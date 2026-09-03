"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundPoMoney = roundPoMoney;
exports.roundPoUnitCost = roundPoUnitCost;
exports.computeRequestedLineBreakdown = computeRequestedLineBreakdown;
exports.computeReceivedLineBreakdown = computeReceivedLineBreakdown;
const unit_amount_util_1 = require("../../../common/utils/unit-amount.util");
function roundPoMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}
function roundPoUnitCost(value) {
    return (0, unit_amount_util_1.roundUnitAmount)(value);
}
function computeRequestedLineBreakdown(quantity, unitTotal, ivaPercentage, iepsPercentage) {
    const qty = Number(quantity) || 0;
    const unit = roundPoUnitCost(unitTotal);
    const ivaPct = Number(ivaPercentage) || 0;
    const iepsPct = Number(iepsPercentage) || 0;
    const line_subtotal = roundPoMoney(qty * unit);
    const line_iva = roundPoMoney((line_subtotal * ivaPct) / 100);
    const line_ieps = roundPoMoney((line_subtotal * iepsPct) / 100);
    const line_total = roundPoMoney(line_subtotal + line_iva + line_ieps);
    const iva_unit = qty > 0 ? roundPoMoney(line_iva / qty) : 0;
    const ieps_unit = qty > 0 ? roundPoMoney(line_ieps / qty) : 0;
    return { line_subtotal, line_iva, line_ieps, line_total, iva_unit, ieps_unit };
}
function computeReceivedLineBreakdown(quantity, unitTotal, ivaPercentage, iepsPercentage) {
    const requested = computeRequestedLineBreakdown(quantity, unitTotal, ivaPercentage, iepsPercentage);
    return {
        received_line_subtotal: requested.line_subtotal,
        received_line_iva: requested.line_iva,
        received_line_ieps: requested.line_ieps,
        received_line_total: requested.line_total,
    };
}
//# sourceMappingURL=purchase-order-line-breakdown.util.js.map