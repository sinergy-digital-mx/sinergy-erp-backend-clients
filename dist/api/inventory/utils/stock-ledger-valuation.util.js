"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUnitCostMxn = resolveUnitCostMxn;
exports.formatStockMoney = formatStockMoney;
exports.roundStockMoney = roundStockMoney;
function toNum(value) {
    if (value == null || value === '')
        return null;
    const n = parseFloat(String(value));
    return Number.isFinite(n) ? n : null;
}
function roundMoney(value) {
    return parseFloat(value.toFixed(4));
}
function resolveUnitCostMxn(input) {
    const scale = input.uom_scale != null &&
        Number.isFinite(input.uom_scale) &&
        input.uom_scale > 0
        ? input.uom_scale
        : 1;
    const realMxn = toNum(input.real_unit_cost_mxn);
    if (realMxn != null) {
        return roundMoney(realMxn * scale);
    }
    const unit = toNum(input.unit_cost);
    if (unit == null) {
        return null;
    }
    const scaled = unit * scale;
    const currency = (input.payment_currency ?? 'MXN').toUpperCase();
    if (currency === 'USD') {
        const rate = toNum(input.customs_exchange_rate);
        if (rate == null || rate <= 0) {
            return null;
        }
        return roundMoney(scaled * rate);
    }
    return roundMoney(scaled);
}
function formatStockMoney(value) {
    const parsed = parseFloat(String(value ?? 0));
    return (Number.isFinite(parsed) ? parsed : 0).toFixed(2);
}
function roundStockMoney(value) {
    return roundMoney(value);
}
//# sourceMappingURL=stock-ledger-valuation.util.js.map