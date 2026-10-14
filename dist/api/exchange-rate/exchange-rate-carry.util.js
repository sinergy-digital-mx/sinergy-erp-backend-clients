"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMissingDailyRates = buildMissingDailyRates;
function buildMissingDailyRates(rows, untilDate) {
    const byDate = new Map();
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
    let rate = byDate.get(knownDates[0]);
    const missing = [];
    while (cursor <= end) {
        const known = byDate.get(cursor);
        if (known == null) {
            missing.push({ rate_date: cursor, exchange_rate: rate });
        }
        else {
            rate = known;
        }
        cursor = addDays(cursor, 1);
    }
    return missing;
}
function asIsoDate(value) {
    if (typeof value === 'string') {
        return value.slice(0, 10);
    }
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function addDays(isoDate, days) {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return date.toISOString().slice(0, 10);
}
//# sourceMappingURL=exchange-rate-carry.util.js.map