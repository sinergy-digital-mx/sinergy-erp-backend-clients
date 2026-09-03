import { Repository } from 'typeorm';
import { SalesGoal, SalesGoalPeriodType, SalesGoalScope } from '../../entities/goals/sales-goal.entity';
import { SalesGoalsSettings } from '../../entities/goals/sales-goals-settings.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Role } from '../../entities/rbac/role.entity';
import { CreateSalesGoalDto, QuerySalesGoalsDto, UpdateSalesGoalDto } from './dto/create-sales-goal.dto';
import { UpdateGoalsSettingsDto } from './dto/update-goals-settings.dto';
export declare class GoalsService {
    private readonly goalRepo;
    private readonly settingsRepo;
    private readonly branchRepo;
    private readonly roleRepo;
    constructor(goalRepo: Repository<SalesGoal>, settingsRepo: Repository<SalesGoalsSettings>, branchRepo: Repository<BillingBranch>, roleRepo: Repository<Role>);
    getCommissionRate(tenantId: string): Promise<number>;
    getSettings(tenantId: string): Promise<{
        commission_rate: number;
        is_default: boolean;
        updated_at: Date | null;
        updated_by: string | null;
    }>;
    updateSettings(tenantId: string, dto: UpdateGoalsSettingsDto, userId: string): Promise<{
        commission_rate: number;
        is_default: boolean;
        updated_at: Date | null;
        updated_by: string | null;
    }>;
    findAll(tenantId: string, filters: QuerySalesGoalsDto): Promise<{
        id: string;
        goal_scope: SalesGoalScope;
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
        period_type: SalesGoalPeriodType;
        period_year: number | null;
        period_month: number | null;
        period_start: Date | null;
        period_end: Date | null;
        is_active: boolean;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
    }[]>;
    findOne(id: string, tenantId: string): Promise<{
        id: string;
        goal_scope: SalesGoalScope;
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
        period_type: SalesGoalPeriodType;
        period_year: number | null;
        period_month: number | null;
        period_start: Date | null;
        period_end: Date | null;
        is_active: boolean;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    create(dto: CreateSalesGoalDto, tenantId: string, userId: string): Promise<{
        id: string;
        goal_scope: SalesGoalScope;
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
        period_type: SalesGoalPeriodType;
        period_year: number | null;
        period_month: number | null;
        period_start: Date | null;
        period_end: Date | null;
        is_active: boolean;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    update(id: string, dto: UpdateSalesGoalDto, tenantId: string): Promise<{
        id: string;
        goal_scope: SalesGoalScope;
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
        period_type: SalesGoalPeriodType;
        period_year: number | null;
        period_month: number | null;
        period_start: Date | null;
        period_end: Date | null;
        is_active: boolean;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    remove(id: string, tenantId: string): Promise<{
        success: boolean;
        id: string;
    }>;
    findActiveForPeriod(tenantId: string, billingBranchId: string | null, year: number, month: number): Promise<SalesGoal[]>;
    private mapGoal;
}
