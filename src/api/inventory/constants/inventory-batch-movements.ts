export const INVENTORY_BATCH_MOVEMENT_TYPES = {
  CREATED: 'created',
  PURCHASE_RECEIVED: 'purchase_received',
  IMPORTED: 'imported',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  STOCK_SOLD: 'stock_sold',
  INVENTORY_ADJUSTED: 'inventory_adjusted',
} as const;

export type InventoryBatchMovementType =
  (typeof INVENTORY_BATCH_MOVEMENT_TYPES)[keyof typeof INVENTORY_BATCH_MOVEMENT_TYPES];

export const INVENTORY_BATCH_MOVEMENT_TYPE_LABELS: Record<
  InventoryBatchMovementType,
  string
> = {
  created: 'Lote creado',
  purchase_received: 'Entrada por compra',
  imported: 'Entrada por importación',
  transfer_in: 'Entrada por transferencia',
  transfer_out: 'Salida por transferencia',
  stock_sold: 'Salida por venta',
  inventory_adjusted: 'Ajuste de inventario',
};
