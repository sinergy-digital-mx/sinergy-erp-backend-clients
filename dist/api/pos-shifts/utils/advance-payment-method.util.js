"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethodFromFormaPago = paymentMethodFromFormaPago;
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
        default:
            return method;
    }
}
//# sourceMappingURL=advance-payment-method.util.js.map