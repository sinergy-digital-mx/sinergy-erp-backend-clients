import type { InventoryBatchMovementType } from '../constants/inventory-batch-movements';
export declare class InventoryBatchMovementChangeDto {
    field: string;
    field_label: string;
    from: string | null;
    to: string | null;
}
export declare class InventoryBatchMovementDto {
    id: string;
    occurred_at: Date;
    type: InventoryBatchMovementType;
    type_label: string;
    title: string;
    description: string | null;
    direction: 'in' | 'out' | 'adjust';
    quantity: string | null;
    actor_id: string | null;
    actor_name: string | null;
    authorized_by_id: string | null;
    authorized_by_name: string | null;
    authorized_at: Date | null;
    changes: InventoryBatchMovementChangeDto[];
    metadata: Record<string, unknown>;
}
export declare class InventoryBatchMovementListResponseDto {
    data: InventoryBatchMovementDto[];
    total: number;
}
