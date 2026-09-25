"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WALK_IN_RFC_PATTERN = void 0;
exports.normalizeWalkInName = normalizeWalkInName;
exports.normalizeWalkInRfc = normalizeWalkInRfc;
exports.isValidWalkInRfc = isValidWalkInRfc;
exports.WALK_IN_RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
function normalizeWalkInName(value) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed)
        return null;
    return trimmed.slice(0, 120);
}
function normalizeWalkInRfc(value) {
    if (typeof value !== 'string')
        return null;
    const rfc = value.trim().toUpperCase().replace(/[\s-]/g, '');
    return rfc || null;
}
function isValidWalkInRfc(value) {
    const rfc = normalizeWalkInRfc(value);
    return rfc == null || exports.WALK_IN_RFC_PATTERN.test(rfc);
}
//# sourceMappingURL=walk-in-ticket.util.js.map