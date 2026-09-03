import { RBACTenant } from '../rbac/tenant.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
import { Role } from '../rbac/role.entity';
import { User } from '../users/user.entity';
export declare enum SalesGoalScope {
    BRANCH = "branch",
    USER_ROLE = "user_role"
}
export declare enum SalesGoalMetricType {
    SALES_COUNT = "sales_count",
    AMOUNT = "amount"
}
export declare enum SalesGoalPeriodType {
    MONTH = "month",
    WEEK = "week",
    YEAR = "year",
    CUSTOM = "custom"
}
export declare class SalesGoal {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    goal_scope: SalesGoalScope;
    billing_branch: BillingBranch;
    billing_branch_id: string;
    role: Role | null;
    role_id: string | null;
    metric_type: SalesGoalMetricType;
    target_value: number;
    period_type: SalesGoalPeriodType;
    period_year: number | null;
    period_month: number | null;
    period_start: Date | null;
    period_end: Date | null;
    is_active: boolean;
    notes: string | null;
    creator: User | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
}
