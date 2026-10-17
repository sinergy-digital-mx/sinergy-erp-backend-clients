"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseOrderHasPersistedRealCost = purchaseOrderHasPersistedRealCost;
exports.catalogPurchaseOrderTotal = catalogPurchaseOrderTotal;
exports.resolvePurchaseOrderPayableTotal = resolvePurchaseOrderPayableTotal;
const purchase_order_real_cost_util_1 = require("./purchase-order-real-cost.util");
function purchaseOrderHasPersistedRealCost(order) {
    return ((0, purchase_order_real_cost_util_1.isRealCostEnabled)(order.customs_exchange_rate, 0) ||
        (0, purchase_order_real_cost_util_1.parseRealCostNumber)(order.landed_extras_mxn) > 0 ||
        (0, purchase_order_real_cost_util_1.parseRealCostNumber)(order.landed_invoice_extras_mxn) > 0 ||
        (0, purchase_order_real_cost_util_1.parseRealCostNumber)(order.landed_merchandise_mxn) > 0);
}
function catalogPurchaseOrderTotal(order) {
    const requestedTotal = Number(order.requested_total || 0);
    const receivedTotal = Number(order.received_total || 0);
    if (order.general_status === 'Recibida') {
        return receivedTotal > 0 ? receivedTotal : requestedTotal;
    }
    return requestedTotal;
}
function resolvePurchaseOrderPayableTotal(order) {
    const catalogTotal = catalogPurchaseOrderTotal(order);
    if (!purchaseOrderHasPersistedRealCost(order)) {
        return catalogTotal;
    }
    const cash = (0, purchase_order_real_cost_util_1.derivePersistedLandedCashTotals)({
        merchandise_mxn: order.landed_merchandise_mxn,
        extras_mxn: order.landed_extras_mxn,
        invoice_extras_mxn: order.landed_invoice_extras_mxn,
        customs_exchange_rate: order.customs_exchange_rate,
    });
    const currency = String(order.payment_currency ?? 'MXN').trim().toUpperCase();
    const invoiceTotal = currency === 'USD' ? cash.invoice_usd : cash.invoice_mxn;
    if (invoiceTotal == null || invoiceTotal <= 0) {
        return catalogTotal;
    }
    return invoiceTotal;
}
//# sourceMappingURL=purchase-order-payable-total.util.js.map