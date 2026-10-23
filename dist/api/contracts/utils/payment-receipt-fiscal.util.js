"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveReceiptFiscalId = resolveReceiptFiscalId;
function resolveReceiptFiscalId(input) {
    return (normalizeId(input.contractFiscalId) ||
        normalizeId(input.templateFiscalId) ||
        normalizeId(input.systemLogoFiscalId) ||
        normalizeId(input.firstFiscalId));
}
function normalizeId(value) {
    const trimmed = value?.trim();
    return trimmed || null;
}
//# sourceMappingURL=payment-receipt-fiscal.util.js.map