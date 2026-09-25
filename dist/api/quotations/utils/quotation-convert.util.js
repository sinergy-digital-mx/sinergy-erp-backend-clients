"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConvertSalesOrderType = resolveConvertSalesOrderType;
function resolveConvertSalesOrderType(quotationType, sendToPosCaja) {
    if (sendToPosCaja === true) {
        return 'POS';
    }
    if (sendToPosCaja === false) {
        return 'MANUAL';
    }
    return quotationType === 'POS' ? 'POS' : 'MANUAL';
}
//# sourceMappingURL=quotation-convert.util.js.map