"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOptionalBoolean = parseOptionalBoolean;
exports.parseOptionalNumber = parseOptionalNumber;
exports.extractCreditPatchFromBody = extractCreditPatchFromBody;
exports.buildCreditSnapshot = buildCreditSnapshot;
function parseOptionalBoolean(value) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    if (value === true || value === 1 || value === '1' || value === 'true') {
        return true;
    }
    if (value === false || value === 0 || value === '0' || value === 'false') {
        return false;
    }
    return undefined;
}
function parseOptionalNumber(value) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}
function extractCreditPatchFromBody(body) {
    const nested = body.credit && typeof body.credit === 'object'
        ? body.credit
        : {};
    const enabled = parseOptionalBoolean(body.credit_enabled ?? nested.credit_enabled ?? nested.enabled);
    const days = parseOptionalNumber(body.credit_days ?? nested.credit_days ?? nested.days);
    const amount = parseOptionalNumber(body.credit_amount ?? nested.credit_amount ?? nested.amount);
    if (enabled === undefined && days === undefined && amount === undefined) {
        return null;
    }
    return {
        credit_enabled: enabled ?? Number(amount ?? 0) > 0,
        credit_days: days ?? null,
        credit_amount: amount ?? null,
    };
}
function buildCreditSnapshot(params) {
    const creditAmount = Math.max(0, Number(params.creditAmount ?? 0));
    const creditUsed = Math.max(0, Number(params.creditUsed ?? 0));
    const creditAvailable = Math.max(0, Number((creditAmount - creditUsed).toFixed(2)));
    const creditUsagePercent = creditAmount > 0 ? Number(((creditUsed / creditAmount) * 100).toFixed(2)) : 0;
    return {
        credit_enabled: Boolean(params.creditEnabled),
        credit_days: params.creditDays ?? null,
        credit_amount: Number(creditAmount.toFixed(2)),
        credit_used: Number(creditUsed.toFixed(2)),
        credit_available: creditAvailable,
        credit_usage_percent: creditUsagePercent,
    };
}
//# sourceMappingURL=customer-credit.util.js.map