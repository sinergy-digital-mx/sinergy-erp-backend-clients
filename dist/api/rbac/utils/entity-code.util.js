"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEntityCode = normalizeEntityCode;
exports.entityCodesMatch = entityCodesMatch;
function normalizeEntityCode(code) {
    let value = (code ?? '').trim().toLowerCase().replace(/[_-]/g, '');
    if (!value) {
        return '';
    }
    if (value.endsWith('ies') && value.length > 4) {
        return `${value.slice(0, -3)}y`;
    }
    if (value.endsWith('s') && value.length > 3 && !value.endsWith('ss')) {
        return value.slice(0, -1);
    }
    return value;
}
function entityCodesMatch(left, right) {
    if (!left || !right) {
        return false;
    }
    return normalizeEntityCode(left) === normalizeEntityCode(right);
}
//# sourceMappingURL=entity-code.util.js.map