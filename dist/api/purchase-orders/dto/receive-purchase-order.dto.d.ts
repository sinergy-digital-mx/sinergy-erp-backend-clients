export declare enum ReceiptLotMode {
    SINGLE = "single",
    MULTIPLE = "multiple"
}
export declare class ReceivedLotDto {
    tag_identifier: string;
    product_uom_id: string;
    quantity: number;
    measure?: number;
    measure_uom_id?: string;
}
export declare class ReceivedItemDto {
    line_item_id: string;
    product_id: string;
    product_uom_id: string;
    quantity: number;
    unit_total: number;
    iva_percentage: number;
    iva_unit: number;
    ieps_percentage: number;
    ieps_unit: number;
    expiration_date?: Date | null;
    lot_mode?: ReceiptLotMode;
    lots?: ReceivedLotDto[];
    measure?: number;
    measure_uom_id?: string;
}
export declare class ReceivePurchaseOrderDto {
    received_items: ReceivedItemDto[];
}
