"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const sales_goal_entity_1 = require("../../entities/goals/sales-goal.entity");
const sales_goals_settings_entity_1 = require("../../entities/goals/sales-goals-settings.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const role_entity_1 = require("../../entities/rbac/role.entity");
const DEFAULT_COMMISSION_RATE = 1;
let GoalsService = class GoalsService {
    goalRepo;
    settingsRepo;
    branchRepo;
    roleRepo;
    constructor(goalRepo, settingsRepo, branchRepo, roleRepo) {
        this.goalRepo = goalRepo;
        this.settingsRepo = settingsRepo;
        this.branchRepo = branchRepo;
        this.roleRepo = roleRepo;
    }
    async getCommissionRate(tenantId) {
        const settings = await this.settingsRepo.findOne({ where: { tenant_id: tenantId } });
        return settings ? Number(settings.commission_rate) : DEFAULT_COMMISSION_RATE;
    }
    async getSettings(tenantId) {
        const settings = await this.settingsRepo.findOne({ where: { tenant_id: tenantId } });
        return {
            commission_rate: settings
                ? Number(settings.commission_rate)
                : DEFAULT_COMMISSION_RATE,
            is_default: !settings,
            updated_at: settings?.updated_at ?? null,
            updated_by: settings?.updated_by ?? null,
        };
    }
    async updateSettings(tenantId, dto, userId) {
        let settings = await this.settingsRepo.findOne({ where: { tenant_id: tenantId } });
        if (!settings) {
            settings = this.settingsRepo.create({
                id: (0, uuid_1.v4)(),
                tenant_id: tenantId,
                commission_rate: dto.commission_rate,
                updated_by: userId,
            });
        }
        else {
            settings.commission_rate = dto.commission_rate;
            settings.updated_by = userId;
        }
        await this.settingsRepo.save(settings);
        return this.getSettings(tenantId);
    }
    async findAll(tenantId, filters) {
        const qb = this.goalRepo
            .createQueryBuilder('g')
            .leftJoinAndSelect('g.billing_branch', 'branch')
            .leftJoinAndSelect('g.role', 'role')
            .where('g.tenant_id = :tenantId', { tenantId })
            .orderBy('g.period_year', 'DESC')
            .addOrderBy('g.period_month', 'DESC')
            .addOrderBy('g.created_at', 'DESC');
        if (filters.billing_branch_id) {
            qb.andWhere('g.billing_branch_id = :branchId', {
                branchId: filters.billing_branch_id,
            });
        }
        if (filters.goal_scope) {
            qb.andWhere('g.goal_scope = :scope', { scope: filters.goal_scope });
        }
        if (filters.period_year) {
            qb.andWhere('g.period_year = :year', { year: filters.period_year });
        }
        if (filters.period_month) {
            qb.andWhere('g.period_month = :month', { month: filters.period_month });
        }
        if (filters.is_active !== undefined) {
            qb.andWhere('g.is_active = :active', { active: filters.is_active });
        }
        const goals = await qb.getMany();
        return goals.map((g) => this.mapGoal(g));
    }
    async findOne(id, tenantId) {
        const goal = await this.goalRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['billing_branch', 'role'],
        });
        if (!goal)
            throw new common_1.NotFoundException('Meta no encontrada');
        return this.mapGoal(goal);
    }
    async create(dto, tenantId, userId) {
        const periodType = dto.period_type ?? sales_goal_entity_1.SalesGoalPeriodType.MONTH;
        const now = new Date();
        const periodYear = dto.period_year ?? now.getFullYear();
        const periodMonth = dto.period_month ?? now.getMonth() + 1;
        if (periodType === sales_goal_entity_1.SalesGoalPeriodType.MONTH) {
            if (!periodYear || !periodMonth) {
                throw new common_1.BadRequestException('period_year y period_month son obligatorios para metas mensuales');
            }
        }
        if (dto.goal_scope === sales_goal_entity_1.SalesGoalScope.USER_ROLE && !dto.role_id) {
            throw new common_1.BadRequestException('role_id es obligatorio para metas de tipo user_role');
        }
        const branch = await this.branchRepo
            .createQueryBuilder('branch')
            .innerJoin('branch.fiscal_configuration', 'fiscal')
            .where('branch.id = :branchId', { branchId: dto.billing_branch_id })
            .andWhere('fiscal.tenant_id = :tenantId', { tenantId })
            .getOne();
        if (!branch)
            throw new common_1.BadRequestException('Sucursal no válida');
        if (dto.role_id) {
            const role = await this.roleRepo.findOne({
                where: { id: dto.role_id, tenant_id: tenantId },
            });
            if (!role)
                throw new common_1.BadRequestException('Rol no válido');
        }
        const goal = this.goalRepo.create({
            id: (0, uuid_1.v4)(),
            tenant_id: tenantId,
            goal_scope: dto.goal_scope,
            billing_branch_id: dto.billing_branch_id,
            role_id: dto.goal_scope === sales_goal_entity_1.SalesGoalScope.USER_ROLE ? dto.role_id : null,
            metric_type: dto.metric_type,
            target_value: dto.target_value,
            period_type: periodType,
            period_year: periodType === sales_goal_entity_1.SalesGoalPeriodType.MONTH ? periodYear : null,
            period_month: periodType === sales_goal_entity_1.SalesGoalPeriodType.MONTH ? periodMonth : null,
            period_start: null,
            period_end: null,
            is_active: dto.is_active ?? true,
            notes: dto.notes?.trim() || null,
            created_by: userId,
        });
        await this.goalRepo.save(goal);
        return this.findOne(goal.id, tenantId);
    }
    async update(id, dto, tenantId) {
        const goal = await this.goalRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!goal)
            throw new common_1.NotFoundException('Meta no encontrada');
        if (dto.goal_scope !== undefined)
            goal.goal_scope = dto.goal_scope;
        if (dto.billing_branch_id !== undefined) {
            const branch = await this.branchRepo
                .createQueryBuilder('branch')
                .innerJoin('branch.fiscal_configuration', 'fiscal')
                .where('branch.id = :branchId', { branchId: dto.billing_branch_id })
                .andWhere('fiscal.tenant_id = :tenantId', { tenantId })
                .getOne();
            if (!branch)
                throw new common_1.BadRequestException('Sucursal no válida');
            goal.billing_branch_id = dto.billing_branch_id;
        }
        if (dto.metric_type !== undefined)
            goal.metric_type = dto.metric_type;
        if (dto.target_value !== undefined)
            goal.target_value = dto.target_value;
        if (dto.notes !== undefined)
            goal.notes = dto.notes?.trim() || null;
        if (dto.is_active !== undefined)
            goal.is_active = dto.is_active;
        if (dto.period_type !== undefined)
            goal.period_type = dto.period_type;
        if (dto.period_year !== undefined)
            goal.period_year = dto.period_year;
        if (dto.period_month !== undefined)
            goal.period_month = dto.period_month;
        const effectiveScope = dto.goal_scope ?? goal.goal_scope;
        if (dto.role_id !== undefined) {
            if (effectiveScope !== sales_goal_entity_1.SalesGoalScope.USER_ROLE) {
                goal.role_id = null;
            }
            else {
                if (!dto.role_id) {
                    throw new common_1.BadRequestException('role_id es obligatorio para metas user_role');
                }
                const role = await this.roleRepo.findOne({
                    where: { id: dto.role_id, tenant_id: tenantId },
                });
                if (!role)
                    throw new common_1.BadRequestException('Rol no válido');
                goal.role_id = dto.role_id;
            }
        }
        else if (dto.goal_scope === sales_goal_entity_1.SalesGoalScope.BRANCH) {
            goal.role_id = null;
        }
        else if (effectiveScope === sales_goal_entity_1.SalesGoalScope.USER_ROLE &&
            !goal.role_id) {
            throw new common_1.BadRequestException('role_id es obligatorio para metas user_role');
        }
        await this.goalRepo.save(goal);
        return this.findOne(id, tenantId);
    }
    async remove(id, tenantId) {
        const goal = await this.goalRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!goal)
            throw new common_1.NotFoundException('Meta no encontrada');
        await this.goalRepo.remove(goal);
        return { success: true, id };
    }
    async findActiveForPeriod(tenantId, billingBranchId, year, month) {
        const qb = this.goalRepo
            .createQueryBuilder('g')
            .leftJoinAndSelect('g.role', 'role')
            .leftJoinAndSelect('g.billing_branch', 'branch')
            .where('g.tenant_id = :tenantId', { tenantId })
            .andWhere('g.is_active = true')
            .andWhere('g.period_type = :periodType', { periodType: sales_goal_entity_1.SalesGoalPeriodType.MONTH })
            .andWhere('g.period_year = :year', { year })
            .andWhere('g.period_month = :month', { month });
        if (billingBranchId) {
            qb.andWhere('g.billing_branch_id = :branchId', { branchId: billingBranchId });
        }
        return qb.getMany();
    }
    mapGoal(goal) {
        return {
            id: goal.id,
            goal_scope: goal.goal_scope,
            billing_branch_id: goal.billing_branch_id,
            billing_branch: goal.billing_branch
                ? {
                    id: goal.billing_branch.id,
                    code: goal.billing_branch.code,
                    name: goal.billing_branch.name ?? goal.billing_branch.city,
                    city: goal.billing_branch.city,
                }
                : null,
            role_id: goal.role_id,
            role: goal.role
                ? { id: goal.role.id, name: goal.role.name, description: goal.role.description }
                : null,
            metric_type: goal.metric_type,
            target_value: Number(goal.target_value),
            period_type: goal.period_type,
            period_year: goal.period_year,
            period_month: goal.period_month,
            period_start: goal.period_start,
            period_end: goal.period_end,
            is_active: goal.is_active,
            notes: goal.notes,
            created_at: goal.created_at,
            updated_at: goal.updated_at,
        };
    }
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_goal_entity_1.SalesGoal)),
    __param(1, (0, typeorm_1.InjectRepository)(sales_goals_settings_entity_1.SalesGoalsSettings)),
    __param(2, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(3, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GoalsService);
//# sourceMappingURL=goals.service.js.map