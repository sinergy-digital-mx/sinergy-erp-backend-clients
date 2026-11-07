export declare class PriceUpdatePriceDto {
    price_list_id: string;
    product_uom_id: string;
    price: number;
}
export declare class UpdatePriceUpdateRowDto {
    average_cost?: number;
    prices?: PriceUpdatePriceDto[];
}
