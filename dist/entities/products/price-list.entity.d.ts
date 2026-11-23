import { RBACTenant } from '../rbac/tenant.entity';
export declare class PriceList {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    list_number: number | null;
    margin_percent: number | null;
    description: string;
    is_active: boolean;
    is_margin_default: boolean;
    created_at: Date;
    updated_at: Date;
}
