import { DataSource } from 'typeorm';
import { QueryAverageCostReportDto } from '../dto/query-average-cost-report.dto';
import { SalesCostReportRow } from '../utils/average-cost-report.util';
export declare class AverageCostReportService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getReport(tenantId: string, filters: QueryAverageCostReportDto): Promise<{
        summary: {
            date_from: string;
            date_to: string;
            branch_label: string;
            document_count: number;
            amount: number;
            discount: number;
            tax: number;
            sale_total: number;
            cost_total: number;
            profit: number;
            margin_percent: number | null;
            has_foreign_currency: boolean;
        };
        data: SalesCostReportRow[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    exportExcel(tenantId: string, filters: QueryAverageCostReportDto): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    private excelRow;
    private collectRows;
    private loadOrders;
    private loadCosts;
    private loadAllocationCosts;
    private loadInvoicedOrderIds;
    private loadSideDocuments;
    private toOrderInput;
    private resolveRange;
    private branchLabel;
    private typeLegend;
    private statusLegend;
}
