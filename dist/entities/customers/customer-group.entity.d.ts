import { RBACTenant } from '../rbac/tenant.entity';
import { Customer } from './customer.entity';
export declare class CustomerGroup {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    description: string | null;
    is_system: boolean;
    customers: Customer[];
    created_at: Date;
    updated_at: Date;
}
