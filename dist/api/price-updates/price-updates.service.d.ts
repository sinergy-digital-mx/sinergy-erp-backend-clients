import { DataSource } from 'typeorm';
import { UpdatePriceUpdateRowDto } from './dto/update-price-update-row.dto';
import { QueryPriceUpdateDto } from './dto/query-price-update.dto';
export interface PriceUpdateListView {
    id: string;
    name: string;
    list_number: number | null;
    margin_percent: number | null;
    label: string;
}
export interface PriceUpdateUomView {
    id: string;
    name: string;
    factor: number;
    is_base: boolean;
}
export interface PriceUpdatePriceView {
    price_list_id: string;
    product_uom_id: string;
    price: number;
}
export interface PriceUpdateRowView {
    id: string;
    sku: string;
    code: string;
    name: string;
    uoms: PriceUpdateUomView[];
    cost_1: number | null;
    cost_2: number | null;
    average_cost: number | null;
    purchase_1: {
        folio: string;
        purchased_at: string;
    } | null;
    purchase_2: {
        folio: string;
        purchased_at: string;
    } | null;
    prices: PriceUpdatePriceView[];
}
export interface PriceUpdateSheet {
    price_lists: PriceUpdateListView[];
    data: PriceUpdateRowView[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
}
export declare class PriceUpdatesService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getSheet(tenantId: string, query: QueryPriceUpdateDto): Promise<PriceUpdateSheet>;
    updateRow(tenantId: string, productId: string, dto: UpdatePriceUpdateRowDto): Promise<PriceUpdateRowView>;
    private findProduct;
    private assertPricesBelong;
    private upsertPrices;
    private loadLists;
    private loadProducts;
    private hydrate;
    private loadUoms;
    private loadPrices;
    private loadPurchases;
}
