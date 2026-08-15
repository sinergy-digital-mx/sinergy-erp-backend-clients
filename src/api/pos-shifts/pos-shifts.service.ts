import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { PosPartialShift } from '../../entities/pos/pos-partial-shift.entity';
import { PosPartialShiftDenomination } from '../../entities/pos/pos-partial-shift-denomination.entity';
import { PosDailyShiftStatus } from '../../entities/pos/pos-daily-shift-status.enum';
import { PosSaleCollection } from '../../entities/pos/pos-sale-collection.entity';
import { PosSalePaymentMethod } from '../../entities/pos/pos-sale-payment-method.enum';
import { User } from '../../entities/users/user.entity';
import { POS_COLLECT_TYPES, canPosCollect } from '../../entities/users/pos-user-type.enum';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { OpenDailyShiftDto } from './dto/open-daily-shift.dto';
import { CreatePartialShiftDto } from './dto/create-partial-shift.dto';
import { QueryDailyShiftDto } from './dto/query-daily-shift.dto';
import { CloseDailyShiftDto } from './dto/close-daily-shift.dto';
import { CollectPosSaleDto } from './dto/collect-pos-sale.dto';
import {
  SalesOrderPosReceiptService,
  PosReceiptResult,
} from '../sales-orders/services/sales-order-pos-receipt.service';
import { SalesOrderService } from '../sales-orders/services/sales-order.service';
import {
  mapPosCustomer,
  mapPosSaleCollection,
  isWalkInCustomer,
} from './mappers/pos-sale-collection.mapper';

const WALK_IN_FISCAL_NAME = 'VENTA DE MOSTRADOR';
const WALK_IN_DISPLAY_NAME = 'Público en General';

@Injectable()
export class PosShiftsService {
  private readonly logger = new Logger(PosShiftsService.name);

  constructor(
    @InjectRepository(PosDailyShift)
    private readonly dailyShiftRepo: Repository<PosDailyShift>,
    @InjectRepository(PosPartialShift)
    private readonly partialShiftRepo: Repository<PosPartialShift>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
    @InjectRepository(PosSaleCollection)
    private readonly collectionRepo: Repository<PosSaleCollection>,
    @Inject(forwardRef(() => SalesOrderPosReceiptService))
    private readonly posReceiptService: SalesOrderPosReceiptService,
    @Inject(forwardRef(() => SalesOrderService))
    private readonly salesOrderService: SalesOrderService,
  ) {}

  async validateSellerCode(tenantId: string, terminalUserId: string, code: number) {
    const terminalUser = await this.requirePosTerminal(tenantId, terminalUserId);
    const dailyShift = await this.getBranchOpenDailyShift(
      tenantId,
      terminalUser.billing_branch_id!,
    );

    const seller = await this.userRepo.findOne({
      where: {
        tenant_id: tenantId,
        pos_user_code: code,
      },
      relations: ['status'],
    });

    if (!seller) {
      throw new NotFoundException('Código de vendedor no válido');
    }

    return {
      seller: this.mapSeller(seller),
      terminal_user: this.mapTerminalUser(terminalUser),
      daily_shift: dailyShift ? this.mapDailyShiftSummary(dailyShift) : null,
      requires_daily_shift: !dailyShift,
      pos_user_type: terminalUser.pos_user_type,
    };
  }

  async getCurrentDailyShift(tenantId: string, terminalUserId: string) {
    const terminalUser = await this.requirePosTerminal(tenantId, terminalUserId);

    return this.getBranchOpenDailyShift(
      tenantId,
      terminalUser.billing_branch_id!,
    );
  }

  async resolveOpenDailyShiftId(tenantId: string, terminalUserId: string) {
    const terminalUser = await this.requirePosTerminal(tenantId, terminalUserId);
    const shift = await this.getBranchOpenDailyShift(
      tenantId,
      terminalUser.billing_branch_id!,
    );

    if (!shift) {
      throw new BadRequestException(
        'No hay corte global abierto en la sucursal. La terminal de cobranza debe abrir el corte del día.',
      );
    }

    return shift.id;
  }

  async getBranchOpenDailyShift(tenantId: string, billingBranchId: string) {
    return this.dailyShiftRepo
      .createQueryBuilder('shift')
      .innerJoinAndSelect('shift.terminal_user', 'terminal_user')
      .leftJoinAndSelect('shift.billing_branch', 'billing_branch')
      .leftJoinAndSelect('billing_branch.fiscal_configuration', 'fiscal_configuration')
      .leftJoinAndSelect('shift.partial_shifts', 'partial_shifts')
      .leftJoinAndSelect('partial_shifts.denominations', 'denominations')
      .leftJoinAndSelect('partial_shifts.performed_by_user', 'performed_by_user')
      .where('shift.tenant_id = :tenantId', { tenantId })
      .andWhere('shift.billing_branch_id = :billingBranchId', { billingBranchId })
      .andWhere('shift.status = :status', { status: PosDailyShiftStatus.OPEN })
      .andWhere('terminal_user.pos_user_type IN (:...collectTypes)', {
        collectTypes: POS_COLLECT_TYPES,
      })
      .orderBy('partial_shifts.partial_number', 'ASC')
      .getOne();
  }

  private buildOpenShiftConflictMessage(
    openShift: PosDailyShift,
    requestedShiftDate: string,
  ) {
    if (openShift.shift_date !== requestedShiftDate) {
      return `Hay un corte abierto del ${openShift.shift_date} sin cerrar. Ciérralo antes de abrir otro.`;
    }

    return 'Ya existe un corte global abierto en la sucursal. Ciérralo antes de abrir otro.';
  }

  async openDailyShift(
    tenantId: string,
    terminalUserId: string,
    dto: OpenDailyShiftDto,
  ) {
    const terminalUser = await this.requireCobranzaTerminal(tenantId, terminalUserId);
    const shiftDate = this.getTodayDateString();
    const billingBranchId = terminalUser.billing_branch_id!;

    const openShift = await this.getBranchOpenDailyShift(
      tenantId,
      billingBranchId,
    );

    if (openShift) {
      throw new BadRequestException(
        this.buildOpenShiftConflictMessage(openShift, shiftDate),
      );
    }

    const shift = this.dailyShiftRepo.create({
      tenant_id: tenantId,
      terminal_user_id: terminalUserId,
      billing_branch_id: billingBranchId,
      shift_date: shiftDate,
      opening_cash_mxn: dto.opening_cash_mxn,
      opening_cash_usd: dto.opening_cash_usd ?? 0,
      status: PosDailyShiftStatus.OPEN,
      notes: dto.notes ?? null,
    });

    const saved = await this.dailyShiftRepo.save(shift);
    const queuedSalesAssigned = await this.assignQueuedSalesToShift(
      tenantId,
      terminalUser.billing_branch_id!,
      saved.id,
    );
    const detail = await this.findDailyShiftById(saved.id, tenantId);
    return { shift: detail, queued_sales_assigned: queuedSalesAssigned };
  }

  async findDailyShiftById(id: string, tenantId: string) {
    const shift = await this.dailyShiftRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: [
        'terminal_user',
        'billing_branch',
        'billing_branch.fiscal_configuration',
        'partial_shifts',
        'partial_shifts.denominations',
        'partial_shifts.performed_by_user',
      ],
      order: {
        partial_shifts: { partial_number: 'ASC' },
      },
    });

    if (!shift) {
      throw new NotFoundException('Corte global no encontrado');
    }

    return this.mapDailyShiftDetail(shift);
  }

  async findDailyShifts(tenantId: string, query: QueryDailyShiftDto) {
    const qb = this.dailyShiftRepo
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.terminal_user', 'terminal_user')
      .leftJoinAndSelect('shift.billing_branch', 'billing_branch')
      .leftJoinAndSelect('billing_branch.fiscal_configuration', 'fiscal_configuration')
      .leftJoinAndSelect('shift.partial_shifts', 'partial_shifts')
      .where('shift.tenant_id = :tenantId', { tenantId })
      .orderBy('shift.shift_date', 'DESC')
      .addOrderBy('partial_shifts.partial_number', 'ASC');

    if (query.terminal_user_id) {
      qb.andWhere('shift.terminal_user_id = :terminalUserId', {
        terminalUserId: query.terminal_user_id,
      });
    }

    if (query.billing_branch_id) {
      qb.andWhere('shift.billing_branch_id = :billingBranchId', {
        billingBranchId: query.billing_branch_id,
      });
    }

    if (query.shift_date) {
      qb.andWhere('shift.shift_date = :shiftDate', { shiftDate: query.shift_date });
    }

    if (query.status) {
      qb.andWhere('shift.status = :status', { status: query.status });
    }

    const shifts = await qb.getMany();
    return Promise.all(shifts.map((shift) => this.mapDailyShiftDetail(shift)));
  }

  async createPartialShift(
    tenantId: string,
    terminalUserId: string,
    dailyShiftId: string,
    dto: CreatePartialShiftDto,
  ) {
    const shift = await this.requireOpenDailyShift(
      tenantId,
      terminalUserId,
      dailyShiftId,
    );

    if (!dto.denominations?.length) {
      throw new BadRequestException('Debe indicar al menos una denominación');
    }

    const { removedTotalMxn, removedTotalUsd, denominationRows } =
      this.computeDenominations(dto.denominations);

    const salesStats = await this.getShiftSalesStats(shift.id);

    const lastPartial = await this.partialShiftRepo.findOne({
      where: { daily_shift_id: shift.id },
      order: { partial_number: 'DESC' },
    });

    const partial = this.partialShiftRepo.create({
      tenant_id: tenantId,
      daily_shift_id: shift.id,
      partial_number: (lastPartial?.partial_number ?? 0) + 1,
      removed_total_mxn: removedTotalMxn,
      removed_total_usd: removedTotalUsd,
      sales_total_mxn: salesStats.total,
      sales_count: salesStats.count,
      performed_by_user_id: dto.performed_by_user_id ?? terminalUserId,
      notes: dto.notes ?? null,
    });

    const saved = await this.partialShiftRepo.save(partial);

    for (const row of denominationRows) {
      await this.partialShiftRepo.manager.save(PosPartialShiftDenomination, {
        ...row,
        partial_shift_id: saved.id,
      });
    }

    const full = await this.partialShiftRepo.findOne({
      where: { id: saved.id },
      relations: ['denominations', 'performed_by_user'],
    });

    return this.mapPartialShift(full!);
  }

  async closeDailyShift(
    tenantId: string,
    terminalUserId: string,
    dailyShiftId: string,
    dto: CloseDailyShiftDto,
  ) {
    const shift = await this.requireOpenDailyShift(
      tenantId,
      terminalUserId,
      dailyShiftId,
    );

    shift.status = PosDailyShiftStatus.CLOSED;
    shift.closed_at = new Date();
    if (dto.notes) {
      shift.notes = [shift.notes, dto.notes].filter(Boolean).join('\n');
    }

    await this.dailyShiftRepo.save(shift);
    return this.findDailyShiftById(shift.id, tenantId);
  }

  async resolvePosSaleContext(
    tenantId: string,
    terminalUserId: string,
    sellerUserId: string,
    dailyShiftId?: string,
  ) {
    const terminalUser = await this.requirePosTerminal(tenantId, terminalUserId);
    await this.requireSellerUser(tenantId, sellerUserId);

    let shift: PosDailyShift | null = null;

    if (dailyShiftId) {
      shift = await this.dailyShiftRepo.findOne({
        where: {
          id: dailyShiftId,
          tenant_id: tenantId,
          billing_branch_id: terminalUser.billing_branch_id!,
          status: PosDailyShiftStatus.OPEN,
        },
        relations: ['terminal_user'],
      });

      if (!shift) {
        throw new BadRequestException(
          'No hay un corte global abierto válido para esta sucursal',
        );
      }

      if (!canPosCollect(shift.terminal_user?.pos_user_type)) {
        throw new BadRequestException(
          'El corte global debe pertenecer a una terminal de cobranza',
        );
      }
    } else {
      shift = await this.getBranchOpenDailyShift(
        tenantId,
        terminalUser.billing_branch_id!,
      );
    }

    if (!shift) {
      if (!canPosCollect(terminalUser.pos_user_type)) {
        return { shift: null, terminalUser, queued: true };
      }

      throw new BadRequestException(
        'No hay corte global abierto en la sucursal. La terminal de cobranza debe abrir el corte del día.',
      );
    }

    return { shift, terminalUser, queued: false };
  }

  async assertPosWarehouseForTerminal(
    tenantId: string,
    terminalUserId: string,
    warehouseId: string,
  ): Promise<void> {
    const terminalUser = await this.requirePosTerminal(tenantId, terminalUserId);

    if (!terminalUser.billing_branch_id) {
      throw new BadRequestException('El usuario POS no tiene una sucursal asignada');
    }

    const warehouse = await this.warehouseRepo.findOne({
      where: { id: warehouseId, tenant_id: tenantId },
    });

    if (!warehouse) {
      throw new BadRequestException('Almacén no encontrado');
    }

    if (warehouse.billing_branch_id !== terminalUser.billing_branch_id) {
      throw new BadRequestException(
        `El almacén "${warehouse.name}" no pertenece a la sucursal de esta terminal POS`,
      );
    }
  }

  /** @deprecated Usar resolvePosSaleContext */
  async assertOpenShiftForSale(
    tenantId: string,
    terminalUserId: string,
    sellerUserId: string,
    dailyShiftId?: string,
  ) {
    const { shift, terminalUser } = await this.resolvePosSaleContext(
      tenantId,
      terminalUserId,
      sellerUserId,
      dailyShiftId,
    );

    if (!shift) {
      throw new BadRequestException(
        'No hay corte global abierto en la sucursal. La terminal de cobranza debe abrir el corte del día.',
      );
    }

    return { shift, terminalUser };
  }

  async resolveWalkInCustomerId(tenantId: string): Promise<number> {
    const walkIn =
      (await this.customerRepo.findOne({
        where: { tenant_id: tenantId, fiscal_razon_social: WALK_IN_FISCAL_NAME },
      })) ??
      (await this.customerRepo.findOne({
        where: { tenant_id: tenantId, name: WALK_IN_DISPLAY_NAME },
      }));

    if (!walkIn) {
      throw new BadRequestException(
        `No existe cliente de mostrador. Cree un cliente "${WALK_IN_DISPLAY_NAME}" o con razón social "${WALK_IN_FISCAL_NAME}".`,
      );
    }

    return walkIn.id;
  }

  async getPendingSales(tenantId: string, terminalUserId: string) {
    const terminalUser = await this.requireCobranzaTerminal(tenantId, terminalUserId);
    const branchId = terminalUser.billing_branch_id!;
    const openShift = await this.getBranchOpenDailyShift(tenantId, branchId);

    const qb = this.salesOrderRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.seller_user', 'seller_user')
      .leftJoinAndSelect('so.terminal_user', 'terminal_user')
      .leftJoinAndSelect('so.customer', 'customer')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.sales_order_type = :type', { type: 'POS' })
      .andWhere('so.general_status = :generalStatus', { generalStatus: 'Surtida' })
      .andWhere('so.payment_status = :paymentStatus', { paymentStatus: 'Pendiente' });

    if (openShift) {
      // Misma fuente que sales_summary del corte: órdenes ligadas al corte abierto.
      qb.andWhere('so.pos_daily_shift_id = :shiftId', { shiftId: openShift.id });
    } else {
      qb.innerJoin('so.warehouse', 'warehouse').andWhere(
        'warehouse.billing_branch_id = :branchId',
        { branchId },
      );
    }

    const orders = await qb.orderBy('so.created_at', 'ASC').getMany();

    return Promise.all(
      orders.map(async (order) => {
        const amountPending = await this.salesOrderService.getAmountPending(
          order.id,
          tenantId,
        );
        return {
          id: order.id,
          folio: order.folio,
          total: Number(order.total),
          amount_pending: amountPending,
          subtotal: Number(order.subtotal),
          created_at: order.created_at,
          notes: order.notes,
          customer: order.customer
            ? {
                id: order.customer.id,
                name: order.customer.name,
                lastname: order.customer.lastname,
                company_name: order.customer.company_name,
                fiscal_razon_social: order.customer.fiscal_razon_social,
                is_walk_in: isWalkInCustomer(order.customer),
              }
            : null,
          seller_user: order.seller_user
            ? {
                id: order.seller_user.id,
                first_name: order.seller_user.first_name,
                last_name: order.seller_user.last_name,
                pos_user_code: order.seller_user.pos_user_code,
              }
            : null,
          terminal_user: order.terminal_user
            ? {
                id: order.terminal_user.id,
                first_name: order.terminal_user.first_name,
                last_name: order.terminal_user.last_name,
                pos_user_type: order.terminal_user.pos_user_type,
              }
            : null,
        };
      }),
    );
  }

  async getCollectedSales(
    tenantId: string,
    terminalUserId: string,
    dailyShiftId?: string,
  ) {
    const terminalUser = await this.requireCobranzaTerminal(tenantId, terminalUserId);

    let shift: PosDailyShift | null;

    if (dailyShiftId) {
      shift = await this.dailyShiftRepo.findOne({
        where: {
          id: dailyShiftId,
          tenant_id: tenantId,
          billing_branch_id: terminalUser.billing_branch_id!,
        },
      });

      if (!shift) {
        throw new NotFoundException('Corte global no encontrado en esta sucursal');
      }
    } else {
      shift = await this.getBranchOpenDailyShift(
        tenantId,
        terminalUser.billing_branch_id!,
      );
    }

    if (!shift) {
      return {
        daily_shift: null,
        collected_sales: [],
        summary: this.buildCollectedSalesSummary([]),
      };
    }

    const collections = await this.collectionRepo.find({
      where: { tenant_id: tenantId, pos_daily_shift_id: shift.id },
      relations: [
        'sales_order',
        'sales_order.seller_user',
        'sales_order.terminal_user',
        'customer',
        'collected_by_user',
      ],
      order: { created_at: 'DESC' },
    });

    const collectedSales = collections.map((row) =>
      this.mapCollectedSaleRow(row),
    );

    return {
      daily_shift: this.mapDailyShiftSummary(shift),
      collected_sales: collectedSales,
      summary: this.buildCollectedSalesSummary(collections),
    };
  }

  async collectSale(
    tenantId: string,
    cobranzaUserId: string,
    salesOrderId: string,
    dto: CollectPosSaleDto,
  ) {
    const cobranzaUser = await this.requireCobranzaTerminal(tenantId, cobranzaUserId);

    const order = await this.salesOrderRepo.findOne({
      where: { id: salesOrderId, tenant_id: tenantId },
      relations: ['warehouse', 'seller_user', 'terminal_user', 'customer'],
    });

    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }

    if (order.sales_order_type !== 'POS') {
      throw new BadRequestException('Solo se pueden cobrar órdenes POS');
    }

    if (order.general_status !== 'Surtida' || order.payment_status !== 'Pendiente') {
      throw new BadRequestException(
        'La orden no está pendiente de cobro (debe estar Surtida y Pendiente)',
      );
    }

    const shift = await this.getBranchOpenDailyShift(
      tenantId,
      cobranzaUser.billing_branch_id!,
    );
    if (!shift) {
      throw new BadRequestException(
        'Debe haber un corte global abierto para cobrar ventas',
      );
    }

    const belongsToOpenShift = order.pos_daily_shift_id === shift.id;
    const belongsToBranch =
      order.warehouse?.billing_branch_id === cobranzaUser.billing_branch_id;

    if (!belongsToOpenShift && !belongsToBranch) {
      throw new BadRequestException(
        'La orden no pertenece a la sucursal de esta terminal de cobranza',
      );
    }

    const existingCollection = await this.collectionRepo.findOne({
      where: { sales_order_id: order.id },
    });
    if (existingCollection) {
      throw new ConflictException('Esta orden ya fue cobrada');
    }

    const orderTotal = Number(order.total);
    const amountPending = await this.salesOrderService.getAmountPending(order.id, tenantId);
    if (amountPending <= 0) {
      throw new BadRequestException('La orden ya no tiene saldo pendiente');
    }

    const payment = this.validateAndNormalizePayment(dto, amountPending);
    const customerId = await this.resolveCollectionCustomerId(
      tenantId,
      order,
      dto.customer_id,
    );

    const collection = this.collectionRepo.create({
      id: uuidv4(),
      tenant_id: tenantId,
      sales_order_id: order.id,
      pos_daily_shift_id: shift.id,
      customer_id: customerId,
      payment_method: dto.payment_method,
      order_total_mxn: amountPending,
      amount_cash_mxn: payment.amountCashMxn,
      amount_cash_usd: payment.amountCashUsd,
      usd_exchange_rate: payment.usdExchangeRate,
      amount_transfer_mxn: payment.amountTransferMxn,
      transfer_reference: payment.transferReference,
      amount_card_mxn: payment.amountCardMxn,
      card_reference: payment.cardReference ?? null,
      received_cash_mxn: payment.receivedCashMxn,
      received_cash_usd: payment.receivedCashUsd,
      change_cash_mxn: payment.changeCashMxn,
      change_cash_usd: payment.changeCashUsd,
      collected_by_user_id: cobranzaUserId,
      notes: dto.notes ?? null,
    });

    await this.collectionRepo.save(collection);

    const referenceNumber =
      payment.transferReference ||
      payment.cardReference ||
      null;

    await this.salesOrderService.createPayment(
      order.id,
      {
        amount: amountPending,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: dto.payment_method,
        currency: 'MXN',
        reference_number: referenceNumber ?? undefined,
        notes: dto.notes,
      },
      tenantId,
      cobranzaUserId,
      'pos_cobranza',
    );

    // update() evita que TypeORM revierta customer_id por la relación customer cargada al crear la orden
    await this.salesOrderRepo.update(
      { id: order.id, tenant_id: tenantId },
      {
        payment_status: 'Pagado',
        collected_by_user_id: cobranzaUserId,
        customer_id: customerId,
        pos_daily_shift_id: shift.id,
      },
    );

    const finalCustomer = await this.customerRepo.findOne({
      where: { id: customerId, tenant_id: tenantId },
    });
    if (finalCustomer) {
      collection.customer = finalCustomer;
    }
    collection.collected_by_user = cobranzaUser;

    let receipt: PosReceiptResult | null = null;
    let receipt_error: string | null = null;
    try {
      receipt = await this.posReceiptService.generateAndSavePosTicket(
        tenantId,
        order.id,
        cobranzaUserId,
      );
    } catch (error) {
      receipt_error =
        error instanceof Error ? error.message : 'Error desconocido al generar ticket';
      this.logger.error(
        `Venta cobrada pero fallo generacion de ticket ${order.id}: ${receipt_error}`,
      );
    }

    return {
      message: 'Venta cobrada correctamente',
      collection: mapPosSaleCollection(collection),
      receipt,
      receipt_error,
      sales_order: {
        id: order.id,
        folio: order.folio,
        payment_status: 'Pagado',
        collected_by_user_id: cobranzaUserId,
        customer_id: customerId,
        customer: mapPosCustomer(finalCustomer),
        pos_daily_shift_id: shift.id,
        total: orderTotal,
        amount_collected: amountPending,
      },
    };
  }

  private async assignQueuedSalesToShift(
    tenantId: string,
    billingBranchId: string,
    shiftId: string,
  ): Promise<number> {
    const shiftDate = this.getTodayDateString();
    const queued = await this.salesOrderRepo
      .createQueryBuilder('so')
      .innerJoin('so.warehouse', 'warehouse')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.sales_order_type = :type', { type: 'POS' })
      .andWhere('so.general_status = :queued', { queued: 'En cola' })
      .andWhere('so.payment_status = :pending', { pending: 'Pendiente' })
      .andWhere('DATE(so.created_at) = :shiftDate', { shiftDate })
      .andWhere('warehouse.billing_branch_id = :billingBranchId', { billingBranchId })
      .getMany();

    if (!queued.length) {
      return 0;
    }

    for (const order of queued) {
      order.general_status = 'Surtida';
      order.pos_daily_shift_id = shiftId;
    }

    await this.salesOrderRepo.save(queued);
    return queued.length;
  }

  private async requireSellerUser(tenantId: string, sellerUserId: string) {
    const seller = await this.userRepo.findOne({
      where: {
        id: sellerUserId,
        tenant_id: tenantId,
      },
    });

    if (!seller) {
      throw new BadRequestException('Vendedor no válido para venta POS');
    }

    if (seller.pos_user_code == null) {
      throw new BadRequestException(
        'El vendedor debe tener un código POS para operar en ventas',
      );
    }

    return seller;
  }

  private async resolveCollectionCustomerId(
    tenantId: string,
    order: SalesOrder,
    customerId?: number,
  ): Promise<number> {
    const normalizedCustomerId =
      customerId === undefined || customerId === null ? undefined : Number(customerId);

    if (
      normalizedCustomerId !== undefined &&
      !Number.isNaN(normalizedCustomerId) &&
      normalizedCustomerId > 0
    ) {
      const customer = await this.customerRepo.findOne({
        where: { id: normalizedCustomerId, tenant_id: tenantId },
      });
      if (!customer) {
        throw new BadRequestException('Cliente no válido');
      }
      return customer.id;
    }

    return order.customer_id;
  }

  private validateAndNormalizePayment(dto: CollectPosSaleDto, orderTotal: number) {
    const amountCashMxn = Number(dto.amount_cash_mxn ?? 0);
    const amountCashUsd = Number(dto.amount_cash_usd ?? 0);
    const amountTransferMxn = Number(dto.amount_transfer_mxn ?? 0);
    const amountCardMxn = Number(dto.amount_card_mxn ?? 0);
    const usdExchangeRate =
      amountCashUsd > 0 ? Number(dto.usd_exchange_rate ?? 0) : null;

    if (amountCashUsd > 0 && (!usdExchangeRate || usdExchangeRate <= 0)) {
      throw new BadRequestException(
        'usd_exchange_rate es obligatorio cuando se cobra en USD',
      );
    }

    if (amountTransferMxn > 0 && !dto.transfer_reference?.trim()) {
      throw new BadRequestException(
        'transfer_reference es obligatorio para pagos por transferencia',
      );
    }

    const paidMxn =
      amountCashMxn +
      amountCashUsd * (usdExchangeRate ?? 0) +
      amountTransferMxn +
      amountCardMxn;

    if (Math.abs(paidMxn - orderTotal) > 0.01) {
      throw new BadRequestException(
        `El monto cubierto (${paidMxn.toFixed(2)}) debe coincidir con el total de la orden (${orderTotal.toFixed(2)})`,
      );
    }

    this.assertPaymentMethodShape(dto.payment_method, {
      amountCashMxn,
      amountCashUsd,
      amountTransferMxn,
      amountCardMxn,
    });

    const receivedCashMxn = Number(dto.received_cash_mxn ?? amountCashMxn);
    const receivedCashUsd = Number(dto.received_cash_usd ?? amountCashUsd);
    const changeCashMxn = Math.max(0, receivedCashMxn - amountCashMxn);
    const changeCashUsd = Math.max(0, receivedCashUsd - amountCashUsd);

    if (receivedCashMxn + 0.0001 < amountCashMxn) {
      throw new BadRequestException('received_cash_mxn es menor al monto en efectivo MXN');
    }
    if (receivedCashUsd + 0.0001 < amountCashUsd) {
      throw new BadRequestException('received_cash_usd es menor al monto en efectivo USD');
    }

    return {
      amountCashMxn,
      amountCashUsd,
      usdExchangeRate,
      amountTransferMxn,
      transferReference: dto.transfer_reference?.trim() ?? null,
      amountCardMxn,
      cardReference: dto.card_reference?.trim() ?? null,
      receivedCashMxn,
      receivedCashUsd,
      changeCashMxn,
      changeCashUsd,
    };
  }

  private assertPaymentMethodShape(
    method: PosSalePaymentMethod,
    amounts: {
      amountCashMxn: number;
      amountCashUsd: number;
      amountTransferMxn: number;
      amountCardMxn: number;
    },
  ) {
    const { amountCashMxn, amountCashUsd, amountTransferMxn, amountCardMxn } = amounts;
    const cashTotal = amountCashMxn + amountCashUsd;
    const nonZeroMethods = [
      cashTotal > 0,
      amountTransferMxn > 0,
      amountCardMxn > 0,
    ].filter(Boolean).length;

    switch (method) {
      case PosSalePaymentMethod.CASH:
        if (cashTotal <= 0 || amountTransferMxn > 0 || amountCardMxn > 0) {
          throw new BadRequestException(
            'payment_method cash requiere montos en efectivo MXN y/o USD',
          );
        }
        break;
      case PosSalePaymentMethod.TRANSFER:
        if (amountTransferMxn <= 0 || cashTotal > 0 || amountCardMxn > 0) {
          throw new BadRequestException(
            'payment_method transfer requiere amount_transfer_mxn',
          );
        }
        break;
      case PosSalePaymentMethod.CARD:
        if (amountCardMxn <= 0 || cashTotal > 0 || amountTransferMxn > 0) {
          throw new BadRequestException('payment_method card requiere amount_card_mxn');
        }
        break;
      case PosSalePaymentMethod.MIXED:
        if (nonZeroMethods < 2) {
          throw new BadRequestException(
            'payment_method mixed requiere al menos dos formas de pago',
          );
        }
        break;
      default:
        throw new BadRequestException('Método de pago no válido');
    }
  }

  private mapCollectedSaleRow(collection: PosSaleCollection) {
    const order = collection.sales_order;

    return {
      collection_id: collection.id,
      collected_at: collection.created_at,
      payment: mapPosSaleCollection(collection),
      sales_order: order
        ? {
            id: order.id,
            folio: order.folio,
            total: Number(order.total),
            subtotal: Number(order.subtotal),
            created_at: order.created_at,
            seller_user: order.seller_user
              ? {
                  id: order.seller_user.id,
                  first_name: order.seller_user.first_name,
                  last_name: order.seller_user.last_name,
                  pos_user_code: order.seller_user.pos_user_code,
                }
              : null,
            terminal_user: order.terminal_user
              ? {
                  id: order.terminal_user.id,
                  first_name: order.terminal_user.first_name,
                  last_name: order.terminal_user.last_name,
                  pos_user_type: order.terminal_user.pos_user_type,
                }
              : null,
          }
        : null,
      customer: collection.customer
        ? {
            id: collection.customer.id,
            name: collection.customer.name,
            lastname: collection.customer.lastname,
            company_name: collection.customer.company_name,
            fiscal_razon_social: collection.customer.fiscal_razon_social,
            is_walk_in: isWalkInCustomer(collection.customer),
          }
        : null,
      collected_by_user: collection.collected_by_user
        ? {
            id: collection.collected_by_user.id,
            first_name: collection.collected_by_user.first_name,
            last_name: collection.collected_by_user.last_name,
          }
        : null,
    };
  }

  private buildCollectedSalesSummary(collections: PosSaleCollection[]) {
    const summary = {
      count: collections.length,
      total_mxn: 0,
      cash_mxn: 0,
      cash_usd: 0,
      transfer_mxn: 0,
      card_mxn: 0,
    };

    for (const collection of collections) {
      summary.total_mxn += Number(collection.order_total_mxn);
      summary.cash_mxn += Number(collection.amount_cash_mxn);
      summary.cash_usd += Number(collection.amount_cash_usd);
      summary.transfer_mxn += Number(collection.amount_transfer_mxn);
      summary.card_mxn += Number(collection.amount_card_mxn);
    }

    return summary;
  }

  async getSaleReceipt(tenantId: string, salesOrderId: string) {
    return {
      receipt: await this.posReceiptService.getPosTicket(tenantId, salesOrderId),
    };
  }

  async getSaleReceiptRaw(tenantId: string, salesOrderId: string, res: any) {
    const { buffer, fileName } = await this.posReceiptService.getPosTicketRawBuffer(
      tenantId,
      salesOrderId,
    );
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(buffer);
  }

  async getSaleCollection(tenantId: string, salesOrderId: string) {
    const collection = await this.collectionRepo.findOne({
      where: { tenant_id: tenantId, sales_order_id: salesOrderId },
      relations: ['customer', 'collected_by_user'],
    });

    if (!collection) {
      throw new NotFoundException('Cobro no encontrado para esta orden');
    }

    return { collection: mapPosSaleCollection(collection) };
  }

  private async requireCobranzaTerminal(tenantId: string, userId: string) {
    const user = await this.requirePosTerminal(tenantId, userId);

    if (!canPosCollect(user.pos_user_type)) {
      throw new ForbiddenException(
        'Esta operación solo está disponible en terminales de cobranza',
      );
    }

    return user;
  }

  private async requirePosTerminal(tenantId: string, userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenant_id: tenantId },
      relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.is_pos_user) {
      throw new ForbiddenException('Solo usuarios de tipo POS pueden operar la terminal');
    }

    if (!user.billing_branch_id) {
      throw new BadRequestException(
        'El usuario POS debe tener una sucursal asignada',
      );
    }

    if (!user.pos_user_type) {
      throw new BadRequestException(
        'El usuario POS debe tener un tipo asignado (VENTAS, COBRANZA o AMBOS)',
      );
    }

    return user;
  }

  private async requireOpenDailyShift(
    tenantId: string,
    terminalUserId: string,
    dailyShiftId: string,
  ) {
    await this.requireCobranzaTerminal(tenantId, terminalUserId);

    const shift = await this.dailyShiftRepo.findOne({
      where: {
        id: dailyShiftId,
        tenant_id: tenantId,
        terminal_user_id: terminalUserId,
        status: PosDailyShiftStatus.OPEN,
      },
    });

    if (!shift) {
      throw new NotFoundException('Corte global abierto no encontrado');
    }

    return shift;
  }

  private async getShiftSalesStats(dailyShiftId: string) {
    const result = await this.salesOrderRepo
      .createQueryBuilder('so')
      .select('COALESCE(SUM(so.total), 0)', 'total')
      .addSelect('COUNT(so.id)', 'count')
      .where('so.pos_daily_shift_id = :dailyShiftId', { dailyShiftId })
      .andWhere('so.sales_order_type = :type', { type: 'POS' })
      .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
      .getRawOne<{ total: string; count: string }>();

    return {
      total: Number(result?.total ?? 0),
      count: Number(result?.count ?? 0),
    };
  }

  private async getShiftSellerUserIds(dailyShiftId: string) {
    const rows = await this.salesOrderRepo
      .createQueryBuilder('so')
      .select('DISTINCT so.seller_user_id', 'seller_user_id')
      .where('so.pos_daily_shift_id = :dailyShiftId', { dailyShiftId })
      .andWhere('so.seller_user_id IS NOT NULL')
      .getRawMany<{ seller_user_id: string }>();

    return rows.map((row) => row.seller_user_id);
  }

  private computeDenominations(
    denominations: CreatePartialShiftDto['denominations'],
  ) {
    let removedTotalMxn = 0;
    let removedTotalUsd = 0;
    const denominationRows: Array<{
      currency: 'MXN' | 'USD';
      denomination: number;
      bill_count: number;
      amount: number;
    }> = [];

    for (const item of denominations) {
      const amount = Number(item.denomination) * item.bill_count;
      denominationRows.push({
        currency: item.currency,
        denomination: item.denomination,
        bill_count: item.bill_count,
        amount,
      });

      if (item.currency === 'MXN') {
        removedTotalMxn += amount;
      } else {
        removedTotalUsd += amount;
      }
    }

    return { removedTotalMxn, removedTotalUsd, denominationRows };
  }

  private getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
  }

  private mapSeller(user: User) {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      pos_user_code: user.pos_user_code,
    };
  }

  private mapTerminalUser(user: User) {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      billing_branch_id: user.billing_branch_id,
      pos_user_type: user.pos_user_type,
      billing_branch: user.billing_branch
        ? {
            id: user.billing_branch.id,
            code: user.billing_branch.code,
            fiscal_configuration: user.billing_branch.fiscal_configuration
              ? {
                  id: user.billing_branch.fiscal_configuration.id,
                  razon_social: user.billing_branch.fiscal_configuration.razon_social,
                  rfc: user.billing_branch.fiscal_configuration.rfc,
                }
              : null,
          }
        : null,
    };
  }

  private mapDailyShiftSummary(shift: PosDailyShift) {
    return {
      id: shift.id,
      shift_date: shift.shift_date,
      status: shift.status,
      opening_cash_mxn: Number(shift.opening_cash_mxn),
      opening_cash_usd: Number(shift.opening_cash_usd),
    };
  }

  private async mapDailyShiftDetail(shift: PosDailyShift) {
    const salesStats = await this.getShiftSalesStats(shift.id);
    const sellerIds = await this.getShiftSellerUserIds(shift.id);
    const partialShifts = (shift.partial_shifts ?? []).map((partial) =>
      this.mapPartialShift(partial),
    );

    const removedMxn = partialShifts.reduce(
      (sum, partial) => sum + partial.removed_total_mxn,
      0,
    );
    const removedUsd = partialShifts.reduce(
      (sum, partial) => sum + partial.removed_total_usd,
      0,
    );

    return {
      id: shift.id,
      shift_date: shift.shift_date,
      status: shift.status,
      opening_cash_mxn: Number(shift.opening_cash_mxn),
      opening_cash_usd: Number(shift.opening_cash_usd),
      closed_at: shift.closed_at,
      notes: shift.notes,
      created_at: shift.created_at,
      updated_at: shift.updated_at,
      terminal_user: shift.terminal_user
        ? this.mapTerminalUser(shift.terminal_user)
        : null,
      billing_branch: shift.billing_branch
        ? {
            id: shift.billing_branch.id,
            code: shift.billing_branch.code,
            fiscal_configuration: shift.billing_branch.fiscal_configuration
              ? {
                  id: shift.billing_branch.fiscal_configuration.id,
                  razon_social: shift.billing_branch.fiscal_configuration.razon_social,
                  rfc: shift.billing_branch.fiscal_configuration.rfc,
                }
              : null,
          }
        : null,
      sales_summary: {
        total_mxn: salesStats.total,
        sales_count: salesStats.count,
        seller_user_ids: sellerIds,
        sellers_count: sellerIds.length,
      },
      partial_shifts: partialShifts,
      totals: {
        partial_shifts_count: partialShifts.length,
        removed_total_mxn: removedMxn,
        removed_total_usd: removedUsd,
        sales_total_mxn: salesStats.total,
      },
    };
  }

  private mapPartialShift(partial: PosPartialShift) {
    const denominations = (partial.denominations ?? []).map((denom) => ({
      id: denom.id,
      currency: denom.currency,
      denomination: Number(denom.denomination),
      bill_count: denom.bill_count,
      amount: Number(denom.amount),
    }));

    const removedTotalMxn = Number(partial.removed_total_mxn);
    const removedTotalUsd = Number(partial.removed_total_usd);
    const mxnFromDenominations = denominations
      .filter((denom) => denom.currency === 'MXN')
      .reduce((sum, denom) => sum + denom.amount, 0);
    const usdFromDenominations = denominations
      .filter((denom) => denom.currency === 'USD')
      .reduce((sum, denom) => sum + denom.amount, 0);

    const totalMxn = removedTotalMxn > 0 ? removedTotalMxn : mxnFromDenominations;
    const totalUsd = removedTotalUsd > 0 ? removedTotalUsd : usdFromDenominations;

    return {
      id: partial.id,
      partial_number: partial.partial_number,
      removed_total_mxn: totalMxn,
      removed_total_usd: totalUsd,
      total_mxn: totalMxn,
      total_usd: totalUsd,
      sales_total_mxn: Number(partial.sales_total_mxn),
      sales_count: partial.sales_count,
      notes: partial.notes,
      created_at: partial.created_at,
      performed_by_user: partial.performed_by_user
        ? this.mapSeller(partial.performed_by_user)
        : null,
      denominations,
    };
  }
}
