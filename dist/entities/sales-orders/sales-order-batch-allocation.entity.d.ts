import { SalesOrderDetail } from './sales-order-detail.entity';
import { InventoryBatch } from '../purchase-orders/inventory-batch.entity';
export declare class SalesOrderBatchAllocation {
    id: string;
    sales_order_detail: SalesOrderDetail;
    sales_order_detail_id: string;
    inventory_batch: InventoryBatch;
    inventory_batch_id: string;
    quantity_allocated: number;
    created_by: string;
    created_at: Date;
}
