import { RBACTenant } from '../rbac/tenant.entity';
import { Customer } from './customer.entity';
import { FiscalConfiguration } from '../billing/fiscal-configuration.entity';
export declare class CustomerCredit {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    customer: Customer;
    customer_id: number;
    fiscal_configuration: FiscalConfiguration;
    fiscal_configuration_id: string;
    credit_enabled: boolean;
    credit_days: number | null;
    credit_amount: number | null;
    created_at: Date;
    updated_at: Date;
}
