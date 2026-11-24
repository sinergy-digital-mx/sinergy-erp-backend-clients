"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptySalesOrderListStats = emptySalesOrderListStats;
exports.buildSalesOrderListStats = buildSalesOrderListStats;
function emptyBucket() {
    return { count: 0, amount: 0 };
}
function emptyCurrencyStats() {
    return {
        count: 0,
        amount: 0,
        created: emptyBucket(),
        paid: emptyBucket(),
        pending: emptyBucket(),
    };
}
function emptySalesOrderListStats() {
    return {
        count: 0,
        by_currency: {
            MXN: emptyCurrencyStats(),
            USD: emptyCurrencyStats(),
        },
    };
}
function roundMoney(value) {
    return Math.round(value * 100) / 100;
}
function buildSalesOrderListStats(rows) {
    const by_currency = {
        MXN: emptyCurrencyStats(),
        USD: emptyCurrencyStats(),
    };
    for (const row of rows) {
        const currency = row.currency === 'USD' ? 'USD' : 'MXN';
        const bucket = by_currency[currency];
        const count = Number(row.cnt) || 0;
        const amount = roundMoney(Number(row.amount) || 0);
        bucket.count += count;
        bucket.amount = roundMoney(bucket.amount + amount);
        if (row.general_status === 'Creada') {
            bucket.created.count += count;
            bucket.created.amount = roundMoney(bucket.created.amount + amount);
        }
        if (row.payment_status === 'Pagado') {
            bucket.paid.count += count;
            bucket.paid.amount = roundMoney(bucket.paid.amount + amount);
        }
        else if (row.payment_status === 'Pendiente') {
            bucket.pending.count += count;
            bucket.pending.amount = roundMoney(bucket.pending.amount + amount);
        }
    }
    return {
        count: by_currency.MXN.count + by_currency.USD.count,
        by_currency,
    };
}
//# sourceMappingURL=sales-order-list-stats.util.js.map