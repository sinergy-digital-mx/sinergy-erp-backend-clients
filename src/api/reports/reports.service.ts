import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { QueryStockReplenishmentDto } from './dto/query-stock-replenishment.dto';
import {
  AveragePriceSource,
  buildReplenishmentPlan,
  needsTransferHint,
  ReplenishmentStatus,
  resolveAveragePrice,
  roundMoney,
  safetyDaysFor,
  SalesTrend,
  STOCK_REPLENISHMENT_FORMULA,
  stockDifference,
  toCostMxn,
} from './utils/stock-replenishment.util';

export interface StockReplenishmentVendorOption {
  id: string;
  legal_name: string;
  rfc: string | null;
  product_count: number;
}

export interface StockReplenishmentBranchColumn {
  id: string;
  name: string;
}

export interface StockReplenishmentBranchCell {
  branch_id: string;
  on_hand: number;
  sold_qty: number;
  difference: number;
}

export interface StockReplenishmentRow {
  product_id: string;
  sku: string;
  external_sku: string | null;
  name: string;
  uom_name: string | null;
  branches: StockReplenishmentBranchCell[];
  on_hand: number;
  sold_qty: number;
  previous_sold_qty: number;
  difference: number;
  average_price: number | null;
  price_source: AveragePriceSource;
  unit_cost: number | null;
  cost_currency: string;
  unit_margin: number | null;
  margin_percent: number | null;
  daily_rate: number;
  trend: SalesTrend;
  trend_factor: number;
  min_stock: number;
  max_stock: number;
  days_of_cover: number | null;
  recommended_qty: number;
  status: ReplenishmentStatus;
  transfer_hint: boolean;
}

export interface StockReplenishmentReport {
  vendor: { id: string; legal_name: string; rfc: string | null };
  period_days: number;
  cover_days: number;
  safety_days: number;
  period_from: string;
  period_to: string;
  period_label: string;
  exchange_rate: number | null;
  formula: string;
  branches: StockReplenishmentBranchColumn[];
  rows: StockReplenishmentRow[];
  summary: {
    product_count: number;
    reorder_count: number;
    out_of_stock_count: number;
    no_movement_count: number;
  };
}

type VendorRow = {
  id: string;
  legal_name: string | null;
  rfc: string | null;
  product_count?: number | string;
  status?: string;
};

type VendorProductRow = {
  product_id: string;
  sku: string;
  external_sku: string | null;
  name: string;
  cost: number | string | null;
  currency: string | null;
  is_base: boolean | number | string | null;
  uom_name: string | null;
  updated_at: Date | string | null;
};

type VendorProduct = {
  product_id: string;
  sku: string;
  external_sku: string | null;
  name: string;
  cost: number | null;
  currency: string | null;
  uom_name: string | null;
};

type StockRow = {
  product_id: string;
  branch_id: string | null;
  qty: number | string | null;
};

type SaleRow = {
  product_id: string;
  branch_id: string | null;
  sold_qty: number | string | null;
  sold_amount: number | string | null;
  previous_qty: number | string | null;
};

type ListPriceRow = {
  product_id: string;
  price: number | string | null;
};

type BranchRow = {
  id: string;
  code: string;
  status: boolean | number | string | null;
};

type SalesBucket = {
  soldQty: number;
  soldAmount: number;
  previousQty: number;
  byBranch: Map<string, { qty: number; amount: number }>;
};

type SalesWindow = {
  dateFrom: Date;
  dateTo: Date;
  prevFrom: Date;
};

const VENDOR_PRODUCTS_SQL = `
  SELECT DISTINCT pvc.product_id
  FROM product_vendor_costs pvc
  INNER JOIN products p ON p.id = pvc.product_id
  WHERE pvc.vendor_id = ? AND p.tenant_id = ? AND p.is_active = 1
`;

const SOLD_QTY_SQL = `
  CASE
    WHEN d.quantity_base_uom IS NOT NULL AND d.quantity_base_uom > 0 THEN d.quantity_base_uom
    ELSE d.quantity
  END
`;

const LINE_AMOUNT_SQL = `
  d.quantity * GREATEST(d.unit_price - COALESCE(d.discount_unit, 0), 0)
`;

const SALE_BRANCH_SQL = `COALESCE(so.billing_branch_id, w.billing_branch_id, 'none')`;

const STATUS_RANK: Record<ReplenishmentStatus, number> = {
  out: 0,
  reorder: 1,
  fill: 2,
  healthy: 3,
  overstock: 4,
  no_movement: 5,
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  async listVendors(tenantId: string): Promise<{ vendors: StockReplenishmentVendorOption[] }> {
    const rows: VendorRow[] = await this.dataSource.query(
      `
        SELECT
          v.id AS id,
          COALESCE(
            NULLIF(TRIM(v.razon_social), ''),
            NULLIF(TRIM(v.legal_name), ''),
            NULLIF(TRIM(v.company_name), ''),
            v.name
          ) AS legal_name,
          v.rfc AS rfc,
          COUNT(DISTINCT pvc.product_id) AS product_count
        FROM vendors v
        INNER JOIN product_vendor_costs pvc ON pvc.vendor_id = v.id
        INNER JOIN products p ON p.id = pvc.product_id AND p.tenant_id = v.tenant_id AND p.is_active = 1
        WHERE v.tenant_id = ? AND v.status = 'active'
        GROUP BY v.id, v.razon_social, v.legal_name, v.company_name, v.name, v.rfc
        ORDER BY legal_name ASC
      `,
      [tenantId],
    );

    return {
      vendors: rows.map((row) => ({
        id: row.id,
        legal_name: row.legal_name || 'Sin razón social',
        rfc: row.rfc,
        product_count: toNumber(row.product_count),
      })),
    };
  }

  async getStockReplenishment(
    tenantId: string,
    query: QueryStockReplenishmentDto,
  ): Promise<StockReplenishmentReport> {
    const periodDays = query.period_days ?? 30;
    const coverDays = query.cover_days ?? 30;
    const safetyDays = safetyDaysFor(coverDays);
    const vendor = await this.findVendor(tenantId, query.vendor_id);
    const window = resolveWindows(periodDays);
    const exchangeRate = await this.readExchangeRate(tenantId);

    const [costRows, stockRows, saleRows, priceRows, branchRows] = await Promise.all([
      this.loadVendorProducts(tenantId, vendor.id),
      this.loadStock(tenantId, vendor.id),
      this.loadSales(tenantId, vendor.id, window),
      this.loadListPrices(tenantId, vendor.id),
      this.loadBranches(tenantId),
    ]);

    const products = pickVendorProducts(costRows);
    const stockByProduct = groupQty(stockRows);
    const salesByProduct = groupSales(saleRows);
    const listPriceByProduct = new Map<string, number>(
      priceRows.map((row) => [row.product_id, toNumber(row.price)]),
    );
    const branches = buildBranchColumns(branchRows, stockByProduct, salesByProduct);

    const rows: StockReplenishmentRow[] = products.map((product) => {
      const stock = stockByProduct.get(product.product_id) ?? new Map<string, number>();
      const sales = salesByProduct.get(product.product_id);

      const cells: StockReplenishmentBranchCell[] = branches.map((branch) => {
        const onHand = stock.get(branch.id) ?? 0;
        const soldQty = sales?.byBranch.get(branch.id)?.qty ?? 0;
        return {
          branch_id: branch.id,
          on_hand: roundMoney(onHand, 3),
          sold_qty: roundMoney(soldQty, 3),
          difference: stockDifference(onHand, soldQty),
        };
      });

      let onHand = 0;
      for (const qty of stock.values()) {
        onHand += qty;
      }
      const soldQty = sales?.soldQty ?? 0;
      const soldAmount = sales?.soldAmount ?? 0;
      const previousSoldQty = sales?.previousQty ?? 0;

      const price = resolveAveragePrice(
        soldQty,
        soldAmount,
        listPriceByProduct.get(product.product_id) ?? null,
      );
      const unitCost = toCostMxn(product.cost, product.currency, exchangeRate);
      const plan = buildReplenishmentPlan({
        onHand,
        soldQty,
        previousSoldQty,
        periodDays,
        coverDays,
        averagePrice: price.price,
        unitCost,
      });
      const branchSoldExceedsStock = cells.some(
        (cell) => cell.sold_qty > cell.on_hand + 0.0001,
      );

      return {
        product_id: product.product_id,
        sku: product.sku,
        external_sku: product.external_sku,
        name: product.name,
        uom_name: product.uom_name,
        branches: cells,
        on_hand: roundMoney(onHand, 3),
        sold_qty: roundMoney(soldQty, 3),
        previous_sold_qty: roundMoney(previousSoldQty, 3),
        difference: stockDifference(onHand, soldQty),
        average_price: price.price,
        price_source: price.source,
        unit_cost: unitCost,
        cost_currency: (product.currency || 'MXN').toUpperCase(),
        unit_margin: plan.unitMargin,
        margin_percent: plan.marginPercent,
        daily_rate: plan.dailyRate,
        trend: plan.trend,
        trend_factor: plan.trendFactor,
        min_stock: plan.minStock,
        max_stock: plan.maxStock,
        days_of_cover: plan.daysOfCover,
        recommended_qty: plan.recommendedQty,
        status: plan.status,
        transfer_hint: needsTransferHint(
          branchSoldExceedsStock,
          plan.recommendedQty,
          onHand,
          soldQty,
        ),
      };
    });

    rows.sort((a, b) => {
      const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (rank !== 0) {
        return rank;
      }
      return a.name.localeCompare(b.name, 'es');
    });

    return {
      vendor: {
        id: vendor.id,
        legal_name: vendor.legal_name,
        rfc: vendor.rfc,
      },
      period_days: periodDays,
      cover_days: coverDays,
      safety_days: safetyDays,
      period_from: formatIsoDate(window.dateFrom),
      period_to: formatIsoDate(window.dateTo),
      period_label: `Últimos ${periodDays} días · ${formatLongDate(window.dateFrom)} — ${formatLongDate(window.dateTo)}`,
      exchange_rate: exchangeRate,
      formula: STOCK_REPLENISHMENT_FORMULA,
      branches,
      rows,
      summary: {
        product_count: rows.length,
        reorder_count: rows.filter((row) => row.recommended_qty > 0).length,
        out_of_stock_count: rows.filter((row) => row.status === 'out').length,
        no_movement_count: rows.filter((row) => row.status === 'no_movement').length,
      },
    };
  }

  private async findVendor(
    tenantId: string,
    vendorId: string,
  ): Promise<StockReplenishmentVendorOption> {
    const rows: VendorRow[] = await this.dataSource.query(
      `
        SELECT
          v.id AS id,
          COALESCE(
            NULLIF(TRIM(v.razon_social), ''),
            NULLIF(TRIM(v.legal_name), ''),
            NULLIF(TRIM(v.company_name), ''),
            v.name
          ) AS legal_name,
          v.rfc AS rfc,
          v.status AS status
        FROM vendors v
        WHERE v.id = ? AND v.tenant_id = ?
        LIMIT 1
      `,
      [vendorId, tenantId],
    );
    const vendor = rows[0];
    if (!vendor) {
      throw new NotFoundException('Proveedor no encontrado.');
    }
    return {
      id: vendor.id,
      legal_name: vendor.legal_name || 'Sin razón social',
      rfc: vendor.rfc,
      product_count: 0,
    };
  }

  private loadVendorProducts(tenantId: string, vendorId: string): Promise<VendorProductRow[]> {
    return this.dataSource.query(
      `
        SELECT
          p.id AS product_id,
          p.sku AS sku,
          p.external_sku AS external_sku,
          p.name AS name,
          pvc.cost AS cost,
          pvc.currency AS currency,
          pu.is_base AS is_base,
          u.name AS uom_name,
          pvc.updated_at AS updated_at
        FROM products p
        INNER JOIN product_vendor_costs pvc ON pvc.product_id = p.id AND pvc.vendor_id = ?
        LEFT JOIN product_uoms pu ON pu.id = pvc.product_uom_id
        LEFT JOIN uom_catalog u ON u.id = pu.uom_catalog_id
        WHERE p.tenant_id = ? AND p.is_active = 1
      `,
      [vendorId, tenantId],
    );
  }

  private loadStock(tenantId: string, vendorId: string): Promise<StockRow[]> {
    return this.dataSource.query(
      `
        SELECT
          b.product_id AS product_id,
          COALESCE(w.billing_branch_id, 'none') AS branch_id,
          SUM(b.available_quantity) AS qty
        FROM inv_s_batches b
        INNER JOIN warehouses w ON w.id = b.warehouse_id
        WHERE b.tenant_id = ?
          AND b.product_id IN (${VENDOR_PRODUCTS_SQL})
        GROUP BY b.product_id, COALESCE(w.billing_branch_id, 'none')
      `,
      [tenantId, vendorId, tenantId],
    );
  }

  private loadSales(
    tenantId: string,
    vendorId: string,
    window: SalesWindow,
  ): Promise<SaleRow[]> {
    return this.dataSource.query(
      `
        SELECT
          d.product_id AS product_id,
          ${SALE_BRANCH_SQL} AS branch_id,
          SUM(CASE WHEN so.created_at >= ? AND so.created_at <= ? THEN ${SOLD_QTY_SQL} ELSE 0 END) AS sold_qty,
          SUM(CASE WHEN so.created_at >= ? AND so.created_at <= ? THEN ${LINE_AMOUNT_SQL} ELSE 0 END) AS sold_amount,
          SUM(CASE WHEN so.created_at >= ? AND so.created_at < ? THEN ${SOLD_QTY_SQL} ELSE 0 END) AS previous_qty
        FROM inv_s_sales_order_details d
        INNER JOIN inv_s_sales_orders so ON so.id = d.sales_order_id
        LEFT JOIN warehouses w ON w.id = so.warehouse_id
        WHERE so.tenant_id = ?
          AND so.general_status = 'Surtida'
          AND so.created_at >= ?
          AND so.created_at <= ?
          AND d.product_id IN (${VENDOR_PRODUCTS_SQL})
        GROUP BY d.product_id, ${SALE_BRANCH_SQL}
      `,
      [
        window.dateFrom,
        window.dateTo,
        window.dateFrom,
        window.dateTo,
        window.prevFrom,
        window.dateFrom,
        tenantId,
        window.prevFrom,
        window.dateTo,
        vendorId,
        tenantId,
      ],
    );
  }

  private loadListPrices(tenantId: string, vendorId: string): Promise<ListPriceRow[]> {
    return this.dataSource.query(
      `
        SELECT pp.product_id AS product_id, AVG(pp.price) AS price
        FROM product_prices pp
        INNER JOIN product_uoms pu ON pu.id = pp.product_uom_id AND pu.is_base = 1
        WHERE pp.product_id IN (${VENDOR_PRODUCTS_SQL})
        GROUP BY pp.product_id
      `,
      [vendorId, tenantId],
    );
  }

  private loadBranches(tenantId: string): Promise<BranchRow[]> {
    return this.dataSource.query(
      `
        SELECT bb.id AS id, bb.code AS code, bb.status AS status
        FROM billing_branches bb
        INNER JOIN fiscal_configurations fc ON fc.id = bb.fiscal_configuration_id
        WHERE fc.tenant_id = ?
        ORDER BY bb.code ASC
      `,
      [tenantId],
    );
  }

  private async readExchangeRate(tenantId: string): Promise<number | null> {
    try {
      const row = await this.exchangeRateService.getDailyRate(tenantId);
      const value = Number(row?.exchange_rate);
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }
}

function resolveWindows(periodDays: number): SalesWindow {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo);
  dateFrom.setHours(0, 0, 0, 0);
  dateFrom.setDate(dateFrom.getDate() - (periodDays - 1));
  const prevFrom = new Date(dateFrom);
  prevFrom.setDate(prevFrom.getDate() - periodDays);
  return { dateFrom, dateTo, prevFrom };
}

function pickVendorProducts(rows: VendorProductRow[]): VendorProduct[] {
  const byProduct = new Map<string, VendorProductRow[]>();
  for (const row of rows) {
    const list = byProduct.get(row.product_id) ?? [];
    list.push(row);
    byProduct.set(row.product_id, list);
  }

  const products: VendorProduct[] = [];
  for (const [productId, options] of byProduct) {
    const base = options.filter((row) => isTruthyFlag(row.is_base));
    const pool = base.length > 0 ? base : options;
    pool.sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? '')));
    const chosen = pool[0];
    const sample = options[0];
    products.push({
      product_id: productId,
      sku: sample?.sku ?? chosen.sku,
      external_sku: sample?.external_sku ?? null,
      name: sample?.name ?? chosen.name,
      cost: chosen.cost == null ? null : toNumber(chosen.cost),
      currency: chosen.currency,
      uom_name: chosen.uom_name,
    });
  }
  return products;
}

function groupQty(rows: StockRow[]): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const branches = map.get(row.product_id) ?? new Map<string, number>();
    branches.set(row.branch_id || 'none', toNumber(row.qty));
    map.set(row.product_id, branches);
  }
  return map;
}

function groupSales(rows: SaleRow[]): Map<string, SalesBucket> {
  const map = new Map<string, SalesBucket>();
  for (const row of rows) {
    const bucket = map.get(row.product_id) ?? {
      soldQty: 0,
      soldAmount: 0,
      previousQty: 0,
      byBranch: new Map<string, { qty: number; amount: number }>(),
    };
    const qty = toNumber(row.sold_qty);
    const amount = toNumber(row.sold_amount);
    bucket.soldQty += qty;
    bucket.soldAmount += amount;
    bucket.previousQty += toNumber(row.previous_qty);
    bucket.byBranch.set(row.branch_id || 'none', { qty, amount });
    map.set(row.product_id, bucket);
  }
  return map;
}

function buildBranchColumns(
  branchRows: BranchRow[],
  stockByProduct: Map<string, Map<string, number>>,
  salesByProduct: Map<string, SalesBucket>,
): StockReplenishmentBranchColumn[] {
  const used = new Set<string>();
  for (const branches of stockByProduct.values()) {
    for (const branchId of branches.keys()) {
      if (toNumber(branches.get(branchId)) !== 0) {
        used.add(branchId);
      }
    }
  }
  for (const sales of salesByProduct.values()) {
    for (const [branchId, cell] of sales.byBranch) {
      if (cell.qty !== 0 || cell.amount !== 0) {
        used.add(branchId);
      }
    }
  }

  const known = new Map(branchRows.map((row) => [row.id, row]));
  const columns: StockReplenishmentBranchColumn[] = branchRows
    .filter((row) => isTruthyFlag(row.status))
    .map((row) => ({ id: row.id, name: row.code }));

  let extraBranch = 1;
  for (const branchId of used) {
    if (branchId === 'none' || columns.some((column) => column.id === branchId)) {
      continue;
    }
    const knownBranch = known.get(branchId);
    columns.push({
      id: branchId,
      name: knownBranch?.code || `Sucursal ${extraBranch++}`,
    });
  }

  if (used.has('none')) {
    columns.push({ id: 'none', name: 'Sin sucursal' });
  }
  if (columns.length === 0) {
    columns.push({ id: 'none', name: 'General' });
  }
  return columns;
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
