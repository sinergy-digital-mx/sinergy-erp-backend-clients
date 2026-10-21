export declare class CloneSalesOrderLineDto {
    line_id: string;
    custom_description?: string;
    unit_price?: number;
}
export declare class CloneSalesOrderDto {
    lines?: CloneSalesOrderLineDto[];
    notes?: string;
    expected_delivery_date?: string;
}
