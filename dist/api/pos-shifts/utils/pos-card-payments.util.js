"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCardKind = toCardKind;
exports.normalizeCardPayments = normalizeCardPayments;
exports.sharedCardKind = sharedCardKind;
exports.cardTicketLabel = cardTicketLabel;
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
function toCardKind(value) {
    const text = String(value ?? '').trim().toLowerCase();
    return text === 'debit' || text === 'credit' ? text : null;
}
function normalizeCardPayments(input) {
    const fallbackKind = toCardKind(input.card_kind);
    const raw = input.card_payments;
    if (Array.isArray(raw) && raw.length > 0) {
        return raw
            .map((item) => ({
            amount_mxn: toAmount(item?.amount_mxn),
            reference: toReference(item?.reference),
            card_kind: toCardKind(item?.card_kind) ?? fallbackKind,
        }))
            .filter((item) => item.amount_mxn > 0)
            .slice(0, MAX_CARD_PAYMENTS);
    }
    const fallback = toAmount(input.amount_card_mxn);
    if (fallback > 0) {
        return [{
                amount_mxn: fallback,
                reference: toReference(input.card_reference),
                card_kind: fallbackKind,
            }];
    }
    return [];
}
function sharedCardKind(payments) {
    if (!payments.length)
        return null;
    const first = payments[0].card_kind;
    if (!first)
        return null;
    return payments.every((item) => item.card_kind === first) ? first : null;
}
function cardTicketLabel(kind, index, multiple) {
    const base = multiple ? `Tarjeta ${index + 1}` : 'Tarjeta';
    if (kind === 'debit')
        return `${base} debito`;
    if (kind === 'credit')
        return `${base} credito`;
    return base;
}
function sumCardPayments(payments) {
    return roundMoney(payments.reduce((sum, item) => sum + item.amount_mxn, 0));
}
function firstCardReference(payments) {
    return payments.find((item) => item.reference)?.reference ?? null;
}
function mixedPaymentPartCount(input) {
    const transferParts = (input.transferPaymentCount ?? 0) > 0
        ? input.transferPaymentCount ?? 0
        : input.amountTransferMxn > 0
            ? 1
            : 0;
    const types = [
        input.cashTotal > 0,
        input.amountCheckMxn > 0 || (input.amountCheckUsd ?? 0) > 0,
    ].filter(Boolean).length;
    return types + transferParts + input.cardPayments.filter((item) => item.amount_mxn > 0).length;
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
function cardPaymentsForResponse(stored, amountCardMxn, cardReference, cardKind) {
    const fromJson = parseStoredCardPayments(stored);
    if (fromJson.length > 0) {
        return fromJson;
    }
    return normalizeCardPayments({
        amount_card_mxn: amountCardMxn,
        card_reference: cardReference,
        card_kind: cardKind,
    });
}
//# sourceMappingURL=pos-card-payments.util.js.map