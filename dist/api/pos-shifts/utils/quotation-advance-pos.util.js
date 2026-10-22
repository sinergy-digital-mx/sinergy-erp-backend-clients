"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isQuotationAdvanceInCaja = isQuotationAdvanceInCaja;
exports.getQuotationReturnToSalesBlockedReason = getQuotationReturnToSalesBlockedReason;
exports.getQuotationSendToCajaBlockedReason = getQuotationSendToCajaBlockedReason;
const sales_order_pos_stage_enum_1 = require("../../../entities/sales-orders/sales-order-pos-stage.enum");
function isQuotationAdvanceInCaja(posStage, advanceRequestedTotal) {
    const requested = Number(advanceRequestedTotal ?? 0);
    if (requested <= 0) {
        return false;
    }
    return posStage !== sales_order_pos_stage_enum_1.SalesOrderPosStage.Ventas;
}
function getQuotationReturnToSalesBlockedReason(input) {
    if (input.generalStatus !== 'Creada') {
        return 'La cotización ya no está pendiente de anticipo';
    }
    if (Number(input.advanceRequestedTotal ?? 0) <= 0) {
        return 'Esta cotización no tiene un anticipo por cobrar';
    }
    if (input.posStage === sales_order_pos_stage_enum_1.SalesOrderPosStage.Ventas) {
        return 'El anticipo ya está en ventas';
    }
    if (input.hasVigenteAdvance) {
        return 'Ese anticipo ya fue cobrado y timbrado';
    }
    return null;
}
function getQuotationSendToCajaBlockedReason(input) {
    if (input.generalStatus !== 'Creada') {
        return 'La cotización ya no se puede enviar a caja';
    }
    if (input.posStage !== sales_order_pos_stage_enum_1.SalesOrderPosStage.Ventas) {
        return 'La cotización no está en ventas';
    }
    if (input.hasVigenteAdvance) {
        return 'Ese anticipo ya fue cobrado y timbrado';
    }
    return null;
}
//# sourceMappingURL=quotation-advance-pos.util.js.map