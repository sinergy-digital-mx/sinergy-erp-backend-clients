import { DataSource } from 'typeorm';
import { QueryAverageCostReportDto } from '../dto/query-average-cost-report.dto';
import { AverageCostReportRow } from '../utils/average-cost-report.util';
export declare class AverageCostReportService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getReport(tenantId: string, filters: QueryAverageCostReportDto): Promise<{
        summary: import("../utils/average-cost-report.util").AverageCostReportSummary;
        data: AverageCostReportRow[];
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
    private loadReceipts;
    private loadPrices;
    private loadPedimentos;
}
