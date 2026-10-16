import { InventoryTransferStatus } from '../../../entities/inventory/inventory-transfer-status.enum';
export declare function roundTransferQty(value: number): number;
export declare function quantitiesMatch(shipped: number, received: number): boolean;
export declare function receptionStatus(lines: Array<{
    shipped: number;
    received: number;
}>): InventoryTransferStatus.RECEIVED | InventoryTransferStatus.RECEIVED_WITH_DIFFERENCE;
export declare function receptionQuantityError(shipped: number, received: number): string | null;
