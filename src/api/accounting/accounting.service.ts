import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { PosSaleCollection } from '../../entities/pos/pos-sale-collection.entity';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { PosDailyShiftStatus } from '../../entities/pos/pos-daily-shift-status.enum';
import { ElectronicInvoice } from '../../entities/electronic-invoicing/electronic-invoice.entity';
import { PurchaseOrderBatch } from '../../entities/purchase-orders/purchase-order-batch.entity';
import { User } from '../../entities/users/user.entity';
import { POS_COLLECT_TYPES, POS_SELL_TYPES } from '../../entities/users/pos-user-type.enum';
import {
  AccountingReportPeriod,
  PosCollectionCustomerType,
  QueryAccountsPayableDto,
  QueryAccountsReceivableDto,
  QueryAccountingBaseDto,
  QueryPosCollectionsDto,
  QueryPosTerminalSalesDto,
} from './dto/query-accounting-base.dto';
import { isWalkInCustomer } from '../pos-shifts/mappers/pos-sale-collection.mapper';

const WALK_IN_FISCAL_NAME = 'VENTA DE MOSTRADOR';
const WALK_IN_DISPLAY_NAME = 'Público en General';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(PosSaleCollection)
    private readonly collectionRepo: Repository<PosSaleCollection>,
    @InjectRepository(PosDailyShift)
    private readonly dailyShiftRepo: Repository<PosDailyShift>,
    @InjectRepository(ElectronicInvoice)
    private readonly electronicInvoiceRepo: Repository<ElectronicInvoice>,
    @InjectRepository(PurchaseOrderBatch)
    private readonly purchaseOrderRepo: Repository<PurchaseOrderBatch>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getPosSummary(tenantId: string, filters: QueryAccountingBaseDto) {
    const { dateFrom, dateTo } = this.resolveDateRange(
      filters.period ?? AccountingReportPeriod.MONTH,
      filters.date_from,
      filters.date_to,
    );

    const terminalRows = await this.salesOrderRepo
      .createQueryBuilder('so')
      .innerJoin('so.terminal_user', 'terminal_user')
      .innerJoin('so.warehouse', 'warehouse')
      .select('terminal_user.id', 'terminal_user_id')
      .addSelect('terminal_user.first_name', 'first_name')
      .addSelect('terminal_user.last_name', 'last_name')
      .addSelect('COUNT(so.id)', 'sales_count')
      .addSelect('COALESCE(SUM(so.total), 0)', 'amount_sold')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('warehouse.billing_branch_id = :branchId', {
        branchId: filters.billing_branch_id,
      })
      .andWhere('so.sales_order_type = :posType', { posType: 'POS' })
      .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
      .andWhere('terminal_user.pos_user_type IN (:...sellTypes)', {
        sellTypes: POS_SELL_TYPES,
      })
      .andWhere('so.created_at >= :dateFrom', { dateFrom })
      .andWhere('so.created_at <= :dateTo', { dateTo })
      .groupBy('terminal_user.id')
      .addGroupBy('terminal_user.first_name')
      .addGroupBy('terminal_user.last_name')
      .orderBy('sales_count', 'DESC')
      .getRawMany<{
        terminal_user_id: string;
        first_name: string | null;
        last_name: string | null;
        sales_count: string;
        amount_sold: string;
      }>();

    const stampedInvoiceSql = this.stampedInvoiceExistsSql('so');
    const walkInSql = this.walkInCustomerSql('customer');

    const collectionRows = await this.collectionRepo
      .createQueryBuilder('collection')
      .innerJoin('collection.sales_order', 'so')
      .innerJoin('so.warehouse', 'warehouse')
      .innerJoin('collection.customer', 'customer')
      .select('COUNT(collection.id)', 'orders_collected')
      .addSelect('COALESCE(SUM(collection.order_total_mxn), 0)', 'amount_collected')
      .addSelect(
        `SUM(CASE WHEN ${walkInSql} AND NOT ${stampedInvoiceSql} THEN 1 ELSE 0 END)`,
        'walk_in_count',
      )
      .addSelect(
        `SUM(CASE WHEN ${stampedInvoiceSql} THEN 1 ELSE 0 END)`,
        'invoiced_count',
      )
      .where('collection.tenant_id = :tenantId', { tenantId })
      .andWhere('warehouse.billing_branch_id = :branchId', {
        branchId: filters.billing_branch_id,
      })
      .andWhere('collection.created_at >= :dateFrom', { dateFrom })
      .andWhere('collection.created_at <= :dateTo', { dateTo })
      .setParameters({
        walkInFiscal: WALK_IN_FISCAL_NAME,
        walkInName: WALK_IN_DISPLAY_NAME,
      })
      .getRawOne<{
        orders_collected: string;
        amount_collected: string;
        walk_in_count: string;
        invoiced_count: string;
      }>();

    const shiftStats = await this.dailyShiftRepo
      .createQueryBuilder('shift')
      .leftJoin('shift.partial_shifts', 'partial')
      .select('COUNT(DISTINCT shift.id)', 'daily_shifts_count')
      .addSelect('COUNT(partial.id)', 'partial_shifts_count')
      .where('shift.tenant_id = :tenantId', { tenantId })
      .andWhere('shift.billing_branch_id = :branchId', {
        branchId: filters.billing_branch_id,
      })
      .andWhere('shift.created_at >= :dateFrom', { dateFrom })
      .andWhere('shift.created_at <= :dateTo', { dateTo })
      .getRawOne<{
        daily_shifts_count: string;
        partial_shifts_count: string;
      }>();

    const openDailyShift = await this.dailyShiftRepo.findOne({
      where: {
        tenant_id: tenantId,
        billing_branch_id: filters.billing_branch_id,
        status: PosDailyShiftStatus.OPEN,
      },
      relations: ['partial_shifts'],
      order: { created_at: 'DESC' },
    });

    const ordersCollected = Number(collectionRows?.orders_collected || 0);
    const amountCollected = Number(collectionRows?.amount_collected || 0);
    const walkInCount = Number(collectionRows?.walk_in_count || 0);
    const invoicedCount = Number(collectionRows?.invoiced_count || 0);
    const dailyShiftsCount = Number(shiftStats?.daily_shifts_count || 0);
    const partialShiftsCount = Number(shiftStats?.partial_shifts_count || 0);

    const cobranzaTerminal = await this.userRepo.findOne({
      where: {
        tenant_id: tenantId,
        billing_branch_id: filters.billing_branch_id,
        is_pos_user: true,
        pos_user_type: In(POS_COLLECT_TYPES),
      },
    });

    const salesTerminals = terminalRows.map((row) => ({
      terminal_user_id: row.terminal_user_id,
      terminal_name: this.buildUserName(row.first_name, row.last_name),
      sales_count: Number(row.sales_count || 0),
      amount_sold: Number(row.amount_sold || 0),
    }));

    return {
      filters_applied: {
        billing_branch_id: filters.billing_branch_id,
        period: filters.period ?? AccountingReportPeriod.MONTH,
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString(),
      },
      sales_terminals: salesTerminals,
      collection_terminal: {
        terminal_user_id: cobranzaTerminal?.id ?? null,
        terminal_name: cobranzaTerminal
          ? this.buildUserName(cobranzaTerminal.first_name, cobranzaTerminal.last_name)
          : null,
        orders_collected: ordersCollected,
        amount_collected: amountCollected,
        walk_in_count: walkInCount,
        invoiced_count: invoicedCount,
        daily_shifts_count: dailyShiftsCount,
        partial_shifts_count: partialShiftsCount,
        open_daily_shift: openDailyShift
          ? {
              id: openDailyShift.id,
              shift_date: openDailyShift.shift_date,
              status: openDailyShift.status,
              partial_shifts_count: openDailyShift.partial_shifts?.length ?? 0,
            }
          : null,
      },
    };
  }

  async getPosTerminalSales(
    tenantId: string,
    terminalUserId: string,
    filters: QueryPosTerminalSalesDto,
  ) {
    const terminalUser = await this.userRepo.findOne({
      where: { id: terminalUserId, tenant_id: tenantId },
    });

    if (!terminalUser) {
      throw new NotFoundException('Terminal POS no encontrada');
    }

    const { dateFrom, dateTo } = this.resolveDateRange(
      filters.period ?? AccountingReportPeriod.MONTH,
      filters.date_from,
      filters.date_to,
    );
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const qb = this.salesOrderRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.seller_user', 'seller_user')
      .innerJoin('so.warehouse', 'warehouse')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.terminal_user_id = :terminalUserId', { terminalUserId })
      .andWhere('warehouse.billing_branch_id = :branchId', {
        branchId: filters.billing_branch_id,
      })
      .andWhere('so.sales_order_type = :posType', { posType: 'POS' })
      .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
      .andWhere('so.created_at >= :dateFrom', { dateFrom })
      .andWhere('so.created_at <= :dateTo', { dateTo })
      .orderBy('so.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await qb.getManyAndCount();

    return {
      terminal_user_id: terminalUserId,
      terminal_name: this.buildUserName(terminalUser.first_name, terminalUser.last_name),
      filters_applied: {
        billing_branch_id: filters.billing_branch_id,
        period: filters.period ?? AccountingReportPeriod.MONTH,
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString(),
      },
      data: orders.map((order) => {
        const customerFields = this.buildCustomerFields(order.customer);
        return {
          id: order.id,
          folio: order.folio,
          total: Number(order.total),
          payment_status: order.payment_status,
          general_status: order.general_status,
          created_at: order.created_at,
          ...customerFields,
          is_walk_in: order.customer ? isWalkInCustomer(order.customer) : false,
          seller_user: order.seller_user
            ? {
                id: order.seller_user.id,
                first_name: order.seller_user.first_name,
                last_name: order.seller_user.last_name,
                pos_user_code: order.seller_user.pos_user_code ?? null,
              }
            : null,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Detalle de órdenes cobradas (card Terminal de cobranza).
   * Filtra por fecha de cobro (`pos_sale_collections.created_at`), no por fecha de venta.
   */
  async getPosCollections(tenantId: string, filters: QueryPosCollectionsDto) {
    const { dateFrom, dateTo } = this.resolveDateRange(
      filters.period ?? AccountingReportPeriod.MONTH,
      filters.date_from,
      filters.date_to,
    );
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const customerType = filters.customer_type ?? PosCollectionCustomerType.ALL;

    const cobranzaTerminal = await this.userRepo.findOne({
      where: {
        tenant_id: tenantId,
        billing_branch_id: filters.billing_branch_id,
        is_pos_user: true,
        pos_user_type: In(POS_COLLECT_TYPES),
      },
    });

    const qb = this.collectionRepo
      .createQueryBuilder('collection')
      .innerJoinAndSelect('collection.sales_order', 'so')
      .innerJoinAndSelect('collection.customer', 'customer')
      .leftJoinAndSelect('so.seller_user', 'seller_user')
      .leftJoinAndSelect('collection.collected_by_user', 'collected_by_user')
      .innerJoin('so.warehouse', 'warehouse')
      .where('collection.tenant_id = :tenantId', { tenantId })
      .andWhere('warehouse.billing_branch_id = :branchId', {
        branchId: filters.billing_branch_id,
      })
      .andWhere('collection.created_at >= :dateFrom', { dateFrom })
      .andWhere('collection.created_at <= :dateTo', { dateTo });

    if (customerType === PosCollectionCustomerType.WALK_IN) {
      qb.andWhere(this.walkInCustomerSql('customer'), {
        walkInFiscal: WALK_IN_FISCAL_NAME,
        walkInName: WALK_IN_DISPLAY_NAME,
      }).andWhere(`NOT ${this.stampedInvoiceExistsSql('so')}`);
    } else if (customerType === PosCollectionCustomerType.INVOICED) {
      qb.andWhere(this.stampedInvoiceExistsSql('so'));
    }

    qb.orderBy('collection.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [collections, total] = await qb.getManyAndCount();

    const orderIds = collections
      .map((collection) => collection.sales_order_id)
      .filter((id): id is string => Boolean(id));
    const stampedOrderIds = await this.getStampedInvoiceOrderIds(tenantId, orderIds);

    return {
      terminal_user_id: cobranzaTerminal?.id ?? null,
      terminal_name: cobranzaTerminal
        ? this.buildUserName(cobranzaTerminal.first_name, cobranzaTerminal.last_name)
        : null,
      filters_applied: {
        billing_branch_id: filters.billing_branch_id,
        period: filters.period ?? AccountingReportPeriod.MONTH,
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString(),
        customer_type: customerType,
      },
      data: collections.map((collection) => {
        const order = collection.sales_order;
        const customer = collection.customer;
        const customerFields = this.buildCustomerFields(customer);
        const hasStampedInvoice = order
          ? stampedOrderIds.has(order.id)
          : false;
        return {
          id: order?.id ?? collection.sales_order_id,
          collection_id: collection.id,
          folio: order?.folio ?? null,
          total: Number(collection.order_total_mxn),
          payment_status: order?.payment_status ?? null,
          general_status: order?.general_status ?? null,
          created_at: order?.created_at ?? null,
          collected_at: collection.created_at,
          payment_method: collection.payment_method,
          has_stamped_invoice: hasStampedInvoice,
          ...customerFields,
          is_walk_in: customer ? isWalkInCustomer(customer) : false,
          seller_user: order?.seller_user
            ? {
                id: order.seller_user.id,
                first_name: order.seller_user.first_name,
                last_name: order.seller_user.last_name,
                pos_user_code: order.seller_user.pos_user_code ?? null,
              }
            : null,
          collected_by_user: collection.collected_by_user
            ? {
                id: collection.collected_by_user.id,
                first_name: collection.collected_by_user.first_name,
                last_name: collection.collected_by_user.last_name,
                pos_user_code: collection.collected_by_user.pos_user_code ?? null,
              }
            : null,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAccountsPayable(tenantId: string, filters: QueryAccountsPayableDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const pendingOrders = await this.purchaseOrderRepo.find({
      where: {
        tenant_id: tenantId,
        payment_status: 'Pendiente',
      },
      relations: ['vendor', 'payments'],
    });

    const activeOrders = pendingOrders.filter((po) => po.general_status !== 'Cancelada');
    const vendorMap = new Map<
      string,
      {
        vendor_id: string;
        vendor_name: string;
        razon_social: string | null;
        company_name: string | null;
        credit_limit: number | null;
        pending_order_count: number;
        amount_pending: number;
        amount_paid: number;
        total_committed: number;
      }
    >();

    for (const order of activeOrders) {
      const summary = this.buildPurchaseOrderPaymentSummary(order);
      if (summary.amount_pending <= 0) continue;

      const vendor = order.vendor;
      if (!vendor) continue;

      const displayName = vendor.razon_social ?? vendor.company_name ?? vendor.name;
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const matches =
          vendor.name.toLowerCase().includes(term) ||
          (vendor.razon_social ?? '').toLowerCase().includes(term) ||
          (vendor.company_name ?? '').toLowerCase().includes(term);
        if (!matches) continue;
      }

      const existing = vendorMap.get(vendor.id) ?? {
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        razon_social: vendor.razon_social,
        company_name: vendor.company_name,
        credit_limit: vendor.credit_limit ? Number(vendor.credit_limit) : null,
        pending_order_count: 0,
        amount_pending: 0,
        amount_paid: 0,
        total_committed: 0,
      };

      existing.pending_order_count += 1;
      existing.amount_pending += summary.amount_pending;
      existing.amount_paid += summary.amount_paid;
      existing.total_committed += summary.amount_paid + summary.amount_pending;
      vendorMap.set(vendor.id, existing);
    }

    const rows = Array.from(vendorMap.values())
      .map((row) => ({
        ...row,
        amount_pending: Number(row.amount_pending.toFixed(2)),
        amount_paid: Number(row.amount_paid.toFixed(2)),
        total_committed: Number(row.total_committed.toFixed(2)),
        progress_percentage: row.credit_limit && row.credit_limit > 0
          ? Number(((row.amount_pending / row.credit_limit) * 100).toFixed(2))
          : row.total_committed > 0
            ? Number(((row.amount_pending / row.total_committed) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.amount_pending - a.amount_pending);

    const total = rows.length;
    const paginated = rows.slice((page - 1) * limit, page * limit);

    return {
      summary: {
        total_vendors: total,
        total_amount_pending: Number(
          rows.reduce((sum, row) => sum + row.amount_pending, 0).toFixed(2),
        ),
      },
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAccountsPayableDetail(tenantId: string, vendorId: string) {
    const orders = await this.purchaseOrderRepo.find({
      where: {
        tenant_id: tenantId,
        vendor_id: vendorId,
        payment_status: 'Pendiente',
      },
      relations: ['vendor', 'payments'],
      order: { created_at: 'DESC' },
    });

    const pendingOrders = orders
      .filter((po) => po.general_status !== 'Cancelada')
      .map((po) => {
        const summary = this.buildPurchaseOrderPaymentSummary(po);
        return {
          id: po.id,
          folio: po.folio,
          general_status: po.general_status,
          payment_status: po.payment_status,
          payment_currency: po.payment_currency,
          expected_delivery_date: po.expected_delivery_date,
          amount_pending: summary.amount_pending,
          amount_paid: summary.amount_paid,
          total: summary.amount_paid + summary.amount_pending,
          created_at: po.created_at,
        };
      })
      .filter((po) => po.amount_pending > 0);

    if (!pendingOrders.length) {
      throw new NotFoundException('No hay cuentas por pagar para este proveedor');
    }

    const vendor = orders[0]?.vendor;

    return {
      vendor: vendor
        ? {
            id: vendor.id,
            name: vendor.name,
            razon_social: vendor.razon_social,
            company_name: vendor.company_name,
            credit_limit: vendor.credit_limit ? Number(vendor.credit_limit) : null,
          }
        : null,
      orders: pendingOrders,
    };
  }

  async getAccountsReceivable(tenantId: string, filters: QueryAccountsReceivableDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const qb = this.salesOrderRepo
      .createQueryBuilder('so')
      .innerJoinAndSelect('so.customer', 'customer')
      .innerJoin('so.warehouse', 'warehouse')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.payment_status = :pending', { pending: 'Pendiente' })
      .andWhere('so.general_status NOT IN (:...excluded)', {
        excluded: ['Cancelada', 'En cola'],
      })
      .andWhere(
        '(customer.fiscal_razon_social IS NULL OR customer.fiscal_razon_social != :walkInFiscal)',
        { walkInFiscal: WALK_IN_FISCAL_NAME },
      )
      .andWhere('customer.name != :walkInName', { walkInName: WALK_IN_DISPLAY_NAME });

    if (filters.billing_branch_id) {
      qb.andWhere('warehouse.billing_branch_id = :branchId', {
        branchId: filters.billing_branch_id,
      });
    }

    const orders = await qb.getMany();

    const grouped = new Map<
      string,
      {
        razon_social: string;
        fiscal_rfc: string | null;
        pending_order_count: number;
        amount_pending: number;
        customer_ids: Set<number>;
      }
    >();

    for (const order of orders) {
      const customer = order.customer;
      const razonSocial =
        order.fiscal_razon_social?.trim() ||
        customer?.fiscal_razon_social?.trim() ||
        customer?.company_name?.trim() ||
        [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim() ||
        'Sin razón social';

      if (filters.search) {
        const term = filters.search.toLowerCase();
        const matches =
          razonSocial.toLowerCase().includes(term) ||
          (customer?.fiscal_rfc ?? '').toLowerCase().includes(term);
        if (!matches) continue;
      }

      const existing = grouped.get(razonSocial) ?? {
        razon_social: razonSocial,
        fiscal_rfc: customer?.fiscal_rfc ?? null,
        pending_order_count: 0,
        amount_pending: 0,
        customer_ids: new Set<number>(),
      };

      existing.pending_order_count += 1;
      existing.amount_pending += Number(order.total || 0);
      if (customer?.id) existing.customer_ids.add(customer.id);
      grouped.set(razonSocial, existing);
    }

    const rows = Array.from(grouped.values())
      .map((row) => ({
        razon_social: row.razon_social,
        fiscal_rfc: row.fiscal_rfc,
        pending_order_count: row.pending_order_count,
        amount_pending: Number(row.amount_pending.toFixed(2)),
        customer_count: row.customer_ids.size,
      }))
      .sort((a, b) => b.amount_pending - a.amount_pending);

    const total = rows.length;
    const paginated = rows.slice((page - 1) * limit, page * limit);

    return {
      summary: {
        total_accounts: total,
        total_amount_pending: Number(
          rows.reduce((sum, row) => sum + row.amount_pending, 0).toFixed(2),
        ),
      },
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAccountsReceivableDetail(
    tenantId: string,
    razonSocial: string,
    billingBranchId?: string,
  ) {
    const decodedRazonSocial = decodeURIComponent(razonSocial);

    const qb = this.salesOrderRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.seller_user', 'seller_user')
      .innerJoin('so.warehouse', 'warehouse')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.payment_status = :pending', { pending: 'Pendiente' })
      .andWhere('so.general_status NOT IN (:...excluded)', {
        excluded: ['Cancelada', 'En cola'],
      });

    if (billingBranchId) {
      qb.andWhere('warehouse.billing_branch_id = :branchId', {
        branchId: billingBranchId,
      });
    }

    const orders = await qb.orderBy('so.created_at', 'DESC').getMany();

    const matchingOrders = orders.filter((order) => {
      const customer = order.customer;
      const key =
        order.fiscal_razon_social?.trim() ||
        customer?.fiscal_razon_social?.trim() ||
        customer?.company_name?.trim() ||
        [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim() ||
        'Sin razón social';
      return key === decodedRazonSocial;
    });

    if (!matchingOrders.length) {
      throw new NotFoundException('No hay órdenes pendientes para esta razón social');
    }

    return {
      razon_social: decodedRazonSocial,
      fiscal_rfc: matchingOrders[0].customer?.fiscal_rfc ?? null,
      pending_order_count: matchingOrders.length,
      amount_pending: Number(
        matchingOrders.reduce((sum, order) => sum + Number(order.total || 0), 0).toFixed(2),
      ),
      orders: matchingOrders.map((order) => ({
        id: order.id,
        folio: order.folio,
        total: Number(order.total),
        payment_status: order.payment_status,
        general_status: order.general_status,
        expected_delivery_date: order.expected_delivery_date,
        created_at: order.created_at,
        customer_display_name: order.customer?.company_name
          ?? [order.customer?.name, order.customer?.lastname].filter(Boolean).join(' ').trim()
          ?? null,
        seller_user: order.seller_user
          ? {
              id: order.seller_user.id,
              first_name: order.seller_user.first_name,
              last_name: order.seller_user.last_name,
              pos_user_code: order.seller_user.pos_user_code ?? null,
            }
          : null,
      })),
    };
  }

  private walkInCustomerSql(customerAlias: string): string {
    return `(${customerAlias}.fiscal_razon_social = :walkInFiscal OR ${customerAlias}.name = :walkInName)`;
  }

  private stampedInvoiceExistsSql(salesOrderAlias: string): string {
    return `EXISTS (
      SELECT 1 FROM electronic_invoices ei
      WHERE ei.tenant_id = collection.tenant_id
        AND ei.source_module = 'sales_orders'
        AND ei.source_id = ${salesOrderAlias}.id
        AND ei.stamp_status IN ('stamped', 'cancel_pending', 'cancelled')
    )`;
  }

  private async getStampedInvoiceOrderIds(
    tenantId: string,
    orderIds: string[],
  ): Promise<Set<string>> {
    if (!orderIds.length) {
      return new Set();
    }

    const rows = await this.electronicInvoiceRepo
      .createQueryBuilder('ei')
      .select('DISTINCT ei.source_id', 'source_id')
      .where('ei.tenant_id = :tenantId', { tenantId })
      .andWhere('ei.source_module = :module', { module: 'sales_orders' })
      .andWhere('ei.source_id IN (:...orderIds)', { orderIds })
      .andWhere('ei.stamp_status IN (:...statuses)', {
        statuses: ['stamped', 'cancel_pending', 'cancelled'],
      })
      .getRawMany<{ source_id: string }>();

    return new Set(rows.map((row) => row.source_id));
  }

  private buildPurchaseOrderPaymentSummary(order: PurchaseOrderBatch) {
    const requestedTotal = Number(order.requested_total || 0);
    const receivedTotal = Number(order.received_total || 0);
    const total =
      order.general_status === 'Recibida'
        ? (receivedTotal > 0 ? receivedTotal : requestedTotal)
        : requestedTotal;
    const amountPaid = (order.payments ?? []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );
    const amountPending = Math.max(total - amountPaid, 0);

    return {
      amount_paid: Number(amountPaid.toFixed(2)),
      amount_pending: Number(amountPending.toFixed(2)),
    };
  }

  private resolveDateRange(
    period: AccountingReportPeriod,
    dateFrom?: string,
    dateTo?: string,
  ): { dateFrom: Date; dateTo: Date } {
    const now = new Date();

    switch (period) {
      case AccountingReportPeriod.TODAY:
        return {
          dateFrom: this.startOfDay(now),
          dateTo: this.endOfDay(now),
        };
      case AccountingReportPeriod.WEEK: {
        const start = new Date(now);
        const day = start.getDay();
        const diff = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - diff);
        return {
          dateFrom: this.startOfDay(start),
          dateTo: this.endOfDay(now),
        };
      }
      case AccountingReportPeriod.MONTH: {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          dateFrom: this.startOfDay(start),
          dateTo: this.endOfDay(now),
        };
      }
      case AccountingReportPeriod.RANGE:
      default: {
        const from = dateFrom ? new Date(dateFrom) : this.startOfDay(now);
        const to = dateTo ? new Date(dateTo) : this.endOfDay(now);
        return {
          dateFrom: this.startOfDay(from),
          dateTo: this.endOfDay(to),
        };
      }
    }
  }

  private startOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  private endOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
  }

  private buildUserName(firstName?: string | null, lastName?: string | null): string {
    return [firstName, lastName].filter(Boolean).join(' ').trim() || 'Sin nombre';
  }

  /** Campos de cliente para listados: empresa arriba, persona abajo en UI. */
  private buildCustomerFields(
    customer?: {
      name?: string | null;
      lastname?: string | null;
      company_name?: string | null;
      fiscal_razon_social?: string | null;
    } | null,
  ): {
    customer_company_name: string | null;
    customer_person_name: string | null;
    customer_display_name: string | null;
  } {
    const companyName = customer?.company_name?.trim() || null;
    const personName =
      [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim() || null;
    const displayName =
      companyName ||
      personName ||
      customer?.fiscal_razon_social?.trim() ||
      null;

    return {
      customer_company_name: companyName,
      customer_person_name: personName,
      customer_display_name: displayName,
    };
  }
}
