"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDateOnlyString = toDateOnlyString;
exports.addCalendarDays = addCalendarDays;
exports.normalizeExpirationDays = normalizeExpirationDays;
exports.resolveQuotationExpiresAt = resolveQuotationExpiresAt;
exports.isQuotationExpired = isQuotationExpired;
function toDateOnlyString(value) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }
    const date = new Date(value);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
function addCalendarDays(value, days) {
    const [year, month, day] = toDateOnlyString(value).split('-').map(Number);
    const utc = new Date(Date.UTC(year, month - 1, day));
    utc.setUTCDate(utc.getUTCDate() + days);
    return utc.toISOString().slice(0, 10);
}
function normalizeExpirationDays(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const days = Number(value);
    if (!Number.isFinite(days) || days <= 0) {
        return null;
    }
    return Math.trunc(days);
}
function resolveQuotationExpiresAt(createdAt, expirationDays) {
    const days = normalizeExpirationDays(expirationDays);
    if (!createdAt || days === null) {
        return null;
    }
    return addCalendarDays(createdAt, days);
}
function isQuotationExpired(createdAt, expirationDays, today = new Date()) {
    const expiresAt = resolveQuotationExpiresAt(createdAt, expirationDays);
    if (!expiresAt) {
        return false;
    }
    return toDateOnlyString(today) >= expiresAt;
}
//# sourceMappingURL=quotation-expiration.util.js.map