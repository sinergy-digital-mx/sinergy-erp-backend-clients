export const PURCHASE_TREND_TIMEZONE = 'America/Mexico_City';
export const PURCHASE_TREND_MONTHS = 12;

const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

export interface PurchaseTrendMonthPoint {
  month: string;
  label: string;
  total: number;
  orders_count: number;
}

export interface PurchaseTrendSeries {
  from: string;
  to: string;
  total: number;
  orders_count: number;
  months: PurchaseTrendMonthPoint[];
}

export interface PurchaseTrendRow {
  created_at: Date | string;
  total: number | string | null;
}

export function rollingPurchaseMonths(
  now: Date = new Date(),
  count: number = PURCHASE_TREND_MONTHS,
  timeZone: string = PURCHASE_TREND_TIMEZONE,
): Array<{ month: string; label: string }> {
  const { year, month } = zonedYearMonth(now, timeZone);
  const points: Array<{ month: string; label: string }> = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(Date.UTC(year, month - 1 - offset, 1));
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth() + 1;
    points.push({
      month: monthKey(y, m),
      label: `${MONTH_LABELS[m - 1]} ${String(y).slice(-2)}`,
    });
  }
  return points;
}

export function rollingWindowStart(
  now: Date = new Date(),
  count: number = PURCHASE_TREND_MONTHS,
  timeZone: string = PURCHASE_TREND_TIMEZONE,
): Date {
  const first = rollingPurchaseMonths(now, count, timeZone)[0];
  const [year, month] = first.month.split('-').map(Number);
  return zonedWallTimeToUtc(year, month, 1, timeZone);
}

export function formatUtcDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function buildPurchaseTrend(
  rows: PurchaseTrendRow[],
  now: Date = new Date(),
  count: number = PURCHASE_TREND_MONTHS,
  timeZone: string = PURCHASE_TREND_TIMEZONE,
): PurchaseTrendSeries {
  const window = rollingPurchaseMonths(now, count, timeZone);
  const buckets = new Map<string, { total: number; orders_count: number }>(
    window.map((point) => [point.month, { total: 0, orders_count: 0 }]),
  );

  for (const row of rows) {
    const created = parseStoredDateTime(row.created_at);
    if (!created) continue;
    const key = monthKeyFromInstant(created, timeZone);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const amount = Number(row.total ?? 0);
    bucket.total += Number.isFinite(amount) ? amount : 0;
    bucket.orders_count += 1;
  }

  const months: PurchaseTrendMonthPoint[] = window.map((point) => {
    const bucket = buckets.get(point.month)!;
    return {
      month: point.month,
      label: point.label,
      total: roundMoney(bucket.total),
      orders_count: bucket.orders_count,
    };
  });

  return {
    from: months[0]?.month ?? '',
    to: months[months.length - 1]?.month ?? '',
    total: roundMoney(months.reduce((sum, point) => sum + point.total, 0)),
    orders_count: months.reduce((sum, point) => sum + point.orders_count, 0),
    months,
  };
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function monthKeyFromInstant(date: Date, timeZone: string): string {
  const { year, month } = zonedYearMonth(date, timeZone);
  return monthKey(year, month);
}

function zonedYearMonth(
  date: Date,
  timeZone: string,
): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  };
}

export function parseStoredDateTime(
  value: Date | string | null | undefined,
): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw)) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const iso = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const parsed = new Date(`${iso}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const corrected = new Date(
    guess.getTime() - timeZoneOffsetMs(guess, timeZone),
  );
  return new Date(guess.getTime() - timeZoneOffsetMs(corrected, timeZone));
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  let hour = pick('hour');
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(
    pick('year'),
    pick('month') - 1,
    pick('day'),
    hour,
    pick('minute'),
    pick('second'),
  );
  return asUtc - date.getTime();
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}
