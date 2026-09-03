export declare class UpdateInventoryAuditLineDto {
    id: string;
    counted_quantity: number;
    reason?: string;
}
export declare class UpdateInventoryAuditLinesDto {
    lines: UpdateInventoryAuditLineDto[];
}
