import { Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { QueryInventoryBatchDto } from '../dto/query-inventory-batch.dto';
import { S3Service } from '../../../common/services/s3.service';
export declare class InventoryBatchService {
    private readonly inventoryBatchRepository;
    private readonly s3Service;
    constructor(inventoryBatchRepository: Repository<InventoryBatch>, s3Service: S3Service);
    queryBatches(tenantId: string, query: QueryInventoryBatchDto): Promise<{
        data: InventoryBatch[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getWarehouseStats(tenantId: string, warehouseId: string): Promise<{
        total_batches: number;
        unique_products: number;
        total_quantity: number;
    }>;
    uploadPhoto(id: string, tenantId: string, file: Express.Multer.File): Promise<InventoryBatch>;
    private getByIdOrFail;
    private toResponseWithPhotoUrl;
}
