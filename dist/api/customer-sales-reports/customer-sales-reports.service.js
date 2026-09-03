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
exports.CustomerSalesReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const excel_export_util_1 = require("../../common/utils/excel-export.util");
const customer_sales_reports_constants_1 = require("./customer-sales-reports.constants");
const query_customer_sales_report_dto_1 = require("./dto/query-customer-sales-report.dto");
let CustomerSalesReportsService = class CustomerSalesReportsService {
    salesOrderRepo;
    constructor(salesOrderRepo) {
        this.salesOrderRepo = salesOrderRepo;
    }
    async getTopCustomersReport(tenantId, filters, rowLimit = customer_sales_reports_constants_1.DEFAULT_TOP_LIMIT) {
        const period = filters.period ?? query_customer_sales_report_dto_1.CustomerSalesReportPeriod.MONTH;
        const { dateFrom, dateTo } = this.resolveDateRange(period, filters.date_from, filters.date_to);
        const limit = Math.min(Math.max(rowLimit, 1), customer_sales_reports_constants_1.EXCEL_MAX_ROWS);
        const [customerRows, totals, branchRows] = await Promise.all([
            this.queryCustomerAggregates(tenantId, filters, dateFrom, dateTo, limit),
            this.queryTotals(tenantId, filters, dateFrom, dateTo),
            this.queryBranchAggregates(tenantId, filters, dateFrom, dateTo),
        ]);
        const rows = customerRows.map((row, index) => {
            const customerId = Number(row.customer_id);
            const salesCount = Number(row.total_sales_count || 0);
            const totalPurchased = Number(row.total_purchased || 0);
            return {
                rank: index + 1,
                customer_id: customerId,
                customer_name: this.buildCustomerName(row.customer_company_name, row.customer_name, row.customer_lastname),
                customer_rfc: row.customer_rfc?.trim() || null,
                total_sales_count: salesCount,
                total_purchased: Number(totalPurchased.toFixed(2)),
                average_ticket: salesCount > 0 ? Number((totalPurchased / salesCount).toFixed(2)) : 0,
                last_purchased_at: row.last_purchased_at
                    ? new Date(row.last_purchased_at).toISOString()
                    : null,
            };
        });
        const totalSalesCount = Number(totals?.total_sales_count || 0);
        const totalAmount = Number(totals?.total_amount || 0);
        const top = rows[0]
            ? {
                customer_id: rows[0].customer_id,
                name: rows[0].customer_name,
                amount: rows[0].total_purchased,
                sales_count: rows[0].total_sales_count,
            }
            : null;
        return {
            view_label: 'Top de clientes por sucursal / razón social (Ventas y total comprado)',
            summary: {
                customers_count: Number(totals?.customers_count || 0),
                total_sales_count: totalSalesCount,
                total_amount: Number(totalAmount.toFixed(2)),
                average_ticket: totalSalesCount > 0 ? Number((totalAmount / totalSalesCount).toFixed(2)) : 0,
                top,
                branches: branchRows
                    .map((row) => ({
                    billing_branch_id: row.billing_branch_id,
                    branch_name: this.buildBranchName(row.branch_code, row.branch_city),
                    sales_count: Number(row.sales_count || 0),
                    amount: Number(Number(row.amount || 0).toFixed(2)),
                }))
                    .sort((a, b) => b.amount - a.amount),
            },
            filters_applied: {
                fiscal_configuration_id: filters.fiscal_configuration_id ?? null,
                billing_branch_id: filters.billing_branch_id ?? null,
                period,
                period_label: this.periodLabel(period, dateFrom, dateTo),
                date_from: dateFrom.toISOString(),
                date_to: dateTo.toISOString(),
                limit,
            },
            rows,
        };
    }
    async exportTopCustomersExcel(tenantId, filters) {
        const report = await this.getTopCustomersReport(tenantId, filters, customer_sales_reports_constants_1.EXCEL_MAX_ROWS);
        const columns = [
            { header: '#', key: 'rank', width: 8, type: 'integer' },
            { header: 'Cliente', key: 'customer_name', width: 36 },
            { header: 'RFC', key: 'customer_rfc', width: 16 },
            { header: 'Ventas', key: 'total_sales_count', width: 12, type: 'integer' },
            { header: 'Total comprado', key: 'total_purchased', width: 16, type: 'currency' },
            { header: 'Ticket promedio', key: 'average_ticket', width: 16, type: 'currency' },
            { header: 'Última compra', key: 'last_purchased_at', width: 16, type: 'date' },
        ];
        const rows = report.rows.map((row) => ({
            rank: row.rank,
            customer_name: row.customer_name,
            customer_rfc: row.customer_rfc,
            total_sales_count: row.total_sales_count,
            total_purchased: row.total_purchased,
            average_ticket: row.average_ticket,
            last_purchased_at: row.last_purchased_at
                ? (0, excel_export_util_1.formatExportDate)(row.last_purchased_at)
                : '',
        }));
        const f = report.filters_applied;
        const subtitle = (0, excel_export_util_1.buildExportSubtitle)([
            report.view_label,
            f.period_label,
            `Generado: ${(0, excel_export_util_1.formatExportDate)(new Date())}`,
            `${report.summary.customers_count} clientes`,
            `${report.summary.total_sales_count} ventas`,
            `Total: ${this.formatMoney(report.summary.total_amount)}`,
        ]);
        return (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Clientes',
            title: 'Reporte de ventas clientes',
            subtitle,
            columns,
            rows,
            headerColor: 'FF1B7F5E',
            titleColor: 'FF145A47',
        });
    }
    getExportFilename() {
        const day = new Date();
        const ymd = [
            day.getFullYear(),
            String(day.getMonth() + 1).padStart(2, '0'),
            String(day.getDate()).padStart(2, '0'),
        ].join('-');
        return `reporte-ventas-clientes-${ymd}.xlsx`;
    }
    async queryCustomerAggregates(tenantId, filters, dateFrom, dateTo, limit) {
        const qb = this.salesOrderRepo
            .createQueryBuilder('so')
            .innerJoin('so.customer', 'customer')
            .leftJoin('so.warehouse', 'warehouse')
            .select('customer.id', 'customer_id')
            .addSelect('customer.name', 'customer_name')
            .addSelect('customer.lastname', 'customer_lastname')
            .addSelect('customer.company_name', 'customer_company_name')
            .addSelect('customer.fiscal_rfc', 'customer_rfc')
            .addSelect('COUNT(so.id)', 'total_sales_count')
            .addSelect('COALESCE(SUM(so.total), 0)', 'total_purchased')
            .addSelect('MAX(so.created_at)', 'last_purchased_at');
        this.applyOrderFilters(qb, tenantId, filters, dateFrom, dateTo);
        return qb
            .groupBy('customer.id')
            .addGroupBy('customer.name')
            .addGroupBy('customer.lastname')
            .addGroupBy('customer.company_name')
            .addGroupBy('customer.fiscal_rfc')
            .orderBy('COALESCE(SUM(so.total), 0)', 'DESC')
            .addOrderBy('COUNT(so.id)', 'DESC')
            .limit(limit)
            .getRawMany();
    }
    async queryTotals(tenantId, filters, dateFrom, dateTo) {
        const qb = this.salesOrderRepo
            .createQueryBuilder('so')
            .leftJoin('so.warehouse', 'warehouse')
            .select('COUNT(DISTINCT so.customer_id)', 'customers_count')
            .addSelect('COUNT(so.id)', 'total_sales_count')
            .addSelect('COALESCE(SUM(so.total), 0)', 'total_amount');
        this.applyOrderFilters(qb, tenantId, filters, dateFrom, dateTo);
        return qb.getRawOne();
    }
    async queryBranchAggregates(tenantId, filters, dateFrom, dateTo) {
        const branchIdSql = 'COALESCE(so_branch.id, wh_branch.id)';
        const qb = this.salesOrderRepo
            .createQueryBuilder('so')
            .leftJoin('so.billing_branch', 'so_branch')
            .leftJoin('so.warehouse', 'warehouse')
            .leftJoin('warehouse.billing_branch', 'wh_branch')
            .select(branchIdSql, 'billing_branch_id')
            .addSelect('COALESCE(so_branch.code, wh_branch.code)', 'branch_code')
            .addSelect('COALESCE(so_branch.city, wh_branch.city)', 'branch_city')
            .addSelect('COUNT(so.id)', 'sales_count')
            .addSelect('COALESCE(SUM(so.total), 0)', 'amount');
        this.applyOrderFilters(qb, tenantId, filters, dateFrom, dateTo);
        qb.andWhere(`${branchIdSql} IS NOT NULL`)
            .groupBy(branchIdSql)
            .addGroupBy('COALESCE(so_branch.code, wh_branch.code)')
            .addGroupBy('COALESCE(so_branch.city, wh_branch.city)');
        return qb.getRawMany();
    }
    applyOrderFilters(qb, tenantId, filters, dateFrom, dateTo) {
        qb.andWhere('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.general_status = :status', { status: 'Surtida' })
            .andWhere('so.created_at >= :dateFrom', { dateFrom })
            .andWhere('so.created_at <= :dateTo', { dateTo });
        if (filters.fiscal_configuration_id) {
            qb.andWhere('so.fiscal_configuration_id = :fiscalConfigurationId', {
                fiscalConfigurationId: filters.fiscal_configuration_id,
            });
        }
        if (filters.billing_branch_id) {
            qb.andWhere('COALESCE(so.billing_branch_id, warehouse.billing_branch_id) = :billingBranchId', { billingBranchId: filters.billing_branch_id });
        }
    }
    resolveDateRange(period, dateFrom, dateTo) {
        const now = new Date();
        switch (period) {
            case query_customer_sales_report_dto_1.CustomerSalesReportPeriod.TODAY:
                return { dateFrom: this.startOfDay(now), dateTo: this.endOfDay(now) };
            case query_customer_sales_report_dto_1.CustomerSalesReportPeriod.WEEK: {
                const start = new Date(now);
                const day = start.getDay();
                const diff = day === 0 ? 6 : day - 1;
                start.setDate(start.getDate() - diff);
                return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
            }
            case query_customer_sales_report_dto_1.CustomerSalesReportPeriod.MONTH: {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
            }
            case query_customer_sales_report_dto_1.CustomerSalesReportPeriod.YEAR: {
                const start = new Date(now.getFullYear(), 0, 1);
                return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
            }
            case query_customer_sales_report_dto_1.CustomerSalesReportPeriod.RANGE:
            default: {
                const from = dateFrom ? new Date(dateFrom) : this.startOfDay(now);
                const to = dateTo ? new Date(dateTo) : this.endOfDay(now);
                return { dateFrom: this.startOfDay(from), dateTo: this.endOfDay(to) };
            }
        }
    }
    periodLabel(period, dateFrom, dateTo) {
        const range = `${(0, excel_export_util_1.formatExportDate)(dateFrom)} — ${(0, excel_export_util_1.formatExportDate)(dateTo)}`;
        switch (period) {
            case query_customer_sales_report_dto_1.CustomerSalesReportPeriod.TODAY:
                return `Hoy · ${range}`;
            case query_customer_sales_report_dto_1.CustomerSalesReportPeriod.WEEK:
                return `Semana · ${range}`;
            case query_customer_sales_report_dto_1.CustomerSalesReportPeriod.MONTH:
                return `Mes · ${range}`;
            case query_customer_sales_report_dto_1.CustomerSalesReportPeriod.YEAR:
                return `Año · ${range}`;
            default:
                return `Rango · ${range}`;
        }
    }
    startOfDay(date) {
        const value = new Date(date);
        value.setHours(0, 0, 0, 0);
        return value;
    }
    endOfDay(date) {
        const value = new Date(date);
        value.setHours(23, 59, 59, 999);
        return value;
    }
    buildCustomerName(companyName, name, lastname) {
        const company = companyName?.trim();
        if (company) {
            return company;
        }
        return [name, lastname].filter(Boolean).join(' ').trim() || 'Cliente';
    }
    buildBranchName(code, city) {
        if (city && code)
            return `${city} (${code})`;
        return city || code || 'Sucursal';
    }
    formatMoney(value) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(value);
    }
};
exports.CustomerSalesReportsService = CustomerSalesReportsService;
exports.CustomerSalesReportsService = CustomerSalesReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CustomerSalesReportsService);
//# sourceMappingURL=customer-sales-reports.service.js.map