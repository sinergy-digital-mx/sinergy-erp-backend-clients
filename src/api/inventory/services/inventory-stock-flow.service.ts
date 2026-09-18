import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryStockLedger } from '../../../entities/inventory/inventory-stock-ledger.entity';
import { InventoryStockLedgerMovementType } from '../../../entities/inventory/inventory-stock-ledger-movement-type.enum';
import {
  formatExportDate,
  buildStyledExcelBuffer,
  ExcelColumnDef,
  buildExportSubtitle,
} from '../../../common/utils/excel-export.util';
import {
  STOCK_LEDGER_MOVEMENT_TYPE_LABELS,
  formatStockQty,
} from '../constants/inventory-stock-ledger';
import {
  QueryStockFlowDto,
  StockFlowPeriod,
  StockFlowView,
} from '../dto/query-stock-flow.dto';
import {
  StockFlowFiltersAppliedDto,
  StockFlowLedgerRowDto,
  StockFlowResponseDto,
  StockFlowSummaryRowDto,
  StockFlowTotalizedRowDto,
} from '../dto/stock-flow-response.dto';
import { formatStockMoney } from '../utils/stock-ledger-valuation.util';

type BranchKey = string;

type OpeningBalance = {
  qty: number;
  cost: number;
  sale: number;
};

type PaginatedRows<T> = {
  rows: T[];
  total: number;
};

type StockFlowQueryOptions = {
  /** Si true, no aplica LIMIT (export Excel). */
  allRows?: boolean;
};

function branchKey(productId: string, branchId: string, uomId: string): BranchKey {
  return `${productId}|${branchId}|${uomId}`;
}

@Injectable()
export class InventoryStockFlowService {
  constructor(
    @InjectRepository(InventoryStockLedger)
    private readonly ledgerRepo: Repository<InventoryStockLedger>,
    private readonly dataSource: DataSource,
  ) {}

  async getReport(
    tenantId: string,
    filters: QueryStockFlowDto,
    options: StockFlowQueryOptions = {},
  ): Promise<StockFlowResponseDto> {
    this.assertFilters(filters);
    const { dateFrom, dateTo } = this.resolveDateRange(
      filters.period,
      filters.date_from,
      filters.date_to,
    );
    const view = filters.view ?? StockFlowView.SUMMARY;
    const { page, limit, skip } = this.resolvePagination(filters, options);
    const filtersApplied = this.buildFiltersApplied(filters, dateFrom, dateTo, view);

    const emptyMeta = {
      page,
      limit,
      total: 0,
      total_pages: 0,
      total_summary_rows: 0,
      total_totalized_rows: 0,
      total_ledger_rows: 0,
    };

    if (view === StockFlowView.LEDGER) {
      const { rows: ledger, total } = await this.buildLedger(
        tenantId,
        filters,
        dateFrom,
        dateTo,
        { page, limit, skip, allRows: options.allRows },
      );
      return {
        filters_applied: filtersApplied,
        summary: [],
        totalized: [],
        ledger,
        ...emptyMeta,
        total,
        total_pages: this.totalPages(total, limit, options.allRows),
        total_ledger_rows: total,
      };
    }

    if (view === StockFlowView.TOTALIZED) {
      const { rows: totalized, total } = await this.buildTotalized(
        tenantId,
        filters,
        dateFrom,
        dateTo,
        { page, limit, skip, allRows: options.allRows },
      );
      return {
        filters_applied: filtersApplied,
        summary: [],
        totalized,
        ledger: [],
        ...emptyMeta,
        total,
        total_pages: this.totalPages(total, limit, options.allRows),
        total_totalized_rows: total,
      };
    }

    const { rows: summary, total } = await this.buildSummary(
      tenantId,
      filters,
      dateFrom,
      dateTo,
      { page, limit, skip, allRows: options.allRows },
    );
    return {
      filters_applied: filtersApplied,
      summary,
      totalized: [],
      ledger: [],
      ...emptyMeta,
      total,
      total_pages: this.totalPages(total, limit, options.allRows),
      total_summary_rows: total,
    };
  }

  async exportExcel(tenantId: string, filters: QueryStockFlowDto): Promise<Buffer> {
    const report = await this.getReport(
      tenantId,
      {
        ...filters,
        view: filters.view ?? StockFlowView.SUMMARY,
      },
      { allRows: true },
    );

    const viewLabel =
      report.filters_applied.view === StockFlowView.LEDGER
        ? 'Flujo detallado'
        : report.filters_applied.view === StockFlowView.TOTALIZED
          ? 'Totalizado'
          : 'Resumen';

    const subtitle = buildExportSubtitle([
      report.filters_applied.period_label,
      viewLabel,
      'MXN',
    ]);

    if (report.filters_applied.view === StockFlowView.LEDGER) {
      const columns: ExcelColumnDef[] = [
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
        { header: 'Costo unit. MXN', key: 'unit_cost_mxn', width: 14, type: 'number' },
        { header: 'P. venta unit. MXN', key: 'unit_sale_price_mxn', width: 14, type: 'number' },
        { header: 'Importe costo MXN', key: 'cost_amount_mxn', width: 14, type: 'number' },
        { header: 'Importe venta MXN', key: 'sale_amount_mxn', width: 14, type: 'number' },
        { header: 'Saldo costo MXN', key: 'cost_balance_after_mxn', width: 14, type: 'number' },
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
        unit_cost_mxn: row.unit_cost_mxn != null ? parseFloat(row.unit_cost_mxn) : null,
        unit_sale_price_mxn:
          row.unit_sale_price_mxn != null ? parseFloat(row.unit_sale_price_mxn) : null,
        cost_amount_mxn:
          row.cost_amount_mxn != null ? parseFloat(row.cost_amount_mxn) : null,
        sale_amount_mxn:
          row.sale_amount_mxn != null ? parseFloat(row.sale_amount_mxn) : null,
        cost_balance_after_mxn:
          row.cost_balance_after_mxn != null
            ? parseFloat(row.cost_balance_after_mxn)
            : null,
        reference_folio: row.reference_folio,
      }));
      return buildStyledExcelBuffer({
        sheetName: 'Flujo',
        title: 'Existencia de inventarios — Flujo',
        subtitle,
        columns,
        rows,
      });
    }

    if (report.filters_applied.view === StockFlowView.TOTALIZED) {
      const columns: ExcelColumnDef[] = [
        { header: 'Razón social', key: 'fiscal_configuration_name', width: 28 },
        { header: 'Sucursal', key: 'billing_branch_name', width: 18 },
        { header: 'Inicial', key: 'opening_qty', width: 12, type: 'number' },
        { header: 'Inicial costo MXN', key: 'opening_cost_mxn', width: 14, type: 'number' },
        { header: 'Inicial venta MXN', key: 'opening_sale_mxn', width: 14, type: 'number' },
        { header: 'Compras', key: 'purchases_qty', width: 12, type: 'number' },
        { header: 'Compras costo MXN', key: 'purchases_cost_mxn', width: 14, type: 'number' },
        { header: 'Ventas', key: 'sales_qty', width: 12, type: 'number' },
        { header: 'Ventas costo MXN', key: 'sales_cost_mxn', width: 14, type: 'number' },
        { header: 'Ventas ingreso MXN', key: 'sales_revenue_mxn', width: 14, type: 'number' },
        { header: 'Transf. entrada', key: 'transfer_in_qty', width: 14, type: 'number' },
        { header: 'Transf. ent. costo', key: 'transfer_in_cost_mxn', width: 14, type: 'number' },
        { header: 'Transf. salida', key: 'transfer_out_qty', width: 14, type: 'number' },
        { header: 'Transf. sal. costo', key: 'transfer_out_cost_mxn', width: 14, type: 'number' },
        { header: 'Ajustes', key: 'adjustments_qty', width: 12, type: 'number' },
        { header: 'Ajustes costo MXN', key: 'adjustments_cost_mxn', width: 14, type: 'number' },
        { header: 'Final', key: 'closing_qty', width: 12, type: 'number' },
        { header: 'Final costo MXN', key: 'closing_cost_mxn', width: 14, type: 'number' },
        { header: 'Final venta MXN', key: 'closing_sale_mxn', width: 14, type: 'number' },
      ];
      const rows = report.totalized.map((row) => this.mapMoneyBlockExcel(row));
      return buildStyledExcelBuffer({
        sheetName: 'Totalizado',
        title: 'Existencia de inventarios — Totalizado',
        subtitle,
        columns,
        rows,
      });
    }

    const columns: ExcelColumnDef[] = [
      { header: 'SKU', key: 'product_sku', width: 14 },
      { header: 'Producto', key: 'product_name', width: 28 },
      { header: 'Razón social', key: 'fiscal_configuration_name', width: 28 },
      { header: 'Sucursal', key: 'billing_branch_name', width: 18 },
      { header: 'UOM', key: 'uom_name', width: 10 },
      { header: 'Inicial', key: 'opening_qty', width: 12, type: 'number' },
      { header: 'Inicial costo MXN', key: 'opening_cost_mxn', width: 14, type: 'number' },
      { header: 'Inicial venta MXN', key: 'opening_sale_mxn', width: 14, type: 'number' },
      { header: 'Compras', key: 'purchases_qty', width: 12, type: 'number' },
      { header: 'Compras costo MXN', key: 'purchases_cost_mxn', width: 14, type: 'number' },
      { header: 'Ventas', key: 'sales_qty', width: 12, type: 'number' },
      { header: 'Ventas costo MXN', key: 'sales_cost_mxn', width: 14, type: 'number' },
      { header: 'Ventas ingreso MXN', key: 'sales_revenue_mxn', width: 14, type: 'number' },
      { header: 'Transf. entrada', key: 'transfer_in_qty', width: 14, type: 'number' },
      { header: 'Transf. ent. costo', key: 'transfer_in_cost_mxn', width: 14, type: 'number' },
      { header: 'Transf. salida', key: 'transfer_out_qty', width: 14, type: 'number' },
      { header: 'Transf. sal. costo', key: 'transfer_out_cost_mxn', width: 14, type: 'number' },
      { header: 'Ajustes', key: 'adjustments_qty', width: 12, type: 'number' },
      { header: 'Ajustes costo MXN', key: 'adjustments_cost_mxn', width: 14, type: 'number' },
      { header: 'Final', key: 'closing_qty', width: 12, type: 'number' },
      { header: 'Final costo MXN', key: 'closing_cost_mxn', width: 14, type: 'number' },
      { header: 'Final venta MXN', key: 'closing_sale_mxn', width: 14, type: 'number' },
    ];
    const rows = report.summary.map((row) => ({
      product_sku: row.product_sku,
      product_name: row.product_name,
      uom_name: row.uom_name,
      ...this.mapMoneyBlockExcel(row),
    }));
    return buildStyledExcelBuffer({
      sheetName: 'Resumen',
      title: 'Existencia de inventarios — Resumen',
      subtitle,
      columns,
      rows,
    });
  }

  getFilename(view: StockFlowView = StockFlowView.SUMMARY): string {
    const suffix = new Date().toISOString().slice(0, 10);
    const kind =
      view === StockFlowView.LEDGER
        ? 'flujo'
        : view === StockFlowView.TOTALIZED
          ? 'totalizado'
          : 'resumen';
    return `existencia-inventarios-${kind}-${suffix}.xlsx`;
  }

  private assertFilters(filters: QueryStockFlowDto): void {
    if (!filters.fiscal_configuration_id) {
      throw new BadRequestException('Selecciona una razón social');
    }
  }

  private resolvePagination(
    filters: QueryStockFlowDto,
    options: StockFlowQueryOptions,
  ): { page: number; limit: number; skip: number } {
    const page = Math.max(1, filters.page ?? 1);
    const limit = options.allRows
      ? Number.MAX_SAFE_INTEGER
      : Math.min(100, Math.max(1, filters.limit ?? 50));
    return { page, limit, skip: (page - 1) * limit };
  }

  private totalPages(total: number, limit: number, allRows?: boolean): number {
    if (allRows) return total > 0 ? 1 : 0;
    if (limit <= 0) return 0;
    return Math.ceil(total / limit) || 0;
  }

  /**
   * Productos ligados al proveedor vía catálogo de costos o lotes de OC.
   * `productExpr` = expresión SQL del product_id (p. ej. `k.product_id` o `l.product_id`).
   */
  private vendorProductPredicate(
    productExpr: string,
    vendorId: string | undefined,
  ): { sql: string; params: unknown[] } {
    if (!vendorId) return { sql: '', params: [] };
    return {
      sql: `AND (
        EXISTS (
          SELECT 1 FROM product_vendor_costs pvc
          WHERE pvc.product_id = ${productExpr} AND pvc.vendor_id = ?
        )
        OR EXISTS (
          SELECT 1
          FROM inv_s_batches b
          INNER JOIN inv_s_purchase_order_batch pob ON pob.id = b.purchase_order_batch_id
          WHERE b.product_id = ${productExpr} AND pob.vendor_id = ?
        )
      )`,
      params: [vendorId, vendorId],
    };
  }

  private async buildSummary(
    tenantId: string,
    filters: QueryStockFlowDto,
    dateFrom: Date,
    dateTo: Date,
    pagination: { page: number; limit: number; skip: number; allRows?: boolean },
  ): Promise<PaginatedRows<StockFlowSummaryRowDto>> {
    const whereExtra: string[] = [];

    if (filters.billing_branch_id) {
      whereExtra.push('AND k.billing_branch_id = ?');
    }
    if (filters.product_id) {
      whereExtra.push('AND k.product_id = ?');
    }
    if (filters.search) {
      whereExtra.push('AND (p.sku LIKE ? OR p.name LIKE ?)');
    }
    const vendor = this.vendorProductPredicate('k.product_id', filters.vendor_id);
    if (vendor.sql) {
      whereExtra.push(vendor.sql);
    }

    const vendorLedger = this.vendorProductPredicate('l.product_id', filters.vendor_id);
    const vendorLedgerSql = vendorLedger.sql;

    const sqlBody = `
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
        COALESCE(op.opening_cost, 0) AS opening_cost,
        COALESCE(op.opening_sale, 0) AS opening_sale,
        COALESCE(agg.purchases_qty, 0) AS purchases_qty,
        COALESCE(agg.purchases_cost, 0) AS purchases_cost,
        COALESCE(agg.sales_qty, 0) AS sales_qty,
        COALESCE(agg.sales_cost, 0) AS sales_cost,
        COALESCE(agg.sales_revenue, 0) AS sales_revenue,
        COALESCE(agg.transfer_in_qty, 0) AS transfer_in_qty,
        COALESCE(agg.transfer_in_cost, 0) AS transfer_in_cost,
        COALESCE(agg.transfer_out_qty, 0) AS transfer_out_qty,
        COALESCE(agg.transfer_out_cost, 0) AS transfer_out_cost,
        COALESCE(agg.adjustments_qty, 0) AS adjustments_qty,
        COALESCE(agg.adjustments_cost, 0) AS adjustments_cost,
        COALESCE(cl.closing_qty, op.opening_qty, 0) AS closing_qty,
        COALESCE(cl.closing_cost, op.opening_cost, 0) AS closing_cost,
        COALESCE(cl.closing_sale, op.opening_sale, 0) AS closing_sale
      FROM (
        SELECT DISTINCT l.product_id, w.billing_branch_id, l.uom_id
        FROM inv_s_stock_ledger l
        INNER JOIN warehouses w ON w.id = l.warehouse_id
        INNER JOIN billing_branches bb ON bb.id = w.billing_branch_id
        WHERE l.tenant_id = ?
          AND bb.fiscal_configuration_id = ?
          AND l.occurred_at <= ?
          ${vendorLedgerSql}
      ) k
      LEFT JOIN (
        SELECT
          product_id,
          billing_branch_id,
          uom_id,
          SUM(balance_after) AS opening_qty,
          SUM(COALESCE(cost_balance_after_mxn, 0)) AS opening_cost,
          SUM(balance_after * COALESCE(unit_sale_price_mxn, 0)) AS opening_sale
        FROM (
          SELECT
            l.product_id,
            w.billing_branch_id,
            l.uom_id,
            l.balance_after,
            l.cost_balance_after_mxn,
            l.unit_sale_price_mxn,
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
            ${vendorLedgerSql}
        ) x
        WHERE rn = 1
        GROUP BY product_id, billing_branch_id, uom_id
      ) op
        ON op.product_id = k.product_id
       AND op.billing_branch_id = k.billing_branch_id
       AND op.uom_id = k.uom_id
      LEFT JOIN (
        SELECT
          product_id,
          billing_branch_id,
          uom_id,
          SUM(balance_after) AS closing_qty,
          SUM(COALESCE(cost_balance_after_mxn, 0)) AS closing_cost,
          SUM(balance_after * COALESCE(unit_sale_price_mxn, 0)) AS closing_sale
        FROM (
          SELECT
            l.product_id,
            w.billing_branch_id,
            l.uom_id,
            l.balance_after,
            l.cost_balance_after_mxn,
            l.unit_sale_price_mxn,
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
            ${vendorLedgerSql}
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
            WHEN l.movement_type IN ('purchase_receipt', 'import')
            THEN l.quantity_delta * COALESCE(l.unit_cost_mxn, 0)
            ELSE 0
          END) AS purchases_cost,
          SUM(CASE
            WHEN l.movement_type = 'sale' THEN ABS(l.quantity_delta)
            WHEN l.movement_type = 'sale_reversal' THEN -l.quantity_delta
            ELSE 0
          END) AS sales_qty,
          SUM(CASE
            WHEN l.movement_type = 'sale'
            THEN ABS(l.quantity_delta) * COALESCE(l.unit_cost_mxn, 0)
            WHEN l.movement_type = 'sale_reversal'
            THEN -l.quantity_delta * COALESCE(l.unit_cost_mxn, 0)
            ELSE 0
          END) AS sales_cost,
          SUM(CASE
            WHEN l.movement_type = 'sale'
            THEN ABS(l.quantity_delta) * COALESCE(l.unit_sale_price_mxn, 0)
            WHEN l.movement_type = 'sale_reversal'
            THEN -l.quantity_delta * COALESCE(l.unit_sale_price_mxn, 0)
            ELSE 0
          END) AS sales_revenue,
          SUM(CASE WHEN l.movement_type = 'transfer_in' THEN l.quantity_delta ELSE 0 END) AS transfer_in_qty,
          SUM(CASE
            WHEN l.movement_type = 'transfer_in'
            THEN l.quantity_delta * COALESCE(l.unit_cost_mxn, 0)
            ELSE 0
          END) AS transfer_in_cost,
          SUM(CASE WHEN l.movement_type = 'transfer_out' THEN ABS(l.quantity_delta) ELSE 0 END) AS transfer_out_qty,
          SUM(CASE
            WHEN l.movement_type = 'transfer_out'
            THEN ABS(l.quantity_delta) * COALESCE(l.unit_cost_mxn, 0)
            ELSE 0
          END) AS transfer_out_cost,
          SUM(CASE WHEN l.movement_type = 'audit_adjustment' THEN l.quantity_delta ELSE 0 END) AS adjustments_qty,
          SUM(CASE
            WHEN l.movement_type = 'audit_adjustment'
            THEN l.quantity_delta * COALESCE(l.unit_cost_mxn, 0)
            ELSE 0
          END) AS adjustments_cost
        FROM inv_s_stock_ledger l
        INNER JOIN warehouses w ON w.id = l.warehouse_id
        INNER JOIN billing_branches bb ON bb.id = w.billing_branch_id
        WHERE l.tenant_id = ?
          AND bb.fiscal_configuration_id = ?
          AND l.occurred_at >= ?
          AND l.occurred_at <= ?
          ${vendorLedgerSql}
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
          OR COALESCE(op.opening_cost, 0) <> 0
          OR COALESCE(op.opening_sale, 0) <> 0
          OR COALESCE(agg.purchases_qty, 0) <> 0
          OR COALESCE(agg.purchases_cost, 0) <> 0
          OR COALESCE(agg.sales_qty, 0) <> 0
          OR COALESCE(agg.sales_cost, 0) <> 0
          OR COALESCE(agg.sales_revenue, 0) <> 0
          OR COALESCE(agg.transfer_in_qty, 0) <> 0
          OR COALESCE(agg.transfer_in_cost, 0) <> 0
          OR COALESCE(agg.transfer_out_qty, 0) <> 0
          OR COALESCE(agg.transfer_out_cost, 0) <> 0
          OR COALESCE(agg.adjustments_qty, 0) <> 0
          OR COALESCE(agg.adjustments_cost, 0) <> 0
          OR COALESCE(cl.closing_qty, 0) <> 0
          OR COALESCE(cl.closing_cost, 0) <> 0
          OR COALESCE(cl.closing_sale, 0) <> 0
        )
    `;

    // Reconstruir params: cada subquery de ledger incluye vendor params si aplica
    const ledgerParams: unknown[] = [];
    const pushLedgerBlock = (block: unknown[]) => {
      ledgerParams.push(...block);
      if (vendorLedger.params.length) {
        ledgerParams.push(...vendorLedger.params);
      }
    };
    // keys subquery: tenant, fiscal, dateTo
    pushLedgerBlock([tenantId, filters.fiscal_configuration_id, dateTo]);
    // opening: tenant, fiscal, dateFrom
    pushLedgerBlock([tenantId, filters.fiscal_configuration_id, dateFrom]);
    // closing: tenant, fiscal, dateTo
    pushLedgerBlock([tenantId, filters.fiscal_configuration_id, dateTo]);
    // agg: tenant, fiscal, dateFrom, dateTo
    pushLedgerBlock([
      tenantId,
      filters.fiscal_configuration_id,
      dateFrom,
      dateTo,
    ]);

    const outerParams: unknown[] = [];
    if (filters.billing_branch_id) outerParams.push(filters.billing_branch_id);
    if (filters.product_id) outerParams.push(filters.product_id);
    if (filters.search) {
      const term = `%${filters.search}%`;
      outerParams.push(term, term);
    }
    if (vendor.params.length) outerParams.push(...vendor.params);

    const queryParams = [...ledgerParams, ...outerParams];

    const countRows = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM (${sqlBody}) counted`,
      queryParams,
    );
    const total = Number((countRows as Array<{ total: number | string }>)[0]?.total ?? 0);

    let pageSql = `${sqlBody} ORDER BY p.name ASC, bb.code ASC`;
    const pageParams = [...queryParams];
    if (!pagination.allRows) {
      pageSql += ' LIMIT ? OFFSET ?';
      pageParams.push(pagination.limit, pagination.skip);
    }

    const rows = await this.dataSource.query(pageSql, pageParams);
    return {
      total,
      rows: (rows as Array<Record<string, unknown>>).map((row) =>
        this.mapSummaryRow(row),
      ),
    };
  }

  private async buildTotalized(
    tenantId: string,
    filters: QueryStockFlowDto,
    dateFrom: Date,
    dateTo: Date,
    pagination: { page: number; limit: number; skip: number; allRows?: boolean },
  ): Promise<PaginatedRows<StockFlowTotalizedRowDto>> {
    const whereExtra: string[] = [];
    if (filters.billing_branch_id) {
      whereExtra.push('AND k.billing_branch_id = ?');
    }

    const vendorLedger = this.vendorProductPredicate('l.product_id', filters.vendor_id);
    const vendorLedgerSql = vendorLedger.sql;

    const sqlBody = `
      SELECT
        k.billing_branch_id AS billing_branch_id,
        COALESCE(bb.code, bb.city, '') AS billing_branch_name,
        COALESCE(fc.razon_social, '') AS fiscal_configuration_name,
        COALESCE(op.opening_qty, 0) AS opening_qty,
        COALESCE(op.opening_cost, 0) AS opening_cost,
        COALESCE(op.opening_sale, 0) AS opening_sale,
        COALESCE(agg.purchases_qty, 0) AS purchases_qty,
        COALESCE(agg.purchases_cost, 0) AS purchases_cost,
        COALESCE(agg.sales_qty, 0) AS sales_qty,
        COALESCE(agg.sales_cost, 0) AS sales_cost,
        COALESCE(agg.sales_revenue, 0) AS sales_revenue,
        COALESCE(agg.transfer_in_qty, 0) AS transfer_in_qty,
        COALESCE(agg.transfer_in_cost, 0) AS transfer_in_cost,
        COALESCE(agg.transfer_out_qty, 0) AS transfer_out_qty,
        COALESCE(agg.transfer_out_cost, 0) AS transfer_out_cost,
        COALESCE(agg.adjustments_qty, 0) AS adjustments_qty,
        COALESCE(agg.adjustments_cost, 0) AS adjustments_cost,
        COALESCE(cl.closing_qty, op.opening_qty, 0) AS closing_qty,
        COALESCE(cl.closing_cost, op.opening_cost, 0) AS closing_cost,
        COALESCE(cl.closing_sale, op.opening_sale, 0) AS closing_sale
      FROM (
        SELECT DISTINCT w.billing_branch_id
        FROM inv_s_stock_ledger l
        INNER JOIN warehouses w ON w.id = l.warehouse_id
        INNER JOIN billing_branches bb ON bb.id = w.billing_branch_id
        WHERE l.tenant_id = ?
          AND bb.fiscal_configuration_id = ?
          AND l.occurred_at <= ?
          ${vendorLedgerSql}
      ) k
      LEFT JOIN (
        SELECT
          billing_branch_id,
          SUM(balance_after) AS opening_qty,
          SUM(COALESCE(cost_balance_after_mxn, 0)) AS opening_cost,
          SUM(balance_after * COALESCE(unit_sale_price_mxn, 0)) AS opening_sale
        FROM (
          SELECT
            w.billing_branch_id,
            l.balance_after,
            l.cost_balance_after_mxn,
            l.unit_sale_price_mxn,
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
            ${vendorLedgerSql}
        ) x
        WHERE rn = 1
        GROUP BY billing_branch_id
      ) op ON op.billing_branch_id = k.billing_branch_id
      LEFT JOIN (
        SELECT
          billing_branch_id,
          SUM(balance_after) AS closing_qty,
          SUM(COALESCE(cost_balance_after_mxn, 0)) AS closing_cost,
          SUM(balance_after * COALESCE(unit_sale_price_mxn, 0)) AS closing_sale
        FROM (
          SELECT
            w.billing_branch_id,
            l.balance_after,
            l.cost_balance_after_mxn,
            l.unit_sale_price_mxn,
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
            ${vendorLedgerSql}
        ) x
        WHERE rn = 1
        GROUP BY billing_branch_id
      ) cl ON cl.billing_branch_id = k.billing_branch_id
      LEFT JOIN (
        SELECT
          w.billing_branch_id,
          SUM(CASE WHEN l.movement_type IN ('purchase_receipt', 'import') THEN l.quantity_delta ELSE 0 END) AS purchases_qty,
          SUM(CASE
            WHEN l.movement_type IN ('purchase_receipt', 'import')
            THEN l.quantity_delta * COALESCE(l.unit_cost_mxn, 0)
            ELSE 0
          END) AS purchases_cost,
          SUM(CASE
            WHEN l.movement_type = 'sale' THEN ABS(l.quantity_delta)
            WHEN l.movement_type = 'sale_reversal' THEN -l.quantity_delta
            ELSE 0
          END) AS sales_qty,
          SUM(CASE
            WHEN l.movement_type = 'sale'
            THEN ABS(l.quantity_delta) * COALESCE(l.unit_cost_mxn, 0)
            WHEN l.movement_type = 'sale_reversal'
            THEN -l.quantity_delta * COALESCE(l.unit_cost_mxn, 0)
            ELSE 0
          END) AS sales_cost,
          SUM(CASE
            WHEN l.movement_type = 'sale'
            THEN ABS(l.quantity_delta) * COALESCE(l.unit_sale_price_mxn, 0)
            WHEN l.movement_type = 'sale_reversal'
            THEN -l.quantity_delta * COALESCE(l.unit_sale_price_mxn, 0)
            ELSE 0
          END) AS sales_revenue,
          SUM(CASE WHEN l.movement_type = 'transfer_in' THEN l.quantity_delta ELSE 0 END) AS transfer_in_qty,
          SUM(CASE
            WHEN l.movement_type = 'transfer_in'
            THEN l.quantity_delta * COALESCE(l.unit_cost_mxn, 0)
            ELSE 0
          END) AS transfer_in_cost,
          SUM(CASE WHEN l.movement_type = 'transfer_out' THEN ABS(l.quantity_delta) ELSE 0 END) AS transfer_out_qty,
          SUM(CASE
            WHEN l.movement_type = 'transfer_out'
            THEN ABS(l.quantity_delta) * COALESCE(l.unit_cost_mxn, 0)
            ELSE 0
          END) AS transfer_out_cost,
          SUM(CASE WHEN l.movement_type = 'audit_adjustment' THEN l.quantity_delta ELSE 0 END) AS adjustments_qty,
          SUM(CASE
            WHEN l.movement_type = 'audit_adjustment'
            THEN l.quantity_delta * COALESCE(l.unit_cost_mxn, 0)
            ELSE 0
          END) AS adjustments_cost
        FROM inv_s_stock_ledger l
        INNER JOIN warehouses w ON w.id = l.warehouse_id
        INNER JOIN billing_branches bb ON bb.id = w.billing_branch_id
        WHERE l.tenant_id = ?
          AND bb.fiscal_configuration_id = ?
          AND l.occurred_at >= ?
          AND l.occurred_at <= ?
          ${vendorLedgerSql}
        GROUP BY w.billing_branch_id
      ) agg ON agg.billing_branch_id = k.billing_branch_id
      INNER JOIN billing_branches bb ON bb.id = k.billing_branch_id
      LEFT JOIN fiscal_configurations fc ON fc.id = bb.fiscal_configuration_id
      WHERE 1 = 1
        ${whereExtra.join('\n')}
        AND (
          COALESCE(op.opening_qty, 0) <> 0
          OR COALESCE(op.opening_cost, 0) <> 0
          OR COALESCE(op.opening_sale, 0) <> 0
          OR COALESCE(agg.purchases_qty, 0) <> 0
          OR COALESCE(agg.purchases_cost, 0) <> 0
          OR COALESCE(agg.sales_qty, 0) <> 0
          OR COALESCE(agg.sales_cost, 0) <> 0
          OR COALESCE(agg.sales_revenue, 0) <> 0
          OR COALESCE(agg.transfer_in_qty, 0) <> 0
          OR COALESCE(agg.transfer_in_cost, 0) <> 0
          OR COALESCE(agg.transfer_out_qty, 0) <> 0
          OR COALESCE(agg.transfer_out_cost, 0) <> 0
          OR COALESCE(agg.adjustments_qty, 0) <> 0
          OR COALESCE(agg.adjustments_cost, 0) <> 0
          OR COALESCE(cl.closing_qty, 0) <> 0
          OR COALESCE(cl.closing_cost, 0) <> 0
          OR COALESCE(cl.closing_sale, 0) <> 0
        )
    `;

    const ledgerParams: unknown[] = [];
    const pushLedgerBlock = (block: unknown[]) => {
      ledgerParams.push(...block);
      if (vendorLedger.params.length) {
        ledgerParams.push(...vendorLedger.params);
      }
    };
    pushLedgerBlock([tenantId, filters.fiscal_configuration_id, dateTo]);
    pushLedgerBlock([tenantId, filters.fiscal_configuration_id, dateFrom]);
    pushLedgerBlock([tenantId, filters.fiscal_configuration_id, dateTo]);
    pushLedgerBlock([
      tenantId,
      filters.fiscal_configuration_id,
      dateFrom,
      dateTo,
    ]);

    const outerParams: unknown[] = [];
    if (filters.billing_branch_id) {
      outerParams.push(filters.billing_branch_id);
    }
    const queryParams = [...ledgerParams, ...outerParams];

    const countRows = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM (${sqlBody}) counted`,
      queryParams,
    );
    const total = Number((countRows as Array<{ total: number | string }>)[0]?.total ?? 0);

    let pageSql = `${sqlBody} ORDER BY bb.code ASC`;
    const pageParams = [...queryParams];
    if (!pagination.allRows) {
      pageSql += ' LIMIT ? OFFSET ?';
      pageParams.push(pagination.limit, pagination.skip);
    }

    const rows = await this.dataSource.query(pageSql, pageParams);
    return {
      total,
      rows: (rows as Array<Record<string, unknown>>).map((row) =>
        this.mapTotalizedRow(row),
      ),
    };
  }

  private async buildLedger(
    tenantId: string,
    filters: QueryStockFlowDto,
    dateFrom: Date,
    dateTo: Date,
    pagination: { page: number; limit: number; skip: number; allRows?: boolean },
  ): Promise<PaginatedRows<StockFlowLedgerRowDto>> {
    const movements = await this.loadMovementsInRange(tenantId, filters, dateFrom, dateTo);
    if (!movements.length) {
      return { rows: [], total: 0 };
    }

    const keys = [
      ...new Set(
        movements.map((m) =>
          branchKey(
            m.product_id,
            m.warehouse?.billing_branch_id ?? '',
            m.uom_id,
          ),
        ),
      ),
    ].filter((k) => !k.includes('||'));

    const openingMap = await this.loadOpeningBalancesForBranchKeys(
      tenantId,
      filters.fiscal_configuration_id,
      dateFrom,
      keys,
    );

    const rows: StockFlowLedgerRowDto[] = [];
    const opened = new Set<BranchKey>();
    const runningQty = new Map<BranchKey, number>();
    const runningCost = new Map<BranchKey, number>();

    for (const row of movements) {
      const branchId = row.warehouse?.billing_branch_id ?? '';
      if (!branchId) continue;
      const key = branchKey(row.product_id, branchId, row.uom_id);
      const branchName =
        row.warehouse?.billing_branch?.code ??
        row.warehouse?.billing_branch?.city ??
        '';

      if (!opened.has(key)) {
        opened.add(key);
        const opening = openingMap.get(key) ?? { qty: 0, cost: 0, sale: 0 };
        runningQty.set(key, opening.qty);
        runningCost.set(key, opening.cost);
        rows.push({
          id: `opening:${key}`,
          // Fecha de calendario del inicio del periodo (mediodía UTC) para no
          // mostrar el día anterior en zonas America/* al formatear en el cliente.
          occurred_at: this.toPeriodCalendarDateIso(dateFrom),
          product_id: row.product_id,
          product_sku: row.product?.sku ?? '',
          product_name: row.product?.name ?? '',
          billing_branch_id: branchId,
          billing_branch_name: branchName,
          uom_name: row.uom?.name ?? '',
          movement_type: InventoryStockLedgerMovementType.OPENING_BALANCE,
          movement_type_label:
            STOCK_LEDGER_MOVEMENT_TYPE_LABELS[
              InventoryStockLedgerMovementType.OPENING_BALANCE
            ],
          title: 'Saldo inicial',
          description: `Saldo al inicio del periodo: ${formatStockQty(opening.qty)} ${row.uom?.name ?? ''}`.trim(),
          quantity_in: null,
          quantity_out: null,
          balance_after: formatStockQty(opening.qty),
          unit_cost_mxn: null,
          unit_sale_price_mxn: null,
          cost_amount_mxn: null,
          sale_amount_mxn: null,
          cost_balance_after_mxn: formatStockMoney(opening.cost),
          reference_folio: null,
          reference_type: null,
          reference_id: null,
          is_opening: true,
        });
      }

      const delta = parseFloat(String(row.quantity_delta));
      const unitCost =
        row.unit_cost_mxn != null ? parseFloat(String(row.unit_cost_mxn)) : null;
      const unitSale =
        row.unit_sale_price_mxn != null
          ? parseFloat(String(row.unit_sale_price_mxn))
          : null;
      const absDelta = Math.abs(delta);
      const costAmount =
        unitCost != null && Number.isFinite(unitCost) ? absDelta * unitCost : null;
      const saleAmount =
        unitSale != null && Number.isFinite(unitSale) ? absDelta * unitSale : null;

      const nextQty = parseFloat(((runningQty.get(key) ?? 0) + delta).toFixed(3));
      runningQty.set(key, nextQty);

      // Saldo de costo a nivel sucursal (suma de almacenes del producto|UOM).
      const costDelta =
        unitCost != null && Number.isFinite(unitCost) ? delta * unitCost : 0;
      const nextCost = parseFloat(((runningCost.get(key) ?? 0) + costDelta).toFixed(2));
      runningCost.set(key, nextCost);

      const typeLabel =
        STOCK_LEDGER_MOVEMENT_TYPE_LABELS[row.movement_type] ?? row.movement_type;
      const qtyAbs = formatStockQty(absDelta);
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
        quantity_in: delta > 0 ? formatStockQty(delta) : null,
        quantity_out: delta < 0 ? formatStockQty(absDelta) : null,
        balance_after: formatStockQty(nextQty),
        unit_cost_mxn: unitCost != null ? formatStockMoney(unitCost) : null,
        unit_sale_price_mxn: unitSale != null ? formatStockMoney(unitSale) : null,
        cost_amount_mxn: costAmount != null ? formatStockMoney(costAmount) : null,
        sale_amount_mxn: saleAmount != null ? formatStockMoney(saleAmount) : null,
        cost_balance_after_mxn: formatStockMoney(nextCost),
        reference_folio: row.reference_folio,
        reference_type: row.reference_type ?? null,
        reference_id: row.reference_id ?? null,
        is_opening: false,
      });
    }

    const total = rows.length;
    if (pagination.allRows) {
      return { rows, total };
    }
    return {
      total,
      rows: rows.slice(pagination.skip, pagination.skip + pagination.limit),
    };
  }

  private buildDescription(
    type: InventoryStockLedgerMovementType,
    qty: string,
    uom: string,
    folio: string,
  ): string {
    switch (type) {
      case InventoryStockLedgerMovementType.PURCHASE_RECEIPT:
        return `Entraron ${qty} ${uom} por compra${folio}.`.trim();
      case InventoryStockLedgerMovementType.IMPORT:
        return `Entraron ${qty} ${uom} por importación${folio}.`.trim();
      case InventoryStockLedgerMovementType.SALE:
        return `Salieron ${qty} ${uom} por venta${folio}.`.trim();
      case InventoryStockLedgerMovementType.SALE_REVERSAL:
        return `Se devolvieron ${qty} ${uom} por cancelación${folio}.`.trim();
      case InventoryStockLedgerMovementType.TRANSFER_IN:
        return `Entraron ${qty} ${uom} por transferencia${folio}.`.trim();
      case InventoryStockLedgerMovementType.TRANSFER_OUT:
        return `Salieron ${qty} ${uom} por transferencia${folio}.`.trim();
      case InventoryStockLedgerMovementType.AUDIT_ADJUSTMENT:
        return `Ajuste de ${qty} ${uom} por auditoría${folio}.`.trim();
      default:
        return `${qty} ${uom}${folio}`.trim();
    }
  }

  private async loadOpeningBalancesForBranchKeys(
    tenantId: string,
    fiscalId: string,
    dateFrom: Date,
    keys: string[],
  ): Promise<Map<BranchKey, OpeningBalance>> {
    const map = new Map<BranchKey, OpeningBalance>();
    if (!keys.length) return map;

    const productIds = [...new Set(keys.map((k) => k.split('|')[0]))];
    const rows = await this.dataSource.query(
      `
      SELECT
        product_id,
        billing_branch_id,
        uom_id,
        SUM(balance_after) AS opening_qty,
        SUM(COALESCE(cost_balance_after_mxn, 0)) AS opening_cost,
        SUM(balance_after * COALESCE(unit_sale_price_mxn, 0)) AS opening_sale
      FROM (
        SELECT
          l.product_id,
          w.billing_branch_id,
          l.uom_id,
          l.balance_after,
          l.cost_balance_after_mxn,
          l.unit_sale_price_mxn,
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
      `,
      [tenantId, fiscalId, dateFrom, ...productIds],
    );

    for (const row of rows as Array<Record<string, unknown>>) {
      const key = branchKey(
        String(row.product_id),
        String(row.billing_branch_id),
        String(row.uom_id),
      );
      if (keys.includes(key)) {
        map.set(key, {
          qty: parseFloat(String(row.opening_qty ?? 0)),
          cost: parseFloat(String(row.opening_cost ?? 0)),
          sale: parseFloat(String(row.opening_sale ?? 0)),
        });
      }
    }
    return map;
  }

  private async loadMovementsInRange(
    tenantId: string,
    filters: QueryStockFlowDto,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<InventoryStockLedger[]> {
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
    if (filters.vendor_id) {
      qb.andWhere(
        `(
          EXISTS (
            SELECT 1 FROM product_vendor_costs pvc
            WHERE pvc.product_id = ledger.product_id AND pvc.vendor_id = :vendorId
          )
          OR EXISTS (
            SELECT 1
            FROM inv_s_batches b
            INNER JOIN inv_s_purchase_order_batch pob ON pob.id = b.purchase_order_batch_id
            WHERE b.product_id = ledger.product_id AND pob.vendor_id = :vendorId
          )
        )`,
        { vendorId: filters.vendor_id },
      );
    }

    return qb
      .orderBy('ledger.product_id', 'ASC')
      .addOrderBy('warehouse.billing_branch_id', 'ASC')
      .addOrderBy('ledger.occurred_at', 'ASC')
      .addOrderBy('ledger.created_at', 'ASC')
      .addOrderBy('ledger.id', 'ASC')
      .getMany();
  }

  private mapSummaryRow(row: Record<string, unknown>): StockFlowSummaryRowDto {
    const money = this.mapMoneyBlock(row);
    return {
      product_id: String(row.product_id),
      product_sku: String(row.product_sku ?? ''),
      product_name: String(row.product_name ?? ''),
      billing_branch_id: String(row.billing_branch_id),
      billing_branch_name: String(row.billing_branch_name ?? ''),
      fiscal_configuration_name: String(row.fiscal_configuration_name ?? ''),
      uom_id: String(row.uom_id),
      uom_name: String(row.uom_name ?? ''),
      ...money,
    };
  }

  private mapTotalizedRow(row: Record<string, unknown>): StockFlowTotalizedRowDto {
    const money = this.mapMoneyBlock(row);
    return {
      billing_branch_id: String(row.billing_branch_id),
      billing_branch_name: String(row.billing_branch_name ?? ''),
      fiscal_configuration_name: String(row.fiscal_configuration_name ?? ''),
      ...money,
    };
  }

  private mapMoneyBlock(row: Record<string, unknown>) {
    return {
      opening_qty: formatStockQty(row.opening_qty),
      opening_cost_mxn: formatStockMoney(row.opening_cost),
      opening_sale_mxn: formatStockMoney(row.opening_sale),
      purchases_qty: formatStockQty(row.purchases_qty),
      purchases_cost_mxn: formatStockMoney(row.purchases_cost),
      sales_qty: formatStockQty(Math.max(0, parseFloat(String(row.sales_qty ?? 0)))),
      sales_cost_mxn: formatStockMoney(Math.max(0, parseFloat(String(row.sales_cost ?? 0)))),
      sales_revenue_mxn: formatStockMoney(
        Math.max(0, parseFloat(String(row.sales_revenue ?? 0))),
      ),
      transfer_in_qty: formatStockQty(row.transfer_in_qty),
      transfer_in_cost_mxn: formatStockMoney(row.transfer_in_cost),
      transfer_out_qty: formatStockQty(row.transfer_out_qty),
      transfer_out_cost_mxn: formatStockMoney(row.transfer_out_cost),
      adjustments_qty: formatStockQty(row.adjustments_qty),
      adjustments_cost_mxn: formatStockMoney(row.adjustments_cost),
      closing_qty: formatStockQty(row.closing_qty),
      closing_cost_mxn: formatStockMoney(row.closing_cost),
      closing_sale_mxn: formatStockMoney(row.closing_sale),
    };
  }

  private mapMoneyBlockExcel(
    row: StockFlowSummaryRowDto | StockFlowTotalizedRowDto,
  ): Record<string, string | number> {
    const base: Record<string, string | number> = {
      fiscal_configuration_name: row.fiscal_configuration_name,
      billing_branch_name: row.billing_branch_name,
      opening_qty: parseFloat(row.opening_qty),
      opening_cost_mxn: parseFloat(row.opening_cost_mxn),
      opening_sale_mxn: parseFloat(row.opening_sale_mxn),
      purchases_qty: parseFloat(row.purchases_qty),
      purchases_cost_mxn: parseFloat(row.purchases_cost_mxn),
      sales_qty: parseFloat(row.sales_qty),
      sales_cost_mxn: parseFloat(row.sales_cost_mxn),
      sales_revenue_mxn: parseFloat(row.sales_revenue_mxn),
      transfer_in_qty: parseFloat(row.transfer_in_qty),
      transfer_in_cost_mxn: parseFloat(row.transfer_in_cost_mxn),
      transfer_out_qty: parseFloat(row.transfer_out_qty),
      transfer_out_cost_mxn: parseFloat(row.transfer_out_cost_mxn),
      adjustments_qty: parseFloat(row.adjustments_qty),
      adjustments_cost_mxn: parseFloat(row.adjustments_cost_mxn),
      closing_qty: parseFloat(row.closing_qty),
      closing_cost_mxn: parseFloat(row.closing_cost_mxn),
      closing_sale_mxn: parseFloat(row.closing_sale_mxn),
    };
    return base;
  }

  private buildFiltersApplied(
    filters: QueryStockFlowDto,
    dateFrom: Date,
    dateTo: Date,
    view: StockFlowView,
  ): StockFlowFiltersAppliedDto {
    return {
      period: filters.period,
      period_label: this.periodLabel(filters.period, dateFrom, dateTo),
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString(),
      fiscal_configuration_id: filters.fiscal_configuration_id,
      billing_branch_id: filters.billing_branch_id ?? null,
      product_id: filters.product_id ?? null,
      vendor_id: filters.vendor_id ?? null,
      view,
      currency: 'MXN',
    };
  }

  private resolveDateRange(
    period: StockFlowPeriod,
    dateFrom?: string,
    dateTo?: string,
  ): { dateFrom: Date; dateTo: Date } {
    const now = new Date();

    switch (period) {
      case StockFlowPeriod.TODAY:
        return { dateFrom: this.startOfDay(now), dateTo: this.endOfDay(now) };
      case StockFlowPeriod.WEEK: {
        const start = new Date(now);
        const day = start.getDay();
        const diff = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - diff);
        return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
      }
      case StockFlowPeriod.MONTH: {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
      }
      case StockFlowPeriod.YEAR: {
        const start = new Date(now.getFullYear(), 0, 1);
        return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
      }
      case StockFlowPeriod.RANGE:
      default: {
        const from = dateFrom ? new Date(dateFrom) : this.startOfDay(now);
        const to = dateTo ? new Date(dateTo) : this.endOfDay(now);
        return { dateFrom: this.startOfDay(from), dateTo: this.endOfDay(to) };
      }
    }
  }

  private periodLabel(period: StockFlowPeriod, dateFrom: Date, dateTo: Date): string {
    const range = `${formatExportDate(dateFrom)} — ${formatExportDate(dateTo)}`;
    switch (period) {
      case StockFlowPeriod.TODAY:
        return `Hoy · ${range}`;
      case StockFlowPeriod.WEEK:
        return `Semana · ${range}`;
      case StockFlowPeriod.MONTH:
        return `Mes · ${range}`;
      case StockFlowPeriod.YEAR:
        return `Año · ${range}`;
      default:
        return `Rango · ${range}`;
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

  /**
   * Serializa el día de calendario de `date` (getFullYear/Month/Date del servidor)
   * a mediodía UTC. Evita que medianoche UTC se vea como el día anterior en MX.
   */
  private toPeriodCalendarDateIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}T12:00:00.000Z`;
  }
}
