import { RBACTenant } from '../rbac/tenant.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
export declare class Warehouse {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    code: string;
    prefix: string | null;
    description: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    status: string;
    billing_branch: BillingBranch | null;
    billing_branch_id: string;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
