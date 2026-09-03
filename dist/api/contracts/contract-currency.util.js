"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTRACT_CURRENCIES = exports.DEFAULT_CONTRACT_CURRENCY = void 0;
exports.isContractCurrency = isContractCurrency;
exports.resolveStoredContractCurrency = resolveStoredContractCurrency;
exports.normalizeContractCurrency = normalizeContractCurrency;
const common_1 = require("@nestjs/common");
exports.DEFAULT_CONTRACT_CURRENCY = 'USD';
exports.CONTRACT_CURRENCIES = ['USD', 'MXN'];
function isContractCurrency(value) {
    return value === 'USD' || value === 'MXN';
}
function resolveStoredContractCurrency(value) {
    const normalized = String(value ?? '')
        .trim()
        .toUpperCase();
    return isContractCurrency(normalized)
        ? normalized
        : exports.DEFAULT_CONTRACT_CURRENCY;
}
function normalizeContractCurrency(value, fallback = exports.DEFAULT_CONTRACT_CURRENCY) {
    const normalized = String(value ?? fallback)
        .trim()
        .toUpperCase();
    if (!isContractCurrency(normalized)) {
        throw new common_1.BadRequestException('La moneda debe ser USD o MXN');
    }
    return normalized;
}
//# sourceMappingURL=contract-currency.util.js.map