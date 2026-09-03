import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { Customer } from './customer.entity';
export type AssignmentChangeItem = {
    field: string;
    field_label: string;
    from: string | null;
    to: string | null;
    from_id?: string | null;
    to_id?: string | null;
};
export declare class CustomerAssignmentChange {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    customer: Customer;
    customer_id: number;
    type: string;
    title: string;
    description: string | null;
    actor: User | null;
    actor_id: string | null;
    occurred_at: Date;
    changes: AssignmentChangeItem[] | null;
    created_at: Date;
}
