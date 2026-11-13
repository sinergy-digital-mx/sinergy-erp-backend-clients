import { roundUnitAmount } from '../../../common/utils/unit-amount.util';

export function meanCost(costs: Array<number | null | undefined>): number | null {
  const values = costs.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );
  if (!values.length) return null;
  return roundUnitAmount(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function priceFromMargin(
  averageCost: number,
  marginPercent: number,
  uomFactor: number,
  baseFactor: number,
): number {
  const base = baseFactor > 0 ? baseFactor : 1;
  const factor = (uomFactor > 0 ? uomFactor : 1) / base;
  return roundUnitAmount(averageCost * factor * (1 + marginPercent / 100));
}

export function priceListLabel(listNumber: number | null, name: string): string {
  if (listNumber != null && Number.isFinite(listNumber)) {
    return `L${listNumber}`;
  }
  const trimmed = name.trim();
  if (trimmed.length <= 8) return trimmed;
  return `${trimmed.slice(0, 7)}…`;
}

export function isManualPrice(price: number | null, calculated: number | null): boolean {
  if (price == null || calculated == null) return false;
  return Math.abs(price - calculated) > 0.0001;
}
