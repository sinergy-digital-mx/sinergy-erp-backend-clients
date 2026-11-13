export interface ExchangeRateDaySource {
  rate_date: string | Date;
  exchange_rate: number | string;
}

export interface CarriedExchangeRateDay {
  rate_date: string;
  exchange_rate: number;
}

export function buildMissingDailyRates(
  rows: ExchangeRateDaySource[],
  untilDate: string,
): CarriedExchangeRateDay[] {
  const byDate = new Map<string, number>();
  for (const row of rows) {
    const date = asIsoDate(row.rate_date);
    if (!date || byDate.has(date)) {
      continue;
    }
    const rate = Number(row.exchange_rate);
    if (Number.isFinite(rate) && rate > 0) {
      byDate.set(date, rate);
    }
  }

  const knownDates = [...byDate.keys()].sort();
  if (knownDates.length === 0) {
    return [];
  }

  const end = untilDate.slice(0, 10);
  let cursor = addDays(knownDates[0], 1);
  let rate = byDate.get(knownDates[0]) as number;
  const missing: CarriedExchangeRateDay[] = [];
  while (cursor <= end) {
    const known = byDate.get(cursor);
    if (known == null) {
      missing.push({ rate_date: cursor, exchange_rate: rate });
    } else {
      rate = known;
    }
    cursor = addDays(cursor, 1);
  }
  return missing;
}

function asIsoDate(value: string | Date): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}
