import { DataSource, Repository } from 'typeorm';
import { InventoryStockLedger } from '../../../entities/inventory/inventory-stock-ledger.entity';
import { QueryStockFlowDto, StockFlowView } from '../dto/query-stock-flow.dto';
import { StockFlowResponseDto } from '../dto/stock-flow-response.dto';
export declare class InventoryStockFlowService {
    private readonly ledgerRepo;
    private readonly dataSource;
    constructor(ledgerRepo: Repository<InventoryStockLedger>, dataSource: DataSource);
    getReport(tenantId: string, filters: QueryStockFlowDto): Promise<StockFlowResponseDto>;
    exportExcel(tenantId: string, filters: QueryStockFlowDto): Promise<Buffer>;
    getFilename(view?: StockFlowView): string;
    private assertFilters;
    private buildSummary;
    private buildLedger;
    private buildDescription;
    private loadOpeningBalancesForBranchKeys;
    private loadMovementsInRange;
    private buildFiltersApplied;
    private resolveDateRange;
    private periodLabel;
    private startOfDay;
    private endOfDay;
}
