export interface StockLotQty {
  quantity: number;
  uomName: string;
}

export interface StockByUom {
  uom_name: string;
  quantity: string;
}

export function roundQty(value: number): number {
  return parseFloat(value.toFixed(3));
}

export function parseQty(value: unknown): number {
  const parsed = parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? roundQty(parsed) : 0;
}

export function formatQty(value: number): string {
  const fixed = roundQty(value).toFixed(3);
  return fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

export function summarizeStock(lots: StockLotQty[]): {
  totalQuantity: number;
  lotCount: number;
  byUom: StockByUom[];
} {
  const totals = new Map<string, number>();
  let lotCount = 0;

  for (const lot of lots) {
    const qty = roundQty(lot.quantity);
    if (qty <= 0) continue;
    lotCount += 1;
    const key = lot.uomName.trim() || '—';
    totals.set(key, roundQty((totals.get(key) ?? 0) + qty));
  }

  const byUom = [...totals.entries()]
    .sort((left, right) => left[0].localeCompare(right[0], 'es'))
    .map(([uom_name, quantity]) => ({
      uom_name,
      quantity: formatQty(quantity),
    }));

  const totalQuantity = roundQty(
    [...totals.values()].reduce((sum, quantity) => sum + quantity, 0),
  );

  return { totalQuantity, lotCount, byUom };
}
