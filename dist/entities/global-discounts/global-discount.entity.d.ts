import { RBACTenant } from '../rbac/tenant.entity';
export declare enum GlobalDiscountType {
    PERCENTAGE = "percentage",
    FIXED = "fixed"
}
export declare class GlobalDiscount {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    discount_type: GlobalDiscountType;
    value: number;
    is_active: boolean;
    valid_from: Date | null;
    valid_to: Date | null;
    created_at: Date;
    updated_at: Date;
}
