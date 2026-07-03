import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import {
  SalesGoal,
  SalesGoalMetricType,
  SalesGoalScope,
} from '../../entities/goals/sales-goal.entity';
import { GoalsService } from '../goals/goals.service';
import {
  QuerySalesBySellerOrdersDto,
  QuerySalesBySellerReportDto,
  SalesReportPeriod,
} from './dto/query-sales-by-seller-report.dto';
import { User } from '../../entities/users/user.entity';

export interface SalesBySellerReportRow {
  billing_branch_id: string;
  branch_code: string;
  branch_initials: string;
  branch_name: string;
  seller_id: string;
  seller_name: string;
  seller_pos_user_code: number | null;
  total_sales_count: number;
  amount_sold: number;
  commission_percentage: number;
  commission_amount: number;
  goal: {
    has_goal: boolean;
    metric_type: SalesGoalMetricType | null;
    target_value: number | null;
    current_value: number;
    progress_percentage: number;
  } | null;
}

export interface SalesBySellerReportResponse {
  summary: {
    total_sellers: number;
    total_sales_count: number;
    total_amount: number;
  };
  filters_applied: {
    fiscal_configuration_id: string | null;
    billing_branch_id: string | null;
    period: SalesReportPeriod;
    date_from: string;
    date_to: string;
    commission_rate: number;
  };
  goals: {
    has_active_goals: boolean;
    message: string | null;
    branch_goal: {
      goal_id: string;
      billing_branch_id: string;
      branch_name: string;
      metric_type: SalesGoalMetricType;
      target_value: number;
      current_value: number;
      progress_percentage: number;
    } | null;
    user_role_goal: {
      goal_id: string;
      role_id: string;
      role_name: string;
      metric_type: SalesGoalMetricType;
      target_value: number;
    } | null;
  };
  rows: SalesBySellerReportRow[];
}

@Injectable()
export class SalesReportsService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly goalsService: GoalsService,
  ) {}

  async getSalesBySellerReport(
    tenantId: string,
    filters: QuerySalesBySellerReportDto,
  ): Promise<SalesBySellerReportResponse> {
    const period = filters.period ?? SalesReportPeriod.MONTH;
    // Comisión del tenant (módulo Metas). Query commission_rate solo como override opcional.
    const tenantCommission = await this.goalsService.getCommissionRate(tenantId);
    const commissionRate =
      filters.commission_rate !== undefined && filters.commission_rate !== null
        ? Number(filters.commission_rate)
        : tenantCommission;
    const { dateFrom, dateTo } = this.resolveDateRange(
      period,
      filters.date_from,
      filters.date_to,
    );

    // Agrupa por seller_user_id (código POS). Si no hay vendedor, cae a created_by (órdenes manuales).
    const qb = this.salesOrderRepo
      .createQueryBuilder('so')
      .innerJoin('so.warehouse', 'warehouse')
      .innerJoin('warehouse.billing_branch', 'branch')
      .innerJoin('so.fiscal_configuration', 'fiscal')
      .innerJoin('so.creator', 'creator')
      .leftJoin('so.seller_user', 'seller')
      .select('branch.id', 'billing_branch_id')
      .addSelect('branch.code', 'branch_code')
      .addSelect('branch.city', 'branch_city')
      .addSelect('COALESCE(seller.id, creator.id)', 'seller_id')
      .addSelect('COALESCE(seller.first_name, creator.first_name)', 'seller_first_name')
      .addSelect('COALESCE(seller.last_name, creator.last_name)', 'seller_last_name')
      .addSelect('seller.pos_user_code', 'seller_pos_user_code')
      .addSelect('COUNT(so.id)', 'total_sales_count')
      .addSelect('COALESCE(SUM(so.total), 0)', 'amount_sold')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.general_status = :status', { status: 'Surtida' })
      .andWhere('so.created_at >= :dateFrom', { dateFrom })
      .andWhere('so.created_at <= :dateTo', { dateTo })
      .andWhere('warehouse.billing_branch_id IS NOT NULL');

    if (filters.fiscal_configuration_id) {
      qb.andWhere('so.fiscal_configuration_id = :fiscalConfigurationId', {
        fiscalConfigurationId: filters.fiscal_configuration_id,
      });
    }

    if (filters.billing_branch_id) {
      qb.andWhere('branch.id = :billingBranchId', {
        billingBranchId: filters.billing_branch_id,
      });
    }

    qb
      .groupBy('branch.id')
      .addGroupBy('branch.code')
      .addGroupBy('branch.city')
      .addGroupBy('COALESCE(seller.id, creator.id)')
      .addGroupBy('COALESCE(seller.first_name, creator.first_name)')
      .addGroupBy('COALESCE(seller.last_name, creator.last_name)')
      .addGroupBy('seller.pos_user_code');

    const rawRows = await qb.getRawMany<{
      billing_branch_id: string;
      branch_code: string;
      branch_city: string;
      seller_id: string;
      seller_first_name: string | null;
      seller_last_name: string | null;
      seller_pos_user_code: string | null;
      total_sales_count: string;
      amount_sold: string;
    }>();

    const periodYear = dateFrom.getFullYear();
    const periodMonth = dateFrom.getMonth() + 1;
    const activeGoals = await this.goalsService.findActiveForPeriod(
      tenantId,
      filters.billing_branch_id ?? null,
      periodYear,
      periodMonth,
    );

    const branchGoals = activeGoals.filter((g) => g.goal_scope === SalesGoalScope.BRANCH);
    const userRoleGoals = activeGoals.filter((g) => g.goal_scope === SalesGoalScope.USER_ROLE);

    const branchGoalByBranch = new Map<string, SalesGoal>();
    for (const g of branchGoals) {
      branchGoalByBranch.set(g.billing_branch_id, g);
    }

    const userRoleGoalByBranch = new Map<string, SalesGoal>();
    for (const g of userRoleGoals) {
      userRoleGoalByBranch.set(g.billing_branch_id, g);
    }

    const branchTotals = new Map<string, { count: number; amount: number; name: string }>();
    for (const row of rawRows) {
      const amountSold = Number(row.amount_sold || 0);
      const count = Number(row.total_sales_count || 0);
      const existing = branchTotals.get(row.billing_branch_id) ?? {
        count: 0,
        amount: 0,
        name: this.buildBranchName(row.branch_code, row.branch_city),
      };
      existing.count += count;
      existing.amount += amountSold;
      branchTotals.set(row.billing_branch_id, existing);
    }

    let branchGoalProgress: SalesBySellerReportResponse['goals']['branch_goal'] = null;
    if (filters.billing_branch_id && branchGoalByBranch.has(filters.billing_branch_id)) {
      const goal = branchGoalByBranch.get(filters.billing_branch_id)!;
      const totals = branchTotals.get(filters.billing_branch_id) ?? {
        count: 0,
        amount: 0,
        name: goal.billing_branch
          ? this.buildBranchName(goal.billing_branch.code, goal.billing_branch.city)
          : 'Sucursal',
      };
      const current =
        goal.metric_type === SalesGoalMetricType.SALES_COUNT
          ? totals.count
          : totals.amount;
      branchGoalProgress = {
        goal_id: goal.id,
        billing_branch_id: goal.billing_branch_id,
        branch_name: totals.name,
        metric_type: goal.metric_type,
        target_value: Number(goal.target_value),
        current_value: Number(current.toFixed(2)),
        progress_percentage: this.progressPct(current, Number(goal.target_value)),
      };
    } else if (!filters.billing_branch_id && branchGoals.length === 1) {
      const goal = branchGoals[0];
      const totals = branchTotals.get(goal.billing_branch_id) ?? {
        count: 0,
        amount: 0,
        name: goal.billing_branch
          ? this.buildBranchName(goal.billing_branch.code, goal.billing_branch.city)
          : 'Sucursal',
      };
      const current =
        goal.metric_type === SalesGoalMetricType.SALES_COUNT
          ? totals.count
          : totals.amount;
      branchGoalProgress = {
        goal_id: goal.id,
        billing_branch_id: goal.billing_branch_id,
        branch_name: totals.name,
        metric_type: goal.metric_type,
        target_value: Number(goal.target_value),
        current_value: Number(current.toFixed(2)),
        progress_percentage: this.progressPct(current, Number(goal.target_value)),
      };
    }

    let userRoleGoalSummary: SalesBySellerReportResponse['goals']['user_role_goal'] = null;
    const primaryUserRoleGoal =
      (filters.billing_branch_id && userRoleGoalByBranch.get(filters.billing_branch_id)) ||
      (userRoleGoals.length === 1 ? userRoleGoals[0] : null);
    if (primaryUserRoleGoal) {
      userRoleGoalSummary = {
        goal_id: primaryUserRoleGoal.id,
        role_id: primaryUserRoleGoal.role_id!,
        role_name: primaryUserRoleGoal.role?.name ?? 'Rol',
        metric_type: primaryUserRoleGoal.metric_type,
        target_value: Number(primaryUserRoleGoal.target_value),
      };
    }

    const hasActiveGoals = activeGoals.length > 0;

    const rows: SalesBySellerReportRow[] = rawRows.map((row) => {
      const amountSold = Number(row.amount_sold || 0);
      const salesCount = Number(row.total_sales_count || 0);
      const commissionAmount = Number(((amountSold * commissionRate) / 100).toFixed(2));
      const userGoal = userRoleGoalByBranch.get(row.billing_branch_id);

      let goalBlock: SalesBySellerReportRow['goal'] = null;
      if (userGoal) {
        const current =
          userGoal.metric_type === SalesGoalMetricType.SALES_COUNT
            ? salesCount
            : amountSold;
        goalBlock = {
          has_goal: true,
          metric_type: userGoal.metric_type,
          target_value: Number(userGoal.target_value),
          current_value: Number(current.toFixed(2)),
          progress_percentage: this.progressPct(current, Number(userGoal.target_value)),
        };
      } else if (hasActiveGoals) {
        goalBlock = {
          has_goal: false,
          metric_type: null,
          target_value: null,
          current_value: 0,
          progress_percentage: 0,
        };
      }

      return {
        billing_branch_id: row.billing_branch_id,
        branch_code: row.branch_code,
        branch_initials: this.buildBranchInitials(row.branch_code, row.branch_city),
        branch_name: this.buildBranchName(row.branch_code, row.branch_city),
        seller_id: row.seller_id,
        seller_name: this.buildSellerName(row.seller_first_name, row.seller_last_name),
        seller_pos_user_code: row.seller_pos_user_code
          ? Number(row.seller_pos_user_code)
          : null,
        total_sales_count: salesCount,
        amount_sold: amountSold,
        commission_percentage: commissionRate,
        commission_amount: commissionAmount,
        goal: goalBlock,
      };
    });

    // Orden por competitividad (mayor avance de meta primero); sin meta, por monto.
    rows.sort((a, b) => {
      const aPct = a.goal?.has_goal ? a.goal.progress_percentage : -1;
      const bPct = b.goal?.has_goal ? b.goal.progress_percentage : -1;
      if (bPct !== aPct) return bPct - aPct;
      return b.amount_sold - a.amount_sold;
    });

    const totalSalesCount = rows.reduce((sum, row) => sum + row.total_sales_count, 0);
    const totalAmount = rows.reduce((sum, row) => sum + row.amount_sold, 0);

    return {
      summary: {
        total_sellers: new Set(rows.map((row) => row.seller_id)).size,
        total_sales_count: totalSalesCount,
        total_amount: Number(totalAmount.toFixed(2)),
      },
      filters_applied: {
        fiscal_configuration_id: filters.fiscal_configuration_id ?? null,
        billing_branch_id: filters.billing_branch_id ?? null,
        period,
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString(),
        commission_rate: commissionRate,
      },
      goals: {
        has_active_goals: hasActiveGoals,
        message: hasActiveGoals
          ? null
          : `No hay metas activas para ${periodMonth.toString().padStart(2, '0')}/${periodYear}`,
        branch_goal: branchGoalProgress,
        user_role_goal: userRoleGoalSummary,
      },
      rows,
    };
  }

  /**
   * Órdenes del vendedor al hacer click en una fila del reporte.
   * Misma lógica de atribución: seller_user_id o, si no hay, created_by.
   */
  async getSalesBySellerOrders(tenantId: string, filters: QuerySalesBySellerOrdersDto) {
    const period = filters.period ?? SalesReportPeriod.MONTH;
    const { dateFrom, dateTo } = this.resolveDateRange(
      period,
      filters.date_from,
      filters.date_to,
    );
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const sellerId = filters.seller_id;

    const seller = await this.userRepo.findOne({
      where: { id: sellerId, tenant_id: tenantId },
    });

    const qb = this.salesOrderRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.seller_user', 'seller')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'branch')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.general_status = :status', { status: 'Surtida' })
      .andWhere('so.created_at >= :dateFrom', { dateFrom })
      .andWhere('so.created_at <= :dateTo', { dateTo })
      .andWhere(
        '(so.seller_user_id = :sellerId OR (so.seller_user_id IS NULL AND so.created_by = :sellerId))',
        { sellerId },
      );

    if (filters.fiscal_configuration_id) {
      qb.andWhere('so.fiscal_configuration_id = :fiscalConfigurationId', {
        fiscalConfigurationId: filters.fiscal_configuration_id,
      });
    }

    if (filters.billing_branch_id) {
      qb.andWhere('warehouse.billing_branch_id = :billingBranchId', {
        billingBranchId: filters.billing_branch_id,
      });
    }

    qb.orderBy('so.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await qb.getManyAndCount();

    const data = orders.map((so) => {
      const companyName = so.customer?.company_name?.trim() || null;
      const personName =
        [so.customer?.name, so.customer?.lastname].filter(Boolean).join(' ').trim() || null;
      return {
        id: so.id,
        folio: so.folio,
        created_at: so.created_at,
        total: Number(so.total),
        payment_status: so.payment_status,
        general_status: so.general_status,
        sales_order_type: so.sales_order_type,
        customer_company_name: companyName,
        customer_person_name: personName,
        customer_display_name: companyName || personName,
        branch_name: so.warehouse?.billing_branch
          ? this.buildBranchName(
              so.warehouse.billing_branch.code,
              so.warehouse.billing_branch.city,
            )
          : null,
        billing_branch_id: so.warehouse?.billing_branch_id ?? null,
      };
    });

    const amountSold = data.reduce((sum, row) => sum + row.total, 0);

    return {
      seller: {
        id: sellerId,
        name: seller
          ? this.buildSellerName(seller.first_name, seller.last_name)
          : 'Vendedor',
        pos_user_code: seller?.pos_user_code ?? null,
      },
      filters_applied: {
        seller_id: sellerId,
        fiscal_configuration_id: filters.fiscal_configuration_id ?? null,
        billing_branch_id: filters.billing_branch_id ?? null,
        period,
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString(),
      },
      summary: {
        total_sales_count: total,
        amount_sold: Number(amountSold.toFixed(2)),
      },
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  private progressPct(current: number, target: number): number {
    if (!target || target <= 0) return 0;
    return Number(Math.min(100, (current / target) * 100).toFixed(2));
  }

  private resolveDateRange(
    period: SalesReportPeriod,
    dateFrom?: string,
    dateTo?: string,
  ): { dateFrom: Date; dateTo: Date } {
    const now = new Date();

    switch (period) {
      case SalesReportPeriod.TODAY:
        return {
          dateFrom: this.startOfDay(now),
          dateTo: this.endOfDay(now),
        };
      case SalesReportPeriod.WEEK: {
        const start = new Date(now);
        const day = start.getDay();
        const diff = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - diff);
        return {
          dateFrom: this.startOfDay(start),
          dateTo: this.endOfDay(now),
        };
      }
      case SalesReportPeriod.MONTH: {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          dateFrom: this.startOfDay(start),
          dateTo: this.endOfDay(now),
        };
      }
      case SalesReportPeriod.YEAR: {
        const start = new Date(now.getFullYear(), 0, 1);
        return {
          dateFrom: this.startOfDay(start),
          dateTo: this.endOfDay(now),
        };
      }
      case SalesReportPeriod.RANGE:
      default: {
        const from = dateFrom ? new Date(dateFrom) : this.startOfDay(now);
        const to = dateTo ? new Date(dateTo) : this.endOfDay(now);
        return {
          dateFrom: this.startOfDay(from),
          dateTo: this.endOfDay(to),
        };
      }
    }
  }

  private startOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  private endOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
  }

  private buildSellerName(firstName?: string | null, lastName?: string | null): string {
    return [firstName, lastName].filter(Boolean).join(' ').trim() || 'Sin nombre';
  }

  private buildBranchName(code?: string | null, city?: string | null): string {
    if (city && code) return `${city} (${code})`;
    return city || code || 'Sucursal';
  }

  private buildBranchInitials(code?: string | null, city?: string | null): string {
    if (code) {
      return code.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
    }

    if (!city) return 'SU';

    const words = city.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
    }

    return city.slice(0, 2).toUpperCase();
  }
}
