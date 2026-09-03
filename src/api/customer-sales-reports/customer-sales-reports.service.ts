import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import {
  buildExportSubtitle,
  buildStyledExcelBuffer,
  ExcelColumnDef,
  formatExportDate,
} from '../../common/utils/excel-export.util';
import {
  DEFAULT_TOP_LIMIT,
  EXCEL_MAX_ROWS,
} from './customer-sales-reports.constants';
import {
  CustomerSalesReportPeriod,
  QueryCustomerSalesReportDto,
} from './dto/query-customer-sales-report.dto';

export interface CustomerSalesReportRow {
  rank: number;
  customer_id: number;
  customer_name: string;
  customer_rfc: string | null;
  total_sales_count: number;
  total_purchased: number;
  average_ticket: number;
  last_purchased_at: string | null;
}

export interface CustomerSalesReportResponse {
  view_label: string;
  summary: {
    customers_count: number;
    total_sales_count: number;
    total_amount: number;
    average_ticket: number;
    top: {
      customer_id: number;
      name: string;
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
    fiscal_configuration_id: string | null;
    billing_branch_id: string | null;
    period: CustomerSalesReportPeriod;
    period_label: string;
    date_from: string;
    date_to: string;
    limit: number;
  };
  rows: CustomerSalesReportRow[];
}

type CustomerAggRaw = {
  customer_id: string | number;
  customer_name: string | null;
  customer_lastname: string | null;
  customer_company_name: string | null;
  customer_rfc: string | null;
  total_sales_count: string;
  total_purchased: string;
  last_purchased_at: Date | string | null;
};

type BranchAggRaw = {
  billing_branch_id: string;
  branch_code: string | null;
  branch_city: string | null;
  sales_count: string;
  amount: string;
};

type TotalsRaw = {
  customers_count: string;
  total_sales_count: string;
  total_amount: string;
};

@Injectable()
export class CustomerSalesReportsService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
  ) {}

  async getTopCustomersReport(
    tenantId: string,
    filters: QueryCustomerSalesReportDto,
    rowLimit = DEFAULT_TOP_LIMIT,
  ): Promise<CustomerSalesReportResponse> {
    const period = filters.period ?? CustomerSalesReportPeriod.MONTH;
    const { dateFrom, dateTo } = this.resolveDateRange(
      period,
      filters.date_from,
      filters.date_to,
    );
    const limit = Math.min(Math.max(rowLimit, 1), EXCEL_MAX_ROWS);

    const [customerRows, totals, branchRows] = await Promise.all([
      this.queryCustomerAggregates(tenantId, filters, dateFrom, dateTo, limit),
      this.queryTotals(tenantId, filters, dateFrom, dateTo),
      this.queryBranchAggregates(tenantId, filters, dateFrom, dateTo),
    ]);

    const rows: CustomerSalesReportRow[] = customerRows.map((row, index) => {
      const customerId = Number(row.customer_id);
      const salesCount = Number(row.total_sales_count || 0);
      const totalPurchased = Number(row.total_purchased || 0);
      return {
        rank: index + 1,
        customer_id: customerId,
        customer_name: this.buildCustomerName(
          row.customer_company_name,
          row.customer_name,
          row.customer_lastname,
        ),
        customer_rfc: row.customer_rfc?.trim() || null,
        total_sales_count: salesCount,
        total_purchased: Number(totalPurchased.toFixed(2)),
        average_ticket:
          salesCount > 0 ? Number((totalPurchased / salesCount).toFixed(2)) : 0,
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
        average_ticket:
          totalSalesCount > 0 ? Number((totalAmount / totalSalesCount).toFixed(2)) : 0,
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

  async exportTopCustomersExcel(
    tenantId: string,
    filters: QueryCustomerSalesReportDto,
  ): Promise<Buffer> {
    const report = await this.getTopCustomersReport(tenantId, filters, EXCEL_MAX_ROWS);
    const columns: ExcelColumnDef[] = [
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
        ? formatExportDate(row.last_purchased_at)
        : '',
    }));

    const f = report.filters_applied;
    const subtitle = buildExportSubtitle([
      report.view_label,
      f.period_label,
      `Generado: ${formatExportDate(new Date())}`,
      `${report.summary.customers_count} clientes`,
      `${report.summary.total_sales_count} ventas`,
      `Total: ${this.formatMoney(report.summary.total_amount)}`,
    ]);

    return buildStyledExcelBuffer({
      sheetName: 'Clientes',
      title: 'Reporte de ventas clientes',
      subtitle,
      columns,
      rows,
      headerColor: 'FF1B7F5E',
      titleColor: 'FF145A47',
    });
  }

  getExportFilename(): string {
    const day = new Date();
    const ymd = [
      day.getFullYear(),
      String(day.getMonth() + 1).padStart(2, '0'),
      String(day.getDate()).padStart(2, '0'),
    ].join('-');
    return `reporte-ventas-clientes-${ymd}.xlsx`;
  }

  private async queryCustomerAggregates(
    tenantId: string,
    filters: QueryCustomerSalesReportDto,
    dateFrom: Date,
    dateTo: Date,
    limit: number,
  ): Promise<CustomerAggRaw[]> {
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
      .getRawMany<CustomerAggRaw>();
  }

  private async queryTotals(
    tenantId: string,
    filters: QueryCustomerSalesReportDto,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TotalsRaw | undefined> {
    const qb = this.salesOrderRepo
      .createQueryBuilder('so')
      .leftJoin('so.warehouse', 'warehouse')
      .select('COUNT(DISTINCT so.customer_id)', 'customers_count')
      .addSelect('COUNT(so.id)', 'total_sales_count')
      .addSelect('COALESCE(SUM(so.total), 0)', 'total_amount');

    this.applyOrderFilters(qb, tenantId, filters, dateFrom, dateTo);
    return qb.getRawOne<TotalsRaw>();
  }

  private async queryBranchAggregates(
    tenantId: string,
    filters: QueryCustomerSalesReportDto,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<BranchAggRaw[]> {
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

    return qb.getRawMany<BranchAggRaw>();
  }

  private applyOrderFilters(
    qb: ReturnType<Repository<SalesOrder>['createQueryBuilder']>,
    tenantId: string,
    filters: QueryCustomerSalesReportDto,
    dateFrom: Date,
    dateTo: Date,
  ): void {
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
      qb.andWhere(
        'COALESCE(so.billing_branch_id, warehouse.billing_branch_id) = :billingBranchId',
        { billingBranchId: filters.billing_branch_id },
      );
    }
  }

  private resolveDateRange(
    period: CustomerSalesReportPeriod,
    dateFrom?: string,
    dateTo?: string,
  ): { dateFrom: Date; dateTo: Date } {
    const now = new Date();

    switch (period) {
      case CustomerSalesReportPeriod.TODAY:
        return { dateFrom: this.startOfDay(now), dateTo: this.endOfDay(now) };
      case CustomerSalesReportPeriod.WEEK: {
        const start = new Date(now);
        const day = start.getDay();
        const diff = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - diff);
        return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
      }
      case CustomerSalesReportPeriod.MONTH: {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
      }
      case CustomerSalesReportPeriod.YEAR: {
        const start = new Date(now.getFullYear(), 0, 1);
        return { dateFrom: this.startOfDay(start), dateTo: this.endOfDay(now) };
      }
      case CustomerSalesReportPeriod.RANGE:
      default: {
        const from = dateFrom ? new Date(dateFrom) : this.startOfDay(now);
        const to = dateTo ? new Date(dateTo) : this.endOfDay(now);
        return { dateFrom: this.startOfDay(from), dateTo: this.endOfDay(to) };
      }
    }
  }

  private periodLabel(
    period: CustomerSalesReportPeriod,
    dateFrom: Date,
    dateTo: Date,
  ): string {
    const range = `${formatExportDate(dateFrom)} — ${formatExportDate(dateTo)}`;
    switch (period) {
      case CustomerSalesReportPeriod.TODAY:
        return `Hoy · ${range}`;
      case CustomerSalesReportPeriod.WEEK:
        return `Semana · ${range}`;
      case CustomerSalesReportPeriod.MONTH:
        return `Mes · ${range}`;
      case CustomerSalesReportPeriod.YEAR:
        return `Año · ${range}`;
      default:
        return `Rango · ${range}`;
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

  private buildCustomerName(
    companyName?: string | null,
    name?: string | null,
    lastname?: string | null,
  ): string {
    const company = companyName?.trim();
    if (company) {
      return company;
    }
    return [name, lastname].filter(Boolean).join(' ').trim() || 'Cliente';
  }

  private buildBranchName(code?: string | null, city?: string | null): string {
    if (city && code) return `${city} (${code})`;
    return city || code || 'Sucursal';
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  }
}
