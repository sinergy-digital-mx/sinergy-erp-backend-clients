"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCardPayments = normalizeCardPayments;
exports.sumCardPayments = sumCardPayments;
exports.firstCardReference = firstCardReference;
exports.mixedPaymentPartCount = mixedPaymentPartCount;
exports.cardPaymentsMatchDeclaredTotal = cardPaymentsMatchDeclaredTotal;
exports.parseStoredCardPayments = parseStoredCardPayments;
exports.cardPaymentsForResponse = cardPaymentsForResponse;
const MONEY_EPS = 0.01;
const MAX_CARD_PAYMENTS = 8;
function roundMoney(value) {
    return Math.round(value * 100) / 100;
}
function toAmount(value) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? roundMoney(n) : 0;
}
function toReference(value) {
    if (value == null)
        return null;
    const text = String(value).trim();
    return text ? text.slice(0, 120) : null;
}
function normalizeCardPayments(input) {
    const raw = input.card_payments;
    if (Array.isArray(raw) && raw.length > 0) {
        return raw
            .map((item) => ({
            amount_mxn: toAmount(item?.amount_mxn),
            reference: toReference(item?.reference),
        }))
            .filter((item) => item.amount_mxn > 0)
            .slice(0, MAX_CARD_PAYMENTS);
    }
    const fallback = toAmount(input.amount_card_mxn);
    if (fallback > 0) {
        return [{ amount_mxn: fallback, reference: toReference(input.card_reference) }];
    }
    return [];
}
function sumCardPayments(payments) {
    return roundMoney(payments.reduce((sum, item) => sum + item.amount_mxn, 0));
}
function firstCardReference(payments) {
    return payments.find((item) => item.reference)?.reference ?? null;
}
function mixedPaymentPartCount(input) {
    const types = [
        input.cashTotal > 0,
        input.amountTransferMxn > 0,
        input.amountCheckMxn > 0,
    ].filter(Boolean).length;
    return types + input.cardPayments.filter((item) => item.amount_mxn > 0).length;
}
function cardPaymentsMatchDeclaredTotal(payments, declaredAmount) {
    if (declaredAmount == null || !Number.isFinite(declaredAmount) || payments.length === 0) {
        return true;
    }
    return Math.abs(sumCardPayments(payments) - roundMoney(declaredAmount)) <= MONEY_EPS;
}
function parseStoredCardPayments(value) {
    if (!value)
        return [];
    try {
        const raw = typeof value === 'string' ? JSON.parse(value) : value;
        return normalizeCardPayments({ card_payments: Array.isArray(raw) ? raw : [] });
    }
    catch {
        return [];
    }
}
function cardPaymentsForResponse(stored, amountCardMxn, cardReference) {
    const fromJson = parseStoredCardPayments(stored);
    if (fromJson.length > 0) {
        return fromJson;
    }
    return normalizeCardPayments({
        amount_card_mxn: amountCardMxn,
        card_reference: cardReference,
    });
}
//# sourceMappingURL=pos-card-payments.util.js.map