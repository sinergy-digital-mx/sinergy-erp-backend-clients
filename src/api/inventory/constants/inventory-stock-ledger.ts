import { InventoryStockLedgerMovementType } from '../../../entities/inventory/inventory-stock-ledger-movement-type.enum';

export const STOCK_LEDGER_MOVEMENT_TYPE_LABELS: Record<
  InventoryStockLedgerMovementType,
  string
> = {
  [InventoryStockLedgerMovementType.PURCHASE_RECEIPT]: 'Entrada por compra',
  [InventoryStockLedgerMovementType.IMPORT]: 'Entrada por importación',
  [InventoryStockLedgerMovementType.SALE]: 'Salida por venta',
  [InventoryStockLedgerMovementType.SALE_REVERSAL]: 'Devolución / cancelación de venta',
  [InventoryStockLedgerMovementType.TRANSFER_IN]: 'Entrada por transferencia',
  [InventoryStockLedgerMovementType.TRANSFER_OUT]: 'Salida por transferencia',
  [InventoryStockLedgerMovementType.AUDIT_ADJUSTMENT]: 'Ajuste por auditoría',
  [InventoryStockLedgerMovementType.OPENING_BALANCE]: 'Saldo inicial',
};

export function formatStockQty(value: unknown): string {
  const parsed = parseFloat(String(value ?? 0));
  return (Number.isFinite(parsed) ? parsed : 0).toFixed(3);
}
