"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaymentMethodTotal = buildPaymentMethodTotal;
exports.emptyPaymentMethodTotals = emptyPaymentMethodTotals;
exports.buildPaymentMethodTotals = buildPaymentMethodTotals;
function buildPaymentMethodTotal(orders, amount) {
    const safeOrders = Math.max(0, Number(orders) || 0);
    const safeAmount = Number(Number(amount || 0).toFixed(2));
    const ticket = safeOrders > 0 ? Number((safeAmount / safeOrders).toFixed(2)) : 0;
    return { orders: safeOrders, amount: safeAmount, ticket };
}
function emptyPaymentMethodTotals() {
    return {
        cash: buildPaymentMethodTotal(0, 0),
        transfer: buildPaymentMethodTotal(0, 0),
        card: buildPaymentMethodTotal(0, 0),
        check: buildPaymentMethodTotal(0, 0),
    };
}
function buildPaymentMethodTotals(input) {
    return {
        cash: buildPaymentMethodTotal(input.cash_orders, input.cash_amount),
        transfer: buildPaymentMethodTotal(input.transfer_orders, input.transfer_amount),
        card: buildPaymentMethodTotal(input.card_orders, input.card_amount),
        check: buildPaymentMethodTotal(input.check_orders, input.check_amount),
    };
}
//# sourceMappingURL=pos-collection-payment-totals.util.js.map