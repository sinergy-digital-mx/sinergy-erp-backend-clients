import { Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { QueryPurchaseOrderDetailExportDto, QueryPurchaseOrderHeaderExportDto } from '../dto/query-purchase-order-export.dto';
export declare class PurchaseOrderExportService {
    private readonly poRepo;
    private readonly detailRepo;
    private readonly headerColumns;
    private readonly detailColumns;
    constructor(poRepo: Repository<PurchaseOrderBatch>, detailRepo: Repository<PurchaseOrderBatchDetail>);
    exportHeaders(tenantId: string, filters: QueryPurchaseOrderHeaderExportDto): Promise<Buffer>;
    exportDetails(tenantId: string, filters: QueryPurchaseOrderDetailExportDto): Promise<Buffer>;
    getHeadersFilename(): string;
    getDetailsFilename(from: string, to: string): string;
    private fetchOrders;
    private applyOrderFilters;
    private applyDetailFilters;
    private describeFilters;
    private endOfDay;
    private todaySuffix;
}
