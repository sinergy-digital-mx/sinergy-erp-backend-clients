import { Lead } from './lead.entity';
import { RBACTenant } from '../rbac/tenant.entity';
export declare class LeadAddress {
    id: number;
    lead: Lead;
    tenant: RBACTenant;
    tenant_id: string;
    type: string;
    street_address: string;
    street_address_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_primary: boolean;
    created_at: Date;
    updated_at: Date;
}
