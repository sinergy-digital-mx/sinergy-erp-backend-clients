import { Customer } from './customer.entity';
import { User } from '../users/user.entity';
import { RBACTenant } from '../rbac/tenant.entity';
export declare enum CustomerActivityType {
    CALL = "call",
    EMAIL = "email",
    MEETING = "meeting",
    NOTE = "note",
    TASK = "task",
    FOLLOW_UP = "follow_up",
    PURCHASE = "purchase",
    SUPPORT = "support"
}
export declare enum CustomerActivityStatus {
    COMPLETED = "completed",
    SCHEDULED = "scheduled",
    CANCELLED = "cancelled",
    IN_PROGRESS = "in_progress"
}
export declare class CustomerActivity {
    id: string;
    customer: Customer;
    customer_id: number;
    user: User;
    user_id: string;
    tenant: RBACTenant;
    tenant_id: string;
    type: CustomerActivityType;
    status: CustomerActivityStatus;
    title: string;
    description: string;
    activity_date: Date;
    duration_minutes: number;
    outcome: string;
    follow_up_date: Date;
    notes: string;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
