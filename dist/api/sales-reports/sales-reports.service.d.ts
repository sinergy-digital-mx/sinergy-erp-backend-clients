import { Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { SalesGoalMetricType } from '../../entities/goals/sales-goal.entity';
import { GoalsService } from '../goals/goals.service';
import { QuerySalesBySellerOrdersDto, QuerySalesBySellerReportDto, SalesReportPeriod, SalesReportView } from './dto/query-sales-by-seller-report.dto';
import { User } from '../../entities/users/user.entity';
export interface SalesBySellerReportRow {
    billing_branch_id: string;
    branch_code: string;
    branch_initials: string;
    branch_name: string;
    seller_id: string;
    seller_name: string;
    seller_pos_user_code: number | null;
    total_sales_count: number;
    amount_sold: number;
    average_ticket: number;
    commission_percentage: number | null;
    commission_amount: number | null;
    goal: {
        has_goal: boolean;
        metric_type: SalesGoalMetricType | null;
        target_value: number | null;
        current_value: number;
        progress_percentage: number;
    } | null;
}
export interface SalesBySellerReportResponse {
    view: SalesReportView;
    view_label: string;
    summary: {
        total_sellers: number;
        people_count: number;
        people_label: string;
        total_sales_count: number;
        total_amount: number;
        average_ticket: number;
        total_commission: number | null;
        commission_rate: number | null;
        top: {
            id: string;
            name: string;
            pos_user_code: number | null;
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
        view: SalesReportView;
        fiscal_configuration_id: string | null;
        billing_branch_id: string | null;
        period: SalesReportPeriod;
        period_label: string;
        date_from: string;
        date_to: string;
        commission_rate: number | null;
    };
    goals: {
        has_active_goals: boolean;
        message: string | null;
        branch_goal: {
            goal_id: string;
            billing_branch_id: string;
            branch_name: string;
            metric_type: SalesGoalMetricType;
            target_value: number;
            current_value: number;
            progress_percentage: number;
        } | null;
        user_role_goal: {
            goal_id: string;
            role_id: string;
            role_name: string;
            metric_type: SalesGoalMetricType;
            target_value: number;
        } | null;
    };
    rows: SalesBySellerReportRow[];
}
export declare class SalesReportsService {
    private readonly salesOrderRepo;
    private readonly userRepo;
    private readonly goalsService;
    constructor(salesOrderRepo: Repository<SalesOrder>, userRepo: Repository<User>, goalsService: GoalsService);
    getSalesBySellerReport(tenantId: string, filters: QuerySalesBySellerReportDto): Promise<SalesBySellerReportResponse>;
    exportSalesBySellerExcel(tenantId: string, filters: QuerySalesBySellerReportDto): Promise<Buffer>;
    getExportFilename(viewSlug: string): string;
    getSalesBySellerOrders(tenantId: string, filters: QuerySalesBySellerOrdersDto): Promise<{
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
    private mapBranchGoal;
    private progressPct;
    private resolveDateRange;
    private periodLabel;
    private formatMoney;
    private startOfDay;
    private endOfDay;
    private buildSellerName;
    private buildBranchName;
    private buildBranchInitials;
}
