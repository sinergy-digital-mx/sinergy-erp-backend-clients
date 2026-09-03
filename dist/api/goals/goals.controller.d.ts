import { GoalsService } from './goals.service';
import { CreateSalesGoalDto, QuerySalesGoalsDto, UpdateSalesGoalDto } from './dto/create-sales-goal.dto';
import { UpdateGoalsSettingsDto } from './dto/update-goals-settings.dto';
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
    getSettings(req: any): Promise<{
        commission_rate: number;
        is_default: boolean;
        updated_at: Date | null;
        updated_by: string | null;
    }>;
    updateSettings(dto: UpdateGoalsSettingsDto, req: any): Promise<{
        commission_rate: number;
        is_default: boolean;
        updated_at: Date | null;
        updated_by: string | null;
    }>;
    findAll(query: QuerySalesGoalsDto, req: any): Promise<{
        id: string;
        goal_scope: import("../../entities/goals/sales-goal.entity").SalesGoalScope;
        billing_branch_id: string;
        billing_branch: {
            id: string;
            code: string;
            name: any;
            city: string;
        } | null;
        role_id: string | null;
        role: {
            id: string;
            name: string;
            description: string;
        } | null;
        metric_type: import("../../entities/goals/sales-goal.entity").SalesGoalMetricType;
        target_value: number;
        period_type: import("../../entities/goals/sales-goal.entity").SalesGoalPeriodType;
        period_year: number | null;
        period_month: number | null;
        period_start: Date | null;
        period_end: Date | null;
        is_active: boolean;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
    }[]>;
    findOne(id: string, req: any): Promise<{
        id: string;
        goal_scope: import("../../entities/goals/sales-goal.entity").SalesGoalScope;
        billing_branch_id: string;
        billing_branch: {
            id: string;
            code: string;
            name: any;
            city: string;
        } | null;
        role_id: string | null;
        role: {
            id: string;
            name: string;
            description: string;
        } | null;
        metric_type: import("../../entities/goals/sales-goal.entity").SalesGoalMetricType;
        target_value: number;
        period_type: import("../../entities/goals/sales-goal.entity").SalesGoalPeriodType;
        period_year: number | null;
        period_month: number | null;
        period_start: Date | null;
        period_end: Date | null;
        is_active: boolean;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    create(dto: CreateSalesGoalDto, req: any): Promise<{
        id: string;
        goal_scope: import("../../entities/goals/sales-goal.entity").SalesGoalScope;
        billing_branch_id: string;
        billing_branch: {
            id: string;
            code: string;
            name: any;
            city: string;
        } | null;
        role_id: string | null;
        role: {
            id: string;
            name: string;
            description: string;
        } | null;
        metric_type: import("../../entities/goals/sales-goal.entity").SalesGoalMetricType;
        target_value: number;
        period_type: import("../../entities/goals/sales-goal.entity").SalesGoalPeriodType;
        period_year: number | null;
        period_month: number | null;
        period_start: Date | null;
        period_end: Date | null;
        is_active: boolean;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    update(id: string, dto: UpdateSalesGoalDto, req: any): Promise<{
        id: string;
        goal_scope: import("../../entities/goals/sales-goal.entity").SalesGoalScope;
        billing_branch_id: string;
        billing_branch: {
            id: string;
            code: string;
            name: any;
            city: string;
        } | null;
        role_id: string | null;
        role: {
            id: string;
            name: string;
            description: string;
        } | null;
        metric_type: import("../../entities/goals/sales-goal.entity").SalesGoalMetricType;
        target_value: number;
        period_type: import("../../entities/goals/sales-goal.entity").SalesGoalPeriodType;
        period_year: number | null;
        period_month: number | null;
        period_start: Date | null;
        period_end: Date | null;
        is_active: boolean;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
        id: string;
    }>;
}
