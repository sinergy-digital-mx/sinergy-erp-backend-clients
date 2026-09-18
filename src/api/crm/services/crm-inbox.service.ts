import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  CustomerActivity,
  CustomerActivityStatus,
  CustomerActivityType,
} from '../../../entities/customers/customer-activity.entity';
import { User } from '../../../entities/users/user.entity';
import {
  CrmAttentionFilter,
  CrmReportPeriod,
  QueryCrmActivityDto,
} from '../dto/query-crm-activity.dto';
import {
  CrmActivityAuthorDto,
  CrmActivityAuthorsResponseDto,
  CrmActivityCustomerDto,
  CrmActivityItemDto,
  CrmActivityListResponseDto,
  CrmActivityStatsResponseDto,
  CrmActivityUserDto,
} from '../dto/crm-activity-response.dto';

const OPEN_STATUSES = [
  CustomerActivityStatus.SCHEDULED,
  CustomerActivityStatus.IN_PROGRESS,
];

const CLOSED_STATUSES = [
  CustomerActivityStatus.COMPLETED,
  CustomerActivityStatus.CANCELLED,
];

const ALLOWED_SORT = new Set([
  'activity_date',
  'follow_up_date',
  'created_at',
  'title',
  'type',
  'status',
]);

@Injectable()
export class CrmInboxService {
  constructor(
    @InjectRepository(CustomerActivity)
    private readonly activityRepo: Repository<CustomerActivity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async list(
    tenantId: string,
    actorUserId: string,
    hasAdminRole: boolean,
    query: QueryCrmActivityDto,
  ): Promise<CrmActivityListResponseDto> {
    const isCrmAdmin = await this.resolveCrmAdmin(tenantId, actorUserId, hasAdminRole);
    const scopeUserId = this.resolveScopeUserId(isCrmAdmin, actorUserId, query.user_id);

    let page = Number(query.page) || 1;
    let limit = Number(query.limit) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const qb = this.filteredListQuery(tenantId, scopeUserId, query);

    const total = await qb.clone().getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const now = new Date();

    return {
      activities: rows.map((row) => this.mapActivity(row, now)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      is_crm_admin: isCrmAdmin,
    };
  }

  async listForExport(
    tenantId: string,
    actorUserId: string,
    hasAdminRole: boolean,
    query: QueryCrmActivityDto,
  ): Promise<{
    activities: CrmActivityItemDto[];
    is_crm_admin: boolean;
    period_label: string;
  }> {
    const isCrmAdmin = await this.resolveCrmAdmin(tenantId, actorUserId, hasAdminRole);
    const scopeUserId = this.resolveScopeUserId(isCrmAdmin, actorUserId, query.user_id);
    const qb = this.filteredListQuery(tenantId, scopeUserId, query);
    const rows = await qb.take(20000).getMany();
    const now = new Date();
    const period = query.period ?? CrmReportPeriod.MONTH;
    const range = this.resolveDateRange(period, query.date_from, query.date_to);

    return {
      activities: rows.map((row) => this.mapActivity(row, now)),
      is_crm_admin: isCrmAdmin,
      period_label: query.attention
        ? 'Pendientes (sin recorte de periodo)'
        : this.periodLabel(period, range.dateFrom, range.dateTo),
    };
  }

  async stats(
    tenantId: string,
    actorUserId: string,
    hasAdminRole: boolean,
    query: QueryCrmActivityDto,
  ): Promise<CrmActivityStatsResponseDto> {
    const isCrmAdmin = await this.resolveCrmAdmin(tenantId, actorUserId, hasAdminRole);
    const scopeUserId = this.resolveScopeUserId(isCrmAdmin, actorUserId, query.user_id);
    const period = query.period ?? CrmReportPeriod.MONTH;
    const { dateFrom, dateTo } = this.resolveDateRange(
      period,
      query.date_from,
      query.date_to,
    );

    const periodQb = this.countQuery(tenantId, scopeUserId);
    this.applySearchAndType(periodQb, query);
    periodQb.andWhere('activity.activity_date >= :dateFrom', { dateFrom });
    periodQb.andWhere('activity.activity_date <= :dateTo', { dateTo });

    const [typeRows, statusRows] = await Promise.all([
      periodQb
        .clone()
        .select('activity.type', 'type')
        .addSelect('COUNT(activity.id)', 'count')
        .groupBy('activity.type')
        .getRawMany<{ type: string; count: string }>(),
      periodQb
        .clone()
        .select('activity.status', 'status')
        .addSelect('COUNT(activity.id)', 'count')
        .groupBy('activity.status')
        .getRawMany<{ status: string; count: string }>(),
    ]);

    const byType = this.toCountMap(typeRows, 'type');
    const byStatus = this.toCountMap(statusRows, 'status');
    const activities = Object.values(byType).reduce((sum, n) => sum + n, 0);

    const attention = await this.loadAttention(tenantId, scopeUserId);

    return {
      is_crm_admin: isCrmAdmin,
      period: {
        period,
        date_from: this.toDateOnly(dateFrom),
        date_to: this.toDateOnly(dateTo),
        label: this.periodLabel(period, dateFrom, dateTo),
      },
      totals: {
        activities,
        by_type: byType,
        by_status: byStatus,
      },
      attention,
    };
  }

  async authors(
    tenantId: string,
    actorUserId: string,
    hasAdminRole: boolean,
  ): Promise<CrmActivityAuthorsResponseDto> {
    const isCrmAdmin = await this.resolveCrmAdmin(tenantId, actorUserId, hasAdminRole);

    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .innerJoin('activity.user', 'user')
      .select('user.id', 'id')
      .addSelect('user.first_name', 'first_name')
      .addSelect('user.last_name', 'last_name')
      .addSelect('user.email', 'email')
      .addSelect('COUNT(activity.id)', 'activity_count')
      .where('activity.tenant_id = :tenantId', { tenantId })
      .andWhere('activity.user_id IS NOT NULL');

    if (!isCrmAdmin) {
      qb.andWhere('activity.user_id = :actorUserId', { actorUserId });
    }

    const rows = await qb
      .groupBy('user.id')
      .addGroupBy('user.first_name')
      .addGroupBy('user.last_name')
      .addGroupBy('user.email')
      .orderBy('user.first_name', 'ASC')
      .addOrderBy('user.last_name', 'ASC')
      .getRawMany<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        activity_count: string;
      }>();

    const authors: CrmActivityAuthorDto[] = rows.map((row) => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      display_name: this.displayUserName(row),
      activity_count: Number(row.activity_count) || 0,
    }));

    return { is_crm_admin: isCrmAdmin, authors };
  }

  private async loadAttention(
    tenantId: string,
    scopeUserId: string | null,
  ): Promise<CrmActivityStatsResponseDto['attention']> {
    const now = new Date();
    const openQb = this.countQuery(tenantId, scopeUserId);
    openQb.andWhere('activity.status IN (:...openStatuses)', {
      openStatuses: OPEN_STATUSES,
    });

    const followQb = this.countQuery(tenantId, scopeUserId);
    followQb.andWhere('activity.follow_up_date IS NOT NULL');
    followQb.andWhere('activity.status NOT IN (:...closedStatuses)', {
      closedStatuses: CLOSED_STATUSES,
    });

    const [pendingCalls, pendingTasks, pendingFollowUps, overdueFollowUps, upcomingFollowUps] =
      await Promise.all([
        openQb
          .clone()
          .andWhere('activity.type = :callType', { callType: CustomerActivityType.CALL })
          .getCount(),
        openQb
          .clone()
          .andWhere('activity.type = :taskType', { taskType: CustomerActivityType.TASK })
          .getCount(),
        followQb.clone().getCount(),
        followQb
          .clone()
          .andWhere('activity.follow_up_date < :now', { now })
          .getCount(),
        followQb
          .clone()
          .andWhere('activity.follow_up_date >= :now', { now })
          .getCount(),
      ]);

    return {
      pending_calls: pendingCalls,
      pending_follow_ups: pendingFollowUps,
      overdue_follow_ups: overdueFollowUps,
      upcoming_follow_ups: upcomingFollowUps,
      pending_tasks: pendingTasks,
    };
  }

  private baseQuery(
    tenantId: string,
    scopeUserId: string | null,
  ): SelectQueryBuilder<CustomerActivity> {
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .leftJoinAndSelect('activity.customer', 'customer');
    this.applyScope(qb, tenantId, scopeUserId);
    return qb;
  }

  private countQuery(
    tenantId: string,
    scopeUserId: string | null,
  ): SelectQueryBuilder<CustomerActivity> {
    const qb = this.activityRepo.createQueryBuilder('activity');
    this.applyScope(qb, tenantId, scopeUserId);
    return qb;
  }

  private applyScope(
    qb: SelectQueryBuilder<CustomerActivity>,
    tenantId: string,
    scopeUserId: string | null,
  ): void {
    qb.where('activity.tenant_id = :tenantId', { tenantId });
    if (scopeUserId) {
      qb.andWhere('activity.user_id = :scopeUserId', { scopeUserId });
    }
  }

  private filteredListQuery(
    tenantId: string,
    scopeUserId: string | null,
    query: QueryCrmActivityDto,
  ): SelectQueryBuilder<CustomerActivity> {
    const qb = this.baseQuery(tenantId, scopeUserId);
    this.applyListFilters(qb, query);

    if (!query.attention) {
      const { dateFrom, dateTo } = this.resolveDateRange(
        query.period ?? CrmReportPeriod.MONTH,
        query.date_from,
        query.date_to,
      );
      qb.andWhere('activity.activity_date >= :dateFrom', { dateFrom });
      qb.andWhere('activity.activity_date <= :dateTo', { dateTo });
    }

    const sortBy = ALLOWED_SORT.has(query.sort_by ?? '')
      ? query.sort_by!
      : query.attention
        ? 'follow_up_date'
        : 'activity_date';
    const sortOrder = query.sort_order === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(`activity.${sortBy}`, sortOrder);
    qb.addOrderBy('activity.created_at', 'DESC');
    return qb;
  }

  private applyListFilters(
    qb: SelectQueryBuilder<CustomerActivity>,
    query: QueryCrmActivityDto,
  ): void {
    this.applySearchAndType(qb, query);

    if (query.status) {
      qb.andWhere('activity.status = :status', { status: query.status });
    }

    if (query.attention) {
      this.applyAttention(qb, query.attention);
    }
  }

  private applySearchAndType(
    qb: SelectQueryBuilder<CustomerActivity>,
    query: QueryCrmActivityDto,
  ): void {
    if (query.type) {
      qb.andWhere('activity.type = :type', { type: query.type });
    }

    const search = query.search?.trim();
    if (search) {
      qb.andWhere(
        '(LOWER(COALESCE(activity.notes, \'\')) LIKE :search OR LOWER(COALESCE(activity.title, \'\')) LIKE :search OR LOWER(COALESCE(activity.description, \'\')) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }
  }

  private applyAttention(
    qb: SelectQueryBuilder<CustomerActivity>,
    attention: CrmAttentionFilter,
  ): void {
    const now = new Date();

    switch (attention) {
      case CrmAttentionFilter.CALL_PENDING:
        qb.andWhere('activity.type = :attentionType', {
          attentionType: CustomerActivityType.CALL,
        });
        qb.andWhere('activity.status IN (:...openStatuses)', {
          openStatuses: OPEN_STATUSES,
        });
        break;
      case CrmAttentionFilter.TASK_PENDING:
        qb.andWhere('activity.type = :attentionType', {
          attentionType: CustomerActivityType.TASK,
        });
        qb.andWhere('activity.status IN (:...openStatuses)', {
          openStatuses: OPEN_STATUSES,
        });
        break;
      case CrmAttentionFilter.FOLLOW_UP_OVERDUE:
        qb.andWhere('activity.follow_up_date IS NOT NULL');
        qb.andWhere('activity.follow_up_date < :attentionNow', { attentionNow: now });
        qb.andWhere('activity.status NOT IN (:...closedStatuses)', {
          closedStatuses: CLOSED_STATUSES,
        });
        break;
      case CrmAttentionFilter.FOLLOW_UP_PENDING:
      default:
        qb.andWhere('activity.follow_up_date IS NOT NULL');
        qb.andWhere('activity.status NOT IN (:...closedStatuses)', {
          closedStatuses: CLOSED_STATUSES,
        });
        break;
    }
  }

  private async resolveCrmAdmin(
    tenantId: string,
    actorUserId: string,
    hasAdminRole: boolean,
  ): Promise<boolean> {
    if (hasAdminRole) {
      return true;
    }

    const user = await this.userRepo.findOne({
      where: { id: actorUserId, tenant_id: tenantId },
      select: ['id', 'is_crm_admin'],
    });

    return Boolean(user?.is_crm_admin);
  }

  private resolveScopeUserId(
    isCrmAdmin: boolean,
    actorUserId: string,
    requestedUserId?: string,
  ): string | null {
    if (!isCrmAdmin) {
      if (requestedUserId && requestedUserId !== actorUserId) {
        throw new ForbiddenException('No puedes filtrar actividades de otros usuarios');
      }
      return actorUserId;
    }

    return requestedUserId?.trim() || null;
  }

  resolveDateRange(
    period: CrmReportPeriod,
    dateFrom?: string,
    dateTo?: string,
  ): { dateFrom: Date; dateTo: Date } {
    const now = new Date();

    switch (period) {
      case CrmReportPeriod.TODAY:
        return { dateFrom: this.startOfDay(now), dateTo: this.endOfDay(now) };
      case CrmReportPeriod.WEEK: {
        const start = new Date(now);
        const day = start.getDay();
        const diff = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - diff);
        return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
      }
      case CrmReportPeriod.MONTH: {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
      }
      case CrmReportPeriod.YEAR: {
        const start = new Date(now.getFullYear(), 0, 1);
        return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
      }
      case CrmReportPeriod.RANGE:
      default: {
        const from = this.parseDateOnly(dateFrom) ?? this.startOfDay(now);
        const to = this.parseDateOnly(dateTo) ?? this.endOfDay(now);
        return { dateFrom: this.startOfDay(from), dateTo: this.endOfDay(to) };
      }
    }
  }

  private mapActivity(row: CustomerActivity, now: Date): CrmActivityItemDto {
    const followUp = row.follow_up_date ? new Date(row.follow_up_date) : null;
    const isOpen = !CLOSED_STATUSES.includes(row.status);

    return {
      id: row.id,
      customer_id: row.customer_id,
      customer: this.mapCustomer(row.customer, row.customer_id),
      user_id: row.user_id,
      user: this.mapUser(row.user),
      type: row.type,
      status: row.status,
      title: row.title,
      description: row.description ?? null,
      notes: row.notes ?? null,
      activity_date: row.activity_date,
      follow_up_date: row.follow_up_date ?? null,
      duration_minutes: row.duration_minutes ?? null,
      outcome: row.outcome ?? null,
      is_overdue_follow_up: Boolean(followUp && isOpen && followUp < now),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapCustomer(
    customer: CustomerActivity['customer'] | undefined,
    customerId: number,
  ): CrmActivityCustomerDto | null {
    if (!customer) {
      return {
        id: customerId,
        name: '',
        lastname: null,
        company_name: null,
        display_name: `#${customerId}`,
      };
    }

    const person = [customer.name, customer.lastname].filter(Boolean).join(' ').trim();
    const displayName = customer.company_name?.trim() || person || `#${customer.id}`;

    return {
      id: customer.id,
      name: customer.name,
      lastname: customer.lastname ?? null,
      company_name: customer.company_name ?? null,
      display_name: displayName,
    };
  }

  private mapUser(user: CustomerActivity['user'] | undefined): CrmActivityUserDto | null {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      first_name: user.first_name ?? null,
      last_name: user.last_name ?? null,
      email: user.email ?? null,
      display_name: this.displayUserName(user),
    };
  }

  private displayUserName(user: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  }): string {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    return name || user.email || 'Sin nombre';
  }

  private toCountMap(
    rows: Array<{ type?: string; status?: string; count: string }>,
    key: 'type' | 'status',
  ): Record<string, number> {
    return rows.reduce((acc, row) => {
      const label = row[key];
      if (label) {
        acc[label] = Number(row.count) || 0;
      }
      return acc;
    }, {} as Record<string, number>);
  }

  private periodLabel(period: CrmReportPeriod, from: Date, to: Date): string {
    const labels: Record<CrmReportPeriod, string> = {
      [CrmReportPeriod.TODAY]: 'Hoy',
      [CrmReportPeriod.WEEK]: 'Semana',
      [CrmReportPeriod.MONTH]: 'Mes',
      [CrmReportPeriod.YEAR]: 'Año',
      [CrmReportPeriod.RANGE]: `${this.toDateOnly(from)} — ${this.toDateOnly(to)}`,
    };
    return labels[period];
  }

  private parseDateOnly(value?: string): Date | null {
    if (!value) {
      return null;
    }
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) {
      return null;
    }
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private endOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  private toDateOnly(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
