import { InventoryTransferStatus } from '../../../entities/inventory/inventory-transfer-status.enum';

const QTY_EPSILON = 0.0005;

export function roundTransferQty(value: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parseFloat(parsed.toFixed(3));
}

export function quantitiesMatch(shipped: number, received: number): boolean {
  return Math.abs(roundTransferQty(shipped) - roundTransferQty(received)) <= QTY_EPSILON;
}

export function receptionStatus(
  lines: Array<{ shipped: number; received: number }>,
): InventoryTransferStatus.RECEIVED | InventoryTransferStatus.RECEIVED_WITH_DIFFERENCE {
  const same = lines.every((line) => quantitiesMatch(line.shipped, line.received));
  return same
    ? InventoryTransferStatus.RECEIVED
    : InventoryTransferStatus.RECEIVED_WITH_DIFFERENCE;
}

export function transferNeedsShipping(
  sourceBranchId: string | null | undefined,
  destinationBranchId: string | null | undefined,
): boolean {
  if (!sourceBranchId || !destinationBranchId) return true;
  return sourceBranchId !== destinationBranchId;
}

export function receptionQuantityError(shipped: number, received: number): string | null {
  if (!Number.isFinite(received) || received < -QTY_EPSILON) {
    return 'La cantidad recibida no puede ser negativa';
  }
  if (roundTransferQty(received) - roundTransferQty(shipped) > QTY_EPSILON) {
    return 'No se puede recibir más de lo enviado';
  }
  return null;
}
