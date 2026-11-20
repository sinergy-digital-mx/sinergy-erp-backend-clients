"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCashContract = isCashContract;
exports.resolveContractSaleMark = resolveContractSaleMark;
exports.contractSaleTypeLabel = contractSaleTypeLabel;
exports.contractSaleTypeHint = contractSaleTypeHint;
function isCashContract(contract) {
    return contract?.sale_type === 'cash';
}
function resolveContractSaleMark(contract) {
    if (isCashContract(contract)) {
        return 'cash';
    }
    if (contract?.down_payment_financed) {
        return 'down_payment_and_financing';
    }
    return 'financing';
}
function contractSaleTypeLabel(contract) {
    const mark = resolveContractSaleMark(contract);
    if (mark === 'cash') {
        return 'Contado';
    }
    if (mark === 'down_payment_and_financing') {
        return 'Financiado (E + F)';
    }
    return 'Financiado (F)';
}
function contractSaleTypeHint(contract) {
    const mark = resolveContractSaleMark(contract);
    if (mark === 'cash') {
        return 'Contado. Sin mensualidad. Los abonos, si se parten, van en enganche.';
    }
    if (mark === 'down_payment_and_financing') {
        return 'Enganche más financiamiento';
    }
    return 'Financiamiento';
}
//# sourceMappingURL=contract-sale-type.util.js.map