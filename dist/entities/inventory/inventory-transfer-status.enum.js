"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECEIVED_TRANSFER_STATUSES = exports.OPEN_TRANSFER_STATUSES = exports.InventoryTransferStatus = void 0;
var InventoryTransferStatus;
(function (InventoryTransferStatus) {
    InventoryTransferStatus["PENDING"] = "pending";
    InventoryTransferStatus["IN_TRANSIT"] = "in_transit";
    InventoryTransferStatus["RECEIVED"] = "received";
    InventoryTransferStatus["RECEIVED_WITH_DIFFERENCE"] = "received_with_difference";
    InventoryTransferStatus["COMPLETED"] = "completed";
    InventoryTransferStatus["CANCELLED"] = "cancelled";
})(InventoryTransferStatus || (exports.InventoryTransferStatus = InventoryTransferStatus = {}));
exports.OPEN_TRANSFER_STATUSES = [
    InventoryTransferStatus.PENDING,
    InventoryTransferStatus.IN_TRANSIT,
];
exports.RECEIVED_TRANSFER_STATUSES = [
    InventoryTransferStatus.RECEIVED,
    InventoryTransferStatus.RECEIVED_WITH_DIFFERENCE,
    InventoryTransferStatus.COMPLETED,
];
//# sourceMappingURL=inventory-transfer-status.enum.js.map