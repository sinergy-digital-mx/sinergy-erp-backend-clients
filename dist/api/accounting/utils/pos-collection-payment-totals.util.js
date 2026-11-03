"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaymentMethodTotal = buildPaymentMethodTotal;
exports.emptyPaymentMethodTotals = emptyPaymentMethodTotals;
exports.paymentMethodAmountSql = paymentMethodAmountSql;
exports.paymentMethodMatchSql = paymentMethodMatchSql;
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
        credit: buildPaymentMethodTotal(0, 0),
    };
}
function paymentMethodAmountSql(method) {
    switch (method) {
        case 'cash':
            return 'COALESCE(collection.amount_cash_mxn, 0) + COALESCE(collection.amount_cash_usd, 0) * COALESCE(collection.usd_exchange_rate, 0)';
        case 'transfer':
            return 'COALESCE(collection.amount_transfer_mxn, 0)';
        case 'card':
            return 'COALESCE(collection.amount_card_mxn, 0)';
        case 'check':
            return 'COALESCE(collection.amount_check_mxn, 0) + COALESCE(collection.amount_check_usd, 0) * COALESCE(collection.usd_exchange_rate, 0)';
        case 'credit':
            return 'COALESCE(collection.amount_credit_mxn, 0)';
    }
}
function paymentMethodMatchSql(method) {
    if (method === 'check') {
        return '(COALESCE(collection.amount_check_mxn, 0) > 0 OR COALESCE(collection.amount_check_usd, 0) > 0)';
    }
    return `(${paymentMethodAmountSql(method)}) > 0`;
}
function buildPaymentMethodTotals(input) {
    return {
        cash: buildPaymentMethodTotal(input.cash_orders, input.cash_amount),
        transfer: buildPaymentMethodTotal(input.transfer_orders, input.transfer_amount),
        card: buildPaymentMethodTotal(input.card_orders, input.card_amount),
        check: buildPaymentMethodTotal(input.check_orders, input.check_amount),
        credit: buildPaymentMethodTotal(input.credit_orders, input.credit_amount),
    };
}
//# sourceMappingURL=pos-collection-payment-totals.util.js.map