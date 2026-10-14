"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePayableCurrency = normalizePayableCurrency;
exports.parseCreditLimit = parseCreditLimit;
exports.aggregatePayableVendors = aggregatePayableVendors;
exports.filterPayableVendors = filterPayableVendors;
exports.sortPayableVendors = sortPayableVendors;
exports.summarizePayableVendors = summarizePayableVendors;
function normalizePayableCurrency(value) {
    return String(value ?? '').trim().toUpperCase() === 'USD' ? 'USD' : 'MXN';
}
function parseCreditLimit(value) {
    if (value == null || value === '')
        return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
function aggregatePayableVendors(orders) {
    const vendorMap = new Map();
    for (const order of orders) {
        if (order.amount_pending <= 0)
            continue;
        const draft = vendorMap.get(order.vendor_id) ?? {
            vendor_id: order.vendor_id,
            vendor_name: order.vendor_name,
            razon_social: order.razon_social,
            company_name: order.company_name,
            credit_limit: parseCreditLimit(order.credit_limit),
            mxn: emptyBucket(),
            usd: emptyBucket(),
        };
        const bucket = normalizePayableCurrency(order.payment_currency) === 'USD' ? draft.usd : draft.mxn;
        bucket.pending_order_count += 1;
        bucket.amount_pending += order.amount_pending;
        bucket.amount_paid += order.amount_paid;
        bucket.total_committed += order.amount_pending + order.amount_paid;
        vendorMap.set(order.vendor_id, draft);
    }
    return Array.from(vendorMap.values()).map((draft) => toVendorRow(draft));
}
function filterPayableVendors(rows, view) {
    if (view === 'mxn')
        return rows.filter((row) => row.amount_pending_mxn > 0);
    if (view === 'usd')
        return rows.filter((row) => row.amount_pending_usd > 0);
    return rows.filter((row) => row.amount_pending_mxn > 0 || row.amount_pending_usd > 0);
}
function sortPayableVendors(rows, view) {
    return [...rows].sort((a, b) => {
        if (view === 'usd')
            return b.amount_pending_usd - a.amount_pending_usd;
        const byMxn = b.amount_pending_mxn - a.amount_pending_mxn;
        if (view === 'mxn' || byMxn !== 0)
            return byMxn;
        return b.amount_pending_usd - a.amount_pending_usd;
    });
}
function summarizePayableVendors(rows, view) {
    const totalMxn = roundMoney(rows.reduce((sum, row) => sum + row.amount_pending_mxn, 0));
    const totalUsd = roundMoney(rows.reduce((sum, row) => sum + row.amount_pending_usd, 0));
    return {
        currency: view,
        total_vendors: rows.length,
        total_amount_pending_mxn: totalMxn,
        total_amount_pending_usd: totalUsd,
        total_pending_orders_mxn: rows.reduce((sum, row) => sum + row.pending_order_count_mxn, 0),
        total_pending_orders_usd: rows.reduce((sum, row) => sum + row.pending_order_count_usd, 0),
        total_amount_pending: view === 'usd' ? totalUsd : totalMxn,
    };
}
function toVendorRow(draft) {
    const mxnPending = roundMoney(draft.mxn.amount_pending);
    const mxnPaid = roundMoney(draft.mxn.amount_paid);
    const mxnCommitted = roundMoney(draft.mxn.total_committed);
    const usdPending = roundMoney(draft.usd.amount_pending);
    const usdPaid = roundMoney(draft.usd.amount_paid);
    const usdCommitted = roundMoney(draft.usd.total_committed);
    const progressMxn = payableProgress(mxnPending, mxnCommitted, draft.credit_limit, true);
    const progressUsd = payableProgress(usdPending, usdCommitted, draft.credit_limit, false);
    return {
        vendor_id: draft.vendor_id,
        vendor_name: draft.vendor_name,
        razon_social: draft.razon_social,
        company_name: draft.company_name,
        credit_limit: draft.credit_limit,
        pending_order_count_mxn: draft.mxn.pending_order_count,
        amount_pending_mxn: mxnPending,
        amount_paid_mxn: mxnPaid,
        total_committed_mxn: mxnCommitted,
        progress_percentage_mxn: progressMxn,
        pending_order_count_usd: draft.usd.pending_order_count,
        amount_pending_usd: usdPending,
        amount_paid_usd: usdPaid,
        total_committed_usd: usdCommitted,
        progress_percentage_usd: progressUsd,
        pending_order_count: draft.mxn.pending_order_count + draft.usd.pending_order_count,
        amount_pending: mxnPending,
        amount_paid: mxnPaid,
        total_committed: mxnCommitted,
        progress_percentage: progressMxn,
    };
}
function payableProgress(pending, committed, creditLimit, applyCreditLimit) {
    if (applyCreditLimit && creditLimit && creditLimit > 0) {
        return Number(((pending / creditLimit) * 100).toFixed(2));
    }
    if (committed > 0) {
        return Number(((pending / committed) * 100).toFixed(2));
    }
    return 0;
}
function emptyBucket() {
    return {
        pending_order_count: 0,
        amount_pending: 0,
        amount_paid: 0,
        total_committed: 0,
    };
}
function roundMoney(value) {
    return Number(value.toFixed(2));
}
//# sourceMappingURL=accounts-payable-currency.util.js.map