import { Lead } from './lead.entity';
import { User } from '../users/user.entity';
import { RBACTenant } from '../rbac/tenant.entity';
export declare enum ActivityType {
    CALL = "call",
    EMAIL = "email",
    MEETING = "meeting",
    NOTE = "note",
    TASK = "task",
    FOLLOW_UP = "follow_up"
}
export declare enum ActivityStatus {
    COMPLETED = "completed",
    SCHEDULED = "scheduled",
    CANCELLED = "cancelled",
    IN_PROGRESS = "in_progress"
}
export declare class LeadActivity {
    id: string;
    lead: Lead;
    lead_id: number;
    user: User;
    user_id: string;
    tenant: RBACTenant;
    tenant_id: string;
    type: ActivityType;
    status: ActivityStatus;
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
