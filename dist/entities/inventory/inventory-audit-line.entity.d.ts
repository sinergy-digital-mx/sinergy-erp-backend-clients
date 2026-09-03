import { InventoryAudit } from './inventory-audit.entity';
import { InventoryBatch } from '../purchase-orders/inventory-batch.entity';
import { User } from '../users/user.entity';
export declare class InventoryAuditLine {
    id: string;
    inventory_audit: InventoryAudit;
    inventory_audit_id: string;
    inventory_batch: InventoryBatch;
    inventory_batch_id: string;
    system_quantity: number;
    counted_quantity: number | null;
    variance: number | null;
    reason: string | null;
    is_additional: boolean;
    counted_by_user: User | null;
    counted_by: string | null;
    counted_at: Date | null;
    quantity_before_post: number | null;
    quantity_after_post: number | null;
    created_at: Date;
    updated_at: Date;
}
