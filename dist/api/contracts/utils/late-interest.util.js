"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LATE_INTEREST_GRACE_DAYS = exports.DEFAULT_LATE_INTEREST_RATE_PERCENT = void 0;
exports.normalizeInterestRatePercent = normalizeInterestRatePercent;
exports.normalizeGraceDays = normalizeGraceDays;
exports.resolveLateInterestConfig = resolveLateInterestConfig;
exports.countDaysPastDue = countDaysPastDue;
exports.isLateInterestEligible = isLateInterestEligible;
exports.computeSuggestedLateInterest = computeSuggestedLateInterest;
exports.resolveLateInterest = resolveLateInterest;
const contract_payment_settlement_util_1 = require("./contract-payment-settlement.util");
exports.DEFAULT_LATE_INTEREST_RATE_PERCENT = 10;
exports.DEFAULT_LATE_INTEREST_GRACE_DAYS = 6;
function normalizeInterestRatePercent(raw) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0)
        return 0;
    const percent = value <= 1 ? value * 100 : value;
    return Math.round(percent * 100) / 100;
}
function normalizeGraceDays(raw) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0)
        return 0;
    return Math.floor(value);
}
function resolveLateInterestConfig(contract) {
    return {
        ratePercent: normalizeInterestRatePercent(contract.interest_rate),
        graceDays: normalizeGraceDays(contract.payment_due_day),
    };
}
function countDaysPastDue(dueDate, today = new Date()) {
    if (!dueDate)
        return 0;
    const due = (0, contract_payment_settlement_util_1.startOfLocalDay)(dueDate);
    const current = (0, contract_payment_settlement_util_1.startOfLocalDay)(today);
    const diffMs = current.getTime() - due.getTime();
    if (diffMs <= 0)
        return 0;
    return Math.floor(diffMs / 86400000);
}
function isLateInterestEligible(status, daysPastDue, config) {
    if (!(0, contract_payment_settlement_util_1.isOpenPaymentStatus)(status))
        return false;
    if (config.ratePercent <= 0)
        return false;
    return daysPastDue > 0 && daysPastDue >= config.graceDays;
}
function computeSuggestedLateInterest(amount, config, eligible) {
    if (!eligible || config.ratePercent <= 0)
        return 0;
    return (0, contract_payment_settlement_util_1.roundPaymentMoney)((Number(amount) || 0) * (config.ratePercent / 100));
}
function resolveLateInterest(payment, config, today = new Date()) {
    const daysPastDue = countDaysPastDue(payment.due_date, today);
    const eligible = isLateInterestEligible(payment.status, daysPastDue, config);
    const suggested = computeSuggestedLateInterest(Number(payment.amount) || 0, config, eligible);
    const waived = !!payment.late_interest_waived;
    const rawOverride = payment.late_interest_amount;
    const hasOverride = rawOverride !== null && rawOverride !== undefined && rawOverride !== '';
    const override = hasOverride ? (0, contract_payment_settlement_util_1.roundPaymentMoney)(Number(rawOverride) || 0) : null;
    const manual = !waived && override != null;
    return {
        late_interest_amount: waived ? 0 : (manual ? override : suggested),
        late_interest_suggested: suggested,
        late_interest_waived: waived,
        late_interest_eligible: eligible,
        late_interest_manual: manual,
        late_interest_days_overdue: daysPastDue,
        late_interest_rate_percent: config.ratePercent,
        late_interest_grace_days: config.graceDays,
    };
}
//# sourceMappingURL=late-interest.util.js.map