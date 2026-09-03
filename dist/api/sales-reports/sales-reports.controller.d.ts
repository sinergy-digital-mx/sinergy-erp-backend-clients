import { QuerySalesBySellerOrdersDto, QuerySalesBySellerReportDto, SalesReportPeriod, SalesReportView } from './dto/query-sales-by-seller-report.dto';
import { SalesReportsService } from './sales-reports.service';
export declare class SalesReportsController {
    private readonly salesReportsService;
    constructor(salesReportsService: SalesReportsService);
    getSalesBySellerReport(query: QuerySalesBySellerReportDto, req: any): Promise<import("./sales-reports.service").SalesBySellerReportResponse>;
    exportSalesBySellerExcel(query: QuerySalesBySellerReportDto, req: any, res: any): Promise<void>;
    getSalesBySellerOrders(query: QuerySalesBySellerOrdersDto, req: any): Promise<{
        view: SalesReportView;
        seller: {
            id: string;
            name: string;
            role_label: string;
            pos_user_code: number | null;
        };
        filters_applied: {
            view: SalesReportView;
            seller_id: string;
            fiscal_configuration_id: string | null;
            billing_branch_id: string | null;
            period: SalesReportPeriod;
            date_from: string;
            date_to: string;
        };
        summary: {
            total_sales_count: number;
            amount_sold: number;
        };
        data: {
            id: string;
            folio: string;
            created_at: Date;
            total: number;
            payment_status: string;
            general_status: string;
            sales_order_type: string;
            customer_company_name: string | null;
            customer_person_name: string | null;
            customer_display_name: string | null;
            seller_name: string | null;
            assigned_seller_name: string | null;
            branch_name: string | null;
            billing_branch_id: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
