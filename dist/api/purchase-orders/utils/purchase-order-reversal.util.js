"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PURCHASE_REVERSAL_QTY_EPSILON = void 0;
exports.roundPurchaseQty = roundPurchaseQty;
exports.lotsBlockingFullExit = lotsBlockingFullExit;
exports.formatBlockedLotsMessage = formatBlockedLotsMessage;
exports.isPurchaseLotAlreadyExited = isPurchaseLotAlreadyExited;
exports.PURCHASE_REVERSAL_QTY_EPSILON = 0.001;
function roundPurchaseQty(value) {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) {
        return 0;
    }
    return parseFloat(parsed.toFixed(3));
}
function lotsBlockingFullExit(lots) {
    return lots
        .filter((lot) => !lot.transferred_from_batch_id)
        .map((lot) => {
        const initial = roundPurchaseQty(lot.initial_quantity);
        const available = roundPurchaseQty(lot.available_quantity);
        const missing = roundPurchaseQty(initial - available);
        return { ...lot, initial_quantity: initial, available_quantity: available, missing_quantity: missing };
    })
        .filter((lot) => lot.missing_quantity > exports.PURCHASE_REVERSAL_QTY_EPSILON);
}
function formatBlockedLotsMessage(folio, lots) {
    const lines = lots.map((lot) => `${lot.batch_number} (${lot.product_label}): ingresó ${lot.initial_quantity.toFixed(3)} y hay ${lot.available_quantity.toFixed(3)}`);
    return `No se puede sacar el inventario de ${folio}. Primero audita estos lotes y repón la existencia: ${lines.join('; ')}`;
}
function isPurchaseLotAlreadyExited(available, purchaseNet) {
    return (roundPurchaseQty(available) <= exports.PURCHASE_REVERSAL_QTY_EPSILON
        && roundPurchaseQty(purchaseNet) <= exports.PURCHASE_REVERSAL_QTY_EPSILON);
}
//# sourceMappingURL=purchase-order-reversal.util.js.map