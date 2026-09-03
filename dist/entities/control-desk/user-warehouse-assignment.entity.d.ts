import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
export declare class UserWarehouseAssignment {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    user: User;
    user_id: string;
    warehouse: Warehouse;
    warehouse_id: string;
    created_at: Date;
}
