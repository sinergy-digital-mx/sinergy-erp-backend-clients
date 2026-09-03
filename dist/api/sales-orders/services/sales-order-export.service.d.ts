import { Repository } from 'typeorm';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
import { PosSaleCollection } from '../../../entities/pos/pos-sale-collection.entity';
import { QuerySalesOrderDetailExportDto, QuerySalesOrderHeaderExportDto } from '../dto/query-sales-order-export.dto';
export declare class SalesOrderExportService {
    private readonly soRepo;
    private readonly detailRepo;
    private readonly paymentRepo;
    private readonly posCollectionRepo;
    private readonly headerColumns;
    private readonly detailColumns;
    constructor(soRepo: Repository<SalesOrder>, detailRepo: Repository<SalesOrderDetail>, paymentRepo: Repository<SalesOrderPayment>, posCollectionRepo: Repository<PosSaleCollection>);
    exportHeaders(tenantId: string, filters: QuerySalesOrderHeaderExportDto): Promise<Buffer>;
    exportDetails(tenantId: string, filters: QuerySalesOrderDetailExportDto): Promise<Buffer>;
    getHeadersFilename(): string;
    getDetailsFilename(from: string, to: string): string;
    private fetchOrders;
    private applyOrderFilters;
    private applyDetailFilters;
    private loadCollectionChannels;
    private formatCustomerName;
    private formatUserName;
    private describeFilters;
    private endOfDay;
    private todaySuffix;
}
