import { SalesGoalMetricType, SalesGoalPeriodType, SalesGoalScope } from '../../../entities/goals/sales-goal.entity';
export declare class CreateSalesGoalDto {
    goal_scope: SalesGoalScope;
    billing_branch_id: string;
    role_id?: string;
    metric_type: SalesGoalMetricType;
    target_value: number;
    period_type?: SalesGoalPeriodType;
    period_year?: number;
    period_month?: number;
    notes?: string;
    is_active?: boolean;
}
export declare class UpdateSalesGoalDto {
    goal_scope?: SalesGoalScope;
    billing_branch_id?: string;
    role_id?: string | null;
    metric_type?: SalesGoalMetricType;
    target_value?: number;
    period_type?: SalesGoalPeriodType;
    period_year?: number;
    period_month?: number;
    notes?: string | null;
    is_active?: boolean;
}
export declare class QuerySalesGoalsDto {
    billing_branch_id?: string;
    goal_scope?: SalesGoalScope;
    period_year?: number;
    period_month?: number;
    is_active?: boolean;
}
