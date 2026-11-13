export const STOCK_REPLENISHMENT_FORMULA =
  'La venta diaria es la venta del periodo dividida entre sus días. Si el periodo anterior vendió distinto, esa venta diaria se ajusta entre 75% y 150%. El mínimo es la venta diaria ajustada por los días de seguridad (25% de los días a cubrir). El máximo es la venta diaria ajustada por los días a cubrir. Se recomienda comprar máximo menos existencia cuando hubo ventas y la existencia está debajo del máximo. Si no hubo ventas, no se recomienda comprar.';

export type SalesTrend = 'up' | 'down' | 'flat' | 'none';

export type ReplenishmentStatus =
  | 'no_movement'
  | 'out'
  | 'reorder'
  | 'fill'
  | 'healthy'
  | 'overstock';

export type AveragePriceSource = 'sales' | 'list' | 'none';

export interface ReplenishmentInput {
  onHand: number;
  soldQty: number;
  previousSoldQty: number;
  periodDays: number;
  coverDays: number;
  averagePrice: number | null;
  unitCost: number | null;
}

export interface ReplenishmentPlan {
  dailyRate: number;
  trend: SalesTrend;
  trendFactor: number;
  adjustedDaily: number;
  safetyDays: number;
  minStock: number;
  maxStock: number;
  daysOfCover: number | null;
  recommendedQty: number;
  unitMargin: number | null;
  marginPercent: number | null;
  status: ReplenishmentStatus;
}

export function roundQtyUp(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  const scaled = value * 1000;
  const nearest = Math.round(scaled);
  if (Math.abs(scaled - nearest) < 1e-6) {
    return nearest / 1000;
  }
  return Math.ceil(scaled - 1e-9) / 1000;
}

export function roundMoney(value: number, scale = 4): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** scale;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function safetyDaysFor(coverDays: number): number {
  const cover = Math.max(1, Math.round(coverDays));
  const quarter = Math.round(cover * 0.25);
  return Math.min(cover, Math.max(1, quarter));
}

export function stockDifference(onHand: number, soldQty: number): number {
  const stock = Number.isFinite(onHand) ? onHand : 0;
  const sold = Number.isFinite(soldQty) ? soldQty : 0;
  return roundMoney(stock - sold, 3);
}

export function trendOf(
  currentSold: number,
  previousSold: number,
): { trend: SalesTrend; factor: number } {
  const current = Math.max(0, currentSold);
  const previous = Math.max(0, previousSold);
  if (current <= 0 && previous <= 0) {
    return { trend: 'none', factor: 1 };
  }
  if (previous <= 0) {
    return { trend: current > 0 ? 'up' : 'none', factor: 1 };
  }
  const ratio = current / previous;
  const factor = Math.min(1.5, Math.max(0.75, ratio));
  let trend: SalesTrend = 'flat';
  if (ratio >= 1.15) {
    trend = 'up';
  } else if (ratio <= 0.85) {
    trend = 'down';
  }
  return { trend, factor };
}

export function toCostMxn(
  cost: number | null,
  currency: string | null | undefined,
  exchangeRate: number | null,
): number | null {
  if (cost == null || !Number.isFinite(cost) || cost < 0) {
    return null;
  }
  const code = (currency || 'MXN').trim().toUpperCase();
  if (code === 'USD') {
    if (exchangeRate == null || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      return null;
    }
    return roundMoney(cost * exchangeRate, 4);
  }
  return roundMoney(cost, 4);
}

export function resolveAveragePrice(
  soldQty: number,
  soldAmount: number,
  listPrice: number | null,
): { price: number | null; source: AveragePriceSource } {
  if (soldQty > 0 && soldAmount > 0) {
    return { price: roundMoney(soldAmount / soldQty, 4), source: 'sales' };
  }
  if (listPrice != null && Number.isFinite(listPrice) && listPrice > 0) {
    return { price: roundMoney(listPrice, 4), source: 'list' };
  }
  return { price: null, source: 'none' };
}

export function buildReplenishmentPlan(input: ReplenishmentInput): ReplenishmentPlan {
  const periodDays = Math.max(1, input.periodDays);
  const coverDays = Math.max(1, input.coverDays);
  const safetyDays = safetyDaysFor(coverDays);
  const onHand = Number.isFinite(input.onHand) ? input.onHand : 0;
  const soldQty = Math.max(0, Number.isFinite(input.soldQty) ? input.soldQty : 0);
  const previousSoldQty = Math.max(
    0,
    Number.isFinite(input.previousSoldQty) ? input.previousSoldQty : 0,
  );

  const { trend, factor } = trendOf(soldQty, previousSoldQty);
  const dailyRate = soldQty / periodDays;
  const adjustedDaily = dailyRate * factor;
  const minStock = soldQty > 0 ? roundQtyUp(adjustedDaily * safetyDays) : 0;
  const maxStock = soldQty > 0 ? roundQtyUp(adjustedDaily * coverDays) : 0;
  const daysOfCover =
    adjustedDaily > 0 ? roundMoney(Math.max(0, onHand) / adjustedDaily, 1) : null;

  const averagePrice =
    input.averagePrice != null && input.averagePrice > 0 ? input.averagePrice : null;
  const unitCost = input.unitCost != null && input.unitCost >= 0 ? input.unitCost : null;
  const unitMargin =
    averagePrice != null && unitCost != null ? roundMoney(averagePrice - unitCost, 4) : null;
  const marginPercent =
    averagePrice != null && unitMargin != null
      ? roundMoney((unitMargin / averagePrice) * 100, 2)
      : null;

  let status: ReplenishmentStatus = 'no_movement';
  let recommendedQty = 0;

  if (soldQty <= 0) {
    status = 'no_movement';
    recommendedQty = 0;
  } else if (onHand <= 0) {
    status = 'out';
    recommendedQty = roundQtyUp(maxStock - onHand);
  } else if (onHand < minStock) {
    status = 'reorder';
    recommendedQty = roundQtyUp(maxStock - onHand);
  } else if (onHand < maxStock) {
    status = 'fill';
    recommendedQty = roundQtyUp(maxStock - onHand);
  } else if (maxStock > 0 && onHand > maxStock * 1.25) {
    status = 'overstock';
    recommendedQty = 0;
  } else {
    status = 'healthy';
    recommendedQty = 0;
  }

  return {
    dailyRate: roundMoney(dailyRate, 4),
    trend,
    trendFactor: roundMoney(factor, 4),
    adjustedDaily: roundMoney(adjustedDaily, 4),
    safetyDays,
    minStock,
    maxStock,
    daysOfCover,
    recommendedQty,
    unitMargin,
    marginPercent,
    status,
  };
}

export function needsTransferHint(
  branchSoldExceedsStock: boolean,
  recommendedQty: number,
  onHand: number,
  soldQty: number,
): boolean {
  return branchSoldExceedsStock && recommendedQty === 0 && onHand > 0 && soldQty > 0;
}
