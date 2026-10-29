"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverageCostReportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const billing_branch_entity_1 = require("../../../entities/billing/billing-branch.entity");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const electronic_invoice_entity_1 = require("../../../entities/electronic-invoicing/electronic-invoice.entity");
const quotation_entity_1 = require("../../../entities/quotations/quotation.entity");
const warehouse_entity_1 = require("../../../entities/warehouse/warehouse.entity");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const excel_export_util_1 = require("../../../common/utils/excel-export.util");
const unclosed_shift_alert_1 = require("../../pos-shifts/utils/unclosed-shift-alert");
const query_accounting_base_dto_1 = require("../dto/query-accounting-base.dto");
const average_cost_report_util_1 = require("../utils/average-cost-report.util");
const EXCEL_COLUMNS = [
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
let AverageCostReportService = class AverageCostReportService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getReport(tenantId, filters) {
        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
        const range = this.resolveRange(filters);
        const branchLabel = await this.branchLabel(filters.billing_branch_id);
        const rows = (0, average_cost_report_util_1.filterSalesCostRows)(await this.collectRows(tenantId, filters, range), filters.search);
        const summary = {
            ...(0, average_cost_report_util_1.summarizeSalesCostRows)(rows),
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
    async exportExcel(tenantId, filters) {
        const range = this.resolveRange(filters);
        const branchLabel = await this.branchLabel(filters.billing_branch_id);
        const rows = (0, average_cost_report_util_1.filterSalesCostRows)(await this.collectRows(tenantId, filters, range), filters.search);
        const summary = (0, average_cost_report_util_1.summarizeSalesCostRows)(rows);
        const periodLabel = range.from === range.to ? range.from : `${range.from} a ${range.to}`;
        const buffer = await (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Ventas costo prom',
            title: 'Reporte de ventas a costo promedio',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
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
    excelRow(row) {
        return {
            customer_name: row.customer_name,
            document: row.document,
            date: displayDay(row.date),
            type_code: row.type_code,
            status_code: row.status_code,
            currency_label: (0, average_cost_report_util_1.salesCurrencyLabel)(row.source_currency, row.exchange_rate),
            amount: row.amount,
            discount: row.discount,
            tax: row.tax,
            sale_total: row.sale_total,
            cost_total: row.cost_total,
            margin_amount: row.margin_amount,
            margin_percent: row.margin_percent,
        };
    }
    async collectRows(tenantId, filters, range) {
        const orders = await this.loadOrders(tenantId, filters.billing_branch_id, range);
        const orderIds = orders.map((order) => order.id);
        const [costs, allocationCosts, invoicedIds, sideDocuments] = await Promise.all([
            this.loadCosts(tenantId, orderIds),
            this.loadAllocationCosts(orderIds),
            this.loadInvoicedOrderIds(tenantId, orderIds),
            this.loadSideDocuments(tenantId, filters.billing_branch_id, range),
        ]);
        const orderInputs = orders.map((order) => this.toOrderInput(order, costs, allocationCosts, invoicedIds));
        await this.applyMissingSaleRates(tenantId, orderInputs, sideDocuments);
        return (0, average_cost_report_util_1.buildSalesCostRows)({
            dateFrom: range.from,
            dateTo: range.to,
            orders: orderInputs,
            sideDocuments,
        });
    }
    async applyMissingSaleRates(tenantId, orders, sideDocuments) {
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
        const stored = await this.dataSource.query(`
      SELECT rate_date, exchange_rate
      FROM exchange_rates
      WHERE tenant_id = ?
        AND rate_date <= ?
      ORDER BY rate_date ASC
      `, [tenantId, until]);
        const points = stored
            .map((row) => ({
            rate_date: sqlDay(row.rate_date) || '',
            exchange_rate: toNum(row.exchange_rate),
        }))
            .filter((row) => row.rate_date && row.exchange_rate > 0);
        for (const order of orders) {
            if (needsDollarRate(order.currency, order.exchange_rate)) {
                order.exchange_rate = (0, average_cost_report_util_1.rateOnOrBefore)(order.created_on, points);
            }
        }
        for (const document of sideDocuments) {
            if (needsDollarRate(document.currency, document.exchange_rate)) {
                document.exchange_rate = (0, average_cost_report_util_1.rateOnOrBefore)(document.stamped_on, points);
            }
        }
    }
    loadOrders(tenantId, branchId, range) {
        const qb = this.dataSource
            .getRepository(sales_order_entity_1.SalesOrder)
            .createQueryBuilder('so')
            .leftJoin('so.customer', 'customer')
            .leftJoin('so.warehouse', 'warehouse')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere("(so.payment_status = 'Pagado' OR so.is_credit = 1)")
            .andWhere(`NOT (
          so.pos_stage IN ('caja', 'ventas')
          AND so.payment_status = 'Pendiente'
          AND so.is_credit = 0
        )`)
            .andWhere(`(
          ${(0, unclosed_shift_alert_1.posCalendarDateSql)('so.created_at')} BETWEEN :from AND :to
          OR (
            so.general_status = 'Cancelada'
            AND ${(0, unclosed_shift_alert_1.posCalendarDateSql)('so.updated_at')} BETWEEN :from AND :to
          )
        )`, range);
        if (branchId) {
            qb.andWhere('(so.billing_branch_id = :branchId OR warehouse.billing_branch_id = :branchId)', { branchId });
        }
        return qb
            .select('so.id', 'id')
            .addSelect('so.folio', 'folio')
            .addSelect((0, unclosed_shift_alert_1.posCalendarDateSql)('so.created_at'), 'created_on')
            .addSelect((0, unclosed_shift_alert_1.posCalendarDateSql)('so.updated_at'), 'updated_on')
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
            .getRawMany();
    }
    async loadCosts(tenantId, orderIds) {
        const costs = new Map();
        if (!orderIds.length) {
            return costs;
        }
        for (const ids of chunk(orderIds, 500)) {
            const unitCost = `COALESCE(NULLIF(ledger.unit_cost_mxn, 0), ${LOT_UNIT_COST_SQL}, ${vendorAverageCostSql('ledger.product_id', 'ledger.uom_id')}, 0)`;
            const rows = await this.dataSource.query(`
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
        `, [tenantId, ...ids]);
            for (const row of rows) {
                costs.set(row.reference_id, row);
            }
        }
        return costs;
    }
    async loadAllocationCosts(orderIds) {
        const costs = new Map();
        if (!orderIds.length) {
            return costs;
        }
        for (const ids of chunk(orderIds, 500)) {
            const rows = await this.dataSource.query(`
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
        `, ids);
            for (const row of rows) {
                costs.set(row.reference_id, toNum(row.sale_cost));
            }
        }
        return costs;
    }
    async loadInvoicedOrderIds(tenantId, orderIds) {
        const invoiced = new Set();
        if (!orderIds.length) {
            return invoiced;
        }
        for (const ids of chunk(orderIds, 500)) {
            const rows = await this.dataSource
                .getRepository(electronic_invoice_entity_1.ElectronicInvoice)
                .createQueryBuilder('ei')
                .select('ei.source_id', 'source_id')
                .where('ei.tenant_id = :tenantId', { tenantId })
                .andWhere("ei.source_module = 'sales_orders'")
                .andWhere('ei.source_id IN (:...ids)', { ids })
                .andWhere("ei.tipo_comprobante = 'I'")
                .andWhere("ei.invoice_role IN ('standard', 'merchandise')")
                .andWhere('ei.stamp_status IN (:...statuses)', { statuses: ACTIVE_STAMP })
                .getRawMany();
            for (const row of rows) {
                invoiced.add(row.source_id);
            }
        }
        return invoiced;
    }
    async loadSideDocuments(tenantId, branchId, range) {
        const stampedOn = (0, unclosed_shift_alert_1.posCalendarDateSql)('COALESCE(ei.stamped_at, ei.created_at)');
        const updatedOn = (0, unclosed_shift_alert_1.posCalendarDateSql)('ei.updated_at');
        const qb = this.dataSource
            .getRepository(electronic_invoice_entity_1.ElectronicInvoice)
            .createQueryBuilder('ei')
            .leftJoin(sales_order_entity_1.SalesOrder, 'so', "ei.source_module = 'sales_orders' AND so.id = ei.source_id AND so.tenant_id = ei.tenant_id")
            .leftJoin(quotation_entity_1.Quotation, 'qt', "ei.source_module = 'quotations' AND qt.id = ei.source_id AND qt.tenant_id = ei.tenant_id")
            .leftJoin(customer_entity_1.Customer, 'order_customer', 'order_customer.id = so.customer_id')
            .leftJoin(customer_entity_1.Customer, 'quote_customer', 'quote_customer.id = qt.customer_id')
            .leftJoin(warehouse_entity_1.Warehouse, 'warehouse', 'warehouse.id = so.warehouse_id')
            .where('ei.tenant_id = :tenantId', { tenantId })
            .andWhere('ei.stamp_status IN (:...statuses)', { statuses: ACTIVE_STAMP })
            .andWhere("(ei.invoice_role = 'advance' AND ei.tipo_comprobante = 'I') OR ei.tipo_comprobante = 'E'")
            .andWhere(`(
          ${stampedOn} BETWEEN :from AND :to
          OR (ei.stamp_status = 'cancelled' AND ${updatedOn} BETWEEN :from AND :to)
        )`, range);
        if (branchId) {
            qb.andWhere(`(
          so.billing_branch_id = :branchId
          OR warehouse.billing_branch_id = :branchId
          OR qt.billing_branch_id = :branchId
        )`, { branchId });
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
            .getRawMany();
        return rows.flatMap((row) => {
            const stampedOnDay = sqlDay(row.stamped_on);
            if (!stampedOnDay) {
                return [];
            }
            const fromQuote = row.source_module === 'quotations';
            const document = [row.series, row.folio].filter((part) => part?.trim()).join('') ||
                (fromQuote ? row.quote_folio : row.order_folio) ||
                row.id.slice(0, 8);
            return [
                {
                    id: row.id,
                    document,
                    customer_name: (0, average_cost_report_util_1.formatSalesCustomerName)(fromQuote
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
                        }),
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
    toOrderInput(order, costs, allocationCosts, invoicedIds) {
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
            customer_name: (0, average_cost_report_util_1.formatSalesCustomerName)({
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
    resolveRange(filters) {
        const range = (0, unclosed_shift_alert_1.resolvePosCalendarRange)(filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH, filters.date_from, filters.date_to);
        if (range.from > range.to) {
            throw new common_1.BadRequestException('La fecha inicial no puede ser posterior a la final');
        }
        return range;
    }
    async branchLabel(branchId) {
        if (!branchId) {
            return 'Todas las sucursales';
        }
        const branch = await this.dataSource.getRepository(billing_branch_entity_1.BillingBranch).findOne({
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
    typeLegend() {
        return `Tipo: ${Object.entries(average_cost_report_util_1.SALES_COST_TYPE_LABELS)
            .map(([code, label]) => `${code}=${label}`)
            .join(', ')}`;
    }
    statusLegend() {
        return `Estatus: ${Object.entries(average_cost_report_util_1.SALES_COST_STATUS_LABELS)
            .map(([code, label]) => `${code}=${label}`)
            .join(', ')}`;
    }
};
exports.AverageCostReportService = AverageCostReportService;
exports.AverageCostReportService = AverageCostReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AverageCostReportService);
function vendorAverageCostSql(productColumn, uomColumn) {
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
function needsDollarRate(currency, exchangeRate) {
    return (currency || '').trim().toUpperCase() === 'USD' && !(exchangeRate != null && exchangeRate > 0);
}
function chunk(items, size) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}
function toNum(value) {
    if (value == null || value === '') {
        return 0;
    }
    const parsed = typeof value === 'number' ? value : Number(String(value).trim());
    return Number.isFinite(parsed) ? parsed : 0;
}
function toNumOrNull(value) {
    if (value == null || value === '') {
        return null;
    }
    const parsed = toNum(value);
    return parsed > 0 ? parsed : null;
}
function asBool(value) {
    return value === true || value === 1 || value === '1';
}
function displayDay(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
}
function sqlDay(value) {
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
//# sourceMappingURL=average-cost-report.service.js.map