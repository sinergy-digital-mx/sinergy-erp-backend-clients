"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cashReceivedEquivalentMxn = cashReceivedEquivalentMxn;
exports.usdCentToleranceMxn = usdCentToleranceMxn;
exports.splitCashPayment = splitCashPayment;
exports.cashCoversOrder = cashCoversOrder;
const cash_drawer_1 = require("./cash-drawer");
function cashReceivedEquivalentMxn(receivedMxn, receivedUsd, rate) {
    const usdMxn = receivedUsd > 0 && rate > 0 ? Number(receivedUsd) * Number(rate) : 0;
    return (0, cash_drawer_1.roundPosMoney)(Number(receivedMxn || 0) + usdMxn);
}
function usdCentToleranceMxn(rate) {
    const fx = Number(rate) || 0;
    if (fx <= 0) {
        return 0.01;
    }
    return Math.max(0.01, (0, cash_drawer_1.roundPosMoney)(0.01 * fx));
}
function splitCashPayment(orderTotal, receivedMxn, receivedUsd, rate) {
    const total = (0, cash_drawer_1.roundPosMoney)(Math.max(0, Number(orderTotal) || 0));
    const mxnIn = (0, cash_drawer_1.roundPosMoney)(Math.max(0, Number(receivedMxn) || 0));
    const usdIn = (0, cash_drawer_1.roundPosMoney)(Math.max(0, Number(receivedUsd) || 0));
    const fx = Number(rate) || 0;
    const amountCashMxn = (0, cash_drawer_1.roundPosMoney)(Math.min(mxnIn, total));
    const remainderMxn = (0, cash_drawer_1.roundPosMoney)(total - amountCashMxn);
    let amountCashUsd = 0;
    if (remainderMxn > 0.001 && usdIn > 0 && fx > 0) {
        amountCashUsd = (0, cash_drawer_1.roundPosMoney)(Math.min(usdIn, remainderMxn / fx));
    }
    const appliedMxn = cashReceivedEquivalentMxn(amountCashMxn, amountCashUsd, fx);
    const gap = (0, cash_drawer_1.roundPosMoney)(total - appliedMxn);
    const covers = gap <= usdCentToleranceMxn(amountCashUsd > 0 ? fx : 0) + 0.001;
    return {
        amountCashMxn,
        amountCashUsd,
        changeCashMxn: (0, cash_drawer_1.roundPosMoney)(Math.max(0, mxnIn - amountCashMxn)),
        changeCashUsd: (0, cash_drawer_1.roundPosMoney)(Math.max(0, usdIn - amountCashUsd)),
        covers,
    };
}
function cashCoversOrder(orderTotal, receivedMxn, receivedUsd, rate) {
    return splitCashPayment(orderTotal, receivedMxn, receivedUsd, rate).covers;
}
//# sourceMappingURL=pos-cash-payment.util.js.map