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
exports.InventoryStockFlowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_stock_ledger_entity_1 = require("../../../entities/inventory/inventory-stock-ledger.entity");
const inventory_stock_ledger_movement_type_enum_1 = require("../../../entities/inventory/inventory-stock-ledger-movement-type.enum");
const excel_export_util_1 = require("../../../common/utils/excel-export.util");
const inventory_stock_ledger_1 = require("../constants/inventory-stock-ledger");
const query_stock_flow_dto_1 = require("../dto/query-stock-flow.dto");
function branchKey(productId, branchId, uomId) {
    return `${productId}|${branchId}|${uomId}`;
}
let InventoryStockFlowService = class InventoryStockFlowService {
    ledgerRepo;
    dataSource;
    constructor(ledgerRepo, dataSource) {
        this.ledgerRepo = ledgerRepo;
        this.dataSource = dataSource;
    }
    async getReport(tenantId, filters) {
        this.assertFilters(filters);
        const { dateFrom, dateTo } = this.resolveDateRange(filters.period, filters.date_from, filters.date_to);
        const view = filters.view ?? query_stock_flow_dto_1.StockFlowView.SUMMARY;
        const filtersApplied = this.buildFiltersApplied(filters, dateFrom, dateTo, view);
        if (view === query_stock_flow_dto_1.StockFlowView.LEDGER) {
            const ledger = await this.buildLedger(tenantId, filters, dateFrom, dateTo);
            return {
                filters_applied: filtersApplied,
                summary: [],
                ledger,
                total_summary_rows: 0,
                total_ledger_rows: ledger.length,
            };
        }
        const summary = await this.buildSummary(tenantId, filters, dateFrom, dateTo);
        return {
            filters_applied: filtersApplied,
            summary,
            ledger: [],
            total_summary_rows: summary.length,
            total_ledger_rows: 0,
        };
    }
    async exportExcel(tenantId, filters) {
        const report = await this.getReport(tenantId, {
            ...filters,
            view: filters.view ?? query_stock_flow_dto_1.StockFlowView.SUMMARY,
        });
        const subtitle = (0, excel_export_util_1.buildExportSubtitle)([
            report.filters_applied.period_label,
            report.filters_applied.view === query_stock_flow_dto_1.StockFlowView.LEDGER
                ? 'Flujo detallado'
                : 'Resumen',
        ]);
        if (report.filters_applied.view === query_stock_flow_dto_1.StockFlowView.LEDGER) {
            const columns = [
                { header: 'Fecha', key: 'occurred_at', width: 18, type: 'date' },
                { header: 'SKU', key: 'product_sku', width: 14 },
                { header: 'Producto', key: 'product_name', width: 28 },
                { header: 'Sucursal', key: 'billing_branch_name', width: 18 },
                { header: 'UOM', key: 'uom_name', width: 10 },
                { header: 'Concepto', key: 'title', width: 28 },
                { header: 'Descripción', key: 'description', width: 40 },
                { header: 'Entrada', key: 'quantity_in', width: 12, type: 'number' },
                { header: 'Salida', key: 'quantity_out', width: 12, type: 'number' },
                { header: 'Saldo', key: 'balance_after', width: 12, type: 'number' },
                { header: 'Folio', key: 'reference_folio', width: 16 },
            ];
            const rows = report.ledger.map((row) => ({
                occurred_at: row.occurred_at,
                product_sku: row.product_sku,
                product_name: row.product_name,
                billing_branch_name: row.billing_branch_name,
                uom_name: row.uom_name,
                title: row.title,
                description: row.description,
                quantity_in: row.quantity_in != null ? parseFloat(row.quantity_in) : null,
                quantity_out: row.quantity_out != null ? parseFloat(row.quantity_out) : null,
                balance_after: parseFloat(row.balance_after),
                reference_folio: row.reference_folio,
            }));
            return (0, excel_export_util_1.buildStyledExcelBuffer)({
                sheetName: 'Flujo',
                title: 'Existencia de inventarios — Flujo',
                subtitle,
                columns,
                rows,
            });
        }
        const columns = [
            { header: 'SKU', key: 'product_sku', width: 14 },
            { header: 'Producto', key: 'product_name', width: 28 },
            { header: 'Razón social', key: 'fiscal_configuration_name', width: 28 },
            { header: 'Sucursal', key: 'billing_branch_name', width: 18 },
            { header: 'UOM', key: 'uom_name', width: 10 },
            { header: 'Inicial', key: 'opening_qty', width: 12, type: 'number' },
            { header: 'Compras', key: 'purchases_qty', width: 12, type: 'number' },
            { header: 'Ventas', key: 'sales_qty', width: 12, type: 'number' },
            { header: 'Transf. entrada', key: 'transfer_in_qty', width: 14, type: 'number' },
            { header: 'Transf. salida', key: 'transfer_out_qty', width: 14, type: 'number' },
            { header: 'Ajustes', key: 'adjustments_qty', width: 12, type: 'number' },
            { header: 'Final', key: 'closing_qty', width: 12, type: 'number' },
        ];
        const rows = report.summary.map((row) => ({
            product_sku: row.product_sku,
            product_name: row.product_name,
            fiscal_configuration_name: row.fiscal_configuration_name,
            billing_branch_name: row.billing_branch_name,
            uom_name: row.uom_name,
            opening_qty: parseFloat(row.opening_qty),
            purchases_qty: parseFloat(row.purchases_qty),
            sales_qty: parseFloat(row.sales_qty),
            transfer_in_qty: parseFloat(row.transfer_in_qty),
            transfer_out_qty: parseFloat(row.transfer_out_qty),
            adjustments_qty: parseFloat(row.adjustments_qty),
            closing_qty: parseFloat(row.closing_qty),
        }));
        return (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Resumen',
            title: 'Existencia de inventarios — Resumen',
            subtitle,
            columns,
            rows,
        });
    }
    getFilename(view = query_stock_flow_dto_1.StockFlowView.SUMMARY) {
        const suffix = new Date().toISOString().slice(0, 10);
        const kind = view === query_stock_flow_dto_1.StockFlowView.LEDGER ? 'flujo' : 'resumen';
        return `existencia-inventarios-${kind}-${suffix}.xlsx`;
    }
    assertFilters(filters) {
        if (!filters.fiscal_configuration_id) {
            throw new common_1.BadRequestException('Selecciona una razón social');
        }
    }
    async buildSummary(tenantId, filters, dateFrom, dateTo) {
        const whereExtra = [];
        const params = [
            tenantId,
            filters.fiscal_configuration_id,
            dateTo,
            tenantId,
            filters.fiscal_configuration_id,
            dateFrom,
            tenantId,
            filters.fiscal_configuration_id,
            dateTo,
            tenantId,
            filters.fiscal_configuration_id,
            dateFrom,
            dateTo,
        ];
        if (filters.billing_branch_id) {
            whereExtra.push('AND k.billing_branch_id = ?');
            params.push(filters.billing_branch_id);
        }
        if (filters.product_id) {
            whereExtra.push('AND k.product_id = ?');
            params.push(filters.product_id);
        }
        if (filters.search) {
            whereExtra.push('AND (p.sku LIKE ? OR p.name LIKE ?)');
            const term = `%${filters.search}%`;
            params.push(term, term);
        }
        const sql = `
      SELECT
        k.product_id AS product_id,
        k.billing_branch_id AS billing_branch_id,
        k.uom_id AS uom_id,
        COALESCE(p.sku, '') AS product_sku,
        COALESCE(p.name, '') AS product_name,
        COALESCE(bb.code, bb.city, '') AS billing_branch_name,
        COALESCE(fc.razon_social, '') AS fiscal_configuration_name,
        COALESCE(u.name, '') AS uom_name,
        COALESCE(op.opening_qty, 0) AS opening_qty,
        COALESCE(agg.purchases_qty, 0) AS purchases_qty,
        COALESCE(agg.sales_qty, 0) AS sales_qty,
        COALESCE(agg.transfer_in_qty, 0) AS transfer_in_qty,
        COALESCE(agg.transfer_out_qty, 0) AS transfer_out_qty,
        COALESCE(agg.adjustments_qty, 0) AS adjustments_qty,
        COALESCE(cl.closing_qty, op.opening_qty, 0) AS closing_qty
      FROM (
        SELECT DISTINCT l.product_id, w.billing_branch_id, l.uom_id
        FROM inv_s_stock_ledger l
        INNER JOIN warehouses w ON w.id = l.warehouse_id
        INNER JOIN billing_branches bb ON bb.id = w.billing_branch_id
        WHERE l.tenant_id = ?
          AND bb.fiscal_configuration_id = ?
          AND l.occurred_at <= ?
      ) k
      LEFT JOIN (
        SELECT product_id, billing_branch_id, uom_id, SUM(balance_after) AS opening_qty
        FROM (
          SELECT
            l.product_id,
            w.billing_branch_id,
            l.uom_id,
            l.balance_after,
            ROW_NUMBER() OVER (
              PARTITION BY l.product_id, l.warehouse_id, l.uom_id
              ORDER BY l.occurred_at DESC, l.created_at DESC, l.id DESC
            ) AS rn
          FROM inv_s_stock_ledger l
          INNER JOIN warehouses w ON w.id = l.warehouse_id
          INNER JOIN billing_branches bb ON bb.id = w.billing_branch_id
          WHERE l.tenant_id = ?
            AND bb.fiscal_configuration_id = ?
            AND l.occurred_at < ?
        ) x
        WHERE rn = 1
        GROUP BY product_id, billing_branch_id, uom_id
      ) op
        ON op.product_id = k.product_id
       AND op.billing_branch_id = k.billing_branch_id
       AND op.uom_id = k.uom_id
      LEFT JOIN (
        SELECT product_id, billing_branch_id, uom_id, SUM(balance_after) AS closing_qty
        FROM (
          SELECT
            l.product_id,
            w.billing_branch_id,
            l.uom_id,
            l.balance_after,
            ROW_NUMBER() OVER (
              PARTITION BY l.product_id, l.warehouse_id, l.uom_id
              ORDER BY l.occurred_at DESC, l.created_at DESC, l.id DESC
            ) AS rn
          FROM inv_s_stock_ledger l
          INNER JOIN warehouses w ON w.id = l.warehouse_id
          INNER JOIN billing_branches bb ON bb.id = w.billing_branch_id
          WHERE l.tenant_id = ?
            AND bb.fiscal_configuration_id = ?
            AND l.occurred_at <= ?
        ) x
        WHERE rn = 1
        GROUP BY product_id, billing_branch_id, uom_id
      ) cl
        ON cl.product_id = k.product_id
       AND cl.billing_branch_id = k.billing_branch_id
       AND cl.uom_id = k.uom_id
      LEFT JOIN (
        SELECT
          l.product_id,
          w.billing_branch_id,
          l.uom_id,
          SUM(CASE WHEN l.movement_type IN ('purchase_receipt', 'import') THEN l.quantity_delta ELSE 0 END) AS purchases_qty,
          SUM(CASE
            WHEN l.movement_type = 'sale' THEN ABS(l.quantity_delta)
            WHEN l.movement_type = 'sale_reversal' THEN -l.quantity_delta
            ELSE 0
          END) AS sales_qty,
          SUM(CASE WHEN l.movement_type = 'transfer_in' THEN l.quantity_delta ELSE 0 END) AS transfer_in_qty,
          SUM(CASE WHEN l.movement_type = 'transfer_out' THEN ABS(l.quantity_delta) ELSE 0 END) AS transfer_out_qty,
          SUM(CASE WHEN l.movement_type = 'audit_adjustment' THEN l.quantity_delta ELSE 0 END) AS adjustments_qty
        FROM inv_s_stock_ledger l
        INNER JOIN warehouses w ON w.id = l.warehouse_id
        INNER JOIN billing_branches bb ON bb.id = w.billing_branch_id
        WHERE l.tenant_id = ?
          AND bb.fiscal_configuration_id = ?
          AND l.occurred_at >= ?
          AND l.occurred_at <= ?
        GROUP BY l.product_id, w.billing_branch_id, l.uom_id
      ) agg
        ON agg.product_id = k.product_id
       AND agg.billing_branch_id = k.billing_branch_id
       AND agg.uom_id = k.uom_id
      INNER JOIN products p ON p.id = k.product_id
      INNER JOIN billing_branches bb ON bb.id = k.billing_branch_id
      LEFT JOIN fiscal_configurations fc ON fc.id = bb.fiscal_configuration_id
      LEFT JOIN uom_catalog u ON u.id = k.uom_id
      WHERE 1 = 1
        ${whereExtra.join('\n')}
        AND (
          COALESCE(op.opening_qty, 0) <> 0
          OR COALESCE(agg.purchases_qty, 0) <> 0
          OR COALESCE(agg.sales_qty, 0) <> 0
          OR COALESCE(agg.transfer_in_qty, 0) <> 0
          OR COALESCE(agg.transfer_out_qty, 0) <> 0
          OR COALESCE(agg.adjustments_qty, 0) <> 0
          OR COALESCE(cl.closing_qty, 0) <> 0
        )
      ORDER BY p.name ASC, bb.code ASC
    `;
        const rows = await this.dataSource.query(sql, params);
        return rows.map((row) => ({
            product_id: String(row.product_id),
            product_sku: String(row.product_sku ?? ''),
            product_name: String(row.product_name ?? ''),
            billing_branch_id: String(row.billing_branch_id),
            billing_branch_name: String(row.billing_branch_name ?? ''),
            fiscal_configuration_name: String(row.fiscal_configuration_name ?? ''),
            uom_id: String(row.uom_id),
            uom_name: String(row.uom_name ?? ''),
            opening_qty: (0, inventory_stock_ledger_1.formatStockQty)(row.opening_qty),
            purchases_qty: (0, inventory_stock_ledger_1.formatStockQty)(row.purchases_qty),
            sales_qty: (0, inventory_stock_ledger_1.formatStockQty)(Math.max(0, parseFloat(String(row.sales_qty ?? 0)))),
            transfer_in_qty: (0, inventory_stock_ledger_1.formatStockQty)(row.transfer_in_qty),
            transfer_out_qty: (0, inventory_stock_ledger_1.formatStockQty)(row.transfer_out_qty),
            adjustments_qty: (0, inventory_stock_ledger_1.formatStockQty)(row.adjustments_qty),
            closing_qty: (0, inventory_stock_ledger_1.formatStockQty)(row.closing_qty),
        }));
    }
    async buildLedger(tenantId, filters, dateFrom, dateTo) {
        const movements = await this.loadMovementsInRange(tenantId, filters, dateFrom, dateTo);
        if (!movements.length) {
            return [];
        }
        const keys = [
            ...new Set(movements.map((m) => branchKey(m.product_id, m.warehouse?.billing_branch_id ?? '', m.uom_id))),
        ].filter((k) => !k.includes('||'));
        const openingMap = await this.loadOpeningBalancesForBranchKeys(tenantId, filters.fiscal_configuration_id, dateFrom, keys);
        const rows = [];
        const opened = new Set();
        const running = new Map();
        for (const row of movements) {
            const branchId = row.warehouse?.billing_branch_id ?? '';
            if (!branchId)
                continue;
            const key = branchKey(row.product_id, branchId, row.uom_id);
            const branchName = row.warehouse?.billing_branch?.code ??
                row.warehouse?.billing_branch?.city ??
                '';
            if (!opened.has(key)) {
                opened.add(key);
                const opening = openingMap.get(key) ?? 0;
                running.set(key, opening);
                rows.push({
                    id: `opening:${key}`,
                    occurred_at: dateFrom.toISOString(),
                    product_id: row.product_id,
                    product_sku: row.product?.sku ?? '',
                    product_name: row.product?.name ?? '',
                    billing_branch_id: branchId,
                    billing_branch_name: branchName,
                    uom_name: row.uom?.name ?? '',
                    movement_type: inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.OPENING_BALANCE,
                    movement_type_label: inventory_stock_ledger_1.STOCK_LEDGER_MOVEMENT_TYPE_LABELS[inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.OPENING_BALANCE],
                    title: 'Saldo inicial',
                    description: `Saldo al inicio del periodo: ${(0, inventory_stock_ledger_1.formatStockQty)(opening)} ${row.uom?.name ?? ''}`.trim(),
                    quantity_in: null,
                    quantity_out: null,
                    balance_after: (0, inventory_stock_ledger_1.formatStockQty)(opening),
                    reference_folio: null,
                    is_opening: true,
                });
            }
            const delta = parseFloat(String(row.quantity_delta));
            const next = parseFloat(((running.get(key) ?? 0) + delta).toFixed(3));
            running.set(key, next);
            const typeLabel = inventory_stock_ledger_1.STOCK_LEDGER_MOVEMENT_TYPE_LABELS[row.movement_type] ?? row.movement_type;
            const qtyAbs = (0, inventory_stock_ledger_1.formatStockQty)(Math.abs(delta));
            const uom = row.uom?.name ?? '';
            const folio = row.reference_folio ? ` (${row.reference_folio})` : '';
            rows.push({
                id: row.id,
                occurred_at: new Date(row.occurred_at).toISOString(),
                product_id: row.product_id,
                product_sku: row.product?.sku ?? '',
                product_name: row.product?.name ?? '',
                billing_branch_id: branchId,
                billing_branch_name: branchName,
                uom_name: uom,
                movement_type: row.movement_type,
                movement_type_label: typeLabel,
                title: typeLabel,
                description: this.buildDescription(row.movement_type, qtyAbs, uom, folio),
                quantity_in: delta > 0 ? (0, inventory_stock_ledger_1.formatStockQty)(delta) : null,
                quantity_out: delta < 0 ? (0, inventory_stock_ledger_1.formatStockQty)(Math.abs(delta)) : null,
                balance_after: (0, inventory_stock_ledger_1.formatStockQty)(next),
                reference_folio: row.reference_folio,
                is_opening: false,
            });
        }
        return rows;
    }
    buildDescription(type, qty, uom, folio) {
        switch (type) {
            case inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.PURCHASE_RECEIPT:
                return `Entraron ${qty} ${uom} por compra${folio}.`.trim();
            case inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.IMPORT:
                return `Entraron ${qty} ${uom} por importación${folio}.`.trim();
            case inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.SALE:
                return `Salieron ${qty} ${uom} por venta${folio}.`.trim();
            case inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.SALE_REVERSAL:
                return `Se devolvieron ${qty} ${uom} por cancelación${folio}.`.trim();
            case inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.TRANSFER_IN:
                return `Entraron ${qty} ${uom} por transferencia${folio}.`.trim();
            case inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.TRANSFER_OUT:
                return `Salieron ${qty} ${uom} por transferencia${folio}.`.trim();
            case inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.AUDIT_ADJUSTMENT:
                return `Ajuste de ${qty} ${uom} por auditoría${folio}.`.trim();
            default:
                return `${qty} ${uom}${folio}`.trim();
        }
    }
    async loadOpeningBalancesForBranchKeys(tenantId, fiscalId, dateFrom, keys) {
        const map = new Map();
        if (!keys.length)
            return map;
        const productIds = [...new Set(keys.map((k) => k.split('|')[0]))];
        const rows = await this.dataSource.query(`
      SELECT product_id, billing_branch_id, uom_id, SUM(balance_after) AS opening_qty
      FROM (
        SELECT
          l.product_id,
          w.billing_branch_id,
          l.uom_id,
          l.balance_after,
          ROW_NUMBER() OVER (
            PARTITION BY l.product_id, l.warehouse_id, l.uom_id
            ORDER BY l.occurred_at DESC, l.created_at DESC, l.id DESC
          ) AS rn
        FROM inv_s_stock_ledger l
        INNER JOIN warehouses w ON w.id = l.warehouse_id
        INNER JOIN billing_branches bb ON bb.id = w.billing_branch_id
        WHERE l.tenant_id = ?
          AND bb.fiscal_configuration_id = ?
          AND l.occurred_at < ?
          AND l.product_id IN (${productIds.map(() => '?').join(',')})
      ) x
      WHERE rn = 1
      GROUP BY product_id, billing_branch_id, uom_id
      `, [tenantId, fiscalId, dateFrom, ...productIds]);
        for (const row of rows) {
            const key = branchKey(String(row.product_id), String(row.billing_branch_id), String(row.uom_id));
            if (keys.includes(key)) {
                map.set(key, parseFloat(String(row.opening_qty ?? 0)));
            }
        }
        return map;
    }
    async loadMovementsInRange(tenantId, filters, dateFrom, dateTo) {
        const qb = this.ledgerRepo
            .createQueryBuilder('ledger')
            .leftJoinAndSelect('ledger.product', 'product')
            .leftJoinAndSelect('ledger.warehouse', 'warehouse')
            .leftJoinAndSelect('warehouse.billing_branch', 'billing_branch')
            .leftJoinAndSelect('billing_branch.fiscal_configuration', 'fiscal_configuration')
            .leftJoinAndSelect('ledger.uom', 'uom')
            .where('ledger.tenant_id = :tenantId', { tenantId })
            .andWhere('billing_branch.fiscal_configuration_id = :fiscalId', {
            fiscalId: filters.fiscal_configuration_id,
        })
            .andWhere('ledger.occurred_at >= :dateFrom', { dateFrom })
            .andWhere('ledger.occurred_at <= :dateTo', { dateTo });
        if (filters.billing_branch_id) {
            qb.andWhere('warehouse.billing_branch_id = :billingBranchId', {
                billingBranchId: filters.billing_branch_id,
            });
        }
        if (filters.product_id) {
            qb.andWhere('ledger.product_id = :productId', { productId: filters.product_id });
        }
        if (filters.search) {
            qb.andWhere('(product.sku LIKE :search OR product.name LIKE :search)', {
                search: `%${filters.search}%`,
            });
        }
        return qb
            .orderBy('ledger.product_id', 'ASC')
            .addOrderBy('warehouse.billing_branch_id', 'ASC')
            .addOrderBy('ledger.occurred_at', 'ASC')
            .addOrderBy('ledger.created_at', 'ASC')
            .addOrderBy('ledger.id', 'ASC')
            .getMany();
    }
    buildFiltersApplied(filters, dateFrom, dateTo, view) {
        return {
            period: filters.period,
            period_label: this.periodLabel(filters.period, dateFrom, dateTo),
            date_from: dateFrom.toISOString(),
            date_to: dateTo.toISOString(),
            fiscal_configuration_id: filters.fiscal_configuration_id,
            billing_branch_id: filters.billing_branch_id ?? null,
            product_id: filters.product_id ?? null,
            view,
        };
    }
    resolveDateRange(period, dateFrom, dateTo) {
        const now = new Date();
        switch (period) {
            case query_stock_flow_dto_1.StockFlowPeriod.TODAY:
                return { dateFrom: this.startOfDay(now), dateTo: this.endOfDay(now) };
            case query_stock_flow_dto_1.StockFlowPeriod.WEEK: {
                const start = new Date(now);
                const day = start.getDay();
                const diff = day === 0 ? 6 : day - 1;
                start.setDate(start.getDate() - diff);
                return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
            }
            case query_stock_flow_dto_1.StockFlowPeriod.MONTH: {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
            }
            case query_stock_flow_dto_1.StockFlowPeriod.YEAR: {
                const start = new Date(now.getFullYear(), 0, 1);
                return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
            }
            case query_stock_flow_dto_1.StockFlowPeriod.RANGE:
            default: {
                const from = dateFrom ? new Date(dateFrom) : this.startOfDay(now);
                const to = dateTo ? new Date(dateTo) : this.endOfDay(now);
                return { dateFrom: this.startOfDay(from), dateTo: this.endOfDay(to) };
            }
        }
    }
    periodLabel(period, dateFrom, dateTo) {
        const range = `${(0, excel_export_util_1.formatExportDate)(dateFrom)} — ${(0, excel_export_util_1.formatExportDate)(dateTo)}`;
        switch (period) {
            case query_stock_flow_dto_1.StockFlowPeriod.TODAY:
                return `Hoy · ${range}`;
            case query_stock_flow_dto_1.StockFlowPeriod.WEEK:
                return `Semana · ${range}`;
            case query_stock_flow_dto_1.StockFlowPeriod.MONTH:
                return `Mes · ${range}`;
            case query_stock_flow_dto_1.StockFlowPeriod.YEAR:
                return `Año · ${range}`;
            default:
                return `Rango · ${range}`;
        }
    }
    startOfDay(date) {
        const value = new Date(date);
        value.setHours(0, 0, 0, 0);
        return value;
    }
    endOfDay(date) {
        const value = new Date(date);
        value.setHours(23, 59, 59, 999);
        return value;
    }
};
exports.InventoryStockFlowService = InventoryStockFlowService;
exports.InventoryStockFlowService = InventoryStockFlowService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_stock_ledger_entity_1.InventoryStockLedger)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], InventoryStockFlowService);
//# sourceMappingURL=inventory-stock-flow.service.js.map