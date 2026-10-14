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
const product_entity_1 = require("../../../entities/products/product.entity");
const product_price_entity_1 = require("../../../entities/products/product-price.entity");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const purchase_order_batch_detail_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch-detail.entity");
const excel_export_util_1 = require("../../../common/utils/excel-export.util");
const unclosed_shift_alert_1 = require("../../pos-shifts/utils/unclosed-shift-alert");
const average_cost_report_util_1 = require("../utils/average-cost-report.util");
const EXCEL_COLUMNS = [
    { header: 'Código', key: 'sku', width: 16 },
    { header: 'Descripción', key: 'name', width: 42 },
    { header: 'Clave SAT', key: 'sat_clave', width: 14 },
    { header: 'Pedimento / fecha / aduana', key: 'pedimentos', width: 46 },
    { header: 'Precio 1', key: 'price', width: 14, type: 'currency' },
    { header: 'Costo prom.', key: 'average_cost', width: 14, type: 'currency' },
    { header: 'Cantidad', key: 'quantity', width: 14, type: 'number' },
    { header: 'Total costo', key: 'total_cost', width: 16, type: 'currency' },
    { header: 'Margen %', key: 'margin_percent', width: 12, type: 'percent' },
    { header: 'Margen $', key: 'margin_amount', width: 14, type: 'currency' },
];
let AverageCostReportService = class AverageCostReportService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getReport(tenantId, filters) {
        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
        const rows = (0, average_cost_report_util_1.filterAverageCostRows)(await this.collectRows(tenantId), filters.search);
        const summary = (0, average_cost_report_util_1.summarizeAverageCostRows)(rows);
        const total = rows.length;
        return {
            summary,
            data: rows.slice((page - 1) * limit, page * limit),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
        };
    }
    async exportExcel(tenantId, filters) {
        const rows = (0, average_cost_report_util_1.filterAverageCostRows)(await this.collectRows(tenantId), filters.search);
        const summary = (0, average_cost_report_util_1.summarizeAverageCostRows)(rows);
        const searchLabel = filters.search?.trim() ? `Búsqueda: ${filters.search.trim()}` : '';
        const buffer = await (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Costo promedio',
            title: 'Reporte de artículos por costo promedio',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                'Ingresos de compra. Si hay costo real, se usa ese. Margen por unidad.',
                `Artículos: ${summary.product_count}`,
                `Costo total: ${summary.total_cost.toFixed(2)}`,
                searchLabel,
            ]),
            columns: EXCEL_COLUMNS,
            rows: rows.map((row) => this.excelRow(row)),
        });
        return {
            buffer,
            filename: `rep-costo-promedio-${(0, unclosed_shift_alert_1.getTodayDateString)()}.xlsx`,
        };
    }
    excelRow(row) {
        return {
            sku: row.sku,
            name: row.name,
            sat_clave: row.sat_clave ?? '',
            pedimentos: row.pedimentos.join('\n'),
            price: row.price,
            average_cost: row.average_cost,
            quantity: row.quantity,
            total_cost: row.total_cost,
            margin_percent: row.margin_percent,
            margin_amount: row.margin_amount,
        };
    }
    async collectRows(tenantId) {
        const receipts = await this.loadReceipts(tenantId);
        const productIds = [...new Set(receipts.map((row) => row.product_id).filter(Boolean))];
        const [prices, pedimentos] = await Promise.all([
            this.loadPrices(tenantId, productIds),
            this.loadPedimentos(tenantId, productIds),
        ]);
        return (0, average_cost_report_util_1.buildAverageCostRows)({ receipts, prices, pedimentos });
    }
    loadReceipts(tenantId) {
        return this.dataSource
            .getRepository(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail)
            .createQueryBuilder('line')
            .innerJoin('line.purchase_order_batch', 'po')
            .innerJoin(product_entity_1.Product, 'product', "product.id = COALESCE(NULLIF(line.received_original_product_id, ''), line.product_id)")
            .where('po.tenant_id = :tenantId', { tenantId })
            .andWhere('product.tenant_id = :tenantId', { tenantId })
            .andWhere("po.general_status <> 'Cancelada'")
            .andWhere('(COALESCE(line.received_converted_quantity, 0) > 0 OR COALESCE(line.received_original_quantity, 0) > 0)')
            .select('product.id', 'product_id')
            .addSelect('product.sku', 'sku')
            .addSelect('product.name', 'name')
            .addSelect('product.sat_clave', 'sat_clave')
            .addSelect('line.received_original_quantity', 'received_original_quantity')
            .addSelect('line.received_converted_quantity', 'received_converted_quantity')
            .addSelect('line.received_original_unit_total', 'received_original_unit_total')
            .addSelect('line.unit_total', 'unit_total')
            .addSelect('line.real_unit_cost_mxn', 'real_unit_cost_mxn')
            .addSelect('po.payment_currency', 'payment_currency')
            .addSelect('po.customs_exchange_rate', 'customs_exchange_rate')
            .addSelect('po.pedimento_number', 'pedimento_number')
            .addSelect('po.customs_date', 'customs_date')
            .getRawMany();
    }
    async loadPrices(tenantId, productIds) {
        if (!productIds.length) {
            return [];
        }
        const rows = [];
        for (const ids of chunk(productIds, 500)) {
            const part = await this.dataSource
                .getRepository(product_price_entity_1.ProductPrice)
                .createQueryBuilder('price')
                .innerJoin('price.price_list', 'list')
                .innerJoin('price.product_uom', 'uom')
                .where('price.product_id IN (:...ids)', { ids })
                .andWhere('list.tenant_id = :tenantId', { tenantId })
                .andWhere('list.is_active = :active', { active: true })
                .select('price.product_id', 'product_id')
                .addSelect('price.price', 'price')
                .addSelect('list.name', 'price_list_name')
                .addSelect('list.created_at', 'price_list_created_at')
                .addSelect('uom.is_base', 'is_base')
                .getRawMany();
            rows.push(...part);
        }
        return rows;
    }
    async loadPedimentos(tenantId, productIds) {
        if (!productIds.length) {
            return [];
        }
        const rows = [];
        for (const ids of chunk(productIds, 500)) {
            const part = await this.dataSource
                .getRepository(inventory_batch_entity_1.InventoryBatch)
                .createQueryBuilder('batch')
                .leftJoin('batch.purchase_order_batch', 'po')
                .where('batch.tenant_id = :tenantId', { tenantId })
                .andWhere('batch.product_id IN (:...ids)', { ids })
                .select('batch.product_id', 'product_id')
                .addSelect('batch.pedimento_number', 'pedimento_number')
                .addSelect('batch.pedimento_entries', 'pedimento_entries')
                .addSelect('po.pedimento_number', 'po_pedimento_number')
                .addSelect('po.customs_date', 'customs_date')
                .getRawMany();
            rows.push(...part);
        }
        return rows.flatMap((row) => expandBatchPedimentos(row));
    }
};
exports.AverageCostReportService = AverageCostReportService;
exports.AverageCostReportService = AverageCostReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AverageCostReportService);
function chunk(items, size) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}
function parsePedimentoEntries(value) {
    let parsed = value;
    if (typeof value === 'string') {
        try {
            parsed = JSON.parse(value);
        }
        catch {
            return [];
        }
    }
    if (!Array.isArray(parsed)) {
        return [];
    }
    return parsed.filter((entry) => entry && typeof entry === 'object');
}
function expandBatchPedimentos(row) {
    const entries = parsePedimentoEntries(row.pedimento_entries).map((entry) => ({
        product_id: row.product_id,
        number: entry.number ?? null,
        date: entry.date ?? null,
        customs: entry.customs ?? null,
        vendor: entry.vendor ?? null,
        raw: entry.raw ?? null,
    }));
    const number = row.po_pedimento_number?.trim() || row.pedimento_number?.trim() || null;
    if (!number) {
        return entries;
    }
    return [
        ...entries,
        {
            product_id: row.product_id,
            number,
            date: row.customs_date,
            customs: null,
            vendor: null,
            raw: null,
        },
    ];
}
//# sourceMappingURL=average-cost-report.service.js.map