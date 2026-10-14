import { AccountingReportPeriod } from './query-accounting-base.dto';
export declare class QueryAverageCostReportDto {
    billing_branch_id?: string;
    period?: AccountingReportPeriod;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
    search?: string;
}
