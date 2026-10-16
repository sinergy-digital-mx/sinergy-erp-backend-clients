"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundTransferQty = roundTransferQty;
exports.quantitiesMatch = quantitiesMatch;
exports.receptionStatus = receptionStatus;
exports.receptionQuantityError = receptionQuantityError;
const inventory_transfer_status_enum_1 = require("../../../entities/inventory/inventory-transfer-status.enum");
const QTY_EPSILON = 0.0005;
function roundTransferQty(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        return 0;
    return parseFloat(parsed.toFixed(3));
}
function quantitiesMatch(shipped, received) {
    return Math.abs(roundTransferQty(shipped) - roundTransferQty(received)) <= QTY_EPSILON;
}
function receptionStatus(lines) {
    const same = lines.every((line) => quantitiesMatch(line.shipped, line.received));
    return same
        ? inventory_transfer_status_enum_1.InventoryTransferStatus.RECEIVED
        : inventory_transfer_status_enum_1.InventoryTransferStatus.RECEIVED_WITH_DIFFERENCE;
}
function receptionQuantityError(shipped, received) {
    if (!Number.isFinite(received) || received < -QTY_EPSILON) {
        return 'La cantidad recibida no puede ser negativa';
    }
    if (roundTransferQty(received) - roundTransferQty(shipped) > QTY_EPSILON) {
        return 'No se puede recibir más de lo enviado';
    }
    return null;
}
//# sourceMappingURL=inventory-transfer-reception.util.js.map