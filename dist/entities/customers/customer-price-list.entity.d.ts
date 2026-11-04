import { PriceList } from '../products/price-list.entity';
import { RBACTenant } from '../rbac/tenant.entity';
import { Customer } from './customer.entity';
export declare class CustomerPriceList {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    customer: Customer;
    customer_id: number;
    price_list: PriceList;
    price_list_id: string;
    is_default: boolean;
    created_at: Date;
    updated_at: Date;
}
