export declare class CorrectPurchaseReceiptLineDto {
    line_item_id: string;
    quantity?: number;
    unit_total?: number;
}
export declare class CorrectPurchaseReceiptDto {
    lines: CorrectPurchaseReceiptLineDto[];
}
