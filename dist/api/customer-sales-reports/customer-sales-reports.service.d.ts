import { Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { CustomerSalesReportPeriod, QueryCustomerSalesReportDto } from './dto/query-customer-sales-report.dto';
export interface CustomerSalesReportRow {
    rank: number;
    customer_id: number;
    customer_name: string;
    customer_rfc: string | null;
    total_sales_count: number;
    total_purchased: number;
    average_ticket: number;
    last_purchased_at: string | null;
}
export interface CustomerSalesReportResponse {
    view_label: string;
    summary: {
        customers_count: number;
        total_sales_count: number;
        total_amount: number;
        average_ticket: number;
        top: {
            customer_id: number;
            name: string;
            amount: number;
            sales_count: number;
        } | null;
        branches: Array<{
            billing_branch_id: string;
            branch_name: string;
            sales_count: number;
            amount: number;
        }>;
    };
    filters_applied: {
        fiscal_configuration_id: string | null;
        billing_branch_id: string | null;
        period: CustomerSalesReportPeriod;
        period_label: string;
        date_from: string;
        date_to: string;
        limit: number;
    };
    rows: CustomerSalesReportRow[];
}
export declare class CustomerSalesReportsService {
    private readonly salesOrderRepo;
    constructor(salesOrderRepo: Repository<SalesOrder>);
    getTopCustomersReport(tenantId: string, filters: QueryCustomerSalesReportDto, rowLimit?: number): Promise<CustomerSalesReportResponse>;
    exportTopCustomersExcel(tenantId: string, filters: QueryCustomerSalesReportDto): Promise<Buffer>;
    getExportFilename(): string;
    private queryCustomerAggregates;
    private queryTotals;
    private queryBranchAggregates;
    private applyOrderFilters;
    private resolveDateRange;
    private periodLabel;
    private startOfDay;
    private endOfDay;
    private buildCustomerName;
    private buildBranchName;
    private formatMoney;
}
