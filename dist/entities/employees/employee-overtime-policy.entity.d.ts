import { RBACTenant } from '../rbac/tenant.entity';
export declare class EmployeeOvertimePolicy {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    workday_hours: number;
    daily_double_hours: number;
    weekly_double_hours: number;
    double_multiplier: number;
    excess_multiplier: number;
    created_at: Date;
    updated_at: Date;
}
