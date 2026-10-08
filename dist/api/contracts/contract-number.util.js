"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContractNumberFromPropertyCode = buildContractNumberFromPropertyCode;
function buildContractNumberFromPropertyCode(code) {
    const rest = code.trim().replace(/^LOT-/i, '');
    return `CONT-${rest}`.slice(0, 50);
}
//# sourceMappingURL=contract-number.util.js.map