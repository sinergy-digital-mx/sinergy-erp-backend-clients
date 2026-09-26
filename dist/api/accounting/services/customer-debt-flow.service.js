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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerDebtFlowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const customer_debt_ledger_movement_type_enum_1 = require("../../../entities/accounting/customer-debt-ledger-movement-type.enum");
const excel_export_util_1 = require("../../../common/utils/excel-export.util");
const query_debt_flow_dto_1 = require("../dto/query-debt-flow.dto");
const customer_debt_ledger_util_1 = require("../utils/customer-debt-ledger.util");
let CustomerDebtFlowService = class CustomerDebtFlowService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getReport(tenantId, filters, options = {}) {
        const view = filters.view ?? query_debt_flow_dto_1.DebtFlowView.AGING;
        const { dateFrom, dateTo } = this.resolveDateRange(filters.period ?? query_debt_flow_dto_1.DebtFlowPeriod.MONTH, filters.date_from, filters.date_to);
        const page = options.allRows ? 1 : Math.max(1, filters.page ?? 1);
        const limit = options.allRows ? 100 : Math.min(100, Math.max(1, filters.limit ?? 50));
        const filtersApplied = this.filtersApplied(filters, view, dateFrom, dateTo);
        if (view === query_debt_flow_dto_1.DebtFlowView.LEDGER) {
            const built = await this.buildLedger(tenantId, filters, dateFrom, dateTo);
            const slice = options.allRows
                ? built
                : built.slice((page - 1) * limit, page * limit);
            return {
                filters_applied: filtersApplied,
                aging: [],
                aging_totals: emptyTotals(),
                ledger: slice,
                page,
                limit: options.allRows ? built.length || limit : limit,
                total: built.length,
                total_pages: options.allRows ? (built.length ? 1 : 0) : Math.ceil(built.length / limit),
            };
        }
        const aging = await this.buildAging(tenantId, filters, dateTo);
        const slice = options.allRows ? aging.rows : aging.rows.slice((page - 1) * limit, page * limit);
        return {
            filters_applied: filtersApplied,
            aging: slice,
            aging_totals: aging.totals,
            ledger: [],
            page,
            limit: options.allRows ? aging.rows.length || limit : limit,
            total: aging.rows.length,
            total_pages: options.allRows
                ? aging.rows.length
                    ? 1
                    : 0
                : Math.ceil(aging.rows.length / limit),
        };
    }
    async exportExcel(tenantId, filters) {
        const report = await this.getReport(tenantId, filters, { allRows: true });
        const view = filters.view ?? query_debt_flow_dto_1.DebtFlowView.AGING;
        if (view === query_debt_flow_dto_1.DebtFlowView.LEDGER) {
            return (0, excel_export_util_1.buildStyledExcelBuffer)({
                sheetName: 'Flujo de deuda',
                title: 'Flujo de deuda',
                subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                    report.filters_applied.period_label,
                    'Histórico capturado',
                ]),
                headerColor: 'FF4338CA',
                titleColor: 'FF312E81',
                columns: ledgerColumns(),
                rows: report.ledger.map((row) => ({
                    occurred_at: (0, customer_debt_ledger_util_1.formatDebtDateTime)(row.occurred_at),
                    customer_name: row.customer_name,
                    customer_rfc: row.customer_rfc ?? '',
                    billing_branch_name: row.billing_branch_name ?? '',
                    title: row.title,
                    folio: row.folio ?? '',
                    description: row.description,
                    payment_method_label: row.payment_method_label ?? '',
                    reference_number: row.reference_number ?? '',
                    due_date: row.due_date ? (0, customer_debt_ledger_util_1.formatDebtDay)(row.due_date) : '',
                    charge_amount: row.charge_amount,
                    payment_amount: row.payment_amount,
                    order_balance_after: row.order_balance_after,
                    balance_after: row.balance_after,
                })),
            });
        }
        return (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Antigüedad de saldos',
            title: 'Antigüedad de saldos',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                `Corte ${(0, customer_debt_ledger_util_1.formatDebtDay)(report.filters_applied.date_to.slice(0, 10))}`,
                'Histórico capturado',
            ]),
            headerColor: 'FF4338CA',
            titleColor: 'FF312E81',
            columns: agingColumns(),
            rows: [
                ...report.aging.map((row) => ({
                    customer_name: row.customer_name,
                    customer_rfc: row.customer_rfc ?? '',
                    billing_branch_name: row.billing_branch_name ?? '',
                    open_order_count: row.open_order_count,
                    current: row.current,
                    d1_30: row.d1_30,
                    d31_60: row.d31_60,
                    d61_90: row.d61_90,
                    d91_plus: row.d91_plus,
                    total: row.total,
                    credit_days: row.credit_days,
                    credit_limit: row.credit_limit,
                })),
                {
                    customer_name: 'Total',
                    customer_rfc: '',
                    billing_branch_name: '',
                    open_order_count: report.aging_totals.open_order_count,
                    current: report.aging_totals.current,
                    d1_30: report.aging_totals.d1_30,
                    d31_60: report.aging_totals.d31_60,
                    d61_90: report.aging_totals.d61_90,
                    d91_plus: report.aging_totals.d91_plus,
                    total: report.aging_totals.total,
                    credit_days: null,
                    credit_limit: null,
                },
            ],
        });
    }
    getFilename(view = query_debt_flow_dto_1.DebtFlowView.AGING) {
        const day = new Date().toISOString().slice(0, 10);
        return view === query_debt_flow_dto_1.DebtFlowView.LEDGER
            ? `flujo-deuda-${day}.xlsx`
            : `antiguedad-saldos-${day}.xlsx`;
    }
    async buildAging(tenantId, filters, asOf) {
        const openRows = await this.latestOrders(tenantId, filters, asOf, true);
        const grouped = new Map();
        for (const row of openRows) {
            const pending = (0, customer_debt_ledger_util_1.roundDebtMoney)(Number(row.order_balance_after || 0));
            if (pending <= 0)
                continue;
            const bucket = (0, customer_debt_ledger_util_1.debtAgingBucket)(row.due_date ? String(row.due_date).slice(0, 10) : null, asOf);
            const current = grouped.get(row.customer_id) ?? blankAging(row);
            addBucket(current, bucket, pending);
            current.open_order_count += 1;
            current.total = (0, customer_debt_ledger_util_1.roundDebtMoney)(current.total + pending);
            current.billing_branch_name = mergeBranch(current.billing_branch_name, row.billing_branch_name);
            grouped.set(row.customer_id, current);
        }
        const rows = Array.from(grouped.values()).sort((a, b) => b.total - a.total || a.customer_name.localeCompare(b.customer_name));
        await this.attachCredit(tenantId, filters.fiscal_configuration_id, rows);
        return { rows, totals: sumAging(rows) };
    }
    async buildLedger(tenantId, filters, dateFrom, dateTo) {
        const [movements, openingOrders] = await Promise.all([
            this.movementsInRange(tenantId, filters, dateFrom, dateTo),
            this.latestOrders(tenantId, filters, new Date(dateFrom.getTime() - 1), true),
        ]);
        const rows = [];
        for (const order of openingOrders) {
            const pending = (0, customer_debt_ledger_util_1.roundDebtMoney)(Number(order.order_balance_after || 0));
            if (pending <= 0)
                continue;
            rows.push(this.toOpeningRow(order, dateFrom, pending));
        }
        for (const movement of movements) {
            rows.push(this.toMovementRow(movement));
        }
        rows.sort((a, b) => {
            const name = a.customer_name.localeCompare(b.customer_name, 'es');
            if (name !== 0)
                return name;
            if (a.is_opening !== b.is_opening)
                return a.is_opening ? -1 : 1;
            const time = new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime();
            if (time !== 0)
                return time;
            return (a.folio ?? '').localeCompare(b.folio ?? '');
        });
        return rows;
    }
    toOpeningRow(order, dateFrom, pending) {
        const due = order.due_date ? String(order.due_date).slice(0, 10) : null;
        return {
            id: `opening:${order.sales_order_id}`,
            occurred_at: dateFrom.toISOString(),
            movement_type: 'opening',
            title: 'Saldo inicial',
            description: (0, customer_debt_ledger_util_1.debtMovementDescription)({
                movementType: 'opening',
                folio: order.folio,
                dueDate: due,
            }),
            customer_id: Number(order.customer_id),
            customer_name: order.customer_name,
            customer_rfc: order.customer_rfc,
            billing_branch_name: order.billing_branch_name,
            sales_order_id: order.sales_order_id,
            folio: order.folio,
            payment_method: null,
            payment_method_label: null,
            reference_number: null,
            charge_amount: null,
            payment_amount: null,
            order_balance_after: pending,
            balance_after: null,
            due_date: due,
            is_opening: true,
        };
    }
    toMovementRow(row) {
        const delta = (0, customer_debt_ledger_util_1.roundDebtMoney)(Number(row.amount_delta || 0));
        const type = row.movement_type;
        const isCharge = type === customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CHARGE ||
            type === customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.PAYMENT_REVERSAL;
        const due = row.due_date ? String(row.due_date).slice(0, 10) : null;
        return {
            id: row.id,
            occurred_at: toIso(row.occurred_at),
            movement_type: type,
            title: (0, customer_debt_ledger_util_1.debtMovementLabel)(type),
            description: (0, customer_debt_ledger_util_1.debtMovementDescription)({
                movementType: type,
                folio: row.folio,
                dueDate: due,
                paymentMethod: row.payment_method,
                referenceNumber: row.reference_number,
            }),
            customer_id: Number(row.customer_id),
            customer_name: row.customer_name,
            customer_rfc: row.customer_rfc,
            billing_branch_name: row.billing_branch_name,
            sales_order_id: row.sales_order_id,
            folio: row.folio,
            payment_method: row.payment_method,
            payment_method_label: (0, customer_debt_ledger_util_1.debtPaymentMethodLabel)(row.payment_method),
            reference_number: row.reference_number,
            charge_amount: isCharge ? (0, customer_debt_ledger_util_1.roundDebtMoney)(Math.abs(delta)) : null,
            payment_amount: isCharge ? null : (0, customer_debt_ledger_util_1.roundDebtMoney)(Math.abs(delta)),
            order_balance_after: (0, customer_debt_ledger_util_1.roundDebtMoney)(Number(row.order_balance_after || 0)),
            balance_after: (0, customer_debt_ledger_util_1.roundDebtMoney)(Number(row.balance_after || 0)),
            due_date: due,
            is_opening: false,
        };
    }
    async latestOrders(tenantId, filters, asOf, onlyOpen) {
        const { where, params } = this.baseWhere(tenantId, filters, ['l.occurred_at <= ?'], [this.formatSqlDateTime(asOf)]);
        const openSql = onlyOpen ? 'AND ranked.order_balance_after > 0.009' : '';
        return this.dataSource.query(`
      SELECT ranked.*
      FROM (
        SELECT
          l.id, l.customer_id, l.customer_name, l.customer_rfc, l.billing_branch_name,
          l.sales_order_id, l.folio, l.movement_type, l.amount_delta, l.balance_after,
          l.order_balance_after, l.occurred_at, l.due_date, l.payment_method, l.reference_number,
          ROW_NUMBER() OVER (
            PARTITION BY l.sales_order_id
            ORDER BY l.occurred_at DESC, l.created_at DESC, l.id DESC
          ) AS rn
        FROM acc_customer_debt_ledger l
        WHERE ${where}
      ) ranked
      WHERE ranked.rn = 1
      ${openSql}
      `, params);
    }
    async movementsInRange(tenantId, filters, dateFrom, dateTo) {
        const { where, params } = this.baseWhere(tenantId, filters, ['l.occurred_at >= ?', 'l.occurred_at <= ?'], [this.formatSqlDateTime(dateFrom), this.formatSqlDateTime(dateTo)]);
        return this.dataSource.query(`
      SELECT
        l.id, l.customer_id, l.customer_name, l.customer_rfc, l.billing_branch_name,
        l.sales_order_id, l.folio, l.movement_type, l.amount_delta, l.balance_after,
        l.order_balance_after, l.occurred_at, l.due_date, l.payment_method, l.reference_number
      FROM acc_customer_debt_ledger l
      WHERE ${where}
      ORDER BY l.occurred_at ASC, l.created_at ASC, l.id ASC
      `, params);
    }
    baseWhere(tenantId, filters, extra, extraParams = []) {
        const clauses = ['l.tenant_id = ?', 'l.fiscal_configuration_id = ?', ...extra];
        const params = [tenantId, filters.fiscal_configuration_id, ...extraParams];
        if (filters.billing_branch_id) {
            clauses.push('l.billing_branch_id = ?');
            params.push(filters.billing_branch_id);
        }
        if (filters.customer_id) {
            clauses.push('l.customer_id = ?');
            params.push(filters.customer_id);
        }
        const search = filters.search?.trim();
        if (search) {
            clauses.push('(l.customer_name LIKE ? OR l.customer_rfc LIKE ? OR l.folio LIKE ?)');
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        return { where: clauses.join(' AND '), params };
    }
    async attachCredit(tenantId, fiscalConfigurationId, rows) {
        if (!rows.length)
            return;
        const ids = rows.map((row) => row.customer_id);
        const credits = await this.dataSource.query(`
      SELECT customer_id, credit_days, credit_amount, credit_enabled
      FROM customer_credits
      WHERE tenant_id = ?
        AND fiscal_configuration_id = ?
        AND customer_id IN (${ids.map(() => '?').join(',')})
      `, [tenantId, fiscalConfigurationId, ...ids]);
        const byCustomer = new Map();
        for (const credit of credits) {
            byCustomer.set(Number(credit.customer_id), credit);
        }
        for (const row of rows) {
            const credit = byCustomer.get(row.customer_id);
            if (!credit || !Number(credit.credit_enabled))
                continue;
            row.credit_days = credit.credit_days != null ? Number(credit.credit_days) : null;
            row.credit_limit =
                credit.credit_amount != null ? (0, customer_debt_ledger_util_1.roundDebtMoney)(Number(credit.credit_amount)) : null;
        }
    }
    filtersApplied(filters, view, dateFrom, dateTo) {
        const fromLabel = (0, customer_debt_ledger_util_1.formatDebtDay)(this.formatSqlDate(dateFrom));
        const toLabel = (0, customer_debt_ledger_util_1.formatDebtDay)(this.formatSqlDate(dateTo));
        return {
            fiscal_configuration_id: filters.fiscal_configuration_id,
            billing_branch_id: filters.billing_branch_id ?? null,
            customer_id: filters.customer_id ?? null,
            search: filters.search?.trim() || null,
            view,
            period: filters.period ?? query_debt_flow_dto_1.DebtFlowPeriod.MONTH,
            date_from: dateFrom.toISOString(),
            date_to: dateTo.toISOString(),
            period_label: view === query_debt_flow_dto_1.DebtFlowView.AGING ? `Al ${toLabel}` : `${fromLabel} – ${toLabel}`,
        };
    }
    resolveDateRange(period, dateFrom, dateTo) {
        const now = new Date();
        switch (period) {
            case query_debt_flow_dto_1.DebtFlowPeriod.TODAY:
                return { dateFrom: startOfDay(now), dateTo: endOfDay(now) };
            case query_debt_flow_dto_1.DebtFlowPeriod.WEEK: {
                const start = new Date(now);
                const day = start.getDay();
                start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
                return { dateFrom: startOfDay(start), dateTo: endOfDay(now) };
            }
            case query_debt_flow_dto_1.DebtFlowPeriod.YEAR:
                return {
                    dateFrom: startOfDay(new Date(now.getFullYear(), 0, 1)),
                    dateTo: endOfDay(now),
                };
            case query_debt_flow_dto_1.DebtFlowPeriod.RANGE: {
                if (!dateFrom || !dateTo) {
                    throw new common_1.BadRequestException('El rango requiere fecha inicial y final');
                }
                const from = parseLocalDay(dateFrom, false);
                const to = parseLocalDay(dateTo, true);
                if (!from || !to || from > to) {
                    throw new common_1.BadRequestException('El rango de fechas no es válido');
                }
                return { dateFrom: from, dateTo: to };
            }
            case query_debt_flow_dto_1.DebtFlowPeriod.MONTH:
            default:
                return {
                    dateFrom: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
                    dateTo: endOfDay(now),
                };
        }
    }
    formatSqlDateTime(value) {
        const pad = (n) => String(n).padStart(2, '0');
        return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
    }
    formatSqlDate(value) {
        const pad = (n) => String(n).padStart(2, '0');
        return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    }
};
exports.CustomerDebtFlowService = CustomerDebtFlowService;
exports.CustomerDebtFlowService = CustomerDebtFlowService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], CustomerDebtFlowService);
function startOfDay(value) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}
function endOfDay(value) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}
function parseLocalDay(value, end) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (!match)
        return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const parsed = end
        ? new Date(year, month, day, 23, 59, 59, 999)
        : new Date(year, month, day, 0, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function toIso(value) {
    if (value instanceof Date)
        return value.toISOString();
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}
function blankAging(row) {
    return {
        customer_id: Number(row.customer_id),
        customer_name: row.customer_name,
        customer_rfc: row.customer_rfc,
        billing_branch_name: row.billing_branch_name,
        open_order_count: 0,
        current: 0,
        d1_30: 0,
        d31_60: 0,
        d61_90: 0,
        d91_plus: 0,
        total: 0,
        credit_days: null,
        credit_limit: null,
    };
}
function addBucket(row, bucket, amount) {
    row[bucket] = (0, customer_debt_ledger_util_1.roundDebtMoney)(row[bucket] + amount);
}
function mergeBranch(current, next) {
    if (!current)
        return next;
    if (!next || current === next)
        return current;
    if (current === 'Varias sucursales')
        return current;
    return 'Varias sucursales';
}
function emptyTotals() {
    return {
        customer_count: 0,
        open_order_count: 0,
        current: 0,
        d1_30: 0,
        d31_60: 0,
        d61_90: 0,
        d91_plus: 0,
        total: 0,
    };
}
function sumAging(rows) {
    const totals = emptyTotals();
    totals.customer_count = rows.length;
    for (const row of rows) {
        totals.open_order_count += row.open_order_count;
        totals.current = (0, customer_debt_ledger_util_1.roundDebtMoney)(totals.current + row.current);
        totals.d1_30 = (0, customer_debt_ledger_util_1.roundDebtMoney)(totals.d1_30 + row.d1_30);
        totals.d31_60 = (0, customer_debt_ledger_util_1.roundDebtMoney)(totals.d31_60 + row.d31_60);
        totals.d61_90 = (0, customer_debt_ledger_util_1.roundDebtMoney)(totals.d61_90 + row.d61_90);
        totals.d91_plus = (0, customer_debt_ledger_util_1.roundDebtMoney)(totals.d91_plus + row.d91_plus);
        totals.total = (0, customer_debt_ledger_util_1.roundDebtMoney)(totals.total + row.total);
    }
    return totals;
}
function agingColumns() {
    return [
        { header: 'Cliente', key: 'customer_name', width: 36 },
        { header: 'RFC', key: 'customer_rfc', width: 16 },
        { header: 'Sucursal', key: 'billing_branch_name', width: 24 },
        { header: 'Órdenes', key: 'open_order_count', width: 12, type: 'integer' },
        { header: 'Por vencer', key: 'current', width: 16, type: 'currency' },
        { header: '1-30', key: 'd1_30', width: 14, type: 'currency' },
        { header: '31-60', key: 'd31_60', width: 14, type: 'currency' },
        { header: '61-90', key: 'd61_90', width: 14, type: 'currency' },
        { header: '+90', key: 'd91_plus', width: 14, type: 'currency' },
        { header: 'Total', key: 'total', width: 16, type: 'currency' },
        { header: 'Días de crédito', key: 'credit_days', width: 16, type: 'integer' },
        { header: 'Límite', key: 'credit_limit', width: 16, type: 'currency' },
    ];
}
function ledgerColumns() {
    return [
        { header: 'Fecha', key: 'occurred_at', width: 20 },
        { header: 'Cliente', key: 'customer_name', width: 32 },
        { header: 'RFC', key: 'customer_rfc', width: 16 },
        { header: 'Sucursal', key: 'billing_branch_name', width: 22 },
        { header: 'Movimiento', key: 'title', width: 18 },
        { header: 'OV', key: 'folio', width: 16 },
        { header: 'Detalle', key: 'description', width: 42 },
        { header: 'Método', key: 'payment_method_label', width: 16 },
        { header: 'Referencia', key: 'reference_number', width: 18 },
        { header: 'Vence', key: 'due_date', width: 14 },
        { header: 'Cargo', key: 'charge_amount', width: 14, type: 'currency' },
        { header: 'Abono', key: 'payment_amount', width: 14, type: 'currency' },
        { header: 'Saldo OV', key: 'order_balance_after', width: 14, type: 'currency' },
        { header: 'Saldo cliente', key: 'balance_after', width: 16, type: 'currency' },
    ];
}
//# sourceMappingURL=customer-debt-flow.service.js.map