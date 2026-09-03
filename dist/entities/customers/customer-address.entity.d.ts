import { Customer } from './customer.entity';
import { RBACTenant } from '../rbac/tenant.entity';
export declare class CustomerAddress {
    id: number;
    customer: Customer;
    customer_id: number;
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
    latitude: number | null;
    longitude: number | null;
    has_gps: number;
    address_source: string | null;
    status: number;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}
