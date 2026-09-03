import { InventoryBatchService } from '../services/inventory-batch.service';
import { QueryInventoryBatchDto } from '../dto/query-inventory-batch.dto';
export declare class InventoryBatchController {
    private readonly inventoryBatchService;
    constructor(inventoryBatchService: InventoryBatchService);
    listBatches(query: QueryInventoryBatchDto, req: any): Promise<{
        data: import("../../../entities/purchase-orders").InventoryBatch[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getWarehouseStats(warehouseId: string, req: any): Promise<{
        total_batches: number;
        unique_products: number;
        total_quantity: number;
    }>;
    uploadPhoto(id: string, file: Express.Multer.File, req: any): Promise<{
        message: string;
        data: import("../../../entities/purchase-orders").InventoryBatch;
    }>;
}
