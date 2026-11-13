import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { Customer } from '../../../entities/customers/customer.entity';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { Quotation } from '../../../entities/quotations/quotation.entity';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import {
  buildExportSubtitle,
  buildStyledExcelBuffer,
  ExcelColumnDef,
} from '../../../common/utils/excel-export.util';
import {
  posCalendarDateSql,
  resolvePosCalendarRange,
} from '../../pos-shifts/utils/unclosed-shift-alert';
import { AccountingReportPeriod } from '../dto/query-accounting-base.dto';
import { QueryAverageCostReportDto } from '../dto/query-average-cost-report.dto';
import {
  buildSalesCostRows,
  filterSalesCostRows,
  formatSalesCustomerName,
  rateOnOrBefore,
  SALES_COST_STATUS_LABELS,
  SALES_COST_TYPE_LABELS,
  salesCurrencyLabel,
  SalesCostOrderInput,
  SalesCostReportRow,
  SalesCostSideDocumentInput,
  summarizeSalesCostRows,
} from '../utils/average-cost-report.util';

type DateRange = { from: string; to: string };

type RawOrderRow = {
  id: string;
  folio: string | null;
  created_on: Date | string | null;
  updated_on: Date | string | null;
  general_status: string | null;
  payment_status: string | null;
  is_credit: boolean | number | string | null;
  walk_in_name: string | null;
  order_fiscal: string | null;
  customer_fiscal: string | null;
  company_name: string | null;
  customer_name: string | null;
  customer_lastname: string | null;
  subtotal: number | string | null;
  discount_total: number | string | null;
  global_discount_amount: number | string | null;
  iva_total: number | string | null;
  ieps_total: number | string | null;
  total: number | string | null;
  currency: string | null;
  exchange_rate: number | string | null;
};

type RawCostRow = {
  reference_id: string;
  sale_cost: number | string | null;
  reversal_cost: number | string | null;
};

type RawSideDocumentRow = {
  id: string;
  folio: string | null;
  series: string | null;
  subtotal: number | string | null;
  total: number | string | null;
  currency: string | null;
  stamp_status: string | null;
  invoice_role: string | null;
  tipo_comprobante: string | null;
  receptor_nombre: string | null;
  source_module: string | null;
  source_id: string | null;
  stamped_on: Date | string | null;
  updated_on: Date | string | null;
  order_folio: string | null;
  order_exchange_rate: number | string | null;
  walk_in_name: string | null;
  order_fiscal: string | null;
  customer_fiscal: string | null;
  company_name: string | null;
  customer_name: string | null;
  customer_lastname: string | null;
  quote_folio: string | null;
  quote_fiscal: string | null;
  quote_company: string | null;
  quote_name: string | null;
  quote_lastname: string | null;
};

const EXCEL_COLUMNS: ExcelColumnDef[] = [
  { header: 'Cliente', key: 'customer_name', width: 42 },
  { header: 'Documento', key: 'document', width: 16 },
  { header: 'Fecha', key: 'date', width: 14 },
  { header: 'Tipo', key: 'type_code', width: 10, type: 'integer' },
  { header: 'Stat', key: 'status_code', width: 10, type: 'integer' },
  { header: 'Moneda', key: 'currency_label', width: 14 },
  { header: 'Importe', key: 'amount', width: 14, type: 'currency' },
  { header: 'Descto', key: 'discount', width: 12, type: 'currency' },
  { header: 'Impuesto', key: 'tax', width: 12, type: 'currency' },
  { header: 'Total venta', key: 'sale_total', width: 14, type: 'currency' },
  { header: 'Total costo', key: 'cost_total', width: 14, type: 'currency' },
  { header: 'Margen', key: 'margin_amount', width: 14, type: 'currency' },
  { header: 'Margen %', key: 'margin_percent', width: 12, type: 'percent' },
];

const ACTIVE_STAMP = ['stamped', 'cancel_pending', 'cancelled', 'cancel_error'];

@Injectable()
export class AverageCostReportService {
  constructor(private readonly dataSource: DataSource) {}

  async getReport(
    tenantId: string,
    filters: QueryAverageCostReportDto,
  ): Promise<{
    summary: {
      date_from: string;
      date_to: string;
      branch_label: string;
      document_count: number;
      amount: number;
      discount: number;
      tax: number;
      sale_total: number;
      cost_total: number;
      profit: number;
      margin_percent: number | null;
      has_foreign_currency: boolean;
    };
    data: SalesCostReportRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const range = this.resolveRange(filters);
    const branchLabel = await this.branchLabel(filters.billing_branch_id);
    const rows = filterSalesCostRows(
      await this.collectRows(tenantId, filters, range),
      filters.search,
    );
    const summary = {
      ...summarizeSalesCostRows(rows),
      date_from: range.from,
      date_to: range.to,
      branch_label: branchLabel,
    };

    return {
      summary,
      data: rows.slice((page - 1) * limit, page * limit),
      total: rows.length,
      page,
      limit,
      totalPages: Math.ceil(rows.length / limit) || 0,
    };
  }

  async exportExcel(
    tenantId: string,
    filters: QueryAverageCostReportDto,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const range = this.resolveRange(filters);
    const branchLabel = await this.branchLabel(filters.billing_branch_id);
    const rows = filterSalesCostRows(
      await this.collectRows(tenantId, filters, range),
      filters.search,
    );
    const summary = summarizeSalesCostRows(rows);
    const periodLabel = range.from === range.to ? range.from : `${range.from} a ${range.to}`;

    const buffer = await buildStyledExcelBuffer({
      sheetName: 'Ventas costo prom',
      title: 'Reporte de ventas a costo promedio',
      subtitle: buildExportSubtitle([
        branchLabel,
        periodLabel,
        `Documentos: ${summary.document_count}`,
        `Total venta: ${summary.sale_total.toFixed(2)}`,
        'Importes convertidos a MXN',
        `Total costo: ${summary.cost_total.toFixed(2)}`,
        `Margen: ${summary.margin_percent == null ? '—' : `${summary.margin_percent.toFixed(2)}%`}`,
        this.typeLegend(),
        this.statusLegend(),
      ]),
      columns: EXCEL_COLUMNS,
      rows: rows.map((row) => this.excelRow(row)),
    });

    return {
      buffer,
      filename: `rep-ventas-costo-promedio-${range.from}${range.from === range.to ? '' : `-${range.to}`}.xlsx`,
    };
  }

  private excelRow(row: SalesCostReportRow): Record<string, unknown> {
    return {
      customer_name: row.customer_name,
      document: row.document,
      date: displayDay(row.date),
      type_code: row.type_code,
      status_code: row.status_code,
      currency_label: salesCurrencyLabel(row.source_currency, row.exchange_rate),
      amount: row.amount,
      discount: row.discount,
      tax: row.tax,
      sale_total: row.sale_total,
      cost_total: row.cost_total,
      margin_amount: row.margin_amount,
      margin_percent: row.margin_percent,
    };
  }

  private async collectRows(
    tenantId: string,
    filters: QueryAverageCostReportDto,
    range: DateRange,
  ): Promise<SalesCostReportRow[]> {
    const orders = await this.loadOrders(tenantId, filters.billing_branch_id, range);
    const orderIds = orders.map((order) => order.id);
    const [costs, allocationCosts, invoicedIds, sideDocuments] = await Promise.all([
      this.loadCosts(tenantId, orderIds),
      this.loadAllocationCosts(orderIds),
      this.loadInvoicedOrderIds(tenantId, orderIds),
      this.loadSideDocuments(tenantId, filters.billing_branch_id, range),
    ]);

    const orderInputs = orders.map((order) =>
      this.toOrderInput(order, costs, allocationCosts, invoicedIds),
    );
    await this.applyMissingSaleRates(tenantId, orderInputs, sideDocuments);

    return buildSalesCostRows({
      dateFrom: range.from,
      dateTo: range.to,
      orders: orderInputs,
      sideDocuments,
    });
  }

  private async applyMissingSaleRates(
    tenantId: string,
    orders: SalesCostOrderInput[],
    sideDocuments: SalesCostSideDocumentInput[],
  ): Promise<void> {
    const missing = [
      ...orders.filter((order) => needsDollarRate(order.currency, order.exchange_rate)).map((order) => order.created_on),
      ...sideDocuments
        .filter((document) => needsDollarRate(document.currency, document.exchange_rate))
        .map((document) => document.stamped_on),
    ].filter((day) => !!day);
    if (!missing.length) {
      return;
    }

    const until = missing.sort().at(-1);
    const stored: Array<{ rate_date: Date | string | null; exchange_rate: number | string | null }> =
      await this.dataSource.query(
        `
      SELECT rate_date, exchange_rate
      FROM exchange_rates
      WHERE tenant_id = ?
        AND rate_date <= ?
      ORDER BY rate_date ASC
      `,
        [tenantId, until],
      );
    const points = stored
      .map((row) => ({
        rate_date: sqlDay(row.rate_date) || '',
        exchange_rate: toNum(row.exchange_rate),
      }))
      .filter((row) => row.rate_date && row.exchange_rate > 0);

    for (const order of orders) {
      if (needsDollarRate(order.currency, order.exchange_rate)) {
        order.exchange_rate = rateOnOrBefore(order.created_on, points);
      }
    }
    for (const document of sideDocuments) {
      if (needsDollarRate(document.currency, document.exchange_rate)) {
        document.exchange_rate = rateOnOrBefore(document.stamped_on, points);
      }
    }
  }

  private loadOrders(
    tenantId: string,
    branchId: string | undefined,
    range: DateRange,
  ): Promise<RawOrderRow[]> {
    const qb = this.dataSource
      .getRepository(SalesOrder)
      .createQueryBuilder('so')
      .leftJoin('so.customer', 'customer')
      .leftJoin('so.warehouse', 'warehouse')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere("(so.payment_status = 'Pagado' OR so.is_credit = 1)")
      .andWhere(
        `NOT (
          so.pos_stage IN ('caja', 'ventas')
          AND so.payment_status = 'Pendiente'
          AND so.is_credit = 0
        )`,
      )
      .andWhere(
        `(
          ${posCalendarDateSql('so.created_at')} BETWEEN :from AND :to
          OR (
            so.general_status = 'Cancelada'
            AND ${posCalendarDateSql('so.updated_at')} BETWEEN :from AND :to
          )
        )`,
        range,
      );

    if (branchId) {
      qb.andWhere(
        '(so.billing_branch_id = :branchId OR warehouse.billing_branch_id = :branchId)',
        { branchId },
      );
    }

    return qb
      .select('so.id', 'id')
      .addSelect('so.folio', 'folio')
      .addSelect(posCalendarDateSql('so.created_at'), 'created_on')
      .addSelect(posCalendarDateSql('so.updated_at'), 'updated_on')
      .addSelect('so.general_status', 'general_status')
      .addSelect('so.payment_status', 'payment_status')
      .addSelect('so.is_credit', 'is_credit')
      .addSelect('so.walk_in_name', 'walk_in_name')
      .addSelect('so.fiscal_razon_social', 'order_fiscal')
      .addSelect('customer.fiscal_razon_social', 'customer_fiscal')
      .addSelect('customer.company_name', 'company_name')
      .addSelect('customer.name', 'customer_name')
      .addSelect('customer.lastname', 'customer_lastname')
      .addSelect('so.subtotal', 'subtotal')
      .addSelect('so.discount_total', 'discount_total')
      .addSelect('so.global_discount_amount', 'global_discount_amount')
      .addSelect('so.iva_total', 'iva_total')
      .addSelect('so.ieps_total', 'ieps_total')
      .addSelect('so.total', 'total')
      .addSelect('so.currency', 'currency')
      .addSelect('so.exchange_rate', 'exchange_rate')
      .getRawMany<RawOrderRow>();
  }

  private async loadCosts(
    tenantId: string,
    orderIds: string[],
  ): Promise<Map<string, RawCostRow>> {
    const costs = new Map<string, RawCostRow>();
    if (!orderIds.length) {
      return costs;
    }

    for (const ids of chunk(orderIds, 500)) {
      const unitCost = `COALESCE(NULLIF(ledger.unit_cost_mxn, 0), ${LOT_UNIT_COST_SQL}, ${vendorAverageCostSql('ledger.product_id', 'ledger.uom_id')}, 0)`;
      const rows: RawCostRow[] = await this.dataSource.query(
        `
        SELECT
          ledger.reference_id AS reference_id,
          SUM(CASE WHEN ledger.movement_type = 'sale' THEN ABS(ledger.quantity_delta) * ${unitCost} ELSE 0 END) AS sale_cost,
          SUM(CASE WHEN ledger.movement_type = 'sale_reversal' THEN ABS(ledger.quantity_delta) * ${unitCost} ELSE 0 END) AS reversal_cost
        FROM inv_s_stock_ledger ledger
        LEFT JOIN inv_s_batches batch ON batch.id = ledger.inventory_batch_id
        LEFT JOIN inv_s_purchase_order_batch_detail pod ON pod.id = batch.purchase_order_detail_id
        LEFT JOIN inv_s_purchase_order_batch pob ON pob.id = batch.purchase_order_batch_id
        WHERE ledger.tenant_id = ?
          AND ledger.reference_type = 'sales_order'
          AND ledger.reference_id IN (${ids.map(() => '?').join(', ')})
        GROUP BY ledger.reference_id
        `,
        [tenantId, ...ids],
      );
      for (const row of rows) {
        costs.set(row.reference_id, row);
      }
    }

    return costs;
  }

  private async loadAllocationCosts(orderIds: string[]): Promise<Map<string, number>> {
    const costs = new Map<string, number>();
    if (!orderIds.length) {
      return costs;
    }

    for (const ids of chunk(orderIds, 500)) {
      const rows: Array<{ reference_id: string; sale_cost: number | string | null }> =
        await this.dataSource.query(
          `
        SELECT
          detail.sales_order_id AS reference_id,
          SUM(ABS(alloc.quantity_allocated) * COALESCE(${LOT_UNIT_COST_SQL}, ${vendorAverageCostSql('batch.product_id', 'batch.uom_id')}, 0)) AS sale_cost
        FROM inv_s_sales_order_batch_allocations alloc
        INNER JOIN inv_s_sales_order_details detail ON detail.id = alloc.sales_order_detail_id
        INNER JOIN inv_s_batches batch ON batch.id = alloc.inventory_batch_id
        LEFT JOIN inv_s_purchase_order_batch_detail pod ON pod.id = batch.purchase_order_detail_id
        LEFT JOIN inv_s_purchase_order_batch pob ON pob.id = batch.purchase_order_batch_id
        WHERE detail.sales_order_id IN (${ids.map(() => '?').join(', ')})
        GROUP BY detail.sales_order_id
        `,
          ids,
        );
      for (const row of rows) {
        costs.set(row.reference_id, toNum(row.sale_cost));
      }
    }

    return costs;
  }

  private async loadInvoicedOrderIds(tenantId: string, orderIds: string[]): Promise<Set<string>> {
    const invoiced = new Set<string>();
    if (!orderIds.length) {
      return invoiced;
    }

    for (const ids of chunk(orderIds, 500)) {
      const rows = await this.dataSource
        .getRepository(ElectronicInvoice)
        .createQueryBuilder('ei')
        .select('ei.source_id', 'source_id')
        .where('ei.tenant_id = :tenantId', { tenantId })
        .andWhere("ei.source_module = 'sales_orders'")
        .andWhere('ei.source_id IN (:...ids)', { ids })
        .andWhere("ei.tipo_comprobante = 'I'")
        .andWhere("ei.invoice_role IN ('standard', 'merchandise')")
        .andWhere('ei.stamp_status IN (:...statuses)', { statuses: ACTIVE_STAMP })
        .getRawMany<{ source_id: string }>();
      for (const row of rows) {
        invoiced.add(row.source_id);
      }
    }

    return invoiced;
  }

  private async loadSideDocuments(
    tenantId: string,
    branchId: string | undefined,
    range: DateRange,
  ): Promise<SalesCostSideDocumentInput[]> {
    const stampedOn = posCalendarDateSql('COALESCE(ei.stamped_at, ei.created_at)');
    const updatedOn = posCalendarDateSql('ei.updated_at');
    const qb = this.dataSource
      .getRepository(ElectronicInvoice)
      .createQueryBuilder('ei')
      .leftJoin(
        SalesOrder,
        'so',
        "ei.source_module = 'sales_orders' AND so.id = ei.source_id AND so.tenant_id = ei.tenant_id",
      )
      .leftJoin(
        Quotation,
        'qt',
        "ei.source_module = 'quotations' AND qt.id = ei.source_id AND qt.tenant_id = ei.tenant_id",
      )
      .leftJoin(Customer, 'order_customer', 'order_customer.id = so.customer_id')
      .leftJoin(Customer, 'quote_customer', 'quote_customer.id = qt.customer_id')
      .leftJoin(Warehouse, 'warehouse', 'warehouse.id = so.warehouse_id')
      .where('ei.tenant_id = :tenantId', { tenantId })
      .andWhere('ei.stamp_status IN (:...statuses)', { statuses: ACTIVE_STAMP })
      .andWhere(
        "(ei.invoice_role = 'advance' AND ei.tipo_comprobante = 'I') OR ei.tipo_comprobante = 'E'",
      )
      .andWhere(
        `(
          ${stampedOn} BETWEEN :from AND :to
          OR (ei.stamp_status = 'cancelled' AND ${updatedOn} BETWEEN :from AND :to)
        )`,
        range,
      );

    if (branchId) {
      qb.andWhere(
        `(
          so.billing_branch_id = :branchId
          OR warehouse.billing_branch_id = :branchId
          OR qt.billing_branch_id = :branchId
        )`,
        { branchId },
      );
    }

    const rows = await qb
      .select('ei.id', 'id')
      .addSelect('ei.folio', 'folio')
      .addSelect('ei.series', 'series')
      .addSelect('ei.subtotal', 'subtotal')
      .addSelect('ei.total', 'total')
      .addSelect('ei.currency', 'currency')
      .addSelect('ei.stamp_status', 'stamp_status')
      .addSelect('ei.invoice_role', 'invoice_role')
      .addSelect('ei.tipo_comprobante', 'tipo_comprobante')
      .addSelect('ei.receptor_nombre', 'receptor_nombre')
      .addSelect('ei.source_module', 'source_module')
      .addSelect('ei.source_id', 'source_id')
      .addSelect(stampedOn, 'stamped_on')
      .addSelect(updatedOn, 'updated_on')
      .addSelect('so.folio', 'order_folio')
      .addSelect('so.exchange_rate', 'order_exchange_rate')
      .addSelect('so.walk_in_name', 'walk_in_name')
      .addSelect('so.fiscal_razon_social', 'order_fiscal')
      .addSelect('order_customer.fiscal_razon_social', 'customer_fiscal')
      .addSelect('order_customer.company_name', 'company_name')
      .addSelect('order_customer.name', 'customer_name')
      .addSelect('order_customer.lastname', 'customer_lastname')
      .addSelect('qt.folio', 'quote_folio')
      .addSelect('quote_customer.fiscal_razon_social', 'quote_fiscal')
      .addSelect('quote_customer.company_name', 'quote_company')
      .addSelect('quote_customer.name', 'quote_name')
      .addSelect('quote_customer.lastname', 'quote_lastname')
      .getRawMany<RawSideDocumentRow>();

    return rows.flatMap((row): SalesCostSideDocumentInput[] => {
      const stampedOnDay = sqlDay(row.stamped_on);
      if (!stampedOnDay) {
        return [];
      }
      const fromQuote = row.source_module === 'quotations';
      const document =
        [row.series, row.folio].filter((part) => part?.trim()).join('') ||
        (fromQuote ? row.quote_folio : row.order_folio) ||
        row.id.slice(0, 8);

      return [
        {
          id: row.id,
          document,
          customer_name: formatSalesCustomerName(
            fromQuote
              ? {
                  customer_fiscal: row.quote_fiscal,
                  company_name: row.quote_company,
                  name: row.quote_name,
                  lastname: row.quote_lastname,
                  receptor_nombre: row.receptor_nombre,
                }
              : {
                  walk_in_name: row.walk_in_name,
                  order_fiscal: row.order_fiscal,
                  customer_fiscal: row.customer_fiscal,
                  company_name: row.company_name,
                  name: row.customer_name,
                  lastname: row.customer_lastname,
                  receptor_nombre: row.receptor_nombre,
                },
          ),
          stamped_on: stampedOnDay,
          cancelled_on: row.stamp_status === 'cancelled' ? sqlDay(row.updated_on) : null,
          cancelled: row.stamp_status === 'cancelled',
          kind: row.tipo_comprobante === 'E' ? 'credit_note' : 'advance',
          subtotal: toNum(row.subtotal),
          total: toNum(row.total),
          currency: row.currency || 'MXN',
          exchange_rate: fromQuote ? null : toNumOrNull(row.order_exchange_rate),
          sales_order_id: row.source_module === 'sales_orders' ? row.source_id : null,
          quotation_id: row.source_module === 'quotations' ? row.source_id : null,
        },
      ];
    });
  }

  private toOrderInput(
    order: RawOrderRow,
    costs: Map<string, RawCostRow>,
    allocationCosts: Map<string, number>,
    invoicedIds: Set<string>,
  ): SalesCostOrderInput {
    const cost = costs.get(order.id);
    const ledgerSale = toNum(cost?.sale_cost);
    const ledgerReversal = toNum(cost?.reversal_cost);
    const allocationSale = allocationCosts.get(order.id) ?? 0;
    const cancelled = order.general_status === 'Cancelada';

    return {
      id: order.id,
      folio: order.folio?.trim() || order.id.slice(0, 8),
      created_on: sqlDay(order.created_on) || '',
      cancelled_on: cancelled ? sqlDay(order.updated_on) : null,
      cancelled,
      payment_status: order.payment_status || 'Pendiente',
      is_credit: asBool(order.is_credit),
      customer_name: formatSalesCustomerName({
        walk_in_name: order.walk_in_name,
        order_fiscal: order.order_fiscal,
        customer_fiscal: order.customer_fiscal,
        company_name: order.company_name,
        name: order.customer_name,
        lastname: order.customer_lastname,
      }),
      subtotal: toNum(order.subtotal),
      discount: toNum(order.discount_total) + toNum(order.global_discount_amount),
      tax: toNum(order.iva_total) + toNum(order.ieps_total),
      total: toNum(order.total),
      currency: order.currency || 'MXN',
      exchange_rate: toNumOrNull(order.exchange_rate),
      invoiced: invoicedIds.has(order.id),
      sale_cost: ledgerSale > 0 ? ledgerSale : allocationSale,
      reversal_cost: ledgerReversal,
    };
  }

  private resolveRange(filters: QueryAverageCostReportDto): DateRange {
    const range = resolvePosCalendarRange(
      filters.period ?? AccountingReportPeriod.MONTH,
      filters.date_from,
      filters.date_to,
    );
    if (range.from > range.to) {
      throw new BadRequestException('La fecha inicial no puede ser posterior a la final');
    }
    return range;
  }

  private async branchLabel(branchId?: string): Promise<string> {
    if (!branchId) {
      return 'Todas las sucursales';
    }
    const branch = await this.dataSource.getRepository(BillingBranch).findOne({
      where: { id: branchId },
      select: ['id', 'code', 'city'],
    });
    if (!branch) {
      return '';
    }
    const code = branch.code?.trim();
    const city = branch.city?.trim();
    if (code && city && code !== city) {
      return `${code} · ${city}`;
    }
    return code || city || '';
  }

  private typeLegend(): string {
    return `Tipo: ${Object.entries(SALES_COST_TYPE_LABELS)
      .map(([code, label]) => `${code}=${label}`)
      .join(', ')}`;
  }

  private statusLegend(): string {
    return `Estatus: ${Object.entries(SALES_COST_STATUS_LABELS)
      .map(([code, label]) => `${code}=${label}`)
      .join(', ')}`;
  }
}

function vendorAverageCostSql(productColumn: string, uomColumn: string): string {
  return `
    (
      SELECT AVG(pvc.cost)
      FROM product_vendor_costs pvc
      INNER JOIN product_uoms pu ON pu.id = pvc.product_uom_id
      WHERE pvc.product_id = ${productColumn}
        AND pu.uom_catalog_id = ${uomColumn}
        AND pvc.cost > 0
        AND UPPER(pvc.currency) = 'MXN'
    )
  `;
}

const LOT_UOM_SCALE_SQL = `
  CASE
    WHEN COALESCE(pod.received_original_quantity, 0) > 0
     AND COALESCE(pod.received_converted_quantity, 0) > 0
    THEN pod.received_original_quantity / pod.received_converted_quantity
    ELSE 1
  END
`;

const LOT_UNIT_COST_SQL = `
  CASE
    WHEN pod.real_unit_cost_mxn IS NOT NULL THEN pod.real_unit_cost_mxn * (${LOT_UOM_SCALE_SQL})
    WHEN COALESCE(pod.received_original_unit_total, pod.unit_total) IS NULL THEN NULL
    WHEN UPPER(COALESCE(pob.payment_currency, 'MXN')) = 'USD' THEN
      CASE
        WHEN COALESCE(pob.customs_exchange_rate, 0) <= 0 THEN NULL
        ELSE COALESCE(pod.received_original_unit_total, pod.unit_total)
          * (${LOT_UOM_SCALE_SQL})
          * pob.customs_exchange_rate
      END
    ELSE COALESCE(pod.received_original_unit_total, pod.unit_total) * (${LOT_UOM_SCALE_SQL})
  END
`;

function needsDollarRate(currency: string | null | undefined, exchangeRate: number | null): boolean {
  return (currency || '').trim().toUpperCase() === 'USD' && !(exchangeRate != null && exchangeRate > 0);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function toNum(value: unknown): number {
  if (value == null || value === '') {
    return 0;
  }
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNumOrNull(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }
  const parsed = toNum(value);
  return parsed > 0 ? parsed : null;
}

function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function displayDay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
}

function sqlDay(value: unknown): string | null {
  if (value == null || value === '') {
    return null;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value).trim());
  return match ? match[1] : null;
}
