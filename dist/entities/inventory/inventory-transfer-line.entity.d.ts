import { InventoryTransfer } from './inventory-transfer.entity';
import { InventoryBatch } from '../purchase-orders/inventory-batch.entity';
export declare class InventoryTransferLine {
    id: string;
    inventory_transfer: InventoryTransfer;
    inventory_transfer_id: string;
    source_inventory_batch: InventoryBatch;
    source_inventory_batch_id: string;
    quantity: number;
    destination_inventory_batch: InventoryBatch;
    destination_inventory_batch_id: string;
    created_at: Date;
}
