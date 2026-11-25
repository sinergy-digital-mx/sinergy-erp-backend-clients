"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPosTenderPaymentLines = buildPosTenderPaymentLines;
exports.assignPosTenderCashierNotes = assignPosTenderCashierNotes;
const pos_sale_payment_method_enum_1 = require("../../../entities/pos/pos-sale-payment-method.enum");
const cash_drawer_1 = require("./cash-drawer");
const pos_cash_payment_util_1 = require("./pos-cash-payment.util");
const pos_card_payments_util_1 = require("./pos-card-payments.util");
const pos_transfer_payments_util_1 = require("./pos-transfer-payments.util");
function readAmount(value) {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount) ? (0, cash_drawer_1.roundPosMoney)(Math.max(0, amount)) : 0;
}
function readText(value) {
    if (value == null)
        return null;
    const text = String(value).trim();
    return text ? text.slice(0, 120) : null;
}
function formatAmount(value) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
function formatRate(value) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    });
}
function cardKindNote(kind) {
    if (kind === 'debit')
        return 'Débito';
    if (kind === 'credit')
        return 'Crédito';
    return null;
}
function readTransfers(input) {
    const stored = (0, pos_transfer_payments_util_1.parseStoredTransferPayments)(input.transferPayments);
    if (stored.length > 0)
        return stored;
    return (0, pos_transfer_payments_util_1.normalizeTransferPayments)({
        amount_transfer_mxn: readAmount(input.amountTransferMxn),
        transfer_reference: input.transferReference,
    });
}
function readCards(input) {
    const stored = (0, pos_card_payments_util_1.parseStoredCardPayments)(input.cardPayments);
    if (stored.length > 0)
        return stored;
    return (0, pos_card_payments_util_1.normalizeCardPayments)({
        amount_card_mxn: readAmount(input.amountCardMxn),
        card_reference: input.cardReference,
        card_kind: input.cardKind,
    });
}
function buildPosTenderPaymentLines(input, targetMxn) {
    const rate = Number(input.usdExchangeRate ?? 0);
    const cashMxn = readAmount(input.amountCashMxn);
    const cashUsd = readAmount(input.amountCashUsd);
    const checkMxn = readAmount(input.amountCheckMxn);
    const checkUsd = readAmount(input.amountCheckUsd);
    const transfers = readTransfers(input);
    const cards = readCards(input);
    const lines = [];
    if (cashMxn > 0) {
        lines.push({
            method: pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH,
            amount: cashMxn,
            reference: null,
            notes: null,
        });
    }
    if (cashUsd > 0) {
        if (!(rate > 0))
            return null;
        lines.push({
            method: pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH,
            amount: (0, cash_drawer_1.roundPosMoney)(cashUsd * rate),
            reference: null,
            notes: `${formatAmount(cashUsd)} USD · TC ${formatRate(rate)}`,
        });
    }
    for (const transfer of transfers) {
        const amount = (0, cash_drawer_1.roundPosMoney)(transfer.amount_mxn);
        if (amount <= 0)
            continue;
        lines.push({
            method: pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER,
            amount,
            reference: readText(transfer.reference),
            notes: null,
        });
    }
    for (const card of cards) {
        const amount = (0, cash_drawer_1.roundPosMoney)(card.amount_mxn);
        if (amount <= 0)
            continue;
        lines.push({
            method: pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD,
            amount,
            reference: card.reference,
            notes: cardKindNote(card.card_kind),
        });
    }
    if (checkMxn > 0) {
        lines.push({
            method: pos_sale_payment_method_enum_1.PosSalePaymentMethod.CHECK,
            amount: checkMxn,
            reference: readText(input.checkReference),
            notes: null,
        });
    }
    if (checkUsd > 0) {
        if (!(rate > 0))
            return null;
        lines.push({
            method: pos_sale_payment_method_enum_1.PosSalePaymentMethod.CHECK,
            amount: (0, cash_drawer_1.roundPosMoney)(checkUsd * rate),
            reference: readText(input.checkReference),
            notes: `${formatAmount(checkUsd)} USD · TC ${formatRate(rate)}`,
        });
    }
    if (lines.length === 0)
        return null;
    const target = (0, cash_drawer_1.roundPosMoney)(targetMxn);
    const sum = (0, cash_drawer_1.roundPosMoney)(lines.reduce((total, line) => total + line.amount, 0));
    const diff = (0, cash_drawer_1.roundPosMoney)(target - sum);
    const usdLegs = (cashUsd > 0 ? 1 : 0) + (checkUsd > 0 ? 1 : 0);
    const tolerance = usdLegs > 0 ? (0, pos_cash_payment_util_1.usdCentToleranceMxn)(rate) * usdLegs + 0.001 : 0.02;
    if (Math.abs(diff) > tolerance)
        return null;
    if (diff !== 0) {
        const last = lines[lines.length - 1];
        last.amount = (0, cash_drawer_1.roundPosMoney)(last.amount + diff);
        if (last.amount <= 0)
            return null;
    }
    return lines;
}
function assignPosTenderCashierNotes(lines, cashierNotes) {
    const note = cashierNotes?.trim();
    if (!note || lines.length === 0)
        return lines;
    const [first, ...rest] = lines;
    return [
        {
            ...first,
            notes: first.notes ? `${first.notes} · ${note}` : note,
        },
        ...rest,
    ];
}
//# sourceMappingURL=pos-collection-payment-lines.util.js.map