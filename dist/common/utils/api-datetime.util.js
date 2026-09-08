"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDbDateTimeAsUtc = parseDbDateTimeAsUtc;
function parseDbDateTimeAsUtc(value) {
    if (value == null || value === '') {
        return null;
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    const raw = String(value).trim();
    if (!raw) {
        return null;
    }
    if (/[zZ]$/.test(raw) || /[+-]\d{2}:?\d{2}$/.test(raw)) {
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const iso = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const parsed = new Date(`${iso}Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
//# sourceMappingURL=api-datetime.util.js.map