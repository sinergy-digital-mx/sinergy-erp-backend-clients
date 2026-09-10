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
exports.CrmInboxService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_activity_entity_1 = require("../../../entities/customers/customer-activity.entity");
const user_entity_1 = require("../../../entities/users/user.entity");
const query_crm_activity_dto_1 = require("../dto/query-crm-activity.dto");
const OPEN_STATUSES = [
    customer_activity_entity_1.CustomerActivityStatus.SCHEDULED,
    customer_activity_entity_1.CustomerActivityStatus.IN_PROGRESS,
];
const CLOSED_STATUSES = [
    customer_activity_entity_1.CustomerActivityStatus.COMPLETED,
    customer_activity_entity_1.CustomerActivityStatus.CANCELLED,
];
const ALLOWED_SORT = new Set([
    'activity_date',
    'follow_up_date',
    'created_at',
    'title',
    'type',
    'status',
]);
let CrmInboxService = class CrmInboxService {
    activityRepo;
    userRepo;
    constructor(activityRepo, userRepo) {
        this.activityRepo = activityRepo;
        this.userRepo = userRepo;
    }
    async list(tenantId, actorUserId, hasAdminRole, query) {
        const isCrmAdmin = await this.resolveCrmAdmin(tenantId, actorUserId, hasAdminRole);
        const scopeUserId = this.resolveScopeUserId(isCrmAdmin, actorUserId, query.user_id);
        let page = Number(query.page) || 1;
        let limit = Number(query.limit) || 20;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 100)
            limit = 100;
        const qb = this.baseQuery(tenantId, scopeUserId);
        this.applyListFilters(qb, query);
        if (!query.attention) {
            const { dateFrom, dateTo } = this.resolveDateRange(query.period ?? query_crm_activity_dto_1.CrmReportPeriod.MONTH, query.date_from, query.date_to);
            qb.andWhere('activity.activity_date >= :dateFrom', { dateFrom });
            qb.andWhere('activity.activity_date <= :dateTo', { dateTo });
        }
        const sortBy = ALLOWED_SORT.has(query.sort_by ?? '')
            ? query.sort_by
            : query.attention
                ? 'follow_up_date'
                : 'activity_date';
        const sortOrder = query.sort_order === 'ASC' ? 'ASC' : 'DESC';
        qb.orderBy(`activity.${sortBy}`, sortOrder);
        qb.addOrderBy('activity.created_at', 'DESC');
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
    async stats(tenantId, actorUserId, hasAdminRole, query) {
        const isCrmAdmin = await this.resolveCrmAdmin(tenantId, actorUserId, hasAdminRole);
        const scopeUserId = this.resolveScopeUserId(isCrmAdmin, actorUserId, query.user_id);
        const period = query.period ?? query_crm_activity_dto_1.CrmReportPeriod.MONTH;
        const { dateFrom, dateTo } = this.resolveDateRange(period, query.date_from, query.date_to);
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
                .getRawMany(),
            periodQb
                .clone()
                .select('activity.status', 'status')
                .addSelect('COUNT(activity.id)', 'count')
                .groupBy('activity.status')
                .getRawMany(),
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
    async authors(tenantId, actorUserId, hasAdminRole) {
        const isCrmAdmin = await this.resolveCrmAdmin(tenantId, actorUserId, hasAdminRole);
        if (!isCrmAdmin) {
            return { is_crm_admin: false, authors: [] };
        }
        const rows = await this.activityRepo
            .createQueryBuilder('activity')
            .innerJoin('activity.user', 'user')
            .select('user.id', 'id')
            .addSelect('user.first_name', 'first_name')
            .addSelect('user.last_name', 'last_name')
            .addSelect('user.email', 'email')
            .addSelect('COUNT(activity.id)', 'activity_count')
            .where('activity.tenant_id = :tenantId', { tenantId })
            .andWhere('activity.user_id IS NOT NULL')
            .groupBy('user.id')
            .addGroupBy('user.first_name')
            .addGroupBy('user.last_name')
            .addGroupBy('user.email')
            .orderBy('user.first_name', 'ASC')
            .addOrderBy('user.last_name', 'ASC')
            .getRawMany();
        const authors = rows.map((row) => ({
            id: row.id,
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            display_name: this.displayUserName(row),
            activity_count: Number(row.activity_count) || 0,
        }));
        return { is_crm_admin: true, authors };
    }
    async loadAttention(tenantId, scopeUserId) {
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
        const [pendingCalls, pendingTasks, pendingFollowUps, overdueFollowUps, upcomingFollowUps] = await Promise.all([
            openQb
                .clone()
                .andWhere('activity.type = :callType', { callType: customer_activity_entity_1.CustomerActivityType.CALL })
                .getCount(),
            openQb
                .clone()
                .andWhere('activity.type = :taskType', { taskType: customer_activity_entity_1.CustomerActivityType.TASK })
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
    baseQuery(tenantId, scopeUserId) {
        const qb = this.activityRepo
            .createQueryBuilder('activity')
            .leftJoinAndSelect('activity.user', 'user')
            .leftJoinAndSelect('activity.customer', 'customer');
        this.applyScope(qb, tenantId, scopeUserId);
        return qb;
    }
    countQuery(tenantId, scopeUserId) {
        const qb = this.activityRepo.createQueryBuilder('activity');
        this.applyScope(qb, tenantId, scopeUserId);
        return qb;
    }
    applyScope(qb, tenantId, scopeUserId) {
        qb.where('activity.tenant_id = :tenantId', { tenantId });
        if (scopeUserId) {
            qb.andWhere('activity.user_id = :scopeUserId', { scopeUserId });
        }
    }
    applyListFilters(qb, query) {
        this.applySearchAndType(qb, query);
        if (query.status) {
            qb.andWhere('activity.status = :status', { status: query.status });
        }
        if (query.attention) {
            this.applyAttention(qb, query.attention);
        }
    }
    applySearchAndType(qb, query) {
        if (query.type) {
            qb.andWhere('activity.type = :type', { type: query.type });
        }
        const search = query.search?.trim();
        if (search) {
            qb.andWhere('(LOWER(COALESCE(activity.notes, \'\')) LIKE :search OR LOWER(COALESCE(activity.title, \'\')) LIKE :search OR LOWER(COALESCE(activity.description, \'\')) LIKE :search)', { search: `%${search.toLowerCase()}%` });
        }
    }
    applyAttention(qb, attention) {
        const now = new Date();
        switch (attention) {
            case query_crm_activity_dto_1.CrmAttentionFilter.CALL_PENDING:
                qb.andWhere('activity.type = :attentionType', {
                    attentionType: customer_activity_entity_1.CustomerActivityType.CALL,
                });
                qb.andWhere('activity.status IN (:...openStatuses)', {
                    openStatuses: OPEN_STATUSES,
                });
                break;
            case query_crm_activity_dto_1.CrmAttentionFilter.TASK_PENDING:
                qb.andWhere('activity.type = :attentionType', {
                    attentionType: customer_activity_entity_1.CustomerActivityType.TASK,
                });
                qb.andWhere('activity.status IN (:...openStatuses)', {
                    openStatuses: OPEN_STATUSES,
                });
                break;
            case query_crm_activity_dto_1.CrmAttentionFilter.FOLLOW_UP_OVERDUE:
                qb.andWhere('activity.follow_up_date IS NOT NULL');
                qb.andWhere('activity.follow_up_date < :attentionNow', { attentionNow: now });
                qb.andWhere('activity.status NOT IN (:...closedStatuses)', {
                    closedStatuses: CLOSED_STATUSES,
                });
                break;
            case query_crm_activity_dto_1.CrmAttentionFilter.FOLLOW_UP_PENDING:
            default:
                qb.andWhere('activity.follow_up_date IS NOT NULL');
                qb.andWhere('activity.status NOT IN (:...closedStatuses)', {
                    closedStatuses: CLOSED_STATUSES,
                });
                break;
        }
    }
    async resolveCrmAdmin(tenantId, actorUserId, hasAdminRole) {
        if (hasAdminRole) {
            return true;
        }
        const user = await this.userRepo.findOne({
            where: { id: actorUserId, tenant_id: tenantId },
            select: ['id', 'is_crm_admin'],
        });
        return Boolean(user?.is_crm_admin);
    }
    resolveScopeUserId(isCrmAdmin, actorUserId, requestedUserId) {
        if (!isCrmAdmin) {
            if (requestedUserId && requestedUserId !== actorUserId) {
                throw new common_1.ForbiddenException('No puedes filtrar actividades de otros usuarios');
            }
            return actorUserId;
        }
        return requestedUserId?.trim() || null;
    }
    resolveDateRange(period, dateFrom, dateTo) {
        const now = new Date();
        switch (period) {
            case query_crm_activity_dto_1.CrmReportPeriod.TODAY:
                return { dateFrom: this.startOfDay(now), dateTo: this.endOfDay(now) };
            case query_crm_activity_dto_1.CrmReportPeriod.WEEK: {
                const start = new Date(now);
                const day = start.getDay();
                const diff = day === 0 ? 6 : day - 1;
                start.setDate(start.getDate() - diff);
                return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
            }
            case query_crm_activity_dto_1.CrmReportPeriod.MONTH: {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
            }
            case query_crm_activity_dto_1.CrmReportPeriod.YEAR: {
                const start = new Date(now.getFullYear(), 0, 1);
                return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
            }
            case query_crm_activity_dto_1.CrmReportPeriod.RANGE:
            default: {
                const from = this.parseDateOnly(dateFrom) ?? this.startOfDay(now);
                const to = this.parseDateOnly(dateTo) ?? this.endOfDay(now);
                return { dateFrom: this.startOfDay(from), dateTo: this.endOfDay(to) };
            }
        }
    }
    mapActivity(row, now) {
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
    mapCustomer(customer, customerId) {
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
    mapUser(user) {
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
    displayUserName(user) {
        const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
        return name || user.email || 'Sin nombre';
    }
    toCountMap(rows, key) {
        return rows.reduce((acc, row) => {
            const label = row[key];
            if (label) {
                acc[label] = Number(row.count) || 0;
            }
            return acc;
        }, {});
    }
    periodLabel(period, from, to) {
        const labels = {
            [query_crm_activity_dto_1.CrmReportPeriod.TODAY]: 'Hoy',
            [query_crm_activity_dto_1.CrmReportPeriod.WEEK]: 'Semana',
            [query_crm_activity_dto_1.CrmReportPeriod.MONTH]: 'Mes',
            [query_crm_activity_dto_1.CrmReportPeriod.YEAR]: 'Año',
            [query_crm_activity_dto_1.CrmReportPeriod.RANGE]: `${this.toDateOnly(from)} — ${this.toDateOnly(to)}`,
        };
        return labels[period];
    }
    parseDateOnly(value) {
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
    startOfDay(d) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
    }
    endOfDay(d) {
        const x = new Date(d);
        x.setHours(23, 59, 59, 999);
        return x;
    }
    toDateOnly(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
};
exports.CrmInboxService = CrmInboxService;
exports.CrmInboxService = CrmInboxService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_activity_entity_1.CustomerActivity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CrmInboxService);
//# sourceMappingURL=crm-inbox.service.js.map