"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STOCK_LEDGER_MOVEMENT_TYPE_LABELS = void 0;
exports.formatStockQty = formatStockQty;
const inventory_stock_ledger_movement_type_enum_1 = require("../../../entities/inventory/inventory-stock-ledger-movement-type.enum");
exports.STOCK_LEDGER_MOVEMENT_TYPE_LABELS = {
    [inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.PURCHASE_RECEIPT]: 'Entrada por compra',
    [inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.IMPORT]: 'Entrada por importación',
    [inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.SALE]: 'Salida por venta',
    [inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.SALE_REVERSAL]: 'Devolución / cancelación de venta',
    [inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.TRANSFER_IN]: 'Entrada por transferencia',
    [inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.TRANSFER_OUT]: 'Salida por transferencia',
    [inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.AUDIT_ADJUSTMENT]: 'Ajuste por auditoría',
    [inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.OPENING_BALANCE]: 'Saldo inicial',
};
function formatStockQty(value) {
    const parsed = parseFloat(String(value ?? 0));
    return (Number.isFinite(parsed) ? parsed : 0).toFixed(3);
}
//# sourceMappingURL=inventory-stock-ledger.js.map