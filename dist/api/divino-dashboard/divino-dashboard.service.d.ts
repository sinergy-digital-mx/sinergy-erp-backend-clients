import { Repository } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { QueryDivinoDashboardDto, QueryRevenueSeriesDto } from './dto/query-divino-dashboard.dto';
interface SaleRow {
    contract_id: string;
    contract_date: string;
    total_price: number;
    list_price: number;
    down_payment: number;
    down_payment_target: number | null;
    down_payment_financed: number;
    payment_months: number;
    monthly_payment: number;
    total_area: number;
    seller_id: string | null;
    seller_first_name: string | null;
    seller_last_name: string | null;
    lead_group_id: string | null;
    origin_name: string | null;
    property_code: string | null;
}
export type DivinoDashboardKpis = ReturnType<DivinoDashboardService['computeKpisFromSales']>;
export declare class DivinoDashboardService {
    private readonly contractRepo;
    constructor(contractRepo: Repository<Contract>);
    assertTenant(tenantId: string): void;
    getSummary(tenantId: string, query: QueryDivinoDashboardDto): Promise<{
        filters: ReturnType<DivinoDashboardService["filtersMeta"]>;
        kpis: DivinoDashboardKpis;
        yearly_breakdown?: Array<DivinoDashboardKpis & {
            year: number;
        }>;
    }>;
    getSellers(tenantId: string, query: QueryDivinoDashboardDto): Promise<{
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
    getLeadOrigins(tenantId: string, query: QueryDivinoDashboardDto): Promise<{
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
    getRevenueSeries(tenantId: string, query: QueryRevenueSeriesDto): Promise<{
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
        period: "monthly" | "quarterly" | "semiannual" | "annual";
        year: number | null;
        month: number | null;
        series: {
            bucket: string;
            revenue: number;
            lots_sold: number;
        }[];
    }>;
    computeKpisFromSales(sales: SaleRow[]): {
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
    };
    private buildYearlyBreakdown;
    private fetchSales;
    private fetchToursBySeller;
    private isAllTime;
    private resolveRange;
    private filtersMeta;
    private round;
}
export {};
