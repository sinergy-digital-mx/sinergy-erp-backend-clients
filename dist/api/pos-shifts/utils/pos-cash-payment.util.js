"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cashReceivedEquivalentMxn = cashReceivedEquivalentMxn;
exports.cashChangeDueMxn = cashChangeDueMxn;
exports.cashCoversOrder = cashCoversOrder;
const cash_drawer_1 = require("./cash-drawer");
function cashReceivedEquivalentMxn(receivedMxn, receivedUsd, rate) {
    const usdMxn = receivedUsd > 0 && rate > 0 ? Number(receivedUsd) * Number(rate) : 0;
    return (0, cash_drawer_1.roundPosMoney)(Number(receivedMxn || 0) + usdMxn);
}
function cashChangeDueMxn(orderTotal, receivedMxn, receivedUsd, rate) {
    return Math.max(0, (0, cash_drawer_1.roundPosMoney)(cashReceivedEquivalentMxn(receivedMxn, receivedUsd, rate) - orderTotal));
}
function cashCoversOrder(orderTotal, receivedMxn, receivedUsd, rate) {
    return (cashReceivedEquivalentMxn(receivedMxn, receivedUsd, rate) + 0.01 >=
        orderTotal);
}
//# sourceMappingURL=pos-cash-payment.util.js.map