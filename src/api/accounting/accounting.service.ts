import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { PosSaleCollection } from '../../entities/pos/pos-sale-collection.entity';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { PosDailyShiftStatus } from '../../entities/pos/pos-daily-shift-status.enum';
import { ElectronicInvoice } from '../../entities/electronic-invoicing/electronic-invoice.entity';
import { PurchaseOrderBatch } from '../../entities/purchase-orders/purchase-order-batch.entity';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { VendorCreditLedgerService } from '../vendor/services/vendor-credit-ledger.service';
import { vendorCompanyName } from '../vendor/utils/vendor-profile.util';
import { resolvePurchaseOrderPayableTotal } from '../purchase-orders/utils/purchase-order-payable-total.util';
import { User } from '../../entities/users/user.entity';
import { PosShiftsService } from '../pos-shifts/pos-shifts.service';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import {
  AccountingReportPeriod,
  AccountsPayableCurrencyView,
  PosCollectionCreditScope,
  PosCollectionCustomerType,
  PosCollectionDateBasis,
  PosCollectionPaymentMethodFilter,
  QueryAccountsPayableDto,
  QueryAccountsReceivableDto,
  QueryAccountingBaseDto,
  QueryPosCollectionsDto,
  QueryPosTerminalSalesDto,
} from './dto/query-accounting-base.dto';
import { isWalkInCustomer } from '../pos-shifts/mappers/pos-sale-collection.mapper';
import {
  buildUnclosedShiftAlert,
  getTodayDateString,
  isPreviousDayOpenShift,
  posCalendarDateSql,
  resolvePosCalendarRange,
  toDateOnlyString,
} from '../pos-shifts/utils/unclosed-shift-alert';
import { SalesOrderPayment } from '../../entities/sales-orders/sales-order-payment.entity';
import { Quotation } from '../../entities/quotations/quotation.entity';
import { AdvanceShiftPayment } from '../../entities/pos/advance-shift-payment.entity';
import { PosSalePaymentMethod } from '../../entities/pos/pos-sale-payment-method.enum';
import {
  advanceDocumentPending,
  roundAdvanceMoney,
} from '../customers/utils/advance-credit.util';
import {
  buildSalesOrderPaymentDisplay,
  SALES_ORDER_PAYMENT_METHOD_LABELS,
} from '../sales-orders/utils/sales-order-payment-display.util';
import {
  isInvoiceVigente,
  roundCreditMoney,
  splitCreditNoteEffect,
} from '../sales-orders/utils/credit-note.util';
import {
  buildPaymentMethodTotals,
  collectionTenderAmounts,
  creditPaymentAmountMxn,
  emptyPaymentMethodTotals,
  isCreditChargeCollection,
  PaidCreditListRow,
  paymentMethodAmountSql,
  paymentMethodMatchSql,
  PosCollectionPaymentMethodKey,
  PosCollectionPaymentMethodTotals,
  PosCollectionTenderAmounts,
  PosCollectionTenderKey,
  summarizePaidCreditRows,
} from './utils/pos-collection-payment-totals.util';
import {
  BuildExcelOptions,
  buildExportSubtitle,
  buildStyledExcelBuffer,
  buildStyledExcelWorkbook,
  formatExportDate,
  formatExportDateTime,
  num,
} from '../../common/utils/excel-export.util';
import {
  AccountsPayableVendorTotals,
  aggregatePayableVendors,
  applyPayableExchangeRate,
  filterPayableVendors,
  isWithinPayablePeriod,
  mergeVendorCredits,
  normalizeExchangeRate,
  normalizePayableCurrency,
  parseCreditLimit,
  PayableCurrencyCode,
  PayableOrderInput,
  payableTotalInMxn,
  sortPayableVendors,
  summarizePayableWithRate,
} from './utils/accounts-payable-currency.util';
import {
  AccountsReceivableAccountTotals,
  aggregateReceivableAccounts,
  applyReceivableExchangeRate,
  filterReceivableAccounts,
  ReceivableOrderInput,
  sortReceivableAccounts,
  summarizeReceivableAccounts,
} from './utils/accounts-receivable-currency.util';

const WALK_IN_FISCAL_NAME = 'VENTA DE MOSTRADOR';
const WALK_IN_DISPLAY_NAME = 'Público en General';

const POS_COLLECTION_PAYMENT_FILTER_LABELS: Record<PosCollectionPaymentMethodFilter, string> = {
  [PosCollectionPaymentMethodFilter.CASH]: 'Efectivo',
  [PosCollectionPaymentMethodFilter.TRANSFER]: 'Transferencia',
  [PosCollectionPaymentMethodFilter.CARD]: 'Tarjeta',
  [PosCollectionPaymentMethodFilter.CHECK]: 'Cheque',
  [PosCollectionPaymentMethodFilter.CREDIT]: 'Crédito',
};

type PosCollectionSaleKind = 'advance' | 'credit' | 'cash';

type PosCollectionUserRef = {
  id: string;
  first_name: string;
  last_name: string;
  pos_user_code: number | null;
};

type PosCollectionBranchRef = {
  id: string | null;
  code: string | null;
  city: string | null;
  label: string | null;
};

type PosCustomerFields = {
  customer_company_name: string | null;
  customer_person_name: string | null;
  customer_display_name: string | null;
};

type PosCollectionListRow = PosCustomerFields & {
  id: string;
  sales_order_id: string | null;
  is_credit_payment: boolean;
  sale_kind: PosCollectionSaleKind;
  document_kind: 'sales_order' | 'quotation';
  collection_id: string | null;
  folio: string;
  total: number;
  has_advance: boolean;
  advance_given: number;
  amount_pending: number;
  payment_status: string;
  general_status: string;
  created_at: Date;
  payment_date: string | null;
  collected_at: Date;
  shift_date: string | null;
  billing_branch: PosCollectionBranchRef | null;
  payment_method: string | null;
  payment_method_label: string;
  payment_breakdown_label: string | null;
  has_stamped_invoice: boolean;
  walk_in_name: string | null;
  walk_in_rfc: string | null;
  for_shipping: boolean;
  is_walk_in: boolean;
  seller_user: PosCollectionUserRef | null;
  collected_by_user: PosCollectionUserRef | null;
};

type PaidCreditListItem = {
  row: PosCollectionListRow;
  meta: PaidCreditListRow;
};

type OrderAdvanceDisplay = {
  hasAdvance: boolean;
  advanceGiven: number;
  amountPending: number;
  requested: number;
};

type PayableDailyRate = {
  exchange_rate: number | null;
  exchange_rate_date: string | null;
};

type PayablePeriodRange = { from: string; to: string };

type CurrencyDetailLine = {
  razon_social: string;
  date: string;
  sort_date: string;
  folio: string;
  invoice: string;
  payment_type: string;
  currency: PayableCurrencyCode;
  amount: number;
};

type CustomerFieldsSource = {
  company_name?: string | null;
  name?: string | null;
  lastname?: string | null;
  fiscal_razon_social?: string | null;
};

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
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly posShiftsService: PosShiftsService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly vendorCreditLedger: VendorCreditLedgerService,
  ) {}

  async getPosSummary(tenantId: string, filters: QueryAccountingBaseDto) {
    const period = filters.period ?? AccountingReportPeriod.MONTH;
    const { from: shiftFrom, to: shiftTo } = resolvePosCalendarRange(
      period,
      filters.date_from,
      filters.date_to,
    );

    const terminalRows = await this.salesOrderRepo
      .createQueryBuilder('so')
      .innerJoin('so.terminal_user', 'terminal_user')
      .leftJoin('so.warehouse', 'warehouse')
      .select('terminal_user.id', 'terminal_user_id')
      .addSelect('terminal_user.first_name', 'first_name')
      .addSelect('terminal_user.last_name', 'last_name')
      .addSelect('COUNT(so.id)', 'sales_count')
      .addSelect('COALESCE(SUM(so.total), 0)', 'amount_sold')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere(this.posBranchSql(), { branchId: filters.billing_branch_id })
      .andWhere('so.sales_order_type = :posType', { posType: 'POS' })
      .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
      .andWhere(`${posCalendarDateSql('so.created_at')} >= :shiftFrom`, { shiftFrom })
      .andWhere(`${posCalendarDateSql('so.created_at')} <= :shiftTo`, { shiftTo })
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

    const enteredOrders = await this.loadPosEnteredOrders(
      tenantId,
      filters.billing_branch_id,
      shiftFrom,
      shiftTo,
    );

    const stampedInvoiceSql = this.stampedInvoiceExistsSql('so');
    const walkInSql = this.walkInCustomerSql('customer');

    const collectionRows = await this.collectionRepo
      .createQueryBuilder('collection')
      .innerJoin('collection.sales_order', 'so')
      .innerJoin('collection.pos_daily_shift', 'shift')
      .innerJoin('collection.customer', 'customer')
      .select('COUNT(collection.id)', 'orders_collected')
      .addSelect('COALESCE(SUM(collection.order_total_mxn), 0)', 'amount_collected')
      .addSelect(
        `SUM(CASE WHEN ${walkInSql} AND NOT ${stampedInvoiceSql} THEN 1 ELSE 0 END)`,
        'walk_in_count',
      )
      .addSelect(`SUM(CASE WHEN ${stampedInvoiceSql} THEN 1 ELSE 0 END)`, 'invoiced_count')
      .addSelect(
        `SUM(CASE WHEN ${paymentMethodMatchSql('credit')} THEN 1 ELSE 0 END)`,
        'credit_count',
      )
      .where('collection.tenant_id = :tenantId', { tenantId })
      .andWhere('shift.billing_branch_id = :branchId', {
        branchId: filters.billing_branch_id,
      })
      .andWhere('shift.shift_date >= :shiftFrom', { shiftFrom })
      .andWhere('shift.shift_date <= :shiftTo', { shiftTo })
      .setParameters({
        walkInFiscal: WALK_IN_FISCAL_NAME,
        walkInName: WALK_IN_DISPLAY_NAME,
      })
      .getRawOne<{
        orders_collected: string;
        amount_collected: string;
        walk_in_count: string;
        invoiced_count: string;
        credit_count: string;
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
      .andWhere('shift.shift_date >= :shiftFrom', { shiftFrom })
      .andWhere('shift.shift_date <= :shiftTo', { shiftTo })
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
    const amountEntered = enteredOrders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = enteredOrders.filter((order) => order.payment_status === 'Pendiente');
    const amountPending = pendingOrders.reduce((sum, order) => sum + order.total, 0);
    const shippingOrders = enteredOrders.filter((order) => order.for_shipping);
    const shippingPending = shippingOrders.filter((order) => order.payment_status === 'Pendiente');
    const amountShipping = shippingOrders.reduce((sum, order) => sum + order.total, 0);
    const walkInCount = Number(collectionRows?.walk_in_count || 0);
    const invoicedCount = Number(collectionRows?.invoiced_count || 0);
    const creditCount = Number(collectionRows?.credit_count || 0);
    const dailyShiftsCount = Number(shiftStats?.daily_shifts_count || 0);
    const partialShiftsCount = Number(shiftStats?.partial_shifts_count || 0);

    const periodShift = await this.dailyShiftRepo.findOne({
      where: {
        tenant_id: tenantId,
        billing_branch_id: filters.billing_branch_id,
        shift_date: Between(shiftFrom, shiftTo),
      },
      relations: ['terminal_user'],
      order: { shift_date: 'DESC', created_at: 'DESC' },
    });
    const cobranzaTerminal = periodShift?.terminal_user ?? null;

    const openShiftDate = openDailyShift ? toDateOnlyString(openDailyShift.shift_date) : null;
    const openShiftInPeriod =
      openDailyShift && openShiftDate && openShiftDate >= shiftFrom && openShiftDate <= shiftTo
        ? openDailyShift
        : null;

    const salesTerminals = terminalRows.map((row) => ({
      terminal_user_id: row.terminal_user_id,
      terminal_name: this.buildUserName(row.first_name, row.last_name),
      sales_count: Number(row.sales_count || 0),
      amount_sold: Number(row.amount_sold || 0),
    }));

    const unclosedShiftAlert = buildUnclosedShiftAlert(openDailyShift);

    return {
      filters_applied: {
        billing_branch_id: filters.billing_branch_id,
        period,
        date_from: shiftFrom,
        date_to: shiftTo,
      },
      unclosed_shift_alert: unclosedShiftAlert,
      summary: {
        orders_entered: enteredOrders.length,
        amount_entered: Number(amountEntered.toFixed(2)),
        orders_collected: ordersCollected,
        amount_collected: Number(amountCollected.toFixed(2)),
        orders_pending: pendingOrders.length,
        amount_pending: Number(amountPending.toFixed(2)),
        orders_for_shipping: shippingOrders.length,
        amount_for_shipping: Number(amountShipping.toFixed(2)),
        orders_for_shipping_pending: shippingPending.length,
      },
      entered_orders: enteredOrders,
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
        credit_count: creditCount,
        daily_shifts_count: dailyShiftsCount,
        partial_shifts_count: partialShiftsCount,
        open_daily_shift: openShiftInPeriod
          ? {
              id: openShiftInPeriod.id,
              shift_date: toDateOnlyString(openShiftInPeriod.shift_date),
              status: openShiftInPeriod.status,
              is_previous_day: isPreviousDayOpenShift(openShiftInPeriod.shift_date),
              partial_shifts_count: openShiftInPeriod.partial_shifts?.length ?? 0,
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

    const period = filters.period ?? AccountingReportPeriod.MONTH;
    const { from: shiftFrom, to: shiftTo } = resolvePosCalendarRange(
      period,
      filters.date_from,
      filters.date_to,
    );
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const qb = this.salesOrderRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.seller_user', 'seller_user')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.terminal_user_id = :terminalUserId', { terminalUserId })
      .andWhere('so.billing_branch_id = :branchId', {
        branchId: filters.billing_branch_id,
      })
      .andWhere('so.sales_order_type = :posType', { posType: 'POS' })
      .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
      .andWhere(`${posCalendarDateSql('so.created_at')} >= :shiftFrom`, { shiftFrom })
      .andWhere(`${posCalendarDateSql('so.created_at')} <= :shiftTo`, { shiftTo })
      .orderBy('so.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await qb.getManyAndCount();

    return {
      terminal_user_id: terminalUserId,
      terminal_name: this.buildUserName(terminalUser.first_name, terminalUser.last_name),
      filters_applied: {
        billing_branch_id: filters.billing_branch_id,
        period,
        date_from: shiftFrom,
        date_to: shiftTo,
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

  async getPosCollections(tenantId: string, filters: QueryPosCollectionsDto) {
    if (filters.credit_scope === PosCollectionCreditScope.PAID) {
      return this.getPaidCreditCollections(tenantId, filters);
    }

    const period = filters.period ?? AccountingReportPeriod.MONTH;
    const { from: shiftFrom, to: shiftTo } = resolvePosCalendarRange(
      period,
      filters.date_from,
      filters.date_to,
    );
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const customerType = filters.customer_type ?? PosCollectionCustomerType.ALL;
    const dateBasis = filters.date_basis ?? PosCollectionDateBasis.SHIFT;
    const paymentMethod = filters.payment_method;
    const search = filters.search?.trim() || '';

    const periodShift = await this.dailyShiftRepo.findOne({
      where: {
        tenant_id: tenantId,
        billing_branch_id: filters.billing_branch_id,
        shift_date: Between(shiftFrom, shiftTo),
      },
      relations: ['terminal_user'],
      order: { shift_date: 'DESC', created_at: 'DESC' },
    });
    const cobranzaTerminal = periodShift?.terminal_user ?? null;

    const summary = await this.aggregatePosCollections(
      tenantId,
      filters,
      shiftFrom,
      shiftTo,
      dateBasis,
      PosCollectionCustomerType.ALL,
    );
    const filtered =
      customerType === PosCollectionCustomerType.ALL && !search && !paymentMethod
        ? summary
        : await this.aggregatePosCollections(
            tenantId,
            filters,
            shiftFrom,
            shiftTo,
            dateBasis,
            customerType,
            search,
            paymentMethod,
          );
    const total = filtered.orders_collected;

    const collectionsQb = this.buildPosCollectionsQuery(
      tenantId,
      filters,
      shiftFrom,
      shiftTo,
      customerType,
      dateBasis,
    );
    collectionsQb.orderBy('collection.created_at', 'DESC');
    if (!filters.credit_only) {
      collectionsQb.skip((page - 1) * limit).take(limit);
    }
    const collections = await collectionsQb.getMany();

    const orderIds = collections
      .map((collection) => collection.sales_order_id)
      .filter((id): id is string => Boolean(id));
    const [stampedOrderIds, paymentDates, advanceByOrder] = await Promise.all([
      this.getStampedInvoiceOrderIds(tenantId, orderIds),
      this.loadSalesOrderPaymentDates(tenantId, orderIds),
      this.loadOrderAdvanceDisplay(tenantId, orderIds),
    ]);

    let data = collections.map((collection) =>
      this.mapPosCollectionRow(collection, stampedOrderIds, paymentDates, advanceByOrder),
    );
    let listTotal = total;
    let listAmount = filtered.amount_collected;
    let listSummary = {
      orders_collected: summary.orders_collected,
      amount_collected: summary.amount_collected,
      walk_in_count: summary.walk_in_count,
      invoiced_count: summary.invoiced_count,
      by_payment_method: summary.by_payment_method,
    };

    if (filters.credit_only) {
      const extras = await this.loadAdvanceCreditRows(tenantId, filters, shiftFrom, shiftTo, search);
      const extraOnly = extras.filter((row) => !orderIds.includes(row.id));
      const extraInvoiced = extraOnly.filter((row) => row.has_stamped_invoice);
      listSummary = {
        ...listSummary,
        orders_collected: listSummary.orders_collected + extraOnly.length,
        amount_collected: roundAdvanceMoney(
          listSummary.amount_collected +
            extraOnly.reduce((sum, row) => sum + Number(row.total || 0), 0),
        ),
        invoiced_count: listSummary.invoiced_count + extraInvoiced.length,
      };
      const pageExtras =
        customerType === PosCollectionCustomerType.INVOICED ? extraInvoiced : extraOnly;
      const seen = new Set(data.map((row) => row.id));
      for (const extra of pageExtras) {
        if (!seen.has(extra.id)) {
          data.push(extra);
        }
      }
      data.sort(
        (a, b) =>
          new Date(b.collected_at || b.created_at || 0).getTime() -
          new Date(a.collected_at || a.created_at || 0).getTime(),
      );
      listAmount = roundAdvanceMoney(
        listAmount + pageExtras.reduce((sum, row) => sum + Number(row.total || 0), 0),
      );
      listTotal = data.length;
      data = data.slice((page - 1) * limit, page * limit);
    }

    return {
      terminal_user_id: cobranzaTerminal?.id ?? null,
      terminal_name: cobranzaTerminal
        ? this.buildUserName(cobranzaTerminal.first_name, cobranzaTerminal.last_name)
        : null,
      filters_applied: {
        billing_branch_id: filters.billing_branch_id,
        period,
        date_from: shiftFrom,
        date_to: shiftTo,
        date_basis: dateBasis,
        customer_type: customerType,
        payment_method: paymentMethod ?? null,
        search: search || null,
      },
      summary: listSummary,
      filtered_amount: listAmount,
      data,
      total: listTotal,
      page,
      limit,
      totalPages: Math.ceil(listTotal / limit) || 0,
    };
  }

  async exportPosCollectionsExcel(
    tenantId: string,
    filters: QueryPosCollectionsDto,
  ): Promise<{ buffer: Buffer; filename: string }> {
    if (filters.credit_scope === PosCollectionCreditScope.PAID) {
      const { from: shiftFrom, to: shiftTo } = resolvePosCalendarRange(
        filters.period ?? AccountingReportPeriod.MONTH,
        filters.date_from,
        filters.date_to,
      );
      const listed = await this.loadPaidCreditListing(tenantId, filters, shiftFrom, shiftTo);
      const mappedRows = listed
        .filter((item) => this.matchesPaidCreditFilters(item, filters))
        .map((item) => item.row);
      return this.buildPosCollectionsExcel(filters, shiftFrom, shiftTo, mappedRows);
    }

    const period = filters.period ?? AccountingReportPeriod.MONTH;
    const { from: shiftFrom, to: shiftTo } = resolvePosCalendarRange(
      period,
      filters.date_from,
      filters.date_to,
    );
    const customerType = filters.customer_type ?? PosCollectionCustomerType.ALL;
    const dateBasis = filters.date_basis ?? PosCollectionDateBasis.SHIFT;

    const qb = this.buildPosCollectionsQuery(
      tenantId,
      filters,
      shiftFrom,
      shiftTo,
      customerType,
      dateBasis,
    );
    qb.orderBy('collection.created_at', 'DESC');
    const collections = await qb.getMany();
    const orderIds = collections
      .map((collection) => collection.sales_order_id)
      .filter((id): id is string => Boolean(id));
    const [stampedOrderIds, paymentDates, advanceByOrder] = await Promise.all([
      this.getStampedInvoiceOrderIds(tenantId, orderIds),
      this.loadSalesOrderPaymentDates(tenantId, orderIds),
      this.loadOrderAdvanceDisplay(tenantId, orderIds),
    ]);

    let mappedRows = collections.map((collection) =>
      this.mapPosCollectionRow(collection, stampedOrderIds, paymentDates, advanceByOrder),
    );
    if (filters.credit_only) {
      let extras = await this.loadAdvanceCreditRows(
        tenantId,
        filters,
        shiftFrom,
        shiftTo,
        filters.search?.trim() || '',
      );
      if (customerType === PosCollectionCustomerType.INVOICED) {
        extras = extras.filter((row) => row.has_stamped_invoice);
      }
      const seen = new Set(mappedRows.map((row) => row.id));
      mappedRows.push(...extras.filter((row) => !seen.has(row.id)));
    }

    return this.buildPosCollectionsExcel(filters, shiftFrom, shiftTo, mappedRows);
  }

  private async buildPosCollectionsExcel(
    filters: QueryPosCollectionsDto,
    shiftFrom: string,
    shiftTo: string,
    mappedRows: PosCollectionListRow[],
  ): Promise<{ buffer: Buffer; filename: string }> {
    const customerType = filters.customer_type ?? PosCollectionCustomerType.ALL;
    const dateBasis = filters.date_basis ?? PosCollectionDateBasis.SHIFT;

    const rows = mappedRows.map((mapped) => {
      const customerName =
        mapped.walk_in_name ||
        mapped.customer_display_name ||
        [mapped.customer_company_name, mapped.customer_person_name]
          .filter(Boolean)
          .join(' · ') ||
        'Público en General';
      return {
        folio: mapped.folio ?? '',
        sale_kind: this.excelSaleKindLabel(mapped.sale_kind),
        branch: mapped.billing_branch?.label ?? '',
        created_at: formatExportDateTime(mapped.created_at),
        payment_date: formatCalendarExportDate(mapped.payment_date),
        collected_at: formatExportDateTime(mapped.collected_at),
        shift_date: mapped.shift_date ?? '',
        customer: customerName,
        walk_in_rfc: mapped.walk_in_rfc ?? '',
        customer_type: mapped.has_stamped_invoice
          ? 'Facturada'
          : mapped.is_walk_in
            ? 'Público en General'
            : 'Cliente',
        seller: this.formatPosUserLabel(mapped.seller_user),
        cashier: this.formatPosUserLabel(mapped.collected_by_user),
        payment_method: this.excelPaymentMethodLabel(mapped),
        total: num(mapped.total),
        advance_given: mapped.has_advance ? num(mapped.advance_given) : null,
        amount_pending: num(mapped.amount_pending),
        payment_status: mapped.payment_status ?? '',
        for_shipping: mapped.for_shipping ? 'Sí' : 'No',
      };
    });

    const customerTypeLabel =
      customerType === PosCollectionCustomerType.WALK_IN
        ? 'Público en General'
        : customerType === PosCollectionCustomerType.INVOICED
          ? 'Facturadas'
          : 'Todas';
    const paymentMethodLabel = filters.payment_method
      ? POS_COLLECTION_PAYMENT_FILTER_LABELS[filters.payment_method]
      : '';

    const buffer = await buildStyledExcelBuffer({
      sheetName: 'Cobranza POS',
      title: 'Cobranza POS — órdenes cobradas',
      subtitle: buildExportSubtitle([
        `Periodo: ${filters.period ?? AccountingReportPeriod.MONTH}`,
        `${shiftFrom} – ${shiftTo}`,
        dateBasis === PosCollectionDateBasis.COLLECTED ? 'Por fecha de cobro' : 'Por fecha de corte',
        `Tipo: ${customerTypeLabel}`,
        paymentMethodLabel ? `Forma de pago: ${paymentMethodLabel}` : '',
        filters.credit_scope === PosCollectionCreditScope.PAID
          ? 'Crédito: solo abonos cobrados'
          : '',
        filters.for_shipping ? 'Para envío' : '',
        filters.search?.trim() ? `Búsqueda: ${filters.search.trim()}` : '',
        `${rows.length} órdenes`,
      ]),
      columns: [
        { header: 'Folio', key: 'folio', width: 16 },
        { header: 'Venta', key: 'sale_kind', width: 12 },
        { header: 'Sucursal', key: 'branch', width: 28 },
        { header: 'Fecha venta', key: 'created_at', width: 18, type: 'date' },
        { header: 'Fecha pago', key: 'payment_date', width: 14, type: 'date' },
        { header: 'Fecha cobro', key: 'collected_at', width: 18, type: 'date' },
        { header: 'Fecha corte', key: 'shift_date', width: 14, type: 'date' },
        { header: 'Cliente', key: 'customer', width: 28 },
        { header: 'RFC ticket', key: 'walk_in_rfc', width: 16 },
        { header: 'Tipo', key: 'customer_type', width: 18 },
        { header: 'Vendedor', key: 'seller', width: 22 },
        { header: 'Cajero', key: 'cashier', width: 22 },
        { header: 'Método de pago', key: 'payment_method', width: 28 },
        { header: 'Total', key: 'total', width: 14, type: 'currency' },
        { header: 'Anticipo', key: 'advance_given', width: 14, type: 'currency' },
        { header: 'Pendiente', key: 'amount_pending', width: 14, type: 'currency' },
        { header: 'Estatus pago', key: 'payment_status', width: 14 },
        { header: 'Para envío', key: 'for_shipping', width: 14 },
      ],
      rows,
    });

    const day = getTodayDateString();
    return { buffer, filename: `cobranza-pos-${day}.xlsx` };
  }

  private async getPaidCreditCollections(tenantId: string, filters: QueryPosCollectionsDto) {
    const period = filters.period ?? AccountingReportPeriod.MONTH;
    const { from: shiftFrom, to: shiftTo } = resolvePosCalendarRange(
      period,
      filters.date_from,
      filters.date_to,
    );
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const customerType = filters.customer_type ?? PosCollectionCustomerType.ALL;
    const dateBasis = filters.date_basis ?? PosCollectionDateBasis.SHIFT;

    const listed = await this.loadPaidCreditListing(tenantId, filters, shiftFrom, shiftTo);
    const summary = summarizePaidCreditRows(listed.map((item) => item.meta));
    const filtered = listed.filter((item) => this.matchesPaidCreditFilters(item, filters));
    const listAmount = Number(
      filtered.reduce((sum, item) => sum + Number(item.row.total || 0), 0).toFixed(2),
    );
    const data = filtered.slice((page - 1) * limit, page * limit).map((item) => item.row);

    return {
      terminal_user_id: null,
      terminal_name: null,
      filters_applied: {
        billing_branch_id: filters.billing_branch_id,
        period,
        date_from: shiftFrom,
        date_to: shiftTo,
        date_basis: dateBasis,
        customer_type: customerType,
        payment_method: filters.payment_method ?? null,
        search: filters.search?.trim() || null,
      },
      summary,
      filtered_amount: listAmount,
      data,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit) || 0,
    };
  }

  private async loadPaidCreditListing(
    tenantId: string,
    filters: QueryPosCollectionsDto,
    periodFrom: string,
    periodTo: string,
  ): Promise<PaidCreditListItem[]> {
    const dateBasis = filters.date_basis ?? PosCollectionDateBasis.SHIFT;
    const scopeFilters: QueryPosCollectionsDto = {
      ...filters,
      credit_only: false,
      payment_method: undefined,
      search: undefined,
      customer_type: PosCollectionCustomerType.ALL,
    };

    const collectionsQb = this.buildPosCollectionsQuery(
      tenantId,
      scopeFilters,
      periodFrom,
      periodTo,
      PosCollectionCustomerType.ALL,
      dateBasis,
    );
    collectionsQb.andWhere(`NOT (
      so.is_credit = 1
      OR collection.payment_method = 'credit'
      OR COALESCE(collection.amount_credit_mxn, 0) > 0
    )`);
    const collections = await collectionsQb.getMany();

    const payments = await this.salesOrderRepo.manager
      .getRepository(SalesOrderPayment)
      .createQueryBuilder('payment')
      .innerJoinAndSelect('payment.sales_order', 'so')
      .innerJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.seller_user', 'seller_user')
      .leftJoinAndSelect('payment.creator', 'cashier')
      .leftJoinAndSelect('so.billing_branch', 'sale_branch')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'warehouse_branch')
      .where('payment.tenant_id = :tenantId', { tenantId })
      .andWhere('so.is_credit = 1')
      .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
      .andWhere('payment.payment_date >= :periodFrom', { periodFrom })
      .andWhere('payment.payment_date <= :periodTo', { periodTo })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM pos_sale_collections col
          INNER JOIN pos_daily_shifts sh ON sh.id = col.pos_daily_shift_id
          WHERE col.sales_order_id = so.id
            AND col.tenant_id = :tenantId
            AND sh.billing_branch_id = :branchId
        )`,
        { branchId: filters.billing_branch_id },
      )
      .getMany();

    const orderIds = [
      ...collections.map((collection) => collection.sales_order_id),
      ...payments.map((payment) => payment.sales_order_id),
    ].filter((id): id is string => Boolean(id));
    const [stampedOrderIds, paymentDates, advanceByOrder] = await Promise.all([
      this.getStampedInvoiceOrderIds(tenantId, orderIds),
      this.loadSalesOrderPaymentDates(tenantId, orderIds),
      this.loadOrderAdvanceDisplay(tenantId, orderIds),
    ]);

    const listed: PaidCreditListItem[] = [];

    for (const collection of collections) {
      if (
        isCreditChargeCollection({
          isCredit: collection.sales_order?.is_credit,
          paymentMethod: collection.payment_method,
          amountCreditMxn: collection.amount_credit_mxn,
        })
      ) {
        continue;
      }
      const row = this.mapPosCollectionRow(collection, stampedOrderIds, paymentDates, advanceByOrder);
      const amounts = collectionTenderAmounts(collection);
      listed.push({
        row,
        meta: {
          total: Number(row.total || 0),
          isWalkIn: Boolean(row.is_walk_in),
          invoiced: Boolean(row.has_stamped_invoice),
          isCreditPayment: false,
          forShipping: Boolean(row.for_shipping),
          amounts,
        },
      });
    }

    for (const payment of payments) {
      const order = payment.sales_order;
      if (!order) continue;
      const amountMxn = creditPaymentAmountMxn({
        amount: payment.amount,
        currency: payment.currency,
        exchangeRate: order.exchange_rate,
      });
      if (amountMxn <= 0.009) continue;

      const method = String(payment.payment_method || '');
      const amounts: PosCollectionTenderAmounts = { cash: 0, transfer: 0, card: 0, check: 0 };
      if (method === 'cash' || method === 'transfer' || method === 'card' || method === 'check') {
        amounts[method] = amountMxn;
      }
      const customerFields = this.buildCustomerFields(order.customer);
      const advance = advanceByOrder.get(order.id);
      const paymentDay = this.paymentCalendarDay(payment.payment_date);
      const label =
        method in SALES_ORDER_PAYMENT_METHOD_LABELS
          ? SALES_ORDER_PAYMENT_METHOD_LABELS[method as PosSalePaymentMethod]
          : method || null;

      listed.push({
        row: {
          id: payment.id,
          sales_order_id: order.id,
          document_kind: 'sales_order',
          collection_id: null,
          folio: order.folio ?? null,
          total: amountMxn,
          has_advance: advance?.hasAdvance ?? false,
          advance_given: advance?.advanceGiven ?? 0,
          amount_pending: advance?.amountPending ?? 0,
          payment_status: order.payment_status ?? null,
          general_status: order.general_status ?? null,
          created_at: order.created_at ?? null,
          payment_date: paymentDay,
          collected_at: payment.created_at,
          shift_date: null,
          billing_branch: this.mapCollectionBranch(
            order.billing_branch ?? order.warehouse?.billing_branch,
          ),
          payment_method: method || null,
          payment_method_label: label ?? '',
          payment_breakdown_label: label,
          has_stamped_invoice: stampedOrderIds.has(order.id),
          walk_in_name: order.walk_in_name ?? null,
          walk_in_rfc: order.walk_in_rfc ?? null,
          for_shipping: this.isForShippingFlag(order.for_shipping),
          ...customerFields,
          is_walk_in: order.customer ? isWalkInCustomer(order.customer) : false,
          is_credit_payment: true,
          sale_kind: 'credit',
          seller_user: order.seller_user
            ? {
                id: order.seller_user.id,
                first_name: order.seller_user.first_name,
                last_name: order.seller_user.last_name,
                pos_user_code: order.seller_user.pos_user_code ?? null,
              }
            : null,
          collected_by_user: payment.creator
            ? {
                id: payment.creator.id,
                first_name: payment.creator.first_name,
                last_name: payment.creator.last_name,
                pos_user_code: payment.creator.pos_user_code ?? null,
              }
            : null,
        },
        meta: {
          total: amountMxn,
          isWalkIn: order.customer ? isWalkInCustomer(order.customer) : false,
          invoiced: stampedOrderIds.has(order.id),
          isCreditPayment: true,
          forShipping: this.isForShippingFlag(order.for_shipping),
          amounts,
        },
      });
    }

    listed.sort(
      (a, b) =>
        new Date(b.row.collected_at || b.row.created_at || 0).getTime() -
        new Date(a.row.collected_at || a.row.created_at || 0).getTime(),
    );
    return listed;
  }

  private matchesPaidCreditFilters(
    item: PaidCreditListItem,
    filters: QueryPosCollectionsDto,
  ): boolean {
    const customerType = filters.customer_type ?? PosCollectionCustomerType.ALL;
    if (
      customerType === PosCollectionCustomerType.WALK_IN &&
      !(item.row.is_walk_in && !item.row.has_stamped_invoice)
    ) {
      return false;
    }
    if (customerType === PosCollectionCustomerType.INVOICED && !item.row.has_stamped_invoice) {
      return false;
    }
    if (filters.for_shipping && !item.row.for_shipping) {
      return false;
    }
    const term = filters.search?.trim().toLowerCase();
    if (term) {
      const haystack = [
        item.row.folio,
        item.row.customer_company_name,
        item.row.customer_person_name,
        item.row.customer_display_name,
        item.row.walk_in_name,
        item.row.walk_in_rfc,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    const method = filters.payment_method;
    if (!method) return true;
    if (method === PosCollectionPaymentMethodFilter.CREDIT) return item.meta.isCreditPayment;
    return Number(item.meta.amounts[method as PosCollectionTenderKey] || 0) > 0.009;
  }

  private paymentCalendarDay(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    if (typeof value === 'string') {
      const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
      return match ? match[1] : null;
    }
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }

  async getPosDailyShifts(tenantId: string, filters: QueryAccountingBaseDto) {
    const period = filters.period ?? AccountingReportPeriod.MONTH;
    const { from: shiftFrom, to: shiftTo } = resolvePosCalendarRange(
      period,
      filters.date_from,
      filters.date_to,
    );

    const shifts = await this.dailyShiftRepo
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.terminal_user', 'terminal_user')
      .leftJoinAndSelect('shift.billing_branch', 'billing_branch')
      .leftJoinAndSelect('shift.partial_shifts', 'partial')
      .leftJoinAndSelect('partial.performed_by_user', 'performed_by')
      .where('shift.tenant_id = :tenantId', { tenantId })
      .andWhere('shift.billing_branch_id = :branchId', {
        branchId: filters.billing_branch_id,
      })
      .andWhere('shift.shift_date >= :shiftFrom', { shiftFrom })
      .andWhere('shift.shift_date <= :shiftTo', { shiftTo })
      .orderBy('shift.shift_date', 'DESC')
      .addOrderBy('shift.created_at', 'DESC')
      .addOrderBy('partial.partial_number', 'ASC')
      .getMany();

    const data = shifts.map((shift) => {
      const partials = shift.partial_shifts ?? [];
      const removedTotalMxn = partials.reduce(
        (sum, partial) => sum + Number(partial.removed_total_mxn || 0),
        0,
      );

      return {
        id: shift.id,
        shift_date: toDateOnlyString(shift.shift_date),
        status: shift.status,
        is_previous_day:
          shift.status === PosDailyShiftStatus.OPEN &&
          isPreviousDayOpenShift(shift.shift_date),
        opening_cash_mxn: Number(shift.opening_cash_mxn),
        opening_cash_usd: Number(shift.opening_cash_usd),
        terminal_user: shift.terminal_user
          ? {
              id: shift.terminal_user.id,
              first_name: shift.terminal_user.first_name,
              last_name: shift.terminal_user.last_name,
              pos_user_type: shift.terminal_user.pos_user_type,
            }
          : null,
        terminal_name: shift.terminal_user
          ? this.buildUserName(shift.terminal_user.first_name, shift.terminal_user.last_name)
          : null,
        billing_branch: shift.billing_branch
          ? {
              id: shift.billing_branch.id,
              code: shift.billing_branch.code,
              display_name: [shift.billing_branch.code, shift.billing_branch.city]
                .filter(Boolean)
                .join(' — '),
            }
          : null,
        partial_shifts_count: partials.length,
        removed_total_mxn: Number(removedTotalMxn.toFixed(2)),
        partial_shifts: partials.map((partial) => ({
          id: partial.id,
          partial_number: partial.partial_number,
          removed_total_mxn: Number(partial.removed_total_mxn || 0),
          removed_total_usd: Number(partial.removed_total_usd || 0),
          created_at: partial.created_at,
          notes: partial.notes,
          performed_by_user: partial.performed_by_user
            ? {
                id: partial.performed_by_user.id,
                first_name: partial.performed_by_user.first_name,
                last_name: partial.performed_by_user.last_name,
              }
            : null,
        })),
      };
    });

    return {
      filters_applied: {
        billing_branch_id: filters.billing_branch_id,
        period,
        date_from: shiftFrom,
        date_to: shiftTo,
      },
      data,
      total: data.length,
    };
  }

  getPosDailyShiftDetail(tenantId: string, dailyShiftId: string) {
    return this.posShiftsService.findDailyShiftById(dailyShiftId, tenantId);
  }

  async getAccountsPayable(tenantId: string, filters: QueryAccountsPayableDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const currency = filters.currency ?? AccountsPayableCurrencyView.ALL;
    const range = this.payablePeriodRange(filters);
    const rows = sortPayableVendors(
      filterPayableVendors(
        await this.collectAccountsPayableVendors(
          tenantId,
          filters.search,
          range,
          filters.fiscal_configuration_id,
        ),
        currency,
      ),
      currency,
    );
    const dailyRate = await this.resolvePayableExchangeRate(tenantId);
    const rated = applyPayableExchangeRate(rows, currency, dailyRate.exchange_rate);
    const total = rated.length;
    const paginated = rated.slice((page - 1) * limit, page * limit);

    return {
      summary: summarizePayableWithRate(
        rows,
        currency,
        dailyRate.exchange_rate,
        dailyRate.exchange_rate_date,
      ),
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async exportAccountsPayableExcel(
    tenantId: string,
    filters: QueryAccountsPayableDto,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const currency = filters.currency ?? AccountsPayableCurrencyView.ALL;
    const range = this.payablePeriodRange(filters);
    const rows = await this.collectAccountsPayableVendors(
      tenantId,
      filters.search,
      range,
      filters.fiscal_configuration_id,
    );
    const dailyRate = await this.resolvePayableExchangeRate(tenantId);
    const searchLabel = [
      range ? `${range.from} – ${range.to}` : '',
      filters.search?.trim() ? `Búsqueda: ${filters.search.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const detail =
      currency === AccountsPayableCurrencyView.ALL
        ? await this.collectPayableDetailLines(
            tenantId,
            filters.search,
            range,
            filters.fiscal_configuration_id,
          )
        : [];
    const buffer = await buildStyledExcelWorkbook(
      this.payableExcelSheets(rows, currency, searchLabel, dailyRate, detail),
    );
    const day = getTodayDateString();
    const suffix = currency === AccountsPayableCurrencyView.ALL ? '' : `-${currency}`;
    return { buffer, filename: `cuentas-por-pagar${suffix}-${day}.xlsx` };
  }

  async getAccountsPayableDetail(
    tenantId: string,
    vendorId: string,
    filters?: QueryAccountsPayableDto,
  ) {
    const orders = await this.purchaseOrderRepo.find({
      where: {
        tenant_id: tenantId,
        vendor_id: vendorId,
        payment_status: 'Pendiente',
        ...(filters?.fiscal_configuration_id
          ? { fiscal_configuration_id: filters.fiscal_configuration_id }
          : {}),
      },
      relations: ['vendor', 'payments'],
      order: { created_at: 'DESC' },
    });

    const range = filters ? this.payablePeriodRange(filters) : null;
    const pendingOrders = orders
      .filter((po) => po.general_status !== 'Cancelada')
      .filter((po) => !range || isWithinPayablePeriod(po.created_at, range.from, range.to))
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

    const vendor = orders[0]?.vendor ?? await this.vendorRepo.findOne({
      where: { id: vendorId, tenant_id: tenantId },
    });
    if (!vendor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    const credit = await this.vendorCreditLedger.balancesForVendor(
      tenantId,
      vendorId,
      filters?.fiscal_configuration_id,
    );

    return {
      vendor: {
        id: vendor.id,
        name: vendorCompanyName(vendor),
        razon_social: vendor.razon_social,
        company_name: vendor.company_name,
        credit_limit: vendor.credit_limit ? Number(vendor.credit_limit) : null,
      },
      credit_balance_mxn: credit.mxn,
      credit_balance_usd: credit.usd,
      orders: pendingOrders,
    };
  }

  async getAccountsReceivable(tenantId: string, filters: QueryAccountsReceivableDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const currency = filters.currency ?? AccountsPayableCurrencyView.ALL;
    const rows = sortReceivableAccounts(
      filterReceivableAccounts(await this.collectAccountsReceivable(tenantId, filters), currency),
      currency,
    );
    const dailyRate = await this.resolvePayableExchangeRate(tenantId);
    const rated = applyReceivableExchangeRate(rows, currency, dailyRate.exchange_rate);
    const total = rated.length;
    const paginated = rated.slice((page - 1) * limit, page * limit);

    return {
      summary: summarizeReceivableAccounts(
        rows,
        currency,
        dailyRate.exchange_rate,
        dailyRate.exchange_rate_date,
      ),
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async exportAccountsReceivableExcel(
    tenantId: string,
    filters: QueryAccountsReceivableDto,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const currency = filters.currency ?? AccountsPayableCurrencyView.ALL;
    const rows = await this.collectAccountsReceivable(tenantId, filters);
    const dailyRate = await this.resolvePayableExchangeRate(tenantId);
    const searchLabel = filters.search?.trim() ? `Búsqueda: ${filters.search.trim()}` : '';
    const detail =
      currency === AccountsPayableCurrencyView.ALL
        ? await this.collectReceivableDetailLines(tenantId, filters)
        : [];
    const buffer = await buildStyledExcelWorkbook(
      this.receivableExcelSheets(rows, currency, searchLabel, dailyRate, detail),
    );
    const day = getTodayDateString();
    const suffix = currency === AccountsPayableCurrencyView.ALL ? '' : `-${currency}`;
    return { buffer, filename: `cuentas-por-cobrar${suffix}-${day}.xlsx` };
  }

  async getAccountsReceivableDetail(
    tenantId: string,
    razonSocial: string,
    fiscalConfigurationId?: string,
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

    if (fiscalConfigurationId) {
      qb.andWhere('so.fiscal_configuration_id = :fiscalConfigurationId', {
        fiscalConfigurationId,
      });
    }

    const orders = await qb.orderBy('so.created_at', 'DESC').getMany();
    const matchingOrders = orders.filter(
      (order) => this.receivableRazonSocial(order) === decodedRazonSocial,
    );

    if (!matchingOrders.length) {
      throw new NotFoundException('No hay órdenes pendientes para esta razón social');
    }

    const mxnOrders = matchingOrders.filter(
      (order) => normalizePayableCurrency(order.currency) === 'MXN',
    );
    const usdOrders = matchingOrders.filter(
      (order) => normalizePayableCurrency(order.currency) === 'USD',
    );
    const sumTotal = (list: SalesOrder[]) =>
      Number(list.reduce((sum, order) => sum + Number(order.total || 0), 0).toFixed(2));

    return {
      razon_social: decodedRazonSocial,
      fiscal_rfc: matchingOrders[0].customer?.fiscal_rfc ?? null,
      pending_order_count: matchingOrders.length,
      pending_order_count_mxn: mxnOrders.length,
      pending_order_count_usd: usdOrders.length,
      amount_pending: sumTotal(mxnOrders),
      amount_pending_mxn: sumTotal(mxnOrders),
      amount_pending_usd: sumTotal(usdOrders),
      orders: matchingOrders.map((order) => ({
        id: order.id,
        folio: order.folio,
        currency: normalizePayableCurrency(order.currency),
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

  private async collectAccountsReceivable(
    tenantId: string,
    filters: QueryAccountsReceivableDto,
  ): Promise<AccountsReceivableAccountTotals[]> {
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

    if (filters.fiscal_configuration_id) {
      qb.andWhere('so.fiscal_configuration_id = :fiscalConfigurationId', {
        fiscalConfigurationId: filters.fiscal_configuration_id,
      });
    }

    const orders = await qb.getMany();
    const appliedByOrder = await this.creditNoteAppliedByOrder(tenantId, orders);
    const term = filters.search?.trim().toLowerCase();
    const inputs: ReceivableOrderInput[] = [];

    for (const order of orders) {
      const gross = Number(order.total || 0);
      const amountPending = roundCreditMoney(
        Math.max(0, gross - (appliedByOrder.get(order.id) ?? 0)),
      );
      if (amountPending <= 0) continue;

      const razonSocial = this.receivableRazonSocial(order);
      const fiscalRfc = order.customer?.fiscal_rfc ?? null;
      if (term) {
        const matches =
          razonSocial.toLowerCase().includes(term) ||
          (fiscalRfc ?? '').toLowerCase().includes(term);
        if (!matches) continue;
      }

      inputs.push({
        razon_social: razonSocial,
        fiscal_rfc: fiscalRfc,
        customer_id: order.customer?.id ?? null,
        currency: order.currency,
        amount_pending: amountPending,
      });
    }

    return aggregateReceivableAccounts(inputs);
  }

  private async creditNoteAppliedByOrder(
    tenantId: string,
    orders: SalesOrder[],
  ): Promise<Map<string, number>> {
    const applied = new Map<string, number>();
    if (!orders.length) return applied;

    const ids = orders.map((order) => order.id);
    const placeholders = ids.map(() => '?').join(',');
    const payments: Array<{ sales_order_id: string; paid: string | number | null }> =
      await this.salesOrderRepo.manager.query(
        `
        SELECT sales_order_id, COALESCE(SUM(amount), 0) AS paid
        FROM inv_s_sales_order_payments
        WHERE tenant_id = ? AND sales_order_id IN (${placeholders})
        GROUP BY sales_order_id
        `,
        [tenantId, ...ids],
      );
    const invoices = await this.electronicInvoiceRepo.find({
      where: {
        tenant_id: tenantId,
        source_module: 'sales_orders',
        source_id: In(ids),
        invoice_role: 'credit_note',
      },
    });

    const paidByOrder = new Map(
      payments.map((row) => [row.sales_order_id, Number(row.paid || 0)]),
    );
    const notesByOrder = new Map<string, number>();
    for (const invoice of invoices) {
      if (!isInvoiceVigente(invoice)) continue;
      notesByOrder.set(
        invoice.source_id,
        roundCreditMoney((notesByOrder.get(invoice.source_id) ?? 0) + Number(invoice.total || 0)),
      );
    }

    for (const order of orders) {
      const effect = splitCreditNoteEffect({
        orderTotal: Number(order.total || 0),
        amountPaid: paidByOrder.get(order.id) ?? 0,
        creditNotesTotal: notesByOrder.get(order.id) ?? 0,
      });
      applied.set(order.id, effect.appliedToPending);
    }
    return applied;
  }

  private receivableRazonSocial(order: SalesOrder): string {
    const customer = order.customer;
    return (
      order.fiscal_razon_social?.trim() ||
      customer?.fiscal_razon_social?.trim() ||
      customer?.company_name?.trim() ||
      [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim() ||
      'Sin razón social'
    );
  }

  private receivableExcelSheets(
    rows: AccountsReceivableAccountTotals[],
    currency: AccountsPayableCurrencyView,
    searchLabel: string,
    dailyRate: PayableDailyRate,
    detail: CurrencyDetailLine[] = [],
  ): BuildExcelOptions[] {
    const banner = this.payableRateBanner(dailyRate);
    const sheets: BuildExcelOptions[] = [];

    if (currency === AccountsPayableCurrencyView.ALL) {
      sheets.push(this.receivableAmbosSheet(rows, searchLabel, dailyRate, banner));
      sheets.push(
        this.ambosDetailSheet('Cuentas por cobrar', 'Por cobrar', detail, searchLabel, banner),
      );
    }

    const views =
      currency === AccountsPayableCurrencyView.ALL
        ? [AccountsPayableCurrencyView.MXN, AccountsPayableCurrencyView.USD]
        : [currency];

    for (const view of views) {
      const isUsd = view === AccountsPayableCurrencyView.USD;
      const list = sortReceivableAccounts(filterReceivableAccounts(rows, view), view);
      sheets.push({
        sheetName: isUsd ? 'Dólares USD' : 'Pesos MXN',
        title: isUsd ? 'Cuentas por cobrar — dólares' : 'Cuentas por cobrar — pesos',
        banner,
        subtitle: buildExportSubtitle([
          isUsd ? 'Montos en USD' : 'Montos en MXN',
          searchLabel,
          `${list.length} cuentas`,
        ]),
        headerColor: isUsd ? 'FF047857' : 'FF1D4ED8',
        titleColor: isUsd ? 'FF065F46' : 'FF1E3A8A',
        columns: [
          { header: 'Razón social', key: 'razon_social', width: 36 },
          { header: 'RFC', key: 'fiscal_rfc', width: 18 },
          { header: 'Órdenes', key: 'pending_orders', width: 14, type: 'integer' },
          { header: 'Monto por cobrar', key: 'amount_pending', width: 18, type: 'currency' },
          { header: 'Total en pesos', key: 'amount_total_mxn', width: 18, type: 'currency' },
        ],
        rows: list.map((row) => ({
          razon_social: row.razon_social,
          fiscal_rfc: row.fiscal_rfc ?? '',
          pending_orders: isUsd ? row.pending_order_count_usd : row.pending_order_count_mxn,
          amount_pending: isUsd ? row.amount_pending_usd : row.amount_pending_mxn,
          amount_total_mxn: payableTotalInMxn(
            isUsd ? 0 : row.amount_pending_mxn,
            isUsd ? row.amount_pending_usd : 0,
            dailyRate.exchange_rate,
          ),
        })),
      });
    }

    return sheets;
  }

  private receivableAmbosSheet(
    rows: AccountsReceivableAccountTotals[],
    searchLabel: string,
    dailyRate: PayableDailyRate,
    banner: string,
  ): BuildExcelOptions {
    const list = sortReceivableAccounts(
      filterReceivableAccounts(rows, AccountsPayableCurrencyView.ALL),
      AccountsPayableCurrencyView.ALL,
    );
    const data = list.map((row) => ({
      razon_social: row.razon_social,
      fiscal_rfc: row.fiscal_rfc ?? '',
      orders_mxn: row.pending_order_count_mxn,
      amount_mxn: row.amount_pending_mxn,
      orders_usd: row.pending_order_count_usd,
      amount_usd: row.amount_pending_usd,
      amount_total_mxn: payableTotalInMxn(
        row.amount_pending_mxn,
        row.amount_pending_usd,
        dailyRate.exchange_rate,
      ),
    }));
    const totalMxn = roundPayableMoney(data.reduce((sum, row) => sum + row.amount_mxn, 0));
    const totalUsd = roundPayableMoney(data.reduce((sum, row) => sum + row.amount_usd, 0));

    return {
      sheetName: 'Ambos',
      title: 'Cuentas por cobrar — ambos',
      banner,
      subtitle: buildExportSubtitle([
        'Pesos + dólares × tipo de cambio del sistema',
        searchLabel,
        `${list.length} cuentas`,
      ]),
      headerColor: 'FF4338CA',
      titleColor: 'FF312E81',
      columns: [
        { header: 'Razón social', key: 'razon_social', width: 36 },
        { header: 'RFC', key: 'fiscal_rfc', width: 18 },
        { header: 'Órdenes pesos', key: 'orders_mxn', width: 16, type: 'integer' },
        { header: 'Por cobrar en pesos', key: 'amount_mxn', width: 20, type: 'currency' },
        { header: 'Órdenes dólares', key: 'orders_usd', width: 16, type: 'integer' },
        { header: 'Por cobrar en dólares', key: 'amount_usd', width: 22, type: 'currency' },
        { header: 'Total en pesos', key: 'amount_total_mxn', width: 20, type: 'currency' },
      ],
      rows: [
        ...data,
        {
          razon_social: 'Total',
          fiscal_rfc: '',
          orders_mxn: data.reduce((sum, row) => sum + row.orders_mxn, 0),
          amount_mxn: totalMxn,
          orders_usd: data.reduce((sum, row) => sum + row.orders_usd, 0),
          amount_usd: totalUsd,
          amount_total_mxn: payableTotalInMxn(totalMxn, totalUsd, dailyRate.exchange_rate),
        },
      ],
    };
  }

  private async collectReceivableDetailLines(
    tenantId: string,
    filters: QueryAccountsReceivableDto,
  ): Promise<CurrencyDetailLine[]> {
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

    if (filters.fiscal_configuration_id) {
      qb.andWhere('so.fiscal_configuration_id = :fiscalConfigurationId', {
        fiscalConfigurationId: filters.fiscal_configuration_id,
      });
    }

    const orders = await qb.getMany();
    const term = filters.search?.trim().toLowerCase();
    const pending = orders.filter((order) => {
      if (Number(order.total || 0) <= 0) return false;
      if (!term) return true;
      const razonSocial = this.receivableRazonSocial(order);
      const fiscalRfc = order.customer?.fiscal_rfc ?? '';
      return (
        razonSocial.toLowerCase().includes(term) || fiscalRfc.toLowerCase().includes(term)
      );
    });

    const orderIds = pending.map((order) => order.id);
    const [invoices, payments] = await Promise.all([
      this.loadStampedInvoiceLabels(tenantId, orderIds),
      this.loadSalesPaymentLabels(orderIds),
    ]);

    return sortCurrencyDetailLines(
      pending.map((order) => {
        const methods = payments.get(order.id) ?? [];
        const dated = toDetailDate(order.created_at);
        return {
          razon_social: this.receivableRazonSocial(order),
          date: dated.display,
          sort_date: dated.sort,
          folio: order.folio?.trim() || '',
          invoice: invoices.get(order.id) || 'Sin factura',
          payment_type: methods.length ? methods.join(' + ') : order.is_credit ? 'Crédito' : 'Pendiente',
          currency: normalizePayableCurrency(order.currency),
          amount: Number(Number(order.total || 0).toFixed(2)),
        };
      }),
    );
  }

  private async loadStampedInvoiceLabels(
    tenantId: string,
    orderIds: string[],
  ): Promise<Map<string, string>> {
    const labels = new Map<string, string[]>();
    for (const ids of chunkIds(orderIds, 500)) {
      const invoices = await this.electronicInvoiceRepo
        .createQueryBuilder('ei')
        .select(['ei.id', 'ei.source_id', 'ei.series', 'ei.folio', 'ei.uuid'])
        .where('ei.tenant_id = :tenantId', { tenantId })
        .andWhere('ei.source_module = :module', { module: 'sales_orders' })
        .andWhere('ei.source_id IN (:...ids)', { ids })
        .andWhere('ei.stamp_status IN (:...statuses)', {
          statuses: ['stamped', 'cancel_pending'],
        })
        .getMany();
      for (const invoice of invoices) {
        const label =
          [invoice.series, invoice.folio].map((part) => part?.trim()).filter(Boolean).join('-') ||
          invoice.uuid?.trim() ||
          '';
        if (!label) continue;
        const list = labels.get(invoice.source_id) ?? [];
        if (!list.includes(label)) list.push(label);
        labels.set(invoice.source_id, list);
      }
    }
    return new Map([...labels.entries()].map(([id, list]) => [id, list.join(', ')]));
  }

  private async loadSalesPaymentLabels(orderIds: string[]): Promise<Map<string, string[]>> {
    const labels = new Map<string, string[]>();
    for (const ids of chunkIds(orderIds, 500)) {
      const payments = await this.salesOrderRepo.manager
        .getRepository(SalesOrderPayment)
        .createQueryBuilder('payment')
        .select(['payment.id', 'payment.sales_order_id', 'payment.payment_method'])
        .where('payment.sales_order_id IN (:...ids)', { ids })
        .getMany();
      for (const payment of payments) {
        const label =
          SALES_ORDER_PAYMENT_METHOD_LABELS[payment.payment_method as PosSalePaymentMethod] ?? payment.payment_method;
        const list = labels.get(payment.sales_order_id) ?? [];
        if (label && !list.includes(label)) list.push(label);
        labels.set(payment.sales_order_id, list);
      }
    }
    return labels;
  }

  private isForShippingFlag(value: unknown): boolean {
    if (value === true || value === 1 || value === '1') return true;
    if (Buffer.isBuffer(value)) return value.length > 0 && value[0] === 1;
    return false;
  }

  private posBranchSql(): string {
    return '(so.billing_branch_id = :branchId OR warehouse.billing_branch_id = :branchId)';
  }

  private async loadPosEnteredOrders(
    tenantId: string,
    branchId: string,
    shiftFrom: string,
    shiftTo: string,
  ) {
    const rows = await this.salesOrderRepo
      .createQueryBuilder('so')
      .leftJoin('so.terminal_user', 'terminal_user')
      .leftJoin('so.customer', 'customer')
      .leftJoin('so.warehouse', 'warehouse')
      .leftJoin('pos_sale_collections', 'collection', 'collection.sales_order_id = so.id')
      .select('so.id', 'id')
      .addSelect('so.folio', 'folio')
      .addSelect('so.created_at', 'created_at')
      .addSelect('so.total', 'total')
      .addSelect('so.payment_status', 'payment_status')
      .addSelect('so.for_shipping', 'for_shipping')
      .addSelect('terminal_user.first_name', 'terminal_first_name')
      .addSelect('terminal_user.last_name', 'terminal_last_name')
      .addSelect('customer.company_name', 'customer_company_name')
      .addSelect('customer.name', 'customer_name')
      .addSelect('customer.lastname', 'customer_lastname')
      .addSelect('customer.fiscal_razon_social', 'customer_fiscal')
      .addSelect('so.sales_order_type', 'sales_order_type')
      .addSelect('COALESCE(collection.order_total_mxn, 0)', 'amount_collected')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere(this.posBranchSql(), { branchId })
      .andWhere('so.sales_order_type IN (:...orderTypes)', { orderTypes: ['POS', 'MANUAL'] })
      .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
      .andWhere(
        `(
          (
            ${posCalendarDateSql('so.created_at')} >= :shiftFrom
            AND ${posCalendarDateSql('so.created_at')} <= :shiftTo
          )
          OR EXISTS (
            SELECT 1 FROM pos_sale_collections col
            INNER JOIN pos_daily_shifts sh ON sh.id = col.pos_daily_shift_id
            WHERE col.sales_order_id = so.id
              AND sh.billing_branch_id = :branchId
              AND sh.shift_date >= :shiftFrom
              AND sh.shift_date <= :shiftTo
          )
        )`,
        { shiftFrom, shiftTo, branchId },
      )
      .orderBy('so.created_at', 'DESC')
      .getRawMany<{
        id: string;
        folio: string | null;
        created_at: Date | string | null;
        total: string | number | null;
        payment_status: string | null;
        for_shipping: unknown;
        terminal_first_name: string | null;
        terminal_last_name: string | null;
        customer_company_name: string | null;
        customer_name: string | null;
        customer_lastname: string | null;
        customer_fiscal: string | null;
        sales_order_type: string | null;
        amount_collected: string | number | null;
      }>();

    const advanceByOrder = await this.loadOrderAdvanceDisplay(
      tenantId,
      rows.map((row) => row.id),
    );

    return rows.map((row) => {
      const customerFields = this.buildCustomerFields({
        company_name: row.customer_company_name,
        name: row.customer_name,
        lastname: row.customer_lastname,
        fiscal_razon_social: row.customer_fiscal,
      });
      const createdAt =
        row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? '');
      const advance = advanceByOrder.get(row.id);
      return {
        id: row.id,
        folio: row.folio,
        created_at: createdAt,
        total: Number(row.total || 0),
        payment_status: row.payment_status,
        has_advance: advance?.hasAdvance ?? false,
        advance_given: advance?.advanceGiven ?? 0,
        amount_pending: advance?.amountPending ?? advanceDocumentPending(Number(row.total || 0), 0),
        for_shipping: this.isForShippingFlag(row.for_shipping),
        sales_order_type: row.sales_order_type,
        channel: row.sales_order_type === 'POS' ? 'caja' : 'branch',
        terminal_name:
          row.sales_order_type === 'POS'
            ? row.terminal_first_name || row.terminal_last_name
              ? this.buildUserName(row.terminal_first_name, row.terminal_last_name)
              : null
            : 'Sucursal',
        customer_display_name: customerFields.customer_display_name,
        amount_collected: Number(row.amount_collected || 0),
      };
    });
  }

  private creditCustomerOrderSql(): string {
    return `(
      so.is_credit = 1
      OR collection.payment_method = 'credit'
      OR COALESCE(collection.amount_credit_mxn, 0) > 0
    )
    AND NOT ${this.walkInCustomerSql('customer')}
    AND EXISTS (
      SELECT 1 FROM customer_credits cc
      WHERE cc.tenant_id = collection.tenant_id
        AND cc.customer_id = customer.id
        AND cc.fiscal_configuration_id = so.fiscal_configuration_id
        AND cc.credit_enabled = 1
    )`;
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

  private async loadSalesOrderPaymentDates(
    tenantId: string,
    orderIds: string[],
  ): Promise<Map<string, string>> {
    const dates = new Map<string, string>();
    if (!orderIds.length) {
      return dates;
    }
    for (const ids of chunkIds(orderIds, 500)) {
      const rows = await this.salesOrderRepo.manager
        .getRepository(SalesOrderPayment)
        .createQueryBuilder('payment')
        .select('payment.sales_order_id', 'sales_order_id')
        .addSelect("DATE_FORMAT(MAX(payment.payment_date), '%Y-%m-%d')", 'payment_date')
        .where('payment.tenant_id = :tenantId', { tenantId })
        .andWhere('payment.sales_order_id IN (:...ids)', { ids })
        .groupBy('payment.sales_order_id')
        .getRawMany<{ sales_order_id: string | null; payment_date: string | null }>();
      for (const row of rows) {
        const day = row.payment_date ? String(row.payment_date).slice(0, 10) : '';
        if (row.sales_order_id && day) {
          dates.set(row.sales_order_id, day);
        }
      }
    }
    return dates;
  }

  private async getStampedInvoiceOrderIds(
    tenantId: string,
    orderIds: string[],
  ): Promise<Set<string>> {
    if (!orderIds.length) {
      return new Set<string>();
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

  private payablePeriodRange(filters: QueryAccountsPayableDto): PayablePeriodRange | null {
    if (!filters.period) return null;
    return resolvePosCalendarRange(filters.period, filters.date_from, filters.date_to);
  }

  private async collectAccountsPayableVendors(
    tenantId: string,
    search?: string,
    range?: PayablePeriodRange | null,
    fiscalConfigurationId?: string,
  ): Promise<AccountsPayableVendorTotals[]> {
    const pendingOrders = await this.purchaseOrderRepo.find({
      where: {
        tenant_id: tenantId,
        payment_status: 'Pendiente',
      },
      relations: ['vendor', 'payments'],
    });

    const term = search?.trim().toLowerCase();
    const inputs: PayableOrderInput[] = [];

    for (const order of pendingOrders) {
      if (order.general_status === 'Cancelada') continue;
      if (
        fiscalConfigurationId &&
        order.fiscal_configuration_id !== fiscalConfigurationId
      ) {
        continue;
      }
      if (range && !isWithinPayablePeriod(order.created_at, range.from, range.to)) continue;

      const summary = this.buildPurchaseOrderPaymentSummary(order);
      if (summary.amount_pending <= 0) continue;

      const vendor = order.vendor;
      if (!vendor) continue;

      if (term) {
        const matches =
          (vendor.name ?? '').toLowerCase().includes(term) ||
          (vendor.razon_social ?? '').toLowerCase().includes(term) ||
          (vendor.company_name ?? '').toLowerCase().includes(term);
        if (!matches) continue;
      }

      inputs.push({
        vendor_id: vendor.id,
        vendor_name: vendorCompanyName(vendor),
        razon_social: vendor.razon_social,
        company_name: vendor.company_name,
        credit_limit: parseCreditLimit(vendor.credit_limit),
        payment_currency: order.payment_currency,
        amount_pending: summary.amount_pending,
        amount_paid: summary.amount_paid,
      });
    }

    const pending = aggregatePayableVendors(inputs);
    const creditRows = await this.vendorCreditLedger.balancesByVendor(
      tenantId,
      fiscalConfigurationId,
    );
    if (!creditRows.length) return pending;

    const missingIds = creditRows
      .map((row) => row.vendor_id)
      .filter((id) => !pending.some((row) => row.vendor_id === id));
    const extraVendors = missingIds.length
      ? await this.vendorRepo.find({
          where: { tenant_id: tenantId, id: In(missingIds) },
        })
      : [];
    const extraById = new Map(extraVendors.map((vendor) => [vendor.id, vendor]));

    return mergeVendorCredits(
      pending,
      creditRows.map((row) => {
        const fromPending = pending.find((item) => item.vendor_id === row.vendor_id);
        const vendor = extraById.get(row.vendor_id);
        if (term && !fromPending && vendor) {
          const matches =
            (vendor.name ?? '').toLowerCase().includes(term) ||
            (vendor.razon_social ?? '').toLowerCase().includes(term) ||
            (vendor.company_name ?? '').toLowerCase().includes(term);
          if (!matches) {
            return {
              vendor_id: row.vendor_id,
              vendor_name: vendorCompanyName(vendor),
              razon_social: vendor.razon_social,
              company_name: vendor.company_name,
              credit_limit: parseCreditLimit(vendor.credit_limit),
              credit_balance_mxn: 0,
              credit_balance_usd: 0,
            };
          }
        }
        return {
          vendor_id: row.vendor_id,
          vendor_name: fromPending?.vendor_name || vendorCompanyName(vendor) || 'Proveedor',
          razon_social: fromPending?.razon_social ?? vendor?.razon_social ?? null,
          company_name: fromPending?.company_name ?? vendor?.company_name ?? null,
          credit_limit: fromPending?.credit_limit ?? parseCreditLimit(vendor?.credit_limit),
          credit_balance_mxn: row.mxn,
          credit_balance_usd: row.usd,
        };
      }),
    );
  }

  private async resolvePayableExchangeRate(tenantId: string): Promise<PayableDailyRate> {
    const row = await this.exchangeRateService.getDailyRate(tenantId);
    if (!row) {
      return { exchange_rate: null, exchange_rate_date: null };
    }
    const rawDate: unknown = row.rate_date;
    const exchangeRateDate =
      rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : rawDate ? String(rawDate).slice(0, 10) : null;
    return {
      exchange_rate: Number(row.exchange_rate),
      exchange_rate_date: exchangeRateDate,
    };
  }

  private payableExcelSheets(
    rows: AccountsPayableVendorTotals[],
    currency: AccountsPayableCurrencyView,
    searchLabel: string,
    dailyRate: PayableDailyRate,
    detail: CurrencyDetailLine[] = [],
  ): BuildExcelOptions[] {
    const banner = this.payableRateBanner(dailyRate);
    const sheets: BuildExcelOptions[] = [];

    if (currency === AccountsPayableCurrencyView.ALL) {
      sheets.push(this.payableAmbosSheet(rows, searchLabel, dailyRate, banner));
      sheets.push(
        this.ambosDetailSheet('Cuentas por pagar', 'Por pagar', detail, searchLabel, banner),
      );
    }

    const views =
      currency === AccountsPayableCurrencyView.ALL
        ? [AccountsPayableCurrencyView.MXN, AccountsPayableCurrencyView.USD]
        : [currency];

    for (const view of views) {
      const isUsd = view === AccountsPayableCurrencyView.USD;
      const list = sortPayableVendors(filterPayableVendors(rows, view), view);
      sheets.push({
        sheetName: isUsd ? 'Dólares USD' : 'Pesos MXN',
        title: isUsd ? 'Cuentas por pagar — dólares' : 'Cuentas por pagar — pesos',
        banner,
        subtitle: buildExportSubtitle([
          isUsd ? 'Montos en USD' : 'Montos en MXN',
          searchLabel,
          `${list.length} proveedores`,
        ]),
        headerColor: isUsd ? 'FF047857' : 'FF1D4ED8',
        titleColor: isUsd ? 'FF065F46' : 'FF1E3A8A',
        columns: [
          { header: 'Razón social', key: 'vendor', width: 36 },
          { header: 'OC pendientes', key: 'pending_orders', width: 16, type: 'integer' },
          { header: 'Monto adeudado', key: 'amount_pending', width: 18, type: 'currency' },
          { header: 'Saldo a favor', key: 'credit_balance', width: 16, type: 'currency' },
          { header: 'Total en pesos', key: 'amount_total_mxn', width: 18, type: 'currency' },
          { header: 'Progreso', key: 'progress', width: 14, type: 'percent' },
        ],
        rows: list.map((row) => ({
          vendor: this.payableVendorLabel(row),
          pending_orders: isUsd ? row.pending_order_count_usd : row.pending_order_count_mxn,
          amount_pending: isUsd ? row.amount_pending_usd : row.amount_pending_mxn,
          credit_balance: isUsd ? row.credit_balance_usd : row.credit_balance_mxn,
          amount_total_mxn: payableTotalInMxn(
            isUsd ? 0 : row.amount_pending_mxn,
            isUsd ? row.amount_pending_usd : 0,
            dailyRate.exchange_rate,
          ),
          progress: isUsd ? row.progress_percentage_usd : row.progress_percentage_mxn,
        })),
      });
    }

    return sheets;
  }

  private payableAmbosSheet(
    rows: AccountsPayableVendorTotals[],
    searchLabel: string,
    dailyRate: PayableDailyRate,
    banner: string,
  ): BuildExcelOptions {
    const list = sortPayableVendors(
      filterPayableVendors(rows, AccountsPayableCurrencyView.ALL),
      AccountsPayableCurrencyView.ALL,
    );
    const data = list.map((row) => ({
      vendor: this.payableVendorLabel(row),
      orders_mxn: row.pending_order_count_mxn,
      amount_mxn: row.amount_pending_mxn,
      credit_mxn: row.credit_balance_mxn,
      orders_usd: row.pending_order_count_usd,
      amount_usd: row.amount_pending_usd,
      credit_usd: row.credit_balance_usd,
      amount_total_mxn: payableTotalInMxn(
        row.amount_pending_mxn,
        row.amount_pending_usd,
        dailyRate.exchange_rate,
      ),
    }));
    const totalMxn = roundPayableMoney(data.reduce((sum, row) => sum + row.amount_mxn, 0));
    const totalUsd = roundPayableMoney(data.reduce((sum, row) => sum + row.amount_usd, 0));
    const totalCreditMxn = roundPayableMoney(data.reduce((sum, row) => sum + row.credit_mxn, 0));
    const totalCreditUsd = roundPayableMoney(data.reduce((sum, row) => sum + row.credit_usd, 0));
    const totalInMxn = payableTotalInMxn(totalMxn, totalUsd, dailyRate.exchange_rate);

    return {
      sheetName: 'Ambos',
      title: 'Cuentas por pagar — ambos',
      banner,
      subtitle: buildExportSubtitle([
        'Pesos + dólares × tipo de cambio del sistema',
        searchLabel,
        `${list.length} proveedores`,
      ]),
      headerColor: 'FF4338CA',
      titleColor: 'FF312E81',
      columns: [
        { header: 'Razón social', key: 'vendor', width: 36 },
        { header: 'OC pesos', key: 'orders_mxn', width: 12, type: 'integer' },
        { header: 'Adeudado en pesos', key: 'amount_mxn', width: 20, type: 'currency' },
        { header: 'A favor pesos', key: 'credit_mxn', width: 16, type: 'currency' },
        { header: 'OC dólares', key: 'orders_usd', width: 14, type: 'integer' },
        { header: 'Adeudado en dólares', key: 'amount_usd', width: 20, type: 'currency' },
        { header: 'A favor dólares', key: 'credit_usd', width: 16, type: 'currency' },
        { header: 'Total en pesos', key: 'amount_total_mxn', width: 20, type: 'currency' },
      ],
      rows: [
        ...data,
        {
          vendor: 'Total',
          orders_mxn: data.reduce((sum, row) => sum + row.orders_mxn, 0),
          amount_mxn: totalMxn,
          credit_mxn: totalCreditMxn,
          orders_usd: data.reduce((sum, row) => sum + row.orders_usd, 0),
          amount_usd: totalUsd,
          credit_usd: totalCreditUsd,
          amount_total_mxn: totalInMxn,
        },
      ],
    };
  }

  private payableRateBanner(dailyRate: PayableDailyRate): string {
    const rate = normalizeExchangeRate(dailyRate.exchange_rate);
    if (rate == null) return 'Sin tipo de cambio en el sistema';
    const formatted = formatPayableRate(rate);
    const date = formatPayableRateDate(dailyRate.exchange_rate_date);
    return date
      ? `Tipo de cambio del sistema: ${formatted}  ·  ${date}`
      : `Tipo de cambio del sistema: ${formatted}`;
  }

  private async collectPayableDetailLines(
    tenantId: string,
    search?: string,
    range?: PayablePeriodRange | null,
    fiscalConfigurationId?: string,
  ): Promise<CurrencyDetailLine[]> {
    const pendingOrders = await this.purchaseOrderRepo.find({
      where: {
        tenant_id: tenantId,
        payment_status: 'Pendiente',
      },
      relations: ['vendor', 'payments'],
    });
    const term = search?.trim().toLowerCase();
    const lines: CurrencyDetailLine[] = [];

    for (const order of pendingOrders) {
      if (order.general_status === 'Cancelada') continue;
      if (
        fiscalConfigurationId &&
        order.fiscal_configuration_id !== fiscalConfigurationId
      ) {
        continue;
      }
      if (range && !isWithinPayablePeriod(order.created_at, range.from, range.to)) continue;

      const summary = this.buildPurchaseOrderPaymentSummary(order);
      if (summary.amount_pending <= 0) continue;

      const vendor = order.vendor;
      if (!vendor) continue;

      const razonSocial = vendor.razon_social?.trim() || vendorCompanyName(vendor) || '—';
      if (term) {
        const matches =
          (vendor.name ?? '').toLowerCase().includes(term) ||
          (vendor.razon_social ?? '').toLowerCase().includes(term) ||
          (vendor.company_name ?? '').toLowerCase().includes(term);
        if (!matches) continue;
      }

      const dated = toDetailDate(order.created_at);
      const methods = [
        ...new Set(
          (order.payments ?? [])
            .map((payment) => payment.payment_method?.trim())
            .filter((method): method is string => Boolean(method)),
        ),
      ];

      lines.push({
        razon_social: razonSocial,
        date: dated.display,
        sort_date: dated.sort,
        folio: order.folio?.trim() || '',
        invoice: vendorInvoiceLabel(order),
        payment_type: methods.length ? methods.join(' + ') : 'Pendiente',
        currency: normalizePayableCurrency(order.payment_currency),
        amount: summary.amount_pending,
      });
    }

    return sortCurrencyDetailLines(lines);
  }

  private ambosDetailSheet(
    titlePrefix: string,
    amountHeader: string,
    lines: CurrencyDetailLine[],
    searchLabel: string,
    banner: string,
  ): BuildExcelOptions {
    const totalMxn = roundPayableMoney(
      lines.filter((line) => line.currency === 'MXN').reduce((sum, line) => sum + line.amount, 0),
    );
    const totalUsd = roundPayableMoney(
      lines.filter((line) => line.currency === 'USD').reduce((sum, line) => sum + line.amount, 0),
    );

    return {
      sheetName: 'Ambos detallado',
      title: `${titlePrefix} — ambos detallado`,
      banner,
      subtitle: buildExportSubtitle([
        'Órdenes por razón social y fecha',
        searchLabel,
        `${lines.length} órdenes`,
      ]),
      headerColor: 'FF4338CA',
      titleColor: 'FF312E81',
      columns: [
        { header: 'Razón social', key: 'razon_social', width: 36 },
        { header: 'Fecha', key: 'date', width: 14 },
        { header: 'Folio', key: 'folio', width: 16 },
        { header: 'Factura', key: 'invoice', width: 24 },
        { header: 'Tipo de pago', key: 'payment_type', width: 22 },
        { header: 'Moneda', key: 'currency', width: 12 },
        { header: amountHeader, key: 'amount', width: 18, type: 'currency' },
      ],
      rows: [
        ...lines.map((line) => ({
          razon_social: line.razon_social,
          date: line.date,
          folio: line.folio,
          invoice: line.invoice,
          payment_type: line.payment_type,
          currency: line.currency,
          amount: line.amount,
        })),
        {
          razon_social: 'Total MXN',
          date: '',
          folio: '',
          invoice: '',
          payment_type: '',
          currency: 'MXN',
          amount: totalMxn,
        },
        {
          razon_social: 'Total USD',
          date: '',
          folio: '',
          invoice: '',
          payment_type: '',
          currency: 'USD',
          amount: totalUsd,
        },
      ],
    };
  }

  private payableVendorLabel(row: AccountsPayableVendorTotals): string {
    return row.razon_social?.trim() || row.company_name?.trim() || row.vendor_name?.trim() || '—';
  }

  private buildPurchaseOrderPaymentSummary(order: PurchaseOrderBatch) {
    const total = resolvePurchaseOrderPayableTotal(order);
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

  private buildPosCollectionsQuery(
    tenantId: string,
    filters: QueryPosCollectionsDto,
    periodFrom: string,
    periodTo: string,
    customerType: PosCollectionCustomerType,
    dateBasis: PosCollectionDateBasis = PosCollectionDateBasis.SHIFT,
  ): SelectQueryBuilder<PosSaleCollection> {
    const qb = this.collectionRepo
      .createQueryBuilder('collection')
      .innerJoinAndSelect('collection.sales_order', 'so')
      .innerJoinAndSelect('collection.pos_daily_shift', 'shift')
      .innerJoinAndSelect('collection.customer', 'customer')
      .leftJoinAndSelect('so.seller_user', 'seller_user')
      .leftJoinAndSelect('collection.collected_by_user', 'collected_by_user')
      .leftJoinAndSelect('so.billing_branch', 'sale_branch')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'warehouse_branch')
      .leftJoinAndSelect('shift.billing_branch', 'shift_branch');

    this.applyPosCollectionScope(
      qb,
      tenantId,
      filters.billing_branch_id,
      periodFrom,
      periodTo,
      dateBasis,
      customerType,
      filters.search,
      filters.credit_only ? undefined : filters.payment_method,
      filters.credit_only,
    );
    return qb;
  }

  private async aggregatePosCollections(
    tenantId: string,
    filters: QueryPosCollectionsDto,
    periodFrom: string,
    periodTo: string,
    dateBasis: PosCollectionDateBasis,
    customerType: PosCollectionCustomerType,
    search?: string,
    paymentMethod?: PosCollectionPaymentMethodFilter,
  ): Promise<{
    orders_collected: number;
    amount_collected: number;
    walk_in_count: number;
    invoiced_count: number;
    by_payment_method: PosCollectionPaymentMethodTotals;
  }> {
    const walkInSql = this.walkInCustomerSql('customer');
    const stampedSql = this.stampedInvoiceExistsSql('so');

    const qb = this.collectionRepo
      .createQueryBuilder('collection')
      .innerJoin('collection.sales_order', 'so')
      .innerJoin('collection.pos_daily_shift', 'shift')
      .innerJoin('collection.customer', 'customer')
      .select('COUNT(collection.id)', 'orders_collected')
      .addSelect('COALESCE(SUM(collection.order_total_mxn), 0)', 'amount_collected')
      .addSelect(
        `SUM(CASE WHEN ${walkInSql} AND NOT ${stampedSql} THEN 1 ELSE 0 END)`,
        'walk_in_count',
      )
      .addSelect(`SUM(CASE WHEN ${stampedSql} THEN 1 ELSE 0 END)`, 'invoiced_count')
      .addSelect(`SUM(CASE WHEN ${paymentMethodMatchSql('cash')} THEN 1 ELSE 0 END)`, 'cash_orders')
      .addSelect(`COALESCE(SUM(${paymentMethodAmountSql('cash')}), 0)`, 'cash_amount')
      .addSelect(
        `SUM(CASE WHEN ${paymentMethodMatchSql('transfer')} THEN 1 ELSE 0 END)`,
        'transfer_orders',
      )
      .addSelect(`COALESCE(SUM(${paymentMethodAmountSql('transfer')}), 0)`, 'transfer_amount')
      .addSelect(`SUM(CASE WHEN ${paymentMethodMatchSql('card')} THEN 1 ELSE 0 END)`, 'card_orders')
      .addSelect(`COALESCE(SUM(${paymentMethodAmountSql('card')}), 0)`, 'card_amount')
      .addSelect(`SUM(CASE WHEN ${paymentMethodMatchSql('check')} THEN 1 ELSE 0 END)`, 'check_orders')
      .addSelect(`COALESCE(SUM(${paymentMethodAmountSql('check')}), 0)`, 'check_amount')
      .addSelect(
        `SUM(CASE WHEN ${paymentMethodMatchSql('credit')} THEN 1 ELSE 0 END)`,
        'credit_orders',
      )
      .addSelect(`COALESCE(SUM(${paymentMethodAmountSql('credit')}), 0)`, 'credit_amount');

    this.applyPosCollectionScope(
      qb,
      tenantId,
      filters.billing_branch_id,
      periodFrom,
      periodTo,
      dateBasis,
      customerType,
      search,
      filters.credit_only ? undefined : paymentMethod,
      filters.credit_only,
    );
    qb.setParameter('walkInFiscal', WALK_IN_FISCAL_NAME).setParameter(
      'walkInName',
      WALK_IN_DISPLAY_NAME,
    );

    const row = await qb.getRawOne<{
      orders_collected: string;
      amount_collected: string;
      walk_in_count: string;
      invoiced_count: string;
      cash_orders: string;
      cash_amount: string;
      transfer_orders: string;
      transfer_amount: string;
      card_orders: string;
      card_amount: string;
      check_orders: string;
      check_amount: string;
      credit_orders: string;
      credit_amount: string;
    }>();

    return {
      orders_collected: Number(row?.orders_collected || 0),
      amount_collected: Number(Number(row?.amount_collected || 0).toFixed(2)),
      walk_in_count: Number(row?.walk_in_count || 0),
      invoiced_count: Number(row?.invoiced_count || 0),
      by_payment_method: row
        ? buildPaymentMethodTotals(row)
        : emptyPaymentMethodTotals(),
    };
  }

  private applyPosCollectionScope(
    qb: SelectQueryBuilder<PosSaleCollection>,
    tenantId: string,
    branchId: string,
    periodFrom: string,
    periodTo: string,
    dateBasis: PosCollectionDateBasis,
    customerType: PosCollectionCustomerType,
    search?: string,
    paymentMethod?: PosCollectionPaymentMethodFilter,
    creditOnly = false,
  ): void {
    qb.where('collection.tenant_id = :tenantId', { tenantId }).andWhere(
      'shift.billing_branch_id = :branchId',
      { branchId },
    );

    if (dateBasis === PosCollectionDateBasis.COLLECTED) {
      qb.andWhere(`${posCalendarDateSql('collection.created_at')} >= :periodFrom`, { periodFrom })
        .andWhere(`${posCalendarDateSql('collection.created_at')} <= :periodTo`, { periodTo });
    } else {
      qb.andWhere('shift.shift_date >= :periodFrom', { periodFrom }).andWhere(
        'shift.shift_date <= :periodTo',
        { periodTo },
      );
    }

    if (creditOnly) {
      qb.andWhere(this.creditCustomerOrderSql(), {
        walkInFiscal: WALK_IN_FISCAL_NAME,
        walkInName: WALK_IN_DISPLAY_NAME,
      });
    }

    if (customerType === PosCollectionCustomerType.WALK_IN && !creditOnly) {
      qb.andWhere(this.walkInCustomerSql('customer'), {
        walkInFiscal: WALK_IN_FISCAL_NAME,
        walkInName: WALK_IN_DISPLAY_NAME,
      }).andWhere(`NOT ${this.stampedInvoiceExistsSql('so')}`);
    } else if (customerType === PosCollectionCustomerType.INVOICED) {
      qb.andWhere(this.stampedInvoiceExistsSql('so'));
    }

    if (paymentMethod && !creditOnly) {
      qb.andWhere(paymentMethodMatchSql(paymentMethod as PosCollectionPaymentMethodKey));
    }

    const term = search?.trim();
    if (term) {
      qb.andWhere(
        `(so.folio ILIKE :search
          OR customer.name ILIKE :search
          OR customer.lastname ILIKE :search
          OR customer.company_name ILIKE :search
          OR so.walk_in_name ILIKE :search
          OR so.walk_in_rfc ILIKE :search)`,
        { search: `%${term}%` },
      );
    }
  }

  private async loadOrderAdvanceDisplay(
    tenantId: string,
    orderIds: string[],
  ): Promise<Map<string, OrderAdvanceDisplay>> {
    const result = new Map<string, OrderAdvanceDisplay>();
    const ids = [...new Set(orderIds.filter(Boolean))];
    if (ids.length === 0) {
      return result;
    }

    const [orders, paymentRows, quotations] = await Promise.all([
      this.salesOrderRepo.find({
        where: { tenant_id: tenantId, id: In(ids) },
        select: ['id', 'total', 'advance_invoice_id'],
      }),
      this.salesOrderRepo.manager
        .getRepository(SalesOrderPayment)
        .createQueryBuilder('payment')
        .select('payment.sales_order_id', 'sales_order_id')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'paid')
        .addSelect(
          `COALESCE(SUM(CASE WHEN payment.source = 'advance' THEN payment.amount ELSE 0 END), 0)`,
          'advance',
        )
        .where('payment.tenant_id = :tenantId', { tenantId })
        .andWhere('payment.sales_order_id IN (:...ids)', { ids })
        .groupBy('payment.sales_order_id')
        .getRawMany<{ sales_order_id: string; paid: string; advance: string }>(),
      this.salesOrderRepo.manager.getRepository(Quotation).find({
        where: { tenant_id: tenantId, converted_to_sales_order_id: In(ids) },
        select: ['id', 'converted_to_sales_order_id', 'advance_requested_total'],
      }),
    ]);

    const paidByOrder = new Map(
      paymentRows.map((row) => [
        row.sales_order_id,
        { paid: Number(row.paid || 0), advance: Number(row.advance || 0) },
      ]),
    );
    const requestedByOrder = new Map<string, number>();
    for (const quote of quotations) {
      if (!quote.converted_to_sales_order_id) continue;
      const requested = Number(quote.advance_requested_total || 0);
      if (requested > 0.009) {
        requestedByOrder.set(quote.converted_to_sales_order_id, requested);
      }
    }

    for (const order of orders) {
      const paid = paidByOrder.get(order.id)?.paid ?? 0;
      const advanceGiven = roundAdvanceMoney(paidByOrder.get(order.id)?.advance ?? 0);
      const requested =
        requestedByOrder.get(order.id) ?? (order.advance_invoice_id ? advanceGiven : 0);
      const hasAdvance =
        Boolean(order.advance_invoice_id) || advanceGiven > 0.009 || requested > 0.009;
      result.set(order.id, {
        hasAdvance,
        advanceGiven,
        amountPending: advanceDocumentPending(Number(order.total || 0), paid),
        requested,
      });
    }

    return result;
  }

  private async loadAdvanceCreditRows(
    tenantId: string,
    filters: QueryPosCollectionsDto,
    periodFrom: string,
    periodTo: string,
    search: string,
  ): Promise<PosCollectionListRow[]> {
    const branchId = filters.billing_branch_id;

    const quotationRows = await this.salesOrderRepo.manager
      .getRepository(Quotation)
      .createQueryBuilder('quotation')
      .innerJoinAndSelect('quotation.customer', 'customer')
      .leftJoinAndSelect('quotation.seller_user', 'seller_user')
      .leftJoinAndSelect('quotation.billing_branch', 'branch')
      .leftJoin('quotation.warehouse', 'warehouse')
      .where('quotation.tenant_id = :tenantId', { tenantId })
      .andWhere('quotation.general_status = :openStatus', { openStatus: 'Creada' })
      .andWhere('quotation.converted_to_sales_order_id IS NULL')
      .andWhere('quotation.advance_requested_total > 0')
      .andWhere(
        '(quotation.billing_branch_id = :branchId OR warehouse.billing_branch_id = :branchId)',
        { branchId },
      )
      .andWhere(`NOT ${this.walkInCustomerSql('customer')}`, {
        walkInFiscal: WALK_IN_FISCAL_NAME,
        walkInName: WALK_IN_DISPLAY_NAME,
      })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM customer_credits cc
          WHERE cc.tenant_id = quotation.tenant_id
            AND cc.customer_id = customer.id
            AND cc.fiscal_configuration_id = quotation.fiscal_configuration_id
            AND cc.credit_enabled = 1
        )`,
      )
      .getMany();

    const quoteIds = quotationRows.map((row) => row.id);
    const advancePayments = quoteIds.length
      ? await this.salesOrderRepo.manager.getRepository(AdvanceShiftPayment).find({
          where: { tenant_id: tenantId, quotation_id: In(quoteIds), voided_at: IsNull() },
        })
      : [];
    const paidByQuote = new Map<string, number>();
    const paidAtByQuote = new Map<string, Date>();
    for (const payment of advancePayments) {
      if (!payment.quotation_id) continue;
      paidByQuote.set(
        payment.quotation_id,
        roundAdvanceMoney((paidByQuote.get(payment.quotation_id) ?? 0) + Number(payment.amount_mxn || 0)),
      );
      const current = paidAtByQuote.get(payment.quotation_id);
      if (!current || payment.created_at > current) {
        paidAtByQuote.set(payment.quotation_id, payment.created_at);
      }
    }

    const orders = await this.salesOrderRepo
      .createQueryBuilder('so')
      .innerJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.seller_user', 'seller_user')
      .leftJoinAndSelect('so.billing_branch', 'branch')
      .leftJoin('so.warehouse', 'warehouse')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
      .andWhere(this.posBranchSql(), { branchId })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM pos_sale_collections collection
          WHERE collection.sales_order_id = so.id
            AND collection.tenant_id = so.tenant_id
        )`,
      )
      .andWhere(
        `(
          so.advance_invoice_id IS NOT NULL
          OR EXISTS (
            SELECT 1 FROM inv_s_quotations quote
            WHERE quote.converted_to_sales_order_id = so.id
              AND quote.tenant_id = so.tenant_id
              AND quote.advance_requested_total > 0
          )
          OR EXISTS (
            SELECT 1 FROM inv_s_sales_order_payments payment
            WHERE payment.sales_order_id = so.id
              AND payment.tenant_id = so.tenant_id
              AND payment.source = 'advance'
          )
        )`,
      )
      .andWhere(`NOT ${this.walkInCustomerSql('customer')}`, {
        walkInFiscal: WALK_IN_FISCAL_NAME,
        walkInName: WALK_IN_DISPLAY_NAME,
      })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM customer_credits cc
          WHERE cc.tenant_id = so.tenant_id
            AND cc.customer_id = customer.id
            AND cc.fiscal_configuration_id = so.fiscal_configuration_id
            AND cc.credit_enabled = 1
        )`,
      )
      .getMany();

    const advanceByOrder = await this.loadOrderAdvanceDisplay(
      tenantId,
      orders.map((order) => order.id),
    );
    const term = search.trim().toLowerCase();
    const rows: PosCollectionListRow[] = [];

    for (const quote of quotationRows) {
      const paid = paidByQuote.get(quote.id) ?? 0;
      const pending = advanceDocumentPending(Number(quote.total || 0), paid);
      if (pending <= 0.009) {
        continue;
      }
      const occurredAt = paidAtByQuote.get(quote.id) ?? quote.created_at;
      if (
        !this.calendarDateInRange(occurredAt, periodFrom, periodTo) &&
        !this.calendarDateInRange(quote.created_at, periodFrom, periodTo)
      ) {
        continue;
      }
      const customerFields = this.buildCustomerFields(quote.customer);
      if (term && !this.advanceRowMatchesSearch(term, quote.folio, customerFields, null)) {
        continue;
      }
      rows.push({
        id: quote.id,
        sales_order_id: null,
        is_credit_payment: false,
        sale_kind: 'advance',
        collection_id: null,
        folio: quote.folio,
        total: pending,
        payment_status: 'Pendiente',
        general_status: quote.general_status,
        created_at: quote.created_at,
        payment_date: paid > 0 ? this.calendarDay(paidAtByQuote.get(quote.id)) : null,
        collected_at: occurredAt,
        shift_date: null,
        billing_branch: this.mapCollectionBranch(quote.billing_branch),
        payment_method: paid > 0 ? 'advance' : null,
        payment_method_label: 'Anticipo',
        payment_breakdown_label: null,
        has_stamped_invoice: false,
        has_advance: true,
        advance_given: roundAdvanceMoney(paid),
        amount_pending: pending,
        walk_in_name: null,
        walk_in_rfc: null,
        for_shipping: false,
        ...customerFields,
        is_walk_in: false,
        seller_user: quote.seller_user
          ? {
              id: quote.seller_user.id,
              first_name: quote.seller_user.first_name,
              last_name: quote.seller_user.last_name,
              pos_user_code: quote.seller_user.pos_user_code ?? null,
            }
          : null,
        collected_by_user: null,
        document_kind: 'quotation',
      });
    }

    for (const order of orders) {
      const advance = advanceByOrder.get(order.id);
      if (!advance?.hasAdvance) continue;
      const pending = Number(advance.amountPending || 0);
      if (pending <= 0.009) continue;
      if (!this.calendarDateInRange(order.created_at, periodFrom, periodTo)) {
        continue;
      }
      const customerFields = this.buildCustomerFields(order.customer);
      if (term && !this.advanceRowMatchesSearch(term, order.folio, customerFields, order.walk_in_rfc)) {
        continue;
      }
      rows.push({
        id: order.id,
        sales_order_id: order.id,
        is_credit_payment: false,
        sale_kind: order.is_credit ? 'credit' : 'advance',
        collection_id: null,
        folio: order.folio,
        total: pending,
        payment_status: order.payment_status,
        general_status: order.general_status,
        created_at: order.created_at,
        payment_date: null,
        collected_at: order.created_at,
        shift_date: null,
        billing_branch: this.mapCollectionBranch(order.billing_branch),
        payment_method: 'advance',
        payment_method_label: 'Anticipo',
        payment_breakdown_label: null,
        has_stamped_invoice: Boolean(order.advance_invoice_id),
        has_advance: true,
        advance_given: advance.advanceGiven,
        amount_pending: advance.amountPending,
        walk_in_name: order.walk_in_name,
        walk_in_rfc: order.walk_in_rfc,
        for_shipping: this.isForShippingFlag(order.for_shipping),
        ...customerFields,
        is_walk_in: false,
        seller_user: order.seller_user
          ? {
              id: order.seller_user.id,
              first_name: order.seller_user.first_name,
              last_name: order.seller_user.last_name,
              pos_user_code: order.seller_user.pos_user_code ?? null,
            }
          : null,
        collected_by_user: null,
        document_kind: 'sales_order',
      });
    }

    return rows;
  }

  private calendarDateInRange(
    value: Date | string | null | undefined,
    from: string,
    to: string,
  ): boolean {
    const day = this.calendarDay(value);
    if (!day) return false;
    return day >= from && day <= to;
  }

  private calendarDay(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Tijuana',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private advanceRowMatchesSearch(
    term: string,
    folio: string | null | undefined,
    customer: PosCustomerFields,
    rfc: string | null | undefined,
  ): boolean {
    const haystack = [folio, customer.customer_company_name, customer.customer_person_name, rfc]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  }

  private mapPosCollectionRow(
    collection: PosSaleCollection,
    stampedOrderIds: Set<string>,
    paymentDates: Map<string, string>,
    advanceByOrder: Map<string, OrderAdvanceDisplay> = new Map(),
  ): PosCollectionListRow {
    const order = collection.sales_order;
    const customer = collection.customer;
    const customerFields = this.buildCustomerFields(customer);
    const hasStampedInvoice = order ? stampedOrderIds.has(order.id) : false;
    const billingBranch = this.mapCollectionBranch(
      order?.billing_branch ??
        order?.warehouse?.billing_branch ??
        collection.pos_daily_shift?.billing_branch,
    );
    const paymentDisplay = buildSalesOrderPaymentDisplay({
      collection: {
        payment_method: collection.payment_method,
        amount_cash_mxn: collection.amount_cash_mxn,
        amount_cash_usd: collection.amount_cash_usd,
        amount_transfer_mxn: collection.amount_transfer_mxn,
        amount_card_mxn: collection.amount_card_mxn,
        amount_check_mxn: collection.amount_check_mxn,
        amount_check_usd: collection.amount_check_usd,
        amount_credit_mxn: collection.amount_credit_mxn,
        card_payments: collection.card_payments,
      },
    });
    const paymentMethod = paymentDisplay.payment_method ?? collection.payment_method;
    const paymentMethodLabel =
      paymentDisplay.payment_method_label ??
      (paymentMethod && paymentMethod in SALES_ORDER_PAYMENT_METHOD_LABELS
        ? SALES_ORDER_PAYMENT_METHOD_LABELS[paymentMethod]
        : paymentMethod ?? null);
    const advance = order?.id ? advanceByOrder.get(order.id) : undefined;
    const documentTotal = Number(order?.total || collection.order_total_mxn || 0);

    return {
      id: order?.id ?? collection.sales_order_id,
      sales_order_id: (order?.id ?? collection.sales_order_id) as string | null,
      is_credit_payment: false,
      sale_kind: (order?.is_credit ? 'credit' : 'cash') as PosCollectionSaleKind,
      document_kind: 'sales_order',
      collection_id: collection.id,
      folio: order?.folio ?? null,
      total: Number(collection.order_total_mxn),
      has_advance: advance?.hasAdvance ?? false,
      advance_given: advance?.advanceGiven ?? 0,
      amount_pending: advance?.amountPending ?? advanceDocumentPending(documentTotal, 0),
      payment_status: order?.payment_status ?? null,
      general_status: order?.general_status ?? null,
      created_at: order?.created_at ?? null,
      payment_date: order?.id ? paymentDates.get(order.id) ?? null : null,
      collected_at: collection.created_at,
      shift_date: collection.pos_daily_shift?.shift_date
        ? toDateOnlyString(collection.pos_daily_shift.shift_date)
        : null,
      billing_branch: billingBranch,
      payment_method: (paymentMethod ?? null) as string | null,
      payment_method_label: paymentMethodLabel,
      payment_breakdown_label: paymentDisplay.payment_breakdown_label,
      has_stamped_invoice: hasStampedInvoice,
      walk_in_name: order?.walk_in_name ?? null,
      walk_in_rfc: order?.walk_in_rfc ?? null,
      for_shipping: this.isForShippingFlag(order?.for_shipping),
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
  }

  private mapCollectionBranch(
    branch?: { id?: string | null; code?: string | null; city?: string | null } | null,
  ): PosCollectionBranchRef | null {
    if (!branch) {
      return null;
    }
    const code = branch.code?.trim() || null;
    const city = branch.city?.trim() || null;
    if (!branch.id && !code && !city) {
      return null;
    }
    return {
      id: branch.id ?? null,
      code,
      city,
      label: [code, city].filter(Boolean).join(' · ') || null,
    };
  }

  private excelSaleKindLabel(kind: PosCollectionSaleKind): string {
    if (kind === 'advance') return 'Anticipo';
    if (kind === 'credit') return 'Crédito';
    return 'Contado';
  }

  private excelPaymentMethodLabel(mapped: PosCollectionListRow): string {
    const label =
      mapped.payment_breakdown_label || mapped.payment_method_label || mapped.payment_method || '';
    return mapped.is_credit_payment && label ? `Abono · ${label}` : label;
  }

  private formatPosUserLabel(
    user: { first_name?: string | null; last_name?: string | null } | null,
  ): string {
    if (!user) return '';
    return this.buildUserName(user.first_name, user.last_name);
  }

  private buildUserName(firstName?: string | null, lastName?: string | null): string {
    return [firstName, lastName].filter(Boolean).join(' ').trim() || 'Sin nombre';
  }

  private buildCustomerFields(customer?: CustomerFieldsSource | null): PosCustomerFields {
    const companyName = customer?.company_name?.trim() || null;
    const personName = [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim() || null;
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

function roundPayableMoney(value: number): number {
  return Number(value.toFixed(2));
}

function formatPayableRate(rate: number): string {
  const [whole, fraction = ''] = rate.toFixed(4).split('.');
  const trimmed = fraction.replace(/0+$/, '');
  const decimals = trimmed.length < 2 ? fraction.slice(0, 2) : trimmed;
  return `${whole}.${decimals}`;
}

function formatPayableRateDate(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function sortCurrencyDetailLines(lines: CurrencyDetailLine[]): CurrencyDetailLine[] {
  return [...lines].sort((left, right) => {
    const byName = left.razon_social.localeCompare(right.razon_social, 'es', { sensitivity: 'base' });
    if (byName !== 0) return byName;
    return left.sort_date.localeCompare(right.sort_date);
  });
}

function toDetailDate(value: Date | string | null | undefined): { display: string; sort: string } {
  if (!value) return { display: '', sort: '' };
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { display: '', sort: '' };
  return { display: formatExportDate(date), sort: date.toISOString() };
}

function formatCalendarExportDate(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? '').trim());
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function chunkIds(ids: string[], size: number): string[][] {
  if (!ids.length) return [];
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

function vendorInvoiceLabel(order: PurchaseOrderBatch): string {
  let raw: unknown = order.vendor_invoice_numbers;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [raw];
    }
  }
  const numbers = Array.isArray(raw)
    ? raw.map((value) => String(value).trim()).filter(Boolean)
    : [];
  const unique = [...new Set(numbers)];
  if (unique.length) return unique.join(', ');
  return order.vendor_invoice_number?.trim() || 'Sin factura';
}
