"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundPosMoney = roundPosMoney;
exports.expectedCashInDrawer = expectedCashInDrawer;
exports.cashDifference = cashDifference;
function roundPosMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
function expectedCashInDrawer(params) {
    return roundPosMoney(params.opening + params.collectedCash - params.removed);
}
function cashDifference(counted, expected) {
    return roundPosMoney(counted - expected);
}
//# sourceMappingURL=cash-drawer.js.map