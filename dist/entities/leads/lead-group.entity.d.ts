import { RBACTenant } from '../rbac/tenant.entity';
import { Lead } from './lead.entity';
export declare class LeadGroup {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    description: string;
    leads: Lead[];
    created_at: Date;
    updated_at: Date;
}
