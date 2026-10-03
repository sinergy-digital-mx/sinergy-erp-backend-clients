"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PURCHASE_TREND_MONTHS = exports.PURCHASE_TREND_TIMEZONE = void 0;
exports.rollingPurchaseMonths = rollingPurchaseMonths;
exports.rollingWindowStart = rollingWindowStart;
exports.formatUtcDateTime = formatUtcDateTime;
exports.buildPurchaseTrend = buildPurchaseTrend;
exports.parseStoredDateTime = parseStoredDateTime;
exports.PURCHASE_TREND_TIMEZONE = 'America/Mexico_City';
exports.PURCHASE_TREND_MONTHS = 12;
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
function rollingPurchaseMonths(now = new Date(), count = exports.PURCHASE_TREND_MONTHS, timeZone = exports.PURCHASE_TREND_TIMEZONE) {
    const { year, month } = zonedYearMonth(now, timeZone);
    const points = [];
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
function rollingWindowStart(now = new Date(), count = exports.PURCHASE_TREND_MONTHS, timeZone = exports.PURCHASE_TREND_TIMEZONE) {
    const first = rollingPurchaseMonths(now, count, timeZone)[0];
    const [year, month] = first.month.split('-').map(Number);
    return zonedWallTimeToUtc(year, month, 1, timeZone);
}
function formatUtcDateTime(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}
function buildPurchaseTrend(rows, now = new Date(), count = exports.PURCHASE_TREND_MONTHS, timeZone = exports.PURCHASE_TREND_TIMEZONE) {
    const window = rollingPurchaseMonths(now, count, timeZone);
    const buckets = new Map(window.map((point) => [point.month, { total: 0, orders_count: 0 }]));
    for (const row of rows) {
        const created = parseStoredDateTime(row.created_at);
        if (!created)
            continue;
        const key = monthKeyFromInstant(created, timeZone);
        const bucket = buckets.get(key);
        if (!bucket)
            continue;
        const amount = Number(row.total ?? 0);
        bucket.total += Number.isFinite(amount) ? amount : 0;
        bucket.orders_count += 1;
    }
    const months = window.map((point) => {
        const bucket = buckets.get(point.month);
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
function monthKey(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
}
function monthKeyFromInstant(date, timeZone) {
    const { year, month } = zonedYearMonth(date, timeZone);
    return monthKey(year, month);
}
function zonedYearMonth(date, timeZone) {
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
function parseStoredDateTime(value) {
    if (value == null || value === '')
        return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    const raw = String(value).trim();
    if (!raw)
        return null;
    if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw)) {
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const iso = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const parsed = new Date(`${iso}Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function zonedWallTimeToUtc(year, month, day, timeZone) {
    const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const corrected = new Date(guess.getTime() - timeZoneOffsetMs(guess, timeZone));
    return new Date(guess.getTime() - timeZoneOffsetMs(corrected, timeZone));
}
function timeZoneOffsetMs(date, timeZone) {
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
    const pick = (type) => Number(parts.find((part) => part.type === type)?.value);
    let hour = pick('hour');
    if (hour === 24)
        hour = 0;
    const asUtc = Date.UTC(pick('year'), pick('month') - 1, pick('day'), hour, pick('minute'), pick('second'));
    return asUtc - date.getTime();
}
function roundMoney(value) {
    return Number(value.toFixed(2));
}
//# sourceMappingURL=customer-purchase-trend.util.js.map