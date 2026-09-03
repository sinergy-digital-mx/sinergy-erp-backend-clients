import { Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { QueryInventoryBatchExportDto, QueryInventorySummaryExportDto } from '../dto/query-inventory-export.dto';
export declare class InventoryExportService {
    private readonly batchRepo;
    private readonly batchColumns;
    private readonly summaryColumns;
    constructor(batchRepo: Repository<InventoryBatch>);
    exportBatches(tenantId: string, filters: QueryInventoryBatchExportDto): Promise<Buffer>;
    exportSummary(tenantId: string, filters: QueryInventorySummaryExportDto): Promise<Buffer>;
    getBatchesFilename(): string;
    getSummaryFilename(): string;
    private fetchBatches;
    private applyBatchFilters;
    private buildSummaryRows;
    private describeBatchFilters;
    private describeSummaryFilters;
    private todaySuffix;
}
