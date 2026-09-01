export const PURCHASE_ORDER_MOVEMENT_TYPES = {
  CREATED: 'created',
  STATUS_CHANGED: 'status_changed',
  LINE_ADDED: 'line_added',
  LINE_UPDATED: 'line_updated',
  LINE_REMOVED: 'line_removed',
  NOTES_UPDATED: 'notes_updated',
  PEDIMENTO_UPDATED: 'pedimento_updated',
  HEADER_REPLACED: 'header_replaced',
  RECEIVED: 'received',
  LOT_RECEIVED: 'lot_received',
  LOT_MIGRATED: 'lot_migrated',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_GENERATED: 'document_generated',
  PAYMENT_RECORDED: 'payment_recorded',
  PAYMENT_DELETED: 'payment_deleted',
  INVENTORY_ADJUSTED: 'inventory_adjusted',
  STOCK_SOLD: 'stock_sold',
} as const;

export type PurchaseOrderMovementType =
  (typeof PURCHASE_ORDER_MOVEMENT_TYPES)[keyof typeof PURCHASE_ORDER_MOVEMENT_TYPES];

/** Tipos de PDF que el sistema genera (no subida manual). */
export const GENERATED_PURCHASE_ORDER_DOCUMENT_TYPE_IDS = new Set([1, 4]);

export const PURCHASE_ORDER_MOVEMENT_TYPE_LABELS: Record<
  PurchaseOrderMovementType,
  string
> = {
  created: 'Orden creada',
  status_changed: 'Cambio de estatus',
  line_added: 'Producto agregado',
  line_updated: 'Producto actualizado',
  line_removed: 'Producto eliminado',
  notes_updated: 'Notas actualizadas',
  pedimento_updated: 'Pedimento actualizado',
  header_replaced: 'Orden reemplazada',
  received: 'Mercancía recibida',
  lot_received: 'Lote recibido',
  lot_migrated: 'Lote migrado',
  document_uploaded: 'Documento subido',
  document_generated: 'Documento generado',
  payment_recorded: 'Pago registrado',
  payment_deleted: 'Pago eliminado',
  inventory_adjusted: 'Ajuste de inventario',
  stock_sold: 'Salida por venta',
};
