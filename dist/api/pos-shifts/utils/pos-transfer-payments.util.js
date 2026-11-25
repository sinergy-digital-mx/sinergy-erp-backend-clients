"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferReferenceKey = transferReferenceKey;
exports.cleanTransferReference = cleanTransferReference;
exports.normalizeTransferPayments = normalizeTransferPayments;
exports.sumTransferPayments = sumTransferPayments;
exports.firstTransferReference = firstTransferReference;
exports.duplicateTransferReference = duplicateTransferReference;
exports.parseStoredTransferPayments = parseStoredTransferPayments;
exports.transferPaymentsForResponse = transferPaymentsForResponse;
const MAX_TRANSFER_PAYMENTS = 8;
function roundMoney(value) {
    return Math.round(value * 100) / 100;
}
function toAmount(value) {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount) ? roundMoney(Math.max(0, amount)) : 0;
}
function transferReferenceKey(value) {
    return value.trim().replace(/\s+/g, ' ').toUpperCase();
}
function cleanTransferReference(value) {
    if (value == null)
        return '';
    return String(value).trim().replace(/\s+/g, ' ').slice(0, 120);
}
function normalizeTransferPayments(input) {
    const raw = input.transfer_payments;
    if (Array.isArray(raw) && raw.length > 0) {
        return raw
            .map((item) => ({
            amount_mxn: toAmount(item?.amount_mxn),
            reference: cleanTransferReference(item?.reference),
        }))
            .filter((item) => item.amount_mxn > 0)
            .slice(0, MAX_TRANSFER_PAYMENTS);
    }
    const fallback = toAmount(input.amount_transfer_mxn);
    if (fallback > 0) {
        return [{
                amount_mxn: fallback,
                reference: cleanTransferReference(input.transfer_reference),
            }];
    }
    return [];
}
function sumTransferPayments(payments) {
    return roundMoney(payments.reduce((sum, item) => sum + item.amount_mxn, 0));
}
function firstTransferReference(payments) {
    return payments.find((item) => item.reference)?.reference ?? null;
}
function duplicateTransferReference(payments) {
    const seen = new Set();
    for (const payment of payments) {
        const key = transferReferenceKey(payment.reference);
        if (!key)
            continue;
        if (seen.has(key))
            return payment.reference;
        seen.add(key);
    }
    return null;
}
function parseStoredTransferPayments(value) {
    if (!value)
        return [];
    try {
        const raw = typeof value === 'string' ? JSON.parse(value) : value;
        return normalizeTransferPayments({ transfer_payments: Array.isArray(raw) ? raw : [] });
    }
    catch {
        return [];
    }
}
function transferPaymentsForResponse(stored, amountTransferMxn, transferReference) {
    const fromJson = parseStoredTransferPayments(stored);
    if (fromJson.length > 0) {
        return fromJson;
    }
    return normalizeTransferPayments({
        amount_transfer_mxn: amountTransferMxn,
        transfer_reference: transferReference,
    });
}
//# sourceMappingURL=pos-transfer-payments.util.js.map