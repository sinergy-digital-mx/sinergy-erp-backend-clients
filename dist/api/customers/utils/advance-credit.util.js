"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundAdvanceMoney = roundAdvanceMoney;
exports.advanceCreditPending = advanceCreditPending;
exports.advanceDocumentPending = advanceDocumentPending;
function roundAdvanceMoney(value) {
    return Number((Number(value) || 0).toFixed(2));
}
function advanceCreditPending(total, requested, paid) {
    const covered = Math.max(roundAdvanceMoney(requested), roundAdvanceMoney(paid));
    return roundAdvanceMoney(Math.max(roundAdvanceMoney(total) - covered, 0));
}
function advanceDocumentPending(total, paid) {
    return roundAdvanceMoney(Math.max(roundAdvanceMoney(total) - roundAdvanceMoney(paid), 0));
}
//# sourceMappingURL=advance-credit.util.js.map