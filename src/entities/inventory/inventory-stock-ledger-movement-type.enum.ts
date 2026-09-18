/**
 * Tipos de movimiento del kardex (libro append-only de existencias).
 */
export enum InventoryStockLedgerMovementType {
  PURCHASE_RECEIPT = 'purchase_receipt',
  IMPORT = 'import',
  SALE = 'sale',
  SALE_REVERSAL = 'sale_reversal',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  AUDIT_ADJUSTMENT = 'audit_adjustment',
  OPENING_BALANCE = 'opening_balance',
}
