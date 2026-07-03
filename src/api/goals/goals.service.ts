import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  SalesGoal,
  SalesGoalPeriodType,
  SalesGoalScope,
} from '../../entities/goals/sales-goal.entity';
import { SalesGoalsSettings } from '../../entities/goals/sales-goals-settings.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Role } from '../../entities/rbac/role.entity';
import {
  CreateSalesGoalDto,
  QuerySalesGoalsDto,
  UpdateSalesGoalDto,
} from './dto/create-sales-goal.dto';
import { UpdateGoalsSettingsDto } from './dto/update-goals-settings.dto';

const DEFAULT_COMMISSION_RATE = 1;

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(SalesGoal)
    private readonly goalRepo: Repository<SalesGoal>,
    @InjectRepository(SalesGoalsSettings)
    private readonly settingsRepo: Repository<SalesGoalsSettings>,
    @InjectRepository(BillingBranch)
    private readonly branchRepo: Repository<BillingBranch>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  /** Comisión activa del tenant (%). Default 1 si no hay configuración. */
  async getCommissionRate(tenantId: string): Promise<number> {
    const settings = await this.settingsRepo.findOne({ where: { tenant_id: tenantId } });
    return settings ? Number(settings.commission_rate) : DEFAULT_COMMISSION_RATE;
  }

  async getSettings(tenantId: string) {
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

  async updateSettings(tenantId: string, dto: UpdateGoalsSettingsDto, userId: string) {
    let settings = await this.settingsRepo.findOne({ where: { tenant_id: tenantId } });

    if (!settings) {
      settings = this.settingsRepo.create({
        id: uuidv4(),
        tenant_id: tenantId,
        commission_rate: dto.commission_rate,
        updated_by: userId,
      });
    } else {
      settings.commission_rate = dto.commission_rate;
      settings.updated_by = userId;
    }

    await this.settingsRepo.save(settings);
    return this.getSettings(tenantId);
  }

  async findAll(tenantId: string, filters: QuerySalesGoalsDto) {
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

  async findOne(id: string, tenantId: string) {
    const goal = await this.goalRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['billing_branch', 'role'],
    });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    return this.mapGoal(goal);
  }

  async create(dto: CreateSalesGoalDto, tenantId: string, userId: string) {
    const periodType = dto.period_type ?? SalesGoalPeriodType.MONTH;
    const now = new Date();
    const periodYear = dto.period_year ?? now.getFullYear();
    const periodMonth = dto.period_month ?? now.getMonth() + 1;

    if (periodType === SalesGoalPeriodType.MONTH) {
      if (!periodYear || !periodMonth) {
        throw new BadRequestException('period_year y period_month son obligatorios para metas mensuales');
      }
    }

    if (dto.goal_scope === SalesGoalScope.USER_ROLE && !dto.role_id) {
      throw new BadRequestException('role_id es obligatorio para metas de tipo user_role');
    }

    const branch = await this.branchRepo
      .createQueryBuilder('branch')
      .innerJoin('branch.fiscal_configuration', 'fiscal')
      .where('branch.id = :branchId', { branchId: dto.billing_branch_id })
      .andWhere('fiscal.tenant_id = :tenantId', { tenantId })
      .getOne();
    if (!branch) throw new BadRequestException('Sucursal no válida');

    if (dto.role_id) {
      const role = await this.roleRepo.findOne({
        where: { id: dto.role_id, tenant_id: tenantId },
      });
      if (!role) throw new BadRequestException('Rol no válido');
    }

    const goal = this.goalRepo.create({
      id: uuidv4(),
      tenant_id: tenantId,
      goal_scope: dto.goal_scope,
      billing_branch_id: dto.billing_branch_id,
      role_id: dto.goal_scope === SalesGoalScope.USER_ROLE ? dto.role_id! : null,
      metric_type: dto.metric_type,
      target_value: dto.target_value,
      period_type: periodType,
      period_year: periodType === SalesGoalPeriodType.MONTH ? periodYear : null,
      period_month: periodType === SalesGoalPeriodType.MONTH ? periodMonth : null,
      period_start: null,
      period_end: null,
      is_active: dto.is_active ?? true,
      notes: dto.notes?.trim() || null,
      created_by: userId,
    });

    await this.goalRepo.save(goal);
    return this.findOne(goal.id, tenantId);
  }

  async update(id: string, dto: UpdateSalesGoalDto, tenantId: string) {
    const goal = await this.goalRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!goal) throw new NotFoundException('Meta no encontrada');

    // Metas activas e inactivas se pueden editar sin restricción.
    if (dto.goal_scope !== undefined) goal.goal_scope = dto.goal_scope;

    if (dto.billing_branch_id !== undefined) {
      const branch = await this.branchRepo
        .createQueryBuilder('branch')
        .innerJoin('branch.fiscal_configuration', 'fiscal')
        .where('branch.id = :branchId', { branchId: dto.billing_branch_id })
        .andWhere('fiscal.tenant_id = :tenantId', { tenantId })
        .getOne();
      if (!branch) throw new BadRequestException('Sucursal no válida');
      goal.billing_branch_id = dto.billing_branch_id;
    }

    if (dto.metric_type !== undefined) goal.metric_type = dto.metric_type;
    if (dto.target_value !== undefined) goal.target_value = dto.target_value;
    if (dto.notes !== undefined) goal.notes = dto.notes?.trim() || null;
    if (dto.is_active !== undefined) goal.is_active = dto.is_active;

    if (dto.period_type !== undefined) goal.period_type = dto.period_type;
    if (dto.period_year !== undefined) goal.period_year = dto.period_year;
    if (dto.period_month !== undefined) goal.period_month = dto.period_month;

    const effectiveScope = dto.goal_scope ?? goal.goal_scope;

    if (dto.role_id !== undefined) {
      if (effectiveScope !== SalesGoalScope.USER_ROLE) {
        goal.role_id = null;
      } else {
        if (!dto.role_id) {
          throw new BadRequestException('role_id es obligatorio para metas user_role');
        }
        const role = await this.roleRepo.findOne({
          where: { id: dto.role_id, tenant_id: tenantId },
        });
        if (!role) throw new BadRequestException('Rol no válido');
        goal.role_id = dto.role_id;
      }
    } else if (dto.goal_scope === SalesGoalScope.BRANCH) {
      goal.role_id = null;
    } else if (
      effectiveScope === SalesGoalScope.USER_ROLE &&
      !goal.role_id
    ) {
      throw new BadRequestException('role_id es obligatorio para metas user_role');
    }

    await this.goalRepo.save(goal);
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const goal = await this.goalRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    await this.goalRepo.remove(goal);
    return { success: true, id };
  }

  /** Metas activas para un periodo (usado por reporte Zona Norte). */
  async findActiveForPeriod(
    tenantId: string,
    billingBranchId: string | null,
    year: number,
    month: number,
  ): Promise<SalesGoal[]> {
    const qb = this.goalRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.role', 'role')
      .leftJoinAndSelect('g.billing_branch', 'branch')
      .where('g.tenant_id = :tenantId', { tenantId })
      .andWhere('g.is_active = true')
      .andWhere('g.period_type = :periodType', { periodType: SalesGoalPeriodType.MONTH })
      .andWhere('g.period_year = :year', { year })
      .andWhere('g.period_month = :month', { month });

    if (billingBranchId) {
      qb.andWhere('g.billing_branch_id = :branchId', { branchId: billingBranchId });
    }

    return qb.getMany();
  }

  private mapGoal(goal: SalesGoal) {
    return {
      id: goal.id,
      goal_scope: goal.goal_scope,
      billing_branch_id: goal.billing_branch_id,
      billing_branch: goal.billing_branch
        ? {
            id: goal.billing_branch.id,
            code: goal.billing_branch.code,
            name: (goal.billing_branch as any).name ?? goal.billing_branch.city,
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
}
