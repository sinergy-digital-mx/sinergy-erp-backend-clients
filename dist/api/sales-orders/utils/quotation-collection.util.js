"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCollectionActions = resolveCollectionActions;
function resolveCollectionActions(input) {
    if (!input.fromQuotation) {
        return {
            canSend: false,
            canWithdraw: false,
            sendBlockedReason: null,
            withdrawBlockedReason: null,
        };
    }
    const paid = input.paymentStatus === 'Pagado' || input.hasCollection || input.hasPayments;
    const cancelled = input.generalStatus === 'Cancelada';
    if (cancelled) {
        return {
            canSend: false,
            canWithdraw: false,
            sendBlockedReason: 'La orden está cancelada',
            withdrawBlockedReason: 'La orden está cancelada',
        };
    }
    if (paid) {
        return {
            canSend: false,
            canWithdraw: false,
            sendBlockedReason: 'La orden ya tiene cobro o pagos',
            withdrawBlockedReason: 'La orden ya fue cobrada. No se puede quitar de cobranza',
        };
    }
    if (input.hasVigenteInvoice) {
        return {
            canSend: false,
            canWithdraw: false,
            sendBlockedReason: 'La orden tiene una factura vigente',
            withdrawBlockedReason: 'La orden tiene una factura vigente. Cancélala antes de quitar el cobro',
        };
    }
    if (input.onOpenShift) {
        return {
            canSend: false,
            canWithdraw: true,
            sendBlockedReason: 'El cobro ya está en el corte abierto',
            withdrawBlockedReason: null,
        };
    }
    if (!input.hasOpenShift) {
        return {
            canSend: false,
            canWithdraw: input.salesOrderType === 'POS',
            sendBlockedReason: 'No hay corte abierto en la sucursal',
            withdrawBlockedReason: input.salesOrderType === 'POS' ? null : 'La orden no está en cobranza',
        };
    }
    return {
        canSend: true,
        canWithdraw: input.salesOrderType === 'POS',
        sendBlockedReason: null,
        withdrawBlockedReason: input.salesOrderType === 'POS' ? null : 'La orden no está en cobranza',
    };
}
//# sourceMappingURL=quotation-collection.util.js.map