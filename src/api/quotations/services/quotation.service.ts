import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, QueryRunner, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Quotation } from '../../../entities/quotations/quotation.entity';
import { QuotationDetail } from '../../../entities/quotations/quotation-detail.entity';
import {
  CreateQuotationDto,
  CreateQuotationLineItemDto,
} from '../dto/create-quotation.dto';
import { QueryQuotationDto } from '../dto/query-quotation.dto';
import { UpdateQuotationNotesDto } from '../dto/update-quotation-notes.dto';
import { ConvertQuotationDto } from '../dto/convert-quotation.dto';
import { UpdateQuotationLineItemDto } from '../dto/update-quotation-line-item.dto';
import { ProductItemKind } from '../../../entities/products/product-item-kind.enum';
import { SalesOrderSaleScope } from '../../../entities/sales-orders/sales-order-sale-scope.enum';
import { SalesOrderPosStage } from '../../../entities/sales-orders/sales-order-pos-stage.enum';
import { User } from '../../../entities/users/user.entity';
import { UserBillingBranch } from '../../../entities/users/user-billing-branch.entity';
import { Customer } from '../../../entities/customers/customer.entity';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { roundUnitAmount } from '../../../common/utils/unit-amount.util';
import { resolveProductUomForLine } from '../../products/utils/resolve-product-uom.util';
import {
  clampTaxPercentages,
  loadFiscalTaxPolicy,
} from '../../billing/utils/fiscal-tax-policy.util';
import { QuotationFolioService } from './quotation-folio.service';
import { QuotationPdfService } from './quotation-pdf.service';
import { QuotationDocumentsService } from './quotation-documents.service';
import { QuotationAdvanceInvoiceService } from './quotation-advance-invoice.service';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { getFiscalInvoiceReadiness } from '../../customers/utils/fiscal-invoice-readiness.util';
import { PosShiftsService } from '../../pos-shifts/pos-shifts.service';
import { resolveConvertSalesOrderType } from '../utils/quotation-convert.util';
import { ProductDiscountService } from '../../products/product-discount.service';
import { GlobalDiscountService } from '../../global-discounts/global-discount.service';
import {
  assertProductDiscountApplicable,
  calculateProductDiscountLineAmounts,
} from '../../products/utils/product-discount.util';
import {
  assertGlobalDiscountApplicable,
  calculateGlobalDiscountAmount,
} from '../../global-discounts/utils/global-discount.util';
import {
  mapAppliedLineDiscountsFromQuotation,
  mapLineItemWithDiscount,
  mapOrderDiscountSummary,
} from '../mappers/quotation-discount.mapper';
import { resolveQuotationExpiresAt } from '../utils/quotation-expiration.util';
import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import {
  formatCustomerDisplayName,
  mapPosCustomer,
  mapPosUser,
} from '../../pos-shifts/mappers/pos-sale-collection.mapper';
import { SalesOrderService } from '../../sales-orders/services/sales-order.service';
import { CreateSalesOrderDto } from '../../sales-orders/dto/create-sales-order.dto';
import { quotedUnitPrice } from '../../sales-orders/utils/quoted-pricing.util';
import {
  assertQuotationBranchAccess,
  assertQuotationSellerAccess,
  QuotationSellerAccess,
  resolveQuotationBranchScopeIds,
  resolveQuotationSellerScopeUserId,
} from '../utils/quotation-seller-scope.util';

@Injectable()
export class QuotationService {
  private readonly logger = new Logger(QuotationService.name);
  private static readonly DOC_TYPE_DOCUMENTO_ORIGINAL = 1;

  constructor(
    @InjectRepository(Quotation)
    private readonly quotationRepo: Repository<Quotation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserBillingBranch)
    private readonly userBillingBranchRepo: Repository<UserBillingBranch>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(BillingBranch)
    private readonly billingBranchRepo: Repository<BillingBranch>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
    private readonly folioService: QuotationFolioService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => PosShiftsService))
    private readonly posShiftsService: PosShiftsService,
    private readonly productDiscountService: ProductDiscountService,
    private readonly globalDiscountService: GlobalDiscountService,
    private readonly pdfService: QuotationPdfService,
    private readonly documentsService: QuotationDocumentsService,
    @Inject(forwardRef(() => SalesOrderService))
    private readonly salesOrderService: SalesOrderService,
    private readonly advanceInvoices: QuotationAdvanceInvoiceService,
  ) {}

  async create(
    dto: CreateQuotationDto,
    tenantId: string,
    userId: string,
  ): Promise<Quotation> {
    const isPos = dto.quotation_type === 'POS';

    if (!isPos && dto.customer_id == null) {
      throw new BadRequestException('Las cotizaciones manuales requieren customer_id');
    }
    if (isPos && !dto.seller_user_id) {
      throw new BadRequestException('Las cotizaciones POS requieren seller_user_id');
    }

    const customerId = isPos
      ? dto.customer_id ?? (await this.posShiftsService.resolveWalkInCustomerId(tenantId))
      : dto.customer_id!;

    const location = await this.resolveLocation(tenantId, dto, isPos);
    const sellerUserId = isPos ? dto.seller_user_id! : (dto.seller_user_id ?? userId);
    const assignedSellerUserId = await this.resolveAssignedSellerUserId(
      tenantId,
      customerId,
      sellerUserId,
      dto.assigned_seller_user_id,
    );

    if (isPos) {
      await this.posShiftsService.assertPosWarehouseForTerminal(
        tenantId,
        userId,
        location.warehouseId!,
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const folio = await this.folioService.generateFolio(tenantId);
      const quotation = qr.manager.create(Quotation, {
        id: uuidv4(),
        tenant_id: tenantId,
        folio,
        fiscal_configuration_id: location.fiscalConfigurationId,
        billing_branch_id: location.billingBranchId,
        warehouse_id: location.warehouseId,
        customer_id: customerId,
        expected_delivery_date: new Date(dto.expected_delivery_date),
        quotation_type: dto.quotation_type || 'MANUAL',
        fiscal_razon_social: dto.fiscal_razon_social ?? null,
        general_status: 'Creada',
        notes: dto.notes ?? null,
        created_by: userId,
        terminal_user_id: isPos ? userId : null,
        seller_user_id: sellerUserId,
        assigned_seller_user_id: assignedSellerUserId,
      });

      const saved = await qr.manager.save(Quotation, quotation);
      await this.insertLineItems(
        qr,
        saved.id,
        dto.line_items,
        userId,
        tenantId,
        location.fiscalConfigurationId,
      );
      await this.recomputeTotals(qr, saved, tenantId, dto.global_discount_id);
      if (dto.advance_amount != null) {
        await this.applyAdvanceRequest(qr, saved, tenantId, Number(dto.advance_amount), {
          usoCfdi: dto.advance_uso_cfdi,
          metodoPago: dto.advance_metodo_pago,
        });
      }
      await qr.commitTransaction();

      this.generateAndUploadPdf(saved.id, tenantId, userId).catch((err) => {
        this.logger.error('[PDF] Error generando PDF de cotización:', err);
      });

      return this.findOne(saved.id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async replace(
    id: string,
    dto: CreateQuotationDto,
    tenantId: string,
    userId: string,
    access?: QuotationSellerAccess,
  ): Promise<Quotation> {
    const existing = await this.findOne(id, tenantId, access);
    if (existing.general_status !== 'Creada') {
      throw new BadRequestException(
        `No se puede editar una cotización con estado: ${existing.general_status}`,
      );
    }
    if (
      existing.pos_stage === SalesOrderPosStage.Caja &&
      Number(existing.advance_requested_total ?? 0) > 0
    ) {
      throw new BadRequestException(
        'La cotización está en caja. Hay que regresarla a ventas antes de editar.',
      );
    }

    const isPos = (dto.quotation_type || existing.quotation_type) === 'POS';
    const location = await this.resolveLocation(
      tenantId,
      {
        ...dto,
        warehouse_id: dto.warehouse_id ?? existing.warehouse_id ?? undefined,
      },
      isPos,
    );

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      await qr.manager.delete(QuotationDetail, { quotation_id: id });
      const quotation = await qr.manager.findOne(Quotation, {
        where: { id, tenant_id: tenantId },
      });
      if (!quotation) {
        throw new NotFoundException(`Cotización no encontrada: ${id}`);
      }

      quotation.fiscal_configuration_id = dto.fiscal_configuration_id;
      quotation.billing_branch_id = location.billingBranchId;
      quotation.warehouse_id = location.warehouseId;
      if (dto.customer_id != null) {
        quotation.customer_id = dto.customer_id;
      }
      quotation.expected_delivery_date = new Date(dto.expected_delivery_date);
      quotation.quotation_type = dto.quotation_type || quotation.quotation_type || 'MANUAL';
      if (dto.fiscal_razon_social !== undefined) {
        quotation.fiscal_razon_social = dto.fiscal_razon_social;
      }
      if (dto.notes !== undefined) {
        quotation.notes = dto.notes;
      }
      if (dto.seller_user_id) {
        quotation.seller_user_id = dto.seller_user_id;
      }
      quotation.updated_by = userId;

      await qr.manager.save(Quotation, quotation);
      await this.insertLineItems(
        qr,
        id,
        dto.line_items,
        userId,
        tenantId,
        quotation.fiscal_configuration_id,
      );
      await this.recomputeTotals(
        qr,
        quotation,
        tenantId,
        dto.global_discount_id !== undefined
          ? dto.global_discount_id
          : existing.global_discount_id ?? undefined,
      );
      await qr.commitTransaction();

      this.regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId).catch(
        (err) => {
          this.logger.error('[PDF] Error regenerando PDF tras editar cotización:', err);
        },
      );

      return this.findOne(id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAll(
    tenantId: string,
    userId: string,
    canViewAll: boolean,
    canViewAllBranches: boolean,
    filters: QueryQuotationDto,
  ) {
    const {
      search,
      general_status,
      quotation_type,
      fiscal_configuration_id,
      billing_branch_id,
      customer_id,
      assigned_seller_user_id,
      created_from,
      created_to,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = filters;

    const qb = this.quotationRepo
      .createQueryBuilder('qt')
      .leftJoinAndSelect('qt.customer', 'customer')
      .leftJoinAndSelect('qt.fiscal_configuration', 'fiscal_configuration')
      .leftJoinAndSelect('qt.billing_branch', 'billing_branch')
      .leftJoinAndSelect('qt.warehouse', 'warehouse')
      .leftJoinAndSelect('qt.seller_user', 'seller_user')
      .leftJoinAndSelect('qt.assigned_seller_user', 'assigned_seller_user')
      .where('qt.tenant_id = :tenantId', { tenantId });

    const scopeUserId = resolveQuotationSellerScopeUserId(
      canViewAll,
      userId,
      assigned_seller_user_id,
    );
    if (scopeUserId) {
      qb.andWhere(
        '(qt.seller_user_id = :scopeUserId OR qt.assigned_seller_user_id = :scopeUserId)',
        { scopeUserId },
      );
    }

    const assignedBranchIds = canViewAllBranches
      ? []
      : await this.loadAssignedBranchIds(tenantId, userId);
    const scopeBranchIds = resolveQuotationBranchScopeIds(
      canViewAllBranches,
      assignedBranchIds,
      billing_branch_id,
    );
    if (scopeBranchIds) {
      if (scopeBranchIds.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          can_view_all: canViewAll,
          can_view_all_branches: canViewAllBranches,
        };
      }
      qb.andWhere(
        '(qt.billing_branch_id IN (:...scopeBranchIds) OR (qt.billing_branch_id IS NULL AND warehouse.billing_branch_id IN (:...scopeBranchIds)))',
        { scopeBranchIds },
      );
    }

    if (search) {
      qb.andWhere(
        '(qt.folio LIKE :s OR customer.name LIKE :s OR customer.lastname LIKE :s OR CONCAT(customer.name, \' \', COALESCE(customer.lastname, \'\')) LIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (general_status?.length) {
      if (general_status.length === 1) {
        qb.andWhere('qt.general_status = :general_status', {
          general_status: general_status[0],
        });
      } else {
        qb.andWhere('qt.general_status IN (:...general_statuses)', {
          general_statuses: general_status,
        });
      }
    }
    if (quotation_type) {
      qb.andWhere('qt.quotation_type = :quotation_type', { quotation_type });
    }
    if (fiscal_configuration_id) {
      qb.andWhere('qt.fiscal_configuration_id = :fiscal_configuration_id', {
        fiscal_configuration_id,
      });
    }
    if (customer_id) {
      qb.andWhere('qt.customer_id = :customer_id', { customer_id });
    }
    if (created_from) {
      qb.andWhere('qt.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }
    if (created_to) {
      qb.andWhere('qt.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    const sortCol =
      sort_by === 'total'
        ? 'qt.total'
        : sort_by === 'folio'
          ? 'qt.folio'
          : 'qt.created_at';
    qb.orderBy(sortCol, sort_order)
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();

    return {
      data: rows.map((qt) => this.mapLocation(qt)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      can_view_all: canViewAll,
      can_view_all_branches: canViewAllBranches,
    };
  }

  async listSellers(tenantId: string, canViewAll: boolean) {
    if (!canViewAll) {
      return { can_view_all: false, sellers: [] };
    }

    const sellers = await this.userRepo.find({
      where: { tenant_id: tenantId, pos_user_code: Not(IsNull()) },
      select: ['id', 'first_name', 'last_name', 'email', 'pos_user_code'],
      order: { first_name: 'ASC', last_name: 'ASC' },
    });

    return {
      can_view_all: true,
      sellers: sellers.map((user) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        pos_user_code: user.pos_user_code,
      })),
    };
  }

  async findOne(
    id: string,
    tenantId: string,
    access?: QuotationSellerAccess,
  ): Promise<Quotation> {
    const quotation = await this.quotationRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: [
        'customer',
        'billing_branch',
        'warehouse',
        'warehouse.billing_branch',
        'fiscal_configuration',
        'seller_user',
        'assigned_seller_user',
        'terminal_user',
        'creator',
        'line_items',
        'line_items.product',
        'line_items.product_uom',
        'line_items.product_uom.uom',
        'line_items.product_discount',
        'line_items.base_uom',
        'global_discount',
      ],
    });
    if (!quotation) {
      throw new NotFoundException(`Cotización no encontrada: ${id}`);
    }
    const scopedAccess = await this.withAssignedBranches(tenantId, access);
    assertQuotationSellerAccess(quotation, scopedAccess);
    assertQuotationBranchAccess(quotation, scopedAccess);
    return quotation;
  }

  async findOneDetail(
    id: string,
    tenantId: string,
    access?: QuotationSellerAccess,
  ) {
    const quotation = await this.findOne(id, tenantId, access);
    const advance = await this.advanceInvoices.describe(quotation);
    const customerSummary = mapPosCustomer(quotation.customer);
    const appliedLineDiscounts = mapAppliedLineDiscountsFromQuotation(quotation);
    const discountSummary = mapOrderDiscountSummary(quotation);
    const quotationTotal = Number(Number(quotation.total || 0).toFixed(2));
    const amountPaid = Number(
      Number(advance.payment?.amount_mxn ?? advance.summary?.total ?? 0).toFixed(2),
    );
    const amountPending = Number(
      Math.max(0, quotationTotal - amountPaid).toFixed(2),
    );

    const header = {
      ...this.mapLocation(quotation),
      customer_display_name:
        customerSummary?.display_name ?? formatCustomerDisplayName(quotation.customer),
      customer_summary: customerSummary,
      seller_user: mapPosUser(quotation.seller_user),
      assigned_seller_user: mapPosUser(quotation.assigned_seller_user),
      terminal_user: mapPosUser(quotation.terminal_user),
      applied_line_discounts: appliedLineDiscounts,
      applied_global_discount: discountSummary.global_discount,
      discount_summary: discountSummary,
      can_convert: quotation.general_status === 'Creada',
      can_cancel: quotation.general_status === 'Creada' && !advance.blocksCancel,
      cancel_blocked_reason: advance.blocksCancel
        ? 'Tiene una factura de anticipo vigente. Cancélala antes de cancelar la cotización.'
        : null,
      can_edit: quotation.general_status === 'Creada',
      can_edit_lines:
        quotation.general_status === 'Creada' && !advance.blocksEdit,
      can_edit_notes: quotation.general_status !== 'Cancelada',
      can_send: quotation.general_status !== 'Cancelada',
      amount_paid: amountPaid,
      amount_pending: amountPending,
      advance_invoicing_enabled: advance.enabled,
      can_stamp_advance: advance.canStamp,
      advance_invoice: advance.summary,
      advance_payment: advance.payment,
      customer_email:
        quotation.customer?.email?.trim() ||
        quotation.customer?.additional_email?.trim() ||
        null,
      converted_to_sales_order_id: quotation.converted_to_sales_order_id,
    };

    return {
      header,
      line_items: (quotation.line_items ?? []).map(mapLineItemWithDiscount),
      discount_summary: discountSummary,
      applied_line_discounts: appliedLineDiscounts,
      applied_global_discount: discountSummary.global_discount,
    };
  }

  async updateNotes(
    id: string,
    dto: UpdateQuotationNotesDto,
    tenantId: string,
    userId: string,
    access?: QuotationSellerAccess,
  ) {
    const quotation = await this.findOne(id, tenantId, access);
    if (quotation.general_status === 'Cancelada') {
      throw new BadRequestException(
        'No se pueden editar las notas de una cotización cancelada',
      );
    }

    quotation.notes =
      dto.notes === undefined
        ? quotation.notes
        : dto.notes?.trim()
          ? dto.notes.trim()
          : null;
    quotation.updated_by = userId;
    await this.quotationRepo.save(quotation);

    try {
      await this.regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId);
    } catch (err) {
      this.logger.error('[PDF] Error regenerando PDF tras actualizar observaciones:', err);
    }

    return this.findOneDetail(id, tenantId, access);
  }

  private assertLinesEditable(quotation: Quotation): void {
    if (quotation.general_status !== 'Creada') {
      throw new BadRequestException(
        `No se puede actualizar la línea de la cotización con estado: ${quotation.general_status}`,
      );
    }
  }

  async addLineItem(
    id: string,
    dto: CreateQuotationLineItemDto,
    tenantId: string,
    userId: string,
    access?: QuotationSellerAccess,
  ): Promise<void> {
    const existing = await this.findOne(id, tenantId, access);
    this.assertLinesEditable(existing);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const quotation = await qr.manager.findOne(Quotation, {
        where: { id, tenant_id: tenantId },
      });
      if (!quotation) {
        throw new NotFoundException(`Cotización no encontrada: ${id}`);
      }

      await this.insertLineItems(
        qr,
        id,
        [dto],
        userId,
        tenantId,
        quotation.fiscal_configuration_id,
      );
      quotation.updated_by = userId;
      await this.recomputeTotals(
        qr,
        quotation,
        tenantId,
        quotation.global_discount_id ?? undefined,
      );
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    this.regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId).catch(
      (err) => {
        this.logger.error('[PDF] Error regenerando PDF tras agregar línea:', err);
      },
    );
  }

  async updateLineItem(
    id: string,
    lineItemId: string,
    dto: UpdateQuotationLineItemDto,
    tenantId: string,
    userId: string,
    access?: QuotationSellerAccess,
  ): Promise<void> {
    const existing = await this.findOne(id, tenantId, access);
    this.assertLinesEditable(existing);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const quotation = await qr.manager.findOne(Quotation, {
        where: { id, tenant_id: tenantId },
      });
      if (!quotation) {
        throw new NotFoundException(`Cotización no encontrada: ${id}`);
      }

      const line = await qr.manager.findOne(QuotationDetail, {
        where: { id: lineItemId, quotation_id: id },
      });
      if (!line) {
        throw new NotFoundException(`Línea no encontrada: ${lineItemId}`);
      }

      if (dto.quantity !== undefined) {
        line.quantity = dto.quantity;
      }
      if (dto.unit_price !== undefined) {
        line.unit_price = roundUnitAmount(dto.unit_price);
      }
      const taxPolicy = await loadFiscalTaxPolicy(
        qr.manager,
        quotation.fiscal_configuration_id,
        tenantId,
      );
      if (dto.iva_percentage !== undefined || !taxPolicy.ivaEnabled) {
        line.iva_percentage = clampTaxPercentages(
          Number(dto.iva_percentage ?? line.iva_percentage ?? 0),
          0,
          taxPolicy,
        ).ivaPercentage;
      }
      if (dto.ieps_percentage !== undefined || !taxPolicy.iepsEnabled) {
        line.ieps_percentage = clampTaxPercentages(
          0,
          Number(dto.ieps_percentage ?? line.ieps_percentage ?? 0),
          taxPolicy,
        ).iepsPercentage;
      }

      const productUomId = dto.product_uom_id || line.product_uom_id;
      const productUomRow = await this.resolveProductUom(
        qr,
        line.product_id,
        productUomId,
        tenantId,
      );
      line.product_uom_id = productUomRow.id;
      const factor = productUomRow.factor || 1;
      line.quantity_base_uom = productUomRow.is_base
        ? Number(line.quantity)
        : Number(line.quantity) * factor;

      const discountAmounts = await this.resolveLineDiscountAmounts(
        tenantId,
        {
          product_id: line.product_id,
          product_uom_id: productUomRow.id,
          quantity: Number(line.quantity),
          unit_price: Number(line.unit_price),
          discount_percentage:
            dto.discount_percentage !== undefined
              ? dto.discount_percentage
              : Number(line.discount_percentage || 0),
          product_discount_id: line.product_discount_id ?? undefined,
          iva_percentage: Number(line.iva_percentage || 0),
          ieps_percentage: Number(line.ieps_percentage || 0),
        },
        productUomRow.id,
      );
      line.discount_percentage = discountAmounts.discount_percentage;
      line.discount_unit = discountAmounts.discount_unit;
      line.product_discount_id = discountAmounts.product_discount_id;
      this.applyQuotationLineAmounts(line);

      quotation.updated_by = userId;
      await qr.manager.save(QuotationDetail, line);
      await this.recomputeTotals(
        qr,
        quotation,
        tenantId,
        quotation.global_discount_id ?? undefined,
      );
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    this.regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId).catch(
      (err) => {
        this.logger.error('[PDF] Error regenerando PDF tras editar línea:', err);
      },
    );
  }

  async removeLineItem(
    id: string,
    lineItemId: string,
    tenantId: string,
    userId: string,
    access?: QuotationSellerAccess,
  ): Promise<void> {
    const existing = await this.findOne(id, tenantId, access);
    this.assertLinesEditable(existing);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const quotation = await qr.manager.findOne(Quotation, {
        where: { id, tenant_id: tenantId },
      });
      if (!quotation) {
        throw new NotFoundException(`Cotización no encontrada: ${id}`);
      }

      const line = await qr.manager.findOne(QuotationDetail, {
        where: { id: lineItemId, quotation_id: id },
      });
      if (!line) {
        throw new NotFoundException(`Línea no encontrada: ${lineItemId}`);
      }

      const remaining = await qr.manager.count(QuotationDetail, {
        where: { quotation_id: id },
      });
      if (remaining <= 1) {
        throw new BadRequestException(
          'La cotización debe tener al menos un producto',
        );
      }

      await qr.manager.delete(QuotationDetail, {
        id: lineItemId,
        quotation_id: id,
      });
      quotation.updated_by = userId;
      await this.recomputeTotals(
        qr,
        quotation,
        tenantId,
        quotation.global_discount_id ?? undefined,
      );
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    this.regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId).catch(
      (err) => {
        this.logger.error('[PDF] Error regenerando PDF tras eliminar línea:', err);
      },
    );
  }

  async cancel(
    id: string,
    tenantId: string,
    userId: string,
    access?: QuotationSellerAccess,
  ): Promise<Quotation> {
    const quotation = await this.findOne(id, tenantId, access);
    if (quotation.general_status === 'Cancelada') {
      throw new BadRequestException('La cotización ya está cancelada');
    }
    if (quotation.general_status === 'Convertida') {
      throw new BadRequestException(
        'No se puede cancelar una cotización convertida. Cancela la orden de venta.',
      );
    }

    await this.advanceInvoices.assertQuotationCancellable(quotation);

    quotation.general_status = 'Cancelada';
    quotation.updated_by = userId;
    await this.quotationRepo.save(quotation);
    return this.findOne(id, tenantId, access);
  }

  /**
   * Convierte la cotización a OV reusando unit_price, impuestos y descuentos persistidos.
   * No consulta listas de precios ni revalida descuentos vigentes del catálogo.
   * POS auto-surtirá inventario; MANUAL queda Creada.
   */
  async convert(
    id: string,
    dto: ConvertQuotationDto,
    tenantId: string,
    userId: string,
    access?: QuotationSellerAccess,
  ) {
    const quotation = await this.findOne(id, tenantId, access);
    if (quotation.general_status !== 'Creada') {
      throw new BadRequestException(
        `Solo se puede convertir una cotización en estado Creada (actual: ${quotation.general_status})`,
      );
    }

    const expectedDate = this.toDateString(quotation.expected_delivery_date);
    const notes = [quotation.notes, dto.notes, `Convertida desde ${quotation.folio}`]
      .filter((part) => part && String(part).trim())
      .join(' | ');

    const lineKinds = (quotation.line_items ?? []).map(
      (line) => line.product?.item_kind ?? ProductItemKind.Goods,
    );
    const hasGoods = lineKinds.some((kind) => kind === ProductItemKind.Goods);
    const hasServices = lineKinds.some((kind) => kind === ProductItemKind.Service);
    const saleScope =
      hasGoods && hasServices
        ? SalesOrderSaleScope.Combined
        : hasServices
          ? SalesOrderSaleScope.Services
          : SalesOrderSaleScope.Inventory;

    const salesOrderType = resolveConvertSalesOrderType(
      quotation.quotation_type,
      dto.send_to_pos_caja,
    );
    const branchId =
      quotation.billing_branch_id ?? quotation.warehouse?.billing_branch_id ?? null;
    if (salesOrderType === 'POS' && !branchId) {
      throw new BadRequestException(
        'La cotización no tiene sucursal para enviar a caja POS',
      );
    }
    const warehouseId =
      salesOrderType === 'POS'
        ? await this.resolveConvertPosWarehouse(tenantId, quotation, branchId!)
        : quotation.warehouse_id ?? undefined;
    const sellerUserId =
      quotation.seller_user_id ?? quotation.assigned_seller_user_id ?? userId;

    const createDto: CreateSalesOrderDto = {
      fiscal_configuration_id: quotation.fiscal_configuration_id,
      billing_branch_id: branchId ?? undefined,
      warehouse_id: warehouseId,
      customer_id: dto.customer_id ?? quotation.customer_id,
      expected_delivery_date: expectedDate,
      sales_order_type: salesOrderType,
      sale_scope: saleScope,
      seller_user_id:
        salesOrderType === 'POS' ? sellerUserId : quotation.seller_user_id ?? undefined,
      assigned_seller_user_id: quotation.assigned_seller_user_id ?? undefined,
      fiscal_razon_social: quotation.fiscal_razon_social ?? undefined,
      notes,
      global_discount_id: quotation.global_discount_id ?? undefined,
      line_items: (quotation.line_items ?? []).map((line) => ({
        product_id: line.product_id,
        product_uom_id: line.product_uom_id,
        quantity: Number(line.quantity),
        unit_price: quotedUnitPrice(line.unit_price),
        discount_percentage: Number(line.discount_percentage || 0),
        discount_unit: Number(line.discount_unit || 0),
        product_discount_id: line.product_discount_id ?? undefined,
        iva_percentage: Number(line.iva_percentage || 0),
        ieps_percentage: Number(line.ieps_percentage || 0),
      })),
    };

    const salesOrder = await this.salesOrderService.create(
      createDto,
      tenantId,
      userId,
      {
        fromQuotation: true,
        quotedGlobalDiscountAmount: Number(quotation.global_discount_amount || 0),
      },
    );

    await this.salesOrderService.linkConvertedFromQuotation(
      salesOrder.id,
      quotation.id,
      tenantId,
    );
    const linked = await this.advanceInvoices.attachToSalesOrder(
      tenantId,
      userId,
      quotation.id,
      salesOrder.id,
    );
    if (linked?.payment_status) {
      salesOrder.payment_status = linked.payment_status;
    }

    quotation.general_status = 'Convertida';
    quotation.converted_to_sales_order_id = salesOrder.id;
    quotation.updated_by = userId;
    await this.quotationRepo.save(quotation);

    return {
      quotation: await this.findOneDetail(id, tenantId, access),
      sales_order: {
        id: salesOrder.id,
        folio: salesOrder.folio,
        general_status: salesOrder.general_status,
        payment_status: salesOrder.payment_status,
        sales_order_type: salesOrder.sales_order_type,
        total: salesOrder.total,
        converted_from_quotation_id: quotation.id,
        sent_to_pos_caja: salesOrderType === 'POS',
        pos_daily_shift_id: salesOrder.pos_daily_shift_id ?? null,
      },
    };
  }

  private async resolveConvertPosWarehouse(
    tenantId: string,
    quotation: Quotation,
    branchId: string,
  ): Promise<string> {
    if (quotation.warehouse_id) {
      const owned = await this.warehouseRepo.findOne({
        where: { id: quotation.warehouse_id, tenant_id: tenantId },
      });
      if (owned?.billing_branch_id === branchId) {
        return owned.id;
      }
    }
    const warehouse = await this.warehouseRepo.findOne({
      where: {
        tenant_id: tenantId,
        billing_branch_id: branchId,
        status: 'active',
      },
      order: { name: 'ASC' },
    });
    if (!warehouse) {
      throw new BadRequestException(
        'La sucursal de la cotización no tiene almacén activo para caja POS',
      );
    }
    return warehouse.id;
  }

  async regenerateDocumentoOriginal(
    id: string,
    tenantId: string,
    userId: string,
    language: DocumentLanguage,
    keepPrevious = false,
    access?: QuotationSellerAccess,
  ) {
    await this.findOne(id, tenantId, access);
    if (!keepPrevious) {
      await this.documentsService.deleteDocumentsByType(
        id,
        QuotationService.DOC_TYPE_DOCUMENTO_ORIGINAL,
      );
    }
    await this.generateAndUploadPdf(id, tenantId, userId, language);
    return {
      success: true,
      message: 'DOCUMENTO_ORIGINAL regenerado exitosamente',
      document_language: language,
      keep_previous: keepPrevious,
    };
  }

  async regenerateDocumentoOriginalPreservingLanguage(
    id: string,
    tenantId: string,
    userId: string,
  ) {
    const language = await this.documentsService.getLastDocumentLanguage(
      id,
      QuotationService.DOC_TYPE_DOCUMENTO_ORIGINAL,
    );
    return this.regenerateDocumentoOriginal(id, tenantId, userId, language);
  }

  private async generateAndUploadPdf(
    quotationId: string,
    tenantId: string,
    userId: string,
    language: DocumentLanguage = DocumentLanguage.ES,
  ): Promise<void> {
    try {
      const full = await this.loadForPdf(quotationId, tenantId);
      if (!full) {
        this.logger.error(`[PDF] No se pudo cargar cotización: ${quotationId}`);
        return;
      }

      const pdfBuffer = await this.pdfService.generatePdf(full, language);
      const uploadResult = await this.pdfService.uploadPdfToS3(full, pdfBuffer);

      await this.documentsService.uploadDocument(
        quotationId,
        QuotationService.DOC_TYPE_DOCUMENTO_ORIGINAL,
        `DOCUMENTO_ORIGINAL_${full.folio}_${language}.pdf`,
        uploadResult.s3Key,
        pdfBuffer.length,
        'application/pdf',
        userId,
        language,
      );
    } catch (error) {
      this.logger.error('[PDF] Error en generateAndUploadPdf:', error);
    }
  }

  private async loadForPdf(id: string, tenantId: string): Promise<Quotation | null> {
    return this.quotationRepo
      .createQueryBuilder('qt')
      .where('qt.id = :id AND qt.tenant_id = :tenantId', { id, tenantId })
      .leftJoinAndSelect('qt.fiscal_configuration', 'fiscal_config')
      .leftJoinAndSelect('qt.billing_branch', 'billing_branch')
      .leftJoinAndSelect('qt.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'warehouse_branch')
      .leftJoinAndSelect('qt.customer', 'customer')
      .leftJoinAndSelect('qt.creator', 'creator')
      .leftJoinAndSelect('qt.line_items', 'line_items')
      .leftJoinAndSelect('line_items.product', 'product')
      .leftJoinAndSelect('line_items.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .leftJoinAndSelect('qt.global_discount', 'global_discount')
      .getOne();
  }

  private async insertLineItems(
    qr: QueryRunner,
    quotationId: string,
    lineItems: CreateQuotationLineItemDto[],
    userId: string,
    tenantId: string,
    fiscalConfigurationId?: string | null,
  ): Promise<QuotationDetail[]> {
    const taxPolicy = await loadFiscalTaxPolicy(
      qr.manager,
      fiscalConfigurationId || '',
      tenantId,
    );
    const saved: QuotationDetail[] = [];

    for (const item of lineItems) {
      const productUomRow = await this.resolveProductUom(
        qr,
        item.product_id,
        item.product_uom_id,
        tenantId,
      );
      const discountAmounts = await this.resolveLineDiscountAmounts(
        tenantId,
        item,
        productUomRow.id,
      );

      const line_subtotal = Number(item.quantity) * Number(item.unit_price);
      const line_discount = discountAmounts.line_discount;
      const taxable_subtotal = Math.max(line_subtotal - line_discount, 0);
      const taxes = clampTaxPercentages(
        Number(item.iva_percentage || 0),
        Number(item.ieps_percentage || 0),
        taxPolicy,
      );
      const iva_pct = taxes.ivaPercentage;
      const ieps_pct = taxes.iepsPercentage;
      const line_iva = (taxable_subtotal * iva_pct) / 100;
      const line_ieps = (taxable_subtotal * ieps_pct) / 100;

      const [baseUomRow] = await qr.manager.query(
        `SELECT pu.uom_catalog_id FROM product_uoms pu
         WHERE pu.product_id = ? AND pu.is_base = 1 LIMIT 1`,
        [item.product_id],
      );
      if (!baseUomRow) {
        throw new BadRequestException(
          `UOM base no encontrado para producto: ${item.product_id}`,
        );
      }

      const factor = productUomRow.factor || 1;
      const qty_base = productUomRow.is_base
        ? Number(item.quantity)
        : Number(item.quantity) * factor;

      const detail = qr.manager.create(QuotationDetail, {
        id: uuidv4(),
        quotation_id: quotationId,
        product_id: item.product_id,
        product_uom_id: productUomRow.id,
        quantity: item.quantity,
        quantity_base_uom: qty_base,
        base_uom_id: baseUomRow.uom_catalog_id,
        unit_price: roundUnitAmount(item.unit_price),
        discount_percentage: discountAmounts.discount_percentage,
        discount_unit: discountAmounts.discount_unit,
        product_discount_id: discountAmounts.product_discount_id,
        iva_percentage: iva_pct,
        iva_unit: Number(item.quantity) > 0 ? line_iva / Number(item.quantity) : 0,
        ieps_percentage: ieps_pct,
        ieps_unit: Number(item.quantity) > 0 ? line_ieps / Number(item.quantity) : 0,
        created_by: userId,
      });

      await qr.manager.save(QuotationDetail, detail);
      saved.push(detail);
    }

    return saved;
  }

  private applyQuotationLineAmounts(detail: QuotationDetail): void {
    const qty = Number(detail.quantity);
    const lineSubtotal = qty * Number(detail.unit_price);
    const lineDiscount = qty * Number(detail.discount_unit || 0);
    const taxable = Math.max(lineSubtotal - lineDiscount, 0);
    const lineIva = (taxable * Number(detail.iva_percentage || 0)) / 100;
    const lineIeps = (taxable * Number(detail.ieps_percentage || 0)) / 100;
    detail.iva_unit = qty > 0 ? lineIva / qty : 0;
    detail.ieps_unit = qty > 0 ? lineIeps / qty : 0;
  }

  private async applyAdvanceRequest(
    qr: QueryRunner,
    quotation: Quotation,
    tenantId: string,
    amount: number,
    cfdi: { usoCfdi?: string; metodoPago?: 'PUE' | 'PPD' } = {},
  ): Promise<void> {
    const usoCfdi = cfdi.usoCfdi?.trim().toUpperCase() || null;
    if (usoCfdi && !/^[A-Z]\d{2}$/.test(usoCfdi)) {
      throw new BadRequestException('El uso CFDI del anticipo no es válido');
    }
    const requested = Number(amount.toFixed(2));
    const total = Number(quotation.total || 0);
    if (requested <= 0 || requested - total > 0.01) {
      throw new BadRequestException(
        'El anticipo debe ser mayor a 0 y no puede pasar el total de la cotización',
      );
    }
    const fiscal = await qr.manager.findOne(FiscalConfiguration, {
      where: { id: quotation.fiscal_configuration_id, tenant_id: tenantId },
    });
    if (!fiscal?.advance_invoicing_enabled) {
      throw new BadRequestException(
        'Esta razón social no tiene activada la factura de anticipo',
      );
    }
    const customer = await qr.manager.findOne(Customer, {
      where: { id: quotation.customer_id, tenant_id: tenantId },
    });
    const readiness = getFiscalInvoiceReadiness(customer);
    if (!readiness.fiscal_ready_for_invoice) {
      const labels: Record<string, string> = {
        fiscal_rfc: 'RFC',
        fiscal_razon_social: 'razón social',
        fiscal_postal_code: 'código postal fiscal',
      };
      const missing = readiness.fiscal_missing_fields.map(
        (field) => labels[field] ?? field,
      );
      throw new BadRequestException(
        `No se puede dejar anticipo: al cliente le falta ${missing.join(', ')} para facturar`,
      );
    }
    quotation.advance_requested_total = requested;
    quotation.advance_uso_cfdi = usoCfdi;
    quotation.advance_metodo_pago = cfdi.metodoPago ?? null;
    quotation.pos_stage = SalesOrderPosStage.Caja;
    await qr.manager.save(Quotation, quotation);
  }

  async requestAdvanceFromPos(
    id: string,
    tenantId: string,
    amount: number,
    cfdi: { usoCfdi?: string; metodoPago?: 'PUE' | 'PPD' } = {},
  ): Promise<Quotation> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const quotation = await qr.manager.findOne(Quotation, {
        where: { id, tenant_id: tenantId },
      });
      if (!quotation) {
        throw new NotFoundException(`Cotización no encontrada: ${id}`);
      }
      await this.applyAdvanceRequest(qr, quotation, tenantId, amount, cfdi);
      await qr.commitTransaction();
      return quotation;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  private async recomputeTotals(
    qr: QueryRunner,
    quotation: Quotation,
    tenantId: string,
    globalDiscountId?: string,
  ): Promise<void> {
    const details = await qr.manager.find(QuotationDetail, {
      where: { quotation_id: quotation.id },
    });

    let subtotal = 0;
    let discount_total = 0;
    let iva_total = 0;
    let ieps_total = 0;

    for (const detail of details) {
      const qty = Number(detail.quantity);
      const line_subtotal = qty * Number(detail.unit_price);
      const line_discount = qty * Number(detail.discount_unit || 0);
      subtotal += line_subtotal;
      discount_total += line_discount;
      iva_total += qty * Number(detail.iva_unit || 0);
      ieps_total += qty * Number(detail.ieps_unit || 0);
    }

    const globalDiscountAmounts = await this.resolveGlobalDiscountAmounts(
      tenantId,
      globalDiscountId,
      subtotal - discount_total,
    );

    quotation.subtotal = Number(subtotal.toFixed(2));
    quotation.discount_total = Number(discount_total.toFixed(2));
    quotation.global_discount_id = globalDiscountAmounts.global_discount_id;
    quotation.global_discount_amount = globalDiscountAmounts.global_discount_amount;
    quotation.iva_total = Number(iva_total.toFixed(2));
    quotation.ieps_total = Number(ieps_total.toFixed(2));
    quotation.total = Number(
      (
        subtotal -
        discount_total -
        globalDiscountAmounts.global_discount_amount +
        iva_total +
        ieps_total
      ).toFixed(2),
    );

    await qr.manager.save(Quotation, quotation);
  }

  private resolveProductUom(
    qr: QueryRunner,
    productId: string,
    providedUomId: string,
    tenantId: string,
  ) {
    return resolveProductUomForLine(qr, productId, providedUomId, tenantId);
  }

  private async resolveLineDiscountAmounts(
    tenantId: string,
    item: CreateQuotationLineItemDto,
    productUomId: string,
  ) {
    if (item.product_discount_id) {
      const discount = await this.productDiscountService.findByIdForOrder(
        item.product_discount_id,
        item.product_id,
        tenantId,
      );
      assertProductDiscountApplicable(discount, item.product_id, productUomId);
      return {
        ...calculateProductDiscountLineAmounts(item.unit_price, item.quantity, discount),
        product_discount_id: discount.id,
      };
    }

    const discount_pct = Number(item.discount_percentage || 0);
    const line_subtotal = Number(item.quantity) * Number(item.unit_price);
    const line_discount = (line_subtotal * discount_pct) / 100;
    return {
      discount_percentage: discount_pct,
      discount_unit: Number(item.quantity) > 0 ? line_discount / Number(item.quantity) : 0,
      line_discount,
      product_discount_id: null,
    };
  }

  private async resolveGlobalDiscountAmounts(
    tenantId: string,
    globalDiscountId: string | undefined,
    netSubtotal: number,
  ) {
    if (!globalDiscountId) {
      return { global_discount_id: null, global_discount_amount: 0 };
    }
    const discount = await this.globalDiscountService.findByIdForOrder(
      globalDiscountId,
      tenantId,
    );
    assertGlobalDiscountApplicable(discount);
    return {
      global_discount_id: discount.id,
      global_discount_amount: calculateGlobalDiscountAmount(netSubtotal, discount),
    };
  }

  private async resolveAssignedSellerUserId(
    tenantId: string,
    customerId: number,
    sellerUserId: string,
    explicitAssignedSellerId?: string,
  ): Promise<string> {
    if (explicitAssignedSellerId) {
      const explicit = await this.userRepo.findOne({
        where: { id: explicitAssignedSellerId, tenant_id: tenantId },
      });
      if (!explicit) {
        throw new BadRequestException('Comisionado no válido');
      }
      return explicit.id;
    }

    const customer = await this.customerRepo.findOne({
      where: { id: customerId, tenant_id: tenantId },
      select: ['id', 'assigned_seller_user_id'],
    });
    if (customer?.assigned_seller_user_id) {
      return customer.assigned_seller_user_id;
    }
    return sellerUserId;
  }

  private async resolveLocation(
    tenantId: string,
    dto: CreateQuotationDto,
    isPos: boolean,
  ): Promise<{
    fiscalConfigurationId: string;
    billingBranchId: string;
    warehouseId: string | null;
  }> {
    if (isPos) {
      if (!dto.warehouse_id) {
        throw new BadRequestException('Las cotizaciones POS requieren warehouse_id');
      }
      const warehouse = await this.warehouseRepo.findOne({
        where: { id: dto.warehouse_id, tenant_id: tenantId },
        relations: ['billing_branch'],
      });
      if (!warehouse) {
        throw new BadRequestException('Almacén no encontrado');
      }
      const branch = warehouse.billing_branch;
      if (!branch) {
        throw new BadRequestException('El almacén no pertenece a ninguna sucursal');
      }
      const billingBranchId = dto.billing_branch_id ?? branch.id;
      if (billingBranchId !== branch.id) {
        throw new BadRequestException(
          'El almacén no pertenece a la sucursal seleccionada',
        );
      }
      if (branch.fiscal_configuration_id !== dto.fiscal_configuration_id) {
        throw new BadRequestException(
          'La sucursal del almacén no pertenece a la razón social seleccionada',
        );
      }
      return {
        fiscalConfigurationId: dto.fiscal_configuration_id,
        billingBranchId,
        warehouseId: warehouse.id,
      };
    }

    let billingBranchId = dto.billing_branch_id ?? null;
    let warehouseId = dto.warehouse_id ?? null;

    if (!billingBranchId && warehouseId) {
      const warehouse = await this.warehouseRepo.findOne({
        where: { id: warehouseId, tenant_id: tenantId },
      });
      if (!warehouse?.billing_branch_id) {
        throw new BadRequestException('El almacén no pertenece a ninguna sucursal');
      }
      billingBranchId = warehouse.billing_branch_id;
    }

    if (!billingBranchId) {
      throw new BadRequestException('Las cotizaciones manuales requieren billing_branch_id');
    }

    const branch = await this.billingBranchRepo.findOne({
      where: { id: billingBranchId },
      relations: ['fiscal_configuration'],
    });
    if (!branch || branch.fiscal_configuration?.tenant_id !== tenantId) {
      throw new BadRequestException('Sucursal no encontrada');
    }
    if (branch.fiscal_configuration_id !== dto.fiscal_configuration_id) {
      throw new BadRequestException(
        'La sucursal no pertenece a la razón social seleccionada',
      );
    }

    return {
      fiscalConfigurationId: dto.fiscal_configuration_id,
      billingBranchId,
      warehouseId,
    };
  }

  private async withAssignedBranches(
    tenantId: string,
    access?: QuotationSellerAccess,
  ): Promise<QuotationSellerAccess | undefined> {
    if (!access || access.canViewAllBranches || access.assignedBranchIds) {
      return access;
    }
    return {
      ...access,
      assignedBranchIds: await this.loadAssignedBranchIds(
        tenantId,
        access.userId,
      ),
    };
  }

  private async loadAssignedBranchIds(
    tenantId: string,
    userId: string,
  ): Promise<string[]> {
    const rows = await this.userBillingBranchRepo.find({
      where: { tenant_id: tenantId, user_id: userId },
    });
    return [...new Set(rows.map((row) => row.billing_branch_id).filter(Boolean))];
  }

  private mapLocation(qt: Quotation) {
    const branch = qt.billing_branch ?? qt.warehouse?.billing_branch ?? null;
    const fiscal = qt.fiscal_configuration ?? null;
    const {
      warehouse: _warehouse,
      seller_user,
      assigned_seller_user,
      terminal_user,
      creator: _creator,
      ...rest
    } = qt;

    return {
      ...rest,
      seller_user: mapPosUser(seller_user),
      assigned_seller_user: mapPosUser(assigned_seller_user),
      terminal_user: mapPosUser(terminal_user),
      razon_social: fiscal?.razon_social ?? qt.fiscal_razon_social ?? null,
      sucursal: branch?.code ?? null,
      expires_at: resolveQuotationExpiresAt(
        qt.created_at,
        fiscal?.quotation_expiration_days,
      ),
      quotation_expiration_days: fiscal?.quotation_expiration_days ?? null,
      fiscal_configuration: fiscal
        ? {
            id: fiscal.id,
            razon_social: fiscal.razon_social,
            rfc: fiscal.rfc,
          }
        : null,
      billing_branch_id:
        qt.billing_branch_id ?? qt.warehouse?.billing_branch_id ?? branch?.id ?? null,
      billing_branch: branch
        ? {
            id: branch.id,
            code: branch.code,
            address: branch.address,
            city: branch.city,
            state: branch.state,
            country: branch.country,
            postal_code: branch.postal_code,
          }
        : null,
    };
  }

  private toDateString(value: Date | string): string {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
    const date = new Date(value);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
