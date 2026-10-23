"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundPaymentMoney = roundPaymentMoney;
exports.isOpenPaymentStatus = isOpenPaymentStatus;
exports.settlePaymentAmounts = settlePaymentAmounts;
exports.startOfLocalDay = startOfLocalDay;
exports.resolvePaymentOverdueFlag = resolvePaymentOverdueFlag;
exports.applyPaymentSettlement = applyPaymentSettlement;
exports.paymentSettlementChanged = paymentSettlementChanged;
exports.isActiveOverduePayment = isActiveOverduePayment;
exports.countActiveOverduePayments = countActiveOverduePayments;
exports.sumActiveOverdueAmount = sumActiveOverdueAmount;
exports.isDownPaymentTargetMet = isDownPaymentTargetMet;
const contract_financial_util_1 = require("../contract-financial.util");
function roundPaymentMoney(value) {
    return Math.round(Number(value || 0) * 100) / 100;
}
function isOpenPaymentStatus(status) {
    return status === 'pendiente' || status === 'parcial';
}
function settlePaymentAmounts(amount, amountPaid) {
    const total = Math.max(0, roundPaymentMoney(amount));
    const paid = Math.max(0, roundPaymentMoney(amountPaid));
    const cappedPaid = Math.min(paid, total);
    const pending = roundPaymentMoney(Math.max(0, total - cappedPaid));
    if (pending <= 0 && cappedPaid > 0) {
        return {
            status: 'pagado',
            amount: total,
            amount_paid: total,
            amount_pending: 0,
        };
    }
    if (cappedPaid > 0) {
        return {
            status: 'parcial',
            amount: total,
            amount_paid: cappedPaid,
            amount_pending: pending,
        };
    }
    return {
        status: 'pendiente',
        amount: total,
        amount_paid: 0,
        amount_pending: total,
    };
}
function startOfLocalDay(value) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        const [year, month, day] = value.slice(0, 10).split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    const date = value instanceof Date ? value : new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function resolvePaymentOverdueFlag(status, dueDate, today = new Date()) {
    if (!isOpenPaymentStatus(status) || !dueDate) {
        return false;
    }
    return startOfLocalDay(dueDate).getTime() < startOfLocalDay(today).getTime();
}
function applyPaymentSettlement(payment, today = new Date()) {
    if (payment.status === 'cancelado') {
        payment.is_overdue = false;
        return payment;
    }
    const settled = settlePaymentAmounts(payment.amount, payment.amount_paid);
    payment.amount = settled.amount;
    payment.amount_paid = settled.amount_paid;
    payment.amount_pending = settled.amount_pending;
    payment.status = settled.status;
    payment.is_overdue = resolvePaymentOverdueFlag(settled.status, payment.due_date, today);
    return payment;
}
function paymentSettlementChanged(before, after) {
    return (before.status !== after.status ||
        roundPaymentMoney(before.amount_paid) !==
            roundPaymentMoney(after.amount_paid) ||
        roundPaymentMoney(before.amount_pending) !==
            roundPaymentMoney(after.amount_pending) ||
        Boolean(before.is_overdue) !== Boolean(after.is_overdue));
}
function isActiveOverduePayment(payment) {
    return Boolean(payment.is_overdue) && isOpenPaymentStatus(payment.status);
}
function countActiveOverduePayments(payments) {
    return payments.filter(isActiveOverduePayment).length;
}
function sumActiveOverdueAmount(payments) {
    return roundPaymentMoney(payments.reduce((sum, payment) => {
        if (!isActiveOverduePayment(payment)) {
            return sum;
        }
        return sum + Number(payment.amount_pending ?? payment.amount ?? 0);
    }, 0));
}
function isDownPaymentTargetMet(target, applied) {
    const safeTarget = Number(target);
    if (!Number.isFinite(safeTarget) || safeTarget <= 0) {
        return false;
    }
    return (0, contract_financial_util_1.computeDownPaymentRemaining)(safeTarget, applied) <= 0;
}
//# sourceMappingURL=contract-payment-settlement.util.js.map