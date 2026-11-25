const SUMMARY_PRICE_KEYS = [
  'margin',
  'suggested_unit_price',
  'suggested_iva_percentage',
  'suggested_ieps_percentage',
  'pricing_options',
] as const;

const STATS_MONEY_KEYS = [
  'total_cost',
  'total_sale_value',
  'average_unit_cost',
  'average_unit_price',
  'gross_margin',
  'gross_margin_percentage',
] as const;

const STOCK_FLOW_MONEY_KEYS = [
  'opening_cost_mxn',
  'opening_sale_mxn',
  'purchases_cost_mxn',
  'sales_cost_mxn',
  'sales_revenue_mxn',
  'transfer_in_cost_mxn',
  'transfer_out_cost_mxn',
  'adjustments_cost_mxn',
  'closing_cost_mxn',
  'closing_sale_mxn',
  'unit_cost_mxn',
  'unit_sale_price_mxn',
  'cost_amount_mxn',
  'sale_amount_mxn',
  'cost_balance_after_mxn',
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function blankKeys(row: Record<string, unknown>, keys: readonly string[]): void {
  for (const key of keys) {
    if (key in row) {
      row[key] = null;
    }
  }
}

export function omitInventorySummaryMargin<T>(response: T): T {
  const body = asRecord(response);
  const rows = body?.['data'];
  if (!Array.isArray(rows)) {
    return response;
  }
  for (const row of rows) {
    const item = asRecord(row);
    if (!item) continue;
    for (const key of SUMMARY_PRICE_KEYS) {
      delete item[key];
    }
    const batches = item['batches'];
    if (!Array.isArray(batches)) continue;
    for (const batch of batches) {
      const lot = asRecord(batch);
      if (lot) delete lot['margin'];
    }
  }
  return response;
}

export function omitInventoryBatchMargin<T>(batch: T): T {
  const row = asRecord(batch);
  if (!row) return batch;
  delete row['margin_detail'];
  if ('unit_cost' in row) row['unit_cost'] = null;
  if ('suggested_unit_price' in row) row['suggested_unit_price'] = null;
  if ('suggested_price_currency' in row) row['suggested_price_currency'] = null;
  return batch;
}

export function omitInventoryStatsMargin<T>(stats: T): T {
  const row = asRecord(stats);
  if (!row) return stats;
  blankKeys(row, STATS_MONEY_KEYS);
  if ('batches_without_cost' in row) row['batches_without_cost'] = 0;
  if ('quantity_without_cost' in row) row['quantity_without_cost'] = '0.000';
  if ('products_without_price' in row) row['products_without_price'] = 0;
  if ('quantity_without_price' in row) row['quantity_without_price'] = '0.000';
  return stats;
}

export function omitBranchReportMargin<T>(report: T): T {
  const row = asRecord(report);
  if (!row) return report;
  blankKeys(row, ['average_unit_cost', 'total_cost']);
  if ('cost_complete' in row) row['cost_complete'] = true;
  const lines = row['lines'];
  if (!Array.isArray(lines)) return report;
  for (const line of lines) {
    const item = asRecord(line);
    if (!item) continue;
    blankKeys(item, ['average_unit_cost', 'total_cost']);
    if ('cost_complete' in item) item['cost_complete'] = true;
  }
  return report;
}

export function omitStockFlowMargin<T>(report: T): T {
  const row = asRecord(report);
  if (!row) return report;
  for (const key of ['summary', 'totalized', 'ledger'] as const) {
    const rows = row[key];
    if (!Array.isArray(rows)) continue;
    for (const entry of rows) {
      const item = asRecord(entry);
      if (item) blankKeys(item, STOCK_FLOW_MONEY_KEYS);
    }
  }
  return report;
}

export function isInventoryMoneyColumn(key: string): boolean {
  return /cost|sale|revenue|price/i.test(key);
}
