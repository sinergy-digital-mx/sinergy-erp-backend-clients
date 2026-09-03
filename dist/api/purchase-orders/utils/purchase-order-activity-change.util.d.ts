import { PurchaseOrderActivityChange } from '../../../entities/purchase-orders/purchase-order-activity.entity';
export declare function activityValue(value: unknown): string | null;
export declare function activityChange(field: string, fieldLabel: string, from: unknown, to: unknown): PurchaseOrderActivityChange | null;
export declare function compactActivityChanges(changes: Array<PurchaseOrderActivityChange | null>): PurchaseOrderActivityChange[];
