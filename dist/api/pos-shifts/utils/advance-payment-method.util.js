"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethodFromFormaPago = paymentMethodFromFormaPago;
exports.formaPagoFromPaymentMethod = formaPagoFromPaymentMethod;
exports.formaPagoFromAdvancePayment = formaPagoFromAdvancePayment;
exports.predominantFormaPago = predominantFormaPago;
exports.advanceShiftAmountSplits = advanceShiftAmountSplits;
exports.advancePaymentMethodLabel = advancePaymentMethodLabel;
const pos_sale_payment_method_enum_1 = require("../../../entities/pos/pos-sale-payment-method.enum");
function paymentMethodFromFormaPago(formaPago) {
    switch ((formaPago ?? '').trim()) {
        case '01':
            return pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH;
        case '02':
            return pos_sale_payment_method_enum_1.PosSalePaymentMethod.CHECK;
        case '03':
            return pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER;
        case '04':
        case '28':
            return pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD;
        default:
            return null;
    }
}
function formaPagoFromPaymentMethod(method) {
    switch (method) {
        case pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH:
            return '01';
        case pos_sale_payment_method_enum_1.PosSalePaymentMethod.CHECK:
            return '02';
        case pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER:
            return '03';
        case pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD:
            return '04';
        default:
            return null;
    }
}
function formaPagoFromAdvancePayment(method, amounts) {
    if (method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED) {
        return predominantFormaPago(amounts);
    }
    return formaPagoFromPaymentMethod(method);
}
function predominantFormaPago(amounts) {
    if (!amounts) {
        return null;
    }
    const parts = [
        { code: '01', amount: Number(amounts.cashMxn || 0) },
        { code: '03', amount: Number(amounts.transferMxn || 0) },
        { code: '04', amount: Number(amounts.cardMxn || 0) },
        { code: '02', amount: Number(amounts.checkMxn || 0) },
    ];
    const best = parts.reduce((current, part) => part.amount > current.amount ? part : current);
    return best.amount > 0 ? best.code : null;
}
function advanceShiftAmountSplits(method, amountMxn, amounts) {
    const total = roundAdvanceMoney(amountMxn);
    if (method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED) {
        return {
            cashMxn: roundAdvanceMoney(amounts?.cashMxn ?? 0),
            transferMxn: roundAdvanceMoney(amounts?.transferMxn ?? 0),
            cardMxn: roundAdvanceMoney(amounts?.cardMxn ?? 0),
            checkMxn: roundAdvanceMoney(amounts?.checkMxn ?? 0),
        };
    }
    return {
        cashMxn: method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH ? total : 0,
        transferMxn: method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER ? total : 0,
        cardMxn: method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD ? total : 0,
        checkMxn: method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.CHECK ? total : 0,
    };
}
function advancePaymentMethodLabel(method) {
    switch (method) {
        case pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH:
            return 'Efectivo';
        case pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD:
            return 'Tarjeta';
        case pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER:
            return 'Transferencia';
        case pos_sale_payment_method_enum_1.PosSalePaymentMethod.CHECK:
            return 'Cheque';
        case pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED:
            return 'Mixto';
        default:
            return method;
    }
}
function roundAdvanceMoney(value) {
    return Number(Number(value || 0).toFixed(2));
}
//# sourceMappingURL=advance-payment-method.util.js.map