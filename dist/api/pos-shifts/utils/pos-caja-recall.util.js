"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cajaRecallMessage = cajaRecallMessage;
function cajaRecallMessage(recalledByName, folio) {
    const who = (recalledByName || '').trim() || 'Ventas';
    const which = (folio || '').trim();
    return which
        ? `${who} regresó ${which} a POS Ventas`
        : `${who} regresó esta venta a POS Ventas`;
}
//# sourceMappingURL=pos-caja-recall.util.js.map