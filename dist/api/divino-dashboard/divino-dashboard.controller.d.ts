import { TenantContextService } from '../rbac/services/tenant-context.service';
import { DivinoDashboardService } from './divino-dashboard.service';
import { QueryDivinoDashboardDto, QueryRevenueSeriesDto } from './dto/query-divino-dashboard.dto';
export declare class DivinoDashboardController {
    private readonly divinoDashboardService;
    private readonly tenantContext;
    constructor(divinoDashboardService: DivinoDashboardService, tenantContext: TenantContextService);
    getSummary(query: QueryDivinoDashboardDto): Promise<{
        filters: ReturnType<DivinoDashboardService["filtersMeta"]>;
        kpis: import("./divino-dashboard.service").DivinoDashboardKpis;
        yearly_breakdown?: ({
            avg_price_per_m2: number;
            total_sold_amount: number;
            total_sold_m2: number;
            lots_sold: number;
            avg_list_price: number;
            avg_close_price: number;
            list_vs_close_diff_amount: number;
            list_vs_close_diff_pct: number;
            max_price_per_m2: number;
            min_price_per_m2: number;
            cash_pct: number;
            financed_pct: number;
            cash_count: number;
            financed_count: number;
            avg_down_payment: number;
            avg_monthly_payment: number;
        } & {
            year: number;
        })[] | undefined;
    }>;
    getSellers(query: QueryDivinoDashboardDto): Promise<{
        filters: {
            scope: "all_time";
            year: null;
            month: null;
            mode: "all_time";
        } | {
            scope: "period";
            year: number | null;
            month: number | null;
            mode: "year" | "month";
        };
        rows: {
            revenue: number;
            m2_sold: number;
            seller_id: string;
            seller_name: string;
            lots_sold: number;
            tours_count: number;
        }[];
    }>;
    getLeadOrigins(query: QueryDivinoDashboardDto): Promise<{
        filters: {
            scope: "all_time";
            year: null;
            month: null;
            mode: "all_time";
        } | {
            scope: "period";
            year: number | null;
            month: number | null;
            mode: "year" | "month";
        };
        rows: {
            revenue: number;
            pct_of_sales: number;
            origin: string;
            count: number;
        }[];
    }>;
    getRevenueSeries(query: QueryRevenueSeriesDto): Promise<{
        filters: {
            scope: "all_time";
            year: null;
            month: null;
            mode: "all_time";
        } | {
            scope: "period";
            year: number | null;
            month: number | null;
            mode: "year" | "month";
        };
        period: "annual" | "monthly" | "quarterly" | "semiannual";
        year: number | null;
        month: number | null;
        series: {
            bucket: string;
            revenue: number;
            lots_sold: number;
        }[];
    }>;
    private getTenantId;
}
