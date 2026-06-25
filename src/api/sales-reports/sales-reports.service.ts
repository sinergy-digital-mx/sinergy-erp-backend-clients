import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import {
  QuerySalesBySellerReportDto,
  SalesReportPeriod,
} from './dto/query-sales-by-seller-report.dto';

export interface SalesBySellerReportRow {
  billing_branch_id: string;
  branch_code: string;
  branch_initials: string;
  branch_name: string;
  seller_id: string;
  seller_name: string;
  total_sales_count: number;
  amount_sold: number;
  commission_percentage: number;
  commission_amount: number;
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
  rows: SalesBySellerReportRow[];
}

@Injectable()
export class SalesReportsService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
  ) {}

  async getSalesBySellerReport(
    tenantId: string,
    filters: QuerySalesBySellerReportDto,
  ): Promise<SalesBySellerReportResponse> {
    const period = filters.period ?? SalesReportPeriod.MONTH;
    const commissionRate = Number(filters.commission_rate ?? 0);
    const { dateFrom, dateTo } = this.resolveDateRange(
      period,
      filters.date_from,
      filters.date_to,
    );

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
      .orderBy('amount_sold', 'DESC');

    const rawRows = await qb.getRawMany<{
      billing_branch_id: string;
      branch_code: string;
      branch_city: string;
      seller_id: string;
      seller_first_name: string | null;
      seller_last_name: string | null;
      total_sales_count: string;
      amount_sold: string;
    }>();

    const rows: SalesBySellerReportRow[] = rawRows.map((row) => {
      const amountSold = Number(row.amount_sold || 0);
      const commissionAmount = Number(((amountSold * commissionRate) / 100).toFixed(2));

      return {
        billing_branch_id: row.billing_branch_id,
        branch_code: row.branch_code,
        branch_initials: this.buildBranchInitials(row.branch_code, row.branch_city),
        branch_name: this.buildBranchName(row.branch_code, row.branch_city),
        seller_id: row.seller_id,
        seller_name: this.buildSellerName(row.seller_first_name, row.seller_last_name),
        total_sales_count: Number(row.total_sales_count || 0),
        amount_sold: amountSold,
        commission_percentage: commissionRate,
        commission_amount: commissionAmount,
      };
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
      rows,
    };
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
