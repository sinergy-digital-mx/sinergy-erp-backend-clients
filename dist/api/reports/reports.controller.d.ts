import { QueryStockReplenishmentDto } from './dto/query-stock-replenishment.dto';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    listVendors(req: {
        user: {
            tenant_id: string;
        };
    }): Promise<{
        vendors: import("./reports.service").StockReplenishmentVendorOption[];
    }>;
    getStockReplenishment(query: QueryStockReplenishmentDto, req: {
        user: {
            tenant_id: string;
        };
    }): Promise<import("./reports.service").StockReplenishmentReport>;
}
