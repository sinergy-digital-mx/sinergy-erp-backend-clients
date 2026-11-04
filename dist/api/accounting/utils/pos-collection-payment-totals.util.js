"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaymentMethodTotal = buildPaymentMethodTotal;
exports.emptyPaymentMethodTotals = emptyPaymentMethodTotals;
exports.paymentMethodAmountSql = paymentMethodAmountSql;
exports.paymentMethodMatchSql = paymentMethodMatchSql;
exports.isCreditChargeCollection = isCreditChargeCollection;
exports.creditPaymentAmountMxn = creditPaymentAmountMxn;
exports.collectionTenderAmounts = collectionTenderAmounts;
exports.summarizePaidCreditRows = summarizePaidCreditRows;
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
function isCreditChargeCollection(input) {
    const credit = Number(input.amountCreditMxn || 0);
    return Boolean(input.isCredit) || input.paymentMethod === 'credit' || credit > 0.009;
}
function creditPaymentAmountMxn(input) {
    const amount = Number(input.amount || 0);
    if (!Number.isFinite(amount))
        return 0;
    if (String(input.currency || 'MXN').toUpperCase() !== 'USD') {
        return Number(amount.toFixed(2));
    }
    const rate = Number(input.exchangeRate || 0);
    if (!Number.isFinite(rate) || rate <= 0)
        return Number(amount.toFixed(2));
    return Number((amount * rate).toFixed(2));
}
function collectionTenderAmounts(input) {
    const rate = Number(input.usd_exchange_rate || 0);
    const usd = Number.isFinite(rate) && rate > 0 ? rate : 0;
    return {
        cash: Number((Number(input.amount_cash_mxn || 0) + Number(input.amount_cash_usd || 0) * usd).toFixed(2)),
        transfer: Number(Number(input.amount_transfer_mxn || 0).toFixed(2)),
        card: Number(Number(input.amount_card_mxn || 0).toFixed(2)),
        check: Number((Number(input.amount_check_mxn || 0) + Number(input.amount_check_usd || 0) * usd).toFixed(2)),
    };
}
function summarizePaidCreditRows(rows) {
    const buckets = {
        cash: { orders: 0, amount: 0 },
        transfer: { orders: 0, amount: 0 },
        card: { orders: 0, amount: 0 },
        check: { orders: 0, amount: 0 },
        credit: { orders: 0, amount: 0 },
    };
    let amount = 0;
    let walkIn = 0;
    let invoiced = 0;
    let shipping = 0;
    let shippingAmount = 0;
    for (const row of rows) {
        amount += Number(row.total || 0);
        if (row.isWalkIn && !row.invoiced)
            walkIn += 1;
        if (row.invoiced)
            invoiced += 1;
        if (row.forShipping) {
            shipping += 1;
            shippingAmount += Number(row.total || 0);
        }
        Object.keys(row.amounts).forEach((key) => {
            const part = Number(row.amounts[key] || 0);
            if (part > 0.009) {
                buckets[key].orders += 1;
                buckets[key].amount += part;
            }
        });
        if (row.isCreditPayment) {
            buckets.credit.orders += 1;
            buckets.credit.amount += Number(row.total || 0);
        }
    }
    return {
        orders_collected: rows.length,
        amount_collected: Number(amount.toFixed(2)),
        walk_in_count: walkIn,
        invoiced_count: invoiced,
        shipping_count: shipping,
        shipping_amount: Number(shippingAmount.toFixed(2)),
        by_payment_method: {
            cash: buildPaymentMethodTotal(buckets.cash.orders, buckets.cash.amount),
            transfer: buildPaymentMethodTotal(buckets.transfer.orders, buckets.transfer.amount),
            card: buildPaymentMethodTotal(buckets.card.orders, buckets.card.amount),
            check: buildPaymentMethodTotal(buckets.check.orders, buckets.check.amount),
            credit: buildPaymentMethodTotal(buckets.credit.orders, buckets.credit.amount),
        },
    };
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