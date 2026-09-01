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
  SalesReportView,
} from './dto/query-sales-by-seller-report.dto';
import { User } from '../../entities/users/user.entity';
import {
  buildExportSubtitle,
  buildStyledExcelBuffer,
  ExcelColumnDef,
  formatExportDate,
} from '../../common/utils/excel-export.util';

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
  average_ticket: number;
  commission_percentage: number | null;
  commission_amount: number | null;
  goal: {
    has_goal: boolean;
    metric_type: SalesGoalMetricType | null;
    target_value: number | null;
    current_value: number;
    progress_percentage: number;
  } | null;
}

export interface SalesBySellerReportResponse {
  view: SalesReportView;
  view_label: string;
  summary: {
    total_sellers: number;
    people_count: number;
    people_label: string;
    total_sales_count: number;
    total_amount: number;
    average_ticket: number;
    total_commission: number | null;
    commission_rate: number | null;
    top: {
      id: string;
      name: string;
      pos_user_code: number | null;
      amount: number;
      sales_count: number;
    } | null;
    branches: Array<{
      billing_branch_id: string;
      branch_name: string;
      sales_count: number;
      amount: number;
    }>;
  };
  filters_applied: {
    view: SalesReportView;
    fiscal_configuration_id: string | null;
    billing_branch_id: string | null;
    period: SalesReportPeriod;
    period_label: string;
    date_from: string;
    date_to: string;
    commission_rate: number | null;
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
    const view = filters.view ?? SalesReportView.SALES;
    const commissions = view === SalesReportView.COMMISSIONS;
    const period = filters.period ?? SalesReportPeriod.MONTH;
    const tenantCommission = await this.goalsService.getCommissionRate(tenantId);
    const commissionRate = commissions
      ? filters.commission_rate !== undefined && filters.commission_rate !== null
        ? Number(filters.commission_rate)
        : tenantCommission
      : null;
    const { dateFrom, dateTo } = this.resolveDateRange(
      period,
      filters.date_from,
      filters.date_to,
    );

    const personIdSql = commissions
      ? 'COALESCE(assigned_seller.id, seller.id, creator.id)'
      : 'COALESCE(seller.id, creator.id)';
    const personFirstSql = commissions
      ? 'COALESCE(assigned_seller.first_name, seller.first_name, creator.first_name)'
      : 'COALESCE(seller.first_name, creator.first_name)';
    const personLastSql = commissions
      ? 'COALESCE(assigned_seller.last_name, seller.last_name, creator.last_name)'
      : 'COALESCE(seller.last_name, creator.last_name)';
    const personCodeSql = commissions
      ? 'COALESCE(assigned_seller.pos_user_code, seller.pos_user_code)'
      : 'COALESCE(seller.pos_user_code, creator.pos_user_code)';
    const branchIdSql = 'COALESCE(so_branch.id, wh_branch.id)';
    const branchCodeSql = 'COALESCE(so_branch.code, wh_branch.code)';
    const branchCitySql = 'COALESCE(so_branch.city, wh_branch.city)';

    const qb = this.salesOrderRepo
      .createQueryBuilder('so')
      .leftJoin('so.billing_branch', 'so_branch')
      .leftJoin('so.warehouse', 'warehouse')
      .leftJoin('warehouse.billing_branch', 'wh_branch')
      .innerJoin('so.fiscal_configuration', 'fiscal')
      .innerJoin('so.creator', 'creator')
      .leftJoin('so.assigned_seller_user', 'assigned_seller')
      .leftJoin('so.seller_user', 'seller')
      .select(branchIdSql, 'billing_branch_id')
      .addSelect(branchCodeSql, 'branch_code')
      .addSelect(branchCitySql, 'branch_city')
      .addSelect(personIdSql, 'seller_id')
      .addSelect(personFirstSql, 'seller_first_name')
      .addSelect(personLastSql, 'seller_last_name')
      .addSelect(personCodeSql, 'seller_pos_user_code')
      .addSelect('COUNT(so.id)', 'total_sales_count')
      .addSelect('COALESCE(SUM(so.total), 0)', 'amount_sold')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.general_status = :status', { status: 'Surtida' })
      .andWhere('so.created_at >= :dateFrom', { dateFrom })
      .andWhere('so.created_at <= :dateTo', { dateTo })
      .andWhere('COALESCE(so.billing_branch_id, warehouse.billing_branch_id) IS NOT NULL');

    if (filters.fiscal_configuration_id) {
      qb.andWhere('so.fiscal_configuration_id = :fiscalConfigurationId', {
        fiscalConfigurationId: filters.fiscal_configuration_id,
      });
    }

    if (filters.billing_branch_id) {
      qb.andWhere(
        'COALESCE(so.billing_branch_id, warehouse.billing_branch_id) = :billingBranchId',
        { billingBranchId: filters.billing_branch_id },
      );
    }

    qb.groupBy(branchIdSql)
      .addGroupBy(branchCodeSql)
      .addGroupBy(branchCitySql)
      .addGroupBy(personIdSql)
      .addGroupBy(personFirstSql)
      .addGroupBy(personLastSql)
      .addGroupBy(personCodeSql);

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
      branchGoalProgress = this.mapBranchGoal(goal, totals);
    } else if (!filters.billing_branch_id && branchGoals.length === 1) {
      const goal = branchGoals[0];
      const totals = branchTotals.get(goal.billing_branch_id) ?? {
        count: 0,
        amount: 0,
        name: goal.billing_branch
          ? this.buildBranchName(goal.billing_branch.code, goal.billing_branch.city)
          : 'Sucursal',
      };
      branchGoalProgress = this.mapBranchGoal(goal, totals);
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
      const commissionAmount =
        commissions && commissionRate != null
          ? Number(((amountSold * commissionRate) / 100).toFixed(2))
          : null;
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
        average_ticket:
          salesCount > 0 ? Number((amountSold / salesCount).toFixed(2)) : 0,
        commission_percentage: commissions ? commissionRate : null,
        commission_amount: commissionAmount,
        goal: goalBlock,
      };
    });

    rows.sort((a, b) => {
      if (commissions) {
        const aPct = a.goal?.has_goal ? a.goal.progress_percentage : -1;
        const bPct = b.goal?.has_goal ? b.goal.progress_percentage : -1;
        if (bPct !== aPct) return bPct - aPct;
      }
      if (b.amount_sold !== a.amount_sold) return b.amount_sold - a.amount_sold;
      return b.total_sales_count - a.total_sales_count;
    });

    const totalSalesCount = rows.reduce((sum, row) => sum + row.total_sales_count, 0);
    const totalAmount = rows.reduce((sum, row) => sum + row.amount_sold, 0);
    const totalCommission = commissions
      ? Number(
          rows.reduce((sum, row) => sum + Number(row.commission_amount || 0), 0).toFixed(2),
        )
      : null;
    const top = rows[0]
      ? {
          id: rows[0].seller_id,
          name: rows[0].seller_name,
          pos_user_code: rows[0].seller_pos_user_code,
          amount: rows[0].amount_sold,
          sales_count: rows[0].total_sales_count,
        }
      : null;

    const peopleCount = new Set(rows.map((row) => row.seller_id)).size;

    return {
      view,
      view_label: commissions
        ? 'Comisiones por comisionado'
        : 'Ventas por vendedor',
      summary: {
        total_sellers: peopleCount,
        people_count: peopleCount,
        people_label: commissions ? 'Comisionados' : 'Vendedores',
        total_sales_count: totalSalesCount,
        total_amount: Number(totalAmount.toFixed(2)),
        average_ticket:
          totalSalesCount > 0
            ? Number((totalAmount / totalSalesCount).toFixed(2))
            : 0,
        total_commission: totalCommission,
        commission_rate: commissionRate,
        top,
        branches: Array.from(branchTotals.entries())
          .map(([id, totals]) => ({
            billing_branch_id: id,
            branch_name: totals.name,
            sales_count: totals.count,
            amount: Number(totals.amount.toFixed(2)),
          }))
          .sort((a, b) => b.amount - a.amount),
      },
      filters_applied: {
        view,
        fiscal_configuration_id: filters.fiscal_configuration_id ?? null,
        billing_branch_id: filters.billing_branch_id ?? null,
        period,
        period_label: this.periodLabel(period, dateFrom, dateTo),
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

  async exportSalesBySellerExcel(
    tenantId: string,
    filters: QuerySalesBySellerReportDto,
  ): Promise<Buffer> {
    const report = await this.getSalesBySellerReport(tenantId, filters);
    const commissions = report.view === SalesReportView.COMMISSIONS;
    const columns: ExcelColumnDef[] = commissions
      ? [
          { header: 'Sucursal', key: 'branch_name', width: 28 },
          { header: 'Comisionado', key: 'seller_name', width: 26 },
          { header: 'Código POS', key: 'seller_pos_user_code', width: 14, type: 'integer' },
          { header: 'Ventas', key: 'total_sales_count', width: 12, type: 'integer' },
          { header: 'Monto', key: 'amount_sold', width: 14, type: 'currency' },
          { header: 'Ticket promedio', key: 'average_ticket', width: 16, type: 'currency' },
          { header: 'Comisión %', key: 'commission_percentage', width: 12, type: 'percent' },
          { header: 'Comisión $', key: 'commission_amount', width: 14, type: 'currency' },
          { header: 'Avance meta %', key: 'goal_progress', width: 14, type: 'percent' },
        ]
      : [
          { header: 'Sucursal', key: 'branch_name', width: 28 },
          { header: 'Vendedor', key: 'seller_name', width: 26 },
          { header: 'Código POS', key: 'seller_pos_user_code', width: 14, type: 'integer' },
          { header: 'Ventas', key: 'total_sales_count', width: 12, type: 'integer' },
          { header: 'Monto', key: 'amount_sold', width: 14, type: 'currency' },
          { header: 'Ticket promedio', key: 'average_ticket', width: 16, type: 'currency' },
          { header: 'Avance meta %', key: 'goal_progress', width: 14, type: 'percent' },
        ];

    const rows = report.rows.map((row) => ({
      branch_name: row.branch_name,
      seller_name: row.seller_name,
      seller_pos_user_code: row.seller_pos_user_code,
      total_sales_count: row.total_sales_count,
      amount_sold: row.amount_sold,
      average_ticket: row.average_ticket,
      commission_percentage: row.commission_percentage,
      commission_amount: row.commission_amount,
      goal_progress: row.goal?.has_goal ? row.goal.progress_percentage : null,
    }));

    const f = report.filters_applied;
    const subtitle = buildExportSubtitle([
      report.view_label,
      f.period_label,
      `Generado: ${formatExportDate(new Date())}`,
      `${report.summary.people_count} ${report.summary.people_label.toLowerCase()}`,
      `${report.summary.total_sales_count} ventas`,
      `Monto: ${this.formatMoney(report.summary.total_amount)}`,
      commissions && report.summary.total_commission != null
        ? `Comisión: ${this.formatMoney(report.summary.total_commission)}`
        : '',
    ]);

    return buildStyledExcelBuffer({
      sheetName: commissions ? 'Comisiones' : 'Ventas',
      title: commissions ? 'Reporte de comisiones' : 'Reporte de ventas',
      subtitle,
      columns,
      rows,
      headerColor: commissions ? 'FF6B4C9A' : 'FF1B7F5E',
      titleColor: commissions ? 'FF4A2C7A' : 'FF145A47',
    });
  }

  getExportFilename(viewSlug: string): string {
    const day = new Date();
    const ymd = [
      day.getFullYear(),
      String(day.getMonth() + 1).padStart(2, '0'),
      String(day.getDate()).padStart(2, '0'),
    ].join('-');
    return `reporte-${viewSlug}-${ymd}.xlsx`;
  }

  /**
   * Órdenes al hacer click en una fila. `view` define si seller_id es vendedor o comisionado.
   */
  async getSalesBySellerOrders(tenantId: string, filters: QuerySalesBySellerOrdersDto) {
    const view = filters.view ?? SalesReportView.SALES;
    const commissions = view === SalesReportView.COMMISSIONS;
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
      .leftJoinAndSelect('so.assigned_seller_user', 'assigned_seller')
      .leftJoinAndSelect('so.seller_user', 'seller')
      .leftJoinAndSelect('so.billing_branch', 'so_branch')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'wh_branch')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.general_status = :status', { status: 'Surtida' })
      .andWhere('so.created_at >= :dateFrom', { dateFrom })
      .andWhere('so.created_at <= :dateTo', { dateTo });

    if (commissions) {
      qb.andWhere(
        `(so.assigned_seller_user_id = :sellerId
          OR (so.assigned_seller_user_id IS NULL AND so.seller_user_id = :sellerId)
          OR (so.assigned_seller_user_id IS NULL AND so.seller_user_id IS NULL AND so.created_by = :sellerId))`,
        { sellerId },
      );
    } else {
      qb.andWhere(
        `(so.seller_user_id = :sellerId
          OR (so.seller_user_id IS NULL AND so.created_by = :sellerId))`,
        { sellerId },
      );
    }

    if (filters.fiscal_configuration_id) {
      qb.andWhere('so.fiscal_configuration_id = :fiscalConfigurationId', {
        fiscalConfigurationId: filters.fiscal_configuration_id,
      });
    }

    if (filters.billing_branch_id) {
      qb.andWhere(
        'COALESCE(so.billing_branch_id, warehouse.billing_branch_id) = :billingBranchId',
        { billingBranchId: filters.billing_branch_id },
      );
    }

    qb.orderBy('so.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await qb.getManyAndCount();

    const data = orders.map((so) => {
      const companyName = so.customer?.company_name?.trim() || null;
      const personName =
        [so.customer?.name, so.customer?.lastname].filter(Boolean).join(' ').trim() || null;
      const branch = so.billing_branch ?? so.warehouse?.billing_branch ?? null;
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
        seller_name: so.seller_user
          ? this.buildSellerName(so.seller_user.first_name, so.seller_user.last_name)
          : null,
        assigned_seller_name: so.assigned_seller_user
          ? this.buildSellerName(
              so.assigned_seller_user.first_name,
              so.assigned_seller_user.last_name,
            )
          : null,
        branch_name: branch
          ? this.buildBranchName(branch.code, branch.city)
          : null,
        billing_branch_id:
          so.billing_branch_id ?? so.warehouse?.billing_branch_id ?? branch?.id ?? null,
      };
    });

    const amountSold = data.reduce((sum, row) => sum + row.total, 0);

    return {
      view,
      seller: {
        id: sellerId,
        name: seller
          ? this.buildSellerName(seller.first_name, seller.last_name)
          : commissions
            ? 'Comisionado'
            : 'Vendedor',
        role_label: commissions ? 'Comisionado' : 'Vendedor',
        pos_user_code: seller?.pos_user_code ?? null,
      },
      filters_applied: {
        view,
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

  private mapBranchGoal(
    goal: SalesGoal,
    totals: { count: number; amount: number; name: string },
  ) {
    const current =
      goal.metric_type === SalesGoalMetricType.SALES_COUNT
        ? totals.count
        : totals.amount;
    return {
      goal_id: goal.id,
      billing_branch_id: goal.billing_branch_id,
      branch_name: totals.name,
      metric_type: goal.metric_type,
      target_value: Number(goal.target_value),
      current_value: Number(current.toFixed(2)),
      progress_percentage: this.progressPct(current, Number(goal.target_value)),
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

  private periodLabel(
    period: SalesReportPeriod,
    dateFrom: Date,
    dateTo: Date,
  ): string {
    const range = `${formatExportDate(dateFrom)} — ${formatExportDate(dateTo)}`;
    switch (period) {
      case SalesReportPeriod.TODAY:
        return `Hoy · ${range}`;
      case SalesReportPeriod.WEEK:
        return `Semana · ${range}`;
      case SalesReportPeriod.MONTH:
        return `Mes · ${range}`;
      case SalesReportPeriod.YEAR:
        return `Año · ${range}`;
      default:
        return `Rango · ${range}`;
    }
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
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
