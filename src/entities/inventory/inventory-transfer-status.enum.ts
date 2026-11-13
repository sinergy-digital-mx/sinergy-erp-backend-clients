export enum InventoryTransferStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  RECEIVED = 'received',
  RECEIVED_WITH_DIFFERENCE = 'received_with_difference',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const OPEN_TRANSFER_STATUSES: InventoryTransferStatus[] = [
  InventoryTransferStatus.PENDING,
  InventoryTransferStatus.IN_TRANSIT,
];

export const RECEIVED_TRANSFER_STATUSES: InventoryTransferStatus[] = [
  InventoryTransferStatus.RECEIVED,
  InventoryTransferStatus.RECEIVED_WITH_DIFFERENCE,
  InventoryTransferStatus.COMPLETED,
];
