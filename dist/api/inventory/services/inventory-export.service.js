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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryExportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const inventory_location_filter_util_1 = require("../utils/inventory-location-filter.util");
const inventory_measure_util_1 = require("../utils/inventory-measure.util");
const excel_export_util_1 = require("../../../common/utils/excel-export.util");
let InventoryExportService = class InventoryExportService {
    batchRepo;
    batchColumns = [
        { header: 'No. lote', key: 'batch_number', width: 16 },
        { header: 'Fecha creación', key: 'created_at', width: 18, type: 'date' },
        { header: 'SKU', key: 'product_sku', width: 14 },
        { header: 'Producto', key: 'product_name', width: 28 },
        { header: 'Razón social', key: 'razon_social', width: 28 },
        { header: 'Sucursal', key: 'sucursal', width: 22 },
        { header: 'Almacén', key: 'warehouse_name', width: 22 },
        { header: 'UOM', key: 'uom_name', width: 12 },
        { header: 'Medida', key: 'measure', width: 12 },
        { header: 'Cant. inicial', key: 'initial_quantity', width: 14, type: 'number' },
        { header: 'Cant. disponible', key: 'available_quantity', width: 14, type: 'number' },
        { header: 'Folio OC', key: 'purchase_order_folio', width: 14 },
        { header: 'Etiqueta origen', key: 'source_tag_identifier', width: 18 },
    ];
    summaryColumns = [
        { header: 'SKU', key: 'product_sku', width: 14 },
        { header: 'Producto', key: 'product_name', width: 28 },
        { header: 'Razón social', key: 'razon_social', width: 28 },
        { header: 'Sucursal', key: 'sucursal', width: 22 },
        { header: 'Almacén', key: 'warehouse_name', width: 22 },
        { header: 'UOM', key: 'uom_name', width: 12 },
        { header: 'Cant. disponible', key: 'total_available_quantity', width: 16, type: 'number' },
        { header: 'Cant. inicial', key: 'total_initial_quantity', width: 14, type: 'number' },
        { header: 'No. lotes', key: 'total_batches', width: 12, type: 'integer' },
        { header: 'Por medida', key: 'measure_totals', width: 28 },
        { header: 'Precio sugerido', key: 'suggested_unit_price', width: 14, type: 'currency' },
    ];
    constructor(batchRepo) {
        this.batchRepo = batchRepo;
    }
    async exportBatches(tenantId, filters) {
        const batches = await this.fetchBatches(tenantId, filters);
        const rows = batches.map((batch) => ({
            batch_number: batch.batch_number,
            created_at: (0, excel_export_util_1.formatExportDateTime)(batch.created_at),
            product_sku: batch.product?.sku ?? '',
            product_name: batch.product?.name ?? '',
            razon_social: batch.warehouse?.billing_branch?.fiscal_configuration?.razon_social ?? '',
            sucursal: batch.warehouse?.billing_branch?.code ?? '',
            warehouse_name: batch.warehouse?.name ?? '',
            uom_name: batch.uom?.name ?? '',
            measure: (0, inventory_measure_util_1.formatMeasureLabel)(batch.measure, batch.measure_uom?.name) ?? '',
            initial_quantity: (0, excel_export_util_1.num)(batch.initial_quantity),
            available_quantity: (0, excel_export_util_1.num)(batch.available_quantity),
            purchase_order_folio: batch.purchase_order_batch?.folio ?? '',
            source_tag_identifier: batch.source_tag_identifier ?? '',
        }));
        return (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Lotes',
            title: 'Reporte de inventario — Por lote',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                `Generado: ${(0, excel_export_util_1.formatExportDateTime)(new Date())}`,
                `Registros: ${rows.length}`,
                this.describeBatchFilters(filters),
            ]),
            columns: this.batchColumns,
            rows,
            headerColor: 'FF2E6B9E',
            titleColor: 'FF1E4A6E',
        });
    }
    async exportSummary(tenantId, filters) {
        const summaries = await this.buildSummaryRows(tenantId, filters);
        return (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Totalizado',
            title: 'Reporte de inventario — Totalizado',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                `Generado: ${(0, excel_export_util_1.formatExportDateTime)(new Date())}`,
                `Productos: ${summaries.length}`,
                this.describeSummaryFilters(filters),
            ]),
            columns: this.summaryColumns,
            rows: summaries,
            headerColor: 'FF3A7CA5',
            titleColor: 'FF255A7A',
        });
    }
    getBatchesFilename() {
        return `inventario-lotes-${this.todaySuffix()}.xlsx`;
    }
    getSummaryFilename() {
        return `inventario-totalizado-${this.todaySuffix()}.xlsx`;
    }
    async fetchBatches(tenantId, filters) {
        const qb = this.batchRepo
            .createQueryBuilder('batch')
            .leftJoinAndSelect('batch.product', 'product')
            .leftJoinAndSelect('batch.warehouse', 'warehouse')
            .leftJoinAndSelect('batch.uom', 'uom')
            .leftJoinAndSelect('batch.measure_uom', 'measure_uom')
            .leftJoinAndSelect('batch.purchase_order_batch', 'purchase_order_batch')
            .where('batch.tenant_id = :tenantId', { tenantId });
        (0, inventory_location_filter_util_1.joinInventoryLocation)(qb);
        (0, inventory_location_filter_util_1.assertInventoryLocationCascade)(filters);
        this.applyBatchFilters(qb, filters);
        const sortBy = filters.sort_by === 'quantity' ? 'available_quantity' : (filters.sort_by || 'created_at');
        const sortOrder = filters.sort_order || 'DESC';
        qb.orderBy(`batch.${sortBy}`, sortOrder);
        return qb.getMany();
    }
    applyBatchFilters(qb, filters) {
        if (filters.search) {
            qb.andWhere('(LOWER(batch.batch_number) LIKE LOWER(:search) OR LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search))', { search: `%${filters.search}%` });
        }
        if (filters.batch_number) {
            qb.andWhere('LOWER(batch.batch_number) LIKE LOWER(:batch_number)', {
                batch_number: `%${filters.batch_number}%`,
            });
        }
        if (filters.product_id) {
            qb.andWhere('batch.product_id = :product_id', { product_id: filters.product_id });
        }
        (0, inventory_location_filter_util_1.applyInventoryLocationFilters)(qb, filters);
        if (filters.purchase_order_batch_id) {
            qb.andWhere('batch.purchase_order_batch_id = :purchase_order_batch_id', {
                purchase_order_batch_id: filters.purchase_order_batch_id,
            });
        }
        if (filters.purchase_order_id) {
            qb.andWhere('batch.purchase_order_batch_id = :purchase_order_id', {
                purchase_order_id: filters.purchase_order_id,
            });
        }
        if (filters.created_from) {
            qb.andWhere('batch.created_at >= :created_from', {
                created_from: new Date(filters.created_from),
            });
        }
        if (filters.created_to) {
            qb.andWhere('batch.created_at <= :created_to', {
                created_to: new Date(filters.created_to),
            });
        }
    }
    async buildSummaryRows(tenantId, filters) {
        let qb = this.batchRepo
            .createQueryBuilder('batch')
            .leftJoinAndSelect('batch.product', 'product')
            .leftJoinAndSelect('batch.warehouse', 'warehouse')
            .leftJoinAndSelect('batch.uom', 'uom')
            .leftJoinAndSelect('batch.measure_uom', 'measure_uom')
            .where('batch.tenant_id = :tenantId', { tenantId });
        (0, inventory_location_filter_util_1.joinInventoryLocation)(qb);
        (0, inventory_location_filter_util_1.assertInventoryLocationCascade)(filters);
        (0, inventory_location_filter_util_1.applyInventoryLocationFilters)(qb, filters);
        if (filters.search) {
            qb = qb.andWhere('(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search))', { search: `%${filters.search}%` });
        }
        if (filters.product_id) {
            qb = qb.andWhere('batch.product_id = :product_id', {
                product_id: filters.product_id,
            });
        }
        if (filters.only_available) {
            qb = qb.andWhere('batch.available_quantity > 0');
        }
        const batches = await qb.getMany();
        const grouped = new Map();
        for (const batch of batches) {
            const key = `${batch.product_id}|${batch.warehouse_id}`;
            if (!grouped.has(key))
                grouped.set(key, []);
            grouped.get(key).push(batch);
        }
        const rows = [];
        for (const batchGroup of grouped.values()) {
            const first = batchGroup[0];
            const totalAvailable = batchGroup.reduce((sum, b) => sum + (0, excel_export_util_1.num)(b.available_quantity), 0);
            const totalInitial = batchGroup.reduce((sum, b) => sum + (0, excel_export_util_1.num)(b.initial_quantity), 0);
            const measureTotals = (0, inventory_measure_util_1.buildMeasureTotals)(batchGroup);
            rows.push({
                product_sku: first.product?.sku ?? '',
                product_name: first.product?.name ?? '',
                razon_social: first.warehouse?.billing_branch?.fiscal_configuration?.razon_social ?? '',
                sucursal: first.warehouse?.billing_branch?.code ?? '',
                warehouse_name: first.warehouse?.name ?? '',
                uom_name: first.uom?.name ?? '',
                total_available_quantity: totalAvailable,
                total_initial_quantity: totalInitial,
                total_batches: batchGroup.length,
                measure_totals: (0, inventory_measure_util_1.formatMeasureTotalsLabel)(measureTotals),
                suggested_unit_price: null,
            });
        }
        const sortBy = filters.sort_by || 'product_name';
        const sortOrder = filters.sort_order || 'ASC';
        rows.sort((a, b) => {
            let valA = String(a[sortBy === 'total_available_quantity' ? 'total_available_quantity' : sortBy] ?? '');
            let valB = String(b[sortBy === 'total_available_quantity' ? 'total_available_quantity' : sortBy] ?? '');
            if (sortBy === 'total_available_quantity') {
                valA = (0, excel_export_util_1.num)(valA);
                valB = (0, excel_export_util_1.num)(valB);
            }
            else if (sortBy === 'product_sku') {
                valA = String(a.product_sku);
                valB = String(b.product_sku);
            }
            else if (sortBy === 'warehouse_name') {
                valA = String(a.warehouse_name);
                valB = String(b.warehouse_name);
            }
            else {
                valA = String(a.product_name);
                valB = String(b.product_name);
            }
            if (valA < valB)
                return sortOrder === 'ASC' ? -1 : 1;
            if (valA > valB)
                return sortOrder === 'ASC' ? 1 : -1;
            return 0;
        });
        return rows;
    }
    describeBatchFilters(filters) {
        const parts = [];
        if (filters.search)
            parts.push(`Búsqueda: ${filters.search}`);
        if (filters.batch_number)
            parts.push(`Lote: ${filters.batch_number}`);
        if (filters.fiscal_configuration_id)
            parts.push('Razón social filtrada');
        if (filters.billing_branch_id)
            parts.push('Sucursal filtrada');
        if (filters.warehouse_id)
            parts.push('Almacén filtrado');
        if (filters.product_id)
            parts.push('Producto filtrado');
        if (filters.created_from || filters.created_to) {
            parts.push(`Fechas: ${filters.created_from ? (0, excel_export_util_1.formatExportDate)(filters.created_from) : '…'} — ${filters.created_to ? (0, excel_export_util_1.formatExportDate)(filters.created_to) : '…'}`);
        }
        return parts.join(' | ');
    }
    describeSummaryFilters(filters) {
        const parts = [];
        if (filters.search)
            parts.push(`Búsqueda: ${filters.search}`);
        if (filters.fiscal_configuration_id)
            parts.push('Razón social filtrada');
        if (filters.billing_branch_id)
            parts.push('Sucursal filtrada');
        if (filters.warehouse_id)
            parts.push('Almacén filtrado');
        if (filters.product_id)
            parts.push('Producto filtrado');
        if (filters.only_available)
            parts.push('Solo con existencia');
        return parts.join(' | ');
    }
    todaySuffix() {
        return new Date().toISOString().slice(0, 10);
    }
};
exports.InventoryExportService = InventoryExportService;
exports.InventoryExportService = InventoryExportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], InventoryExportService);
//# sourceMappingURL=inventory-export.service.js.map