import { DataSource } from 'typeorm';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { QueryStockReplenishmentDto } from './dto/query-stock-replenishment.dto';
import { AveragePriceSource, ReplenishmentStatus, SalesTrend } from './utils/stock-replenishment.util';
export interface StockReplenishmentVendorOption {
    id: string;
    legal_name: string;
    rfc: string | null;
    product_count: number;
}
export interface StockReplenishmentBranchColumn {
    id: string;
    name: string;
}
export interface StockReplenishmentBranchCell {
    branch_id: string;
    on_hand: number;
    sold_qty: number;
    difference: number;
}
export interface StockReplenishmentRow {
    product_id: string;
    sku: string;
    external_sku: string | null;
    name: string;
    uom_name: string | null;
    branches: StockReplenishmentBranchCell[];
    on_hand: number;
    sold_qty: number;
    previous_sold_qty: number;
    difference: number;
    average_price: number | null;
    price_source: AveragePriceSource;
    unit_cost: number | null;
    cost_currency: string;
    unit_margin: number | null;
    margin_percent: number | null;
    daily_rate: number;
    trend: SalesTrend;
    trend_factor: number;
    min_stock: number;
    max_stock: number;
    days_of_cover: number | null;
    recommended_qty: number;
    status: ReplenishmentStatus;
    transfer_hint: boolean;
}
export interface StockReplenishmentReport {
    vendor: {
        id: string;
        legal_name: string;
        rfc: string | null;
    };
    period_days: number;
    cover_days: number;
    safety_days: number;
    period_from: string;
    period_to: string;
    period_label: string;
    exchange_rate: number | null;
    formula: string;
    branches: StockReplenishmentBranchColumn[];
    rows: StockReplenishmentRow[];
    summary: {
        product_count: number;
        reorder_count: number;
        out_of_stock_count: number;
        no_movement_count: number;
    };
}
export declare class ReportsService {
    private readonly dataSource;
    private readonly exchangeRateService;
    constructor(dataSource: DataSource, exchangeRateService: ExchangeRateService);
    listVendors(tenantId: string): Promise<{
        vendors: StockReplenishmentVendorOption[];
    }>;
    getStockReplenishment(tenantId: string, query: QueryStockReplenishmentDto): Promise<StockReplenishmentReport>;
    private findVendor;
    private loadVendorProducts;
    private loadStock;
    private loadSales;
    private loadListPrices;
    private loadBranches;
    private readExchangeRate;
}
