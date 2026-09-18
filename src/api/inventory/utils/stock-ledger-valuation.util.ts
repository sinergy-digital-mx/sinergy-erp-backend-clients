/**
 * Resolución de costo unitario MXN para snapshot en kardex.
 * Preferencia: costo real MXN → vendor USD×T.C. aduana → vendor MXN.
 */
export type StockLedgerCostInput = {
  real_unit_cost_mxn?: number | string | null;
  unit_cost?: number | string | null;
  /** Factor UOM original→base (original_qty / converted_qty). Default 1. */
  uom_scale?: number | null;
  payment_currency?: string | null;
  customs_exchange_rate?: number | string | null;
};

function toNum(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function roundMoney(value: number): number {
  return parseFloat(value.toFixed(4));
}

export function resolveUnitCostMxn(input: StockLedgerCostInput): number | null {
  const scale =
    input.uom_scale != null &&
    Number.isFinite(input.uom_scale) &&
    input.uom_scale > 0
      ? input.uom_scale
      : 1;

  const realMxn = toNum(input.real_unit_cost_mxn);
  if (realMxn != null) {
    return roundMoney(realMxn * scale);
  }

  const unit = toNum(input.unit_cost);
  if (unit == null) {
    return null;
  }

  const scaled = unit * scale;
  const currency = (input.payment_currency ?? 'MXN').toUpperCase();
  if (currency === 'USD') {
    const rate = toNum(input.customs_exchange_rate);
    if (rate == null || rate <= 0) {
      return null;
    }
    return roundMoney(scaled * rate);
  }

  return roundMoney(scaled);
}

export function formatStockMoney(value: unknown): string {
  const parsed = parseFloat(String(value ?? 0));
  return (Number.isFinite(parsed) ? parsed : 0).toFixed(2);
}

export function roundStockMoney(value: number): number {
  return roundMoney(value);
}
