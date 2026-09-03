import { Repository } from 'typeorm';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
export declare class SalesOrderFolioService {
    private readonly salesOrderRepo;
    constructor(salesOrderRepo: Repository<SalesOrder>);
    generateFolio(tenantId: string): Promise<string>;
}
