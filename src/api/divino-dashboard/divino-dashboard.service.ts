import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import {
  DivinoDashboardScope,
  QueryDivinoDashboardDto,
  QueryRevenueSeriesDto,
} from './dto/query-divino-dashboard.dto';
import { DIVINO_DASHBOARD_ALLOWED_TENANT_ID } from './divino-dashboard.constants';

interface SaleRow {
  contract_id: string;
  contract_date: string;
  total_price: number;
  list_price: number;
  down_payment: number;
  down_payment_target: number | null;
  down_payment_financed: number;
  payment_months: number;
  monthly_payment: number;
  total_area: number;
  seller_id: string | null;
  seller_first_name: string | null;
  seller_last_name: string | null;
  lead_group_id: string | null;
  origin_name: string | null;
  property_code: string | null;
}

export type DivinoDashboardKpis = ReturnType<
  DivinoDashboardService['computeKpisFromSales']
>;

@Injectable()
export class DivinoDashboardService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
  ) {}

  assertTenant(tenantId: string): void {
    if (tenantId !== DIVINO_DASHBOARD_ALLOWED_TENANT_ID) {
      throw new ForbiddenException(
        'Divino Dashboard is not enabled for this tenant',
      );
    }
  }

  async getSummary(tenantId: string, query: QueryDivinoDashboardDto) {
    this.assertTenant(tenantId);
    const sales = await this.fetchSales(tenantId, query);
    const result: {
      filters: ReturnType<DivinoDashboardService['filtersMeta']>;
      kpis: DivinoDashboardKpis;
      yearly_breakdown?: Array<DivinoDashboardKpis & { year: number }>;
    } = {
      filters: this.filtersMeta(query),
      kpis: this.computeKpisFromSales(sales),
    };

    if (this.isAllTime(query)) {
      result.yearly_breakdown = this.buildYearlyBreakdown(sales);
    }

    return result;
  }

  async getSellers(tenantId: string, query: QueryDivinoDashboardDto) {
    this.assertTenant(tenantId);
    const sales = await this.fetchSales(tenantId, query);
    const toursBySeller = await this.fetchToursBySeller(tenantId, query);
    const map = new Map<
      string,
      {
        seller_id: string;
        seller_name: string;
        lots_sold: number;
        revenue: number;
        m2_sold: number;
        tours_count: number;
      }
    >();

    for (const row of sales) {
      const sid = row.seller_id ?? 'unassigned';
      const name =
        row.seller_id == null
          ? 'Sin vendedor'
          : `${row.seller_first_name ?? ''} ${row.seller_last_name ?? ''}`.trim();
      if (!map.has(sid)) {
        map.set(sid, {
          seller_id: sid,
          seller_name: name,
          lots_sold: 0,
          revenue: 0,
          m2_sold: 0,
          tours_count: toursBySeller.get(sid)?.tours ?? 0,
        });
      }
      const entry = map.get(sid)!;
      entry.lots_sold += 1;
      entry.revenue += Number(row.total_price);
      entry.m2_sold += Number(row.total_area);
    }

    for (const [sid, tourInfo] of toursBySeller) {
      if (!map.has(sid)) {
        map.set(sid, {
          seller_id: sid,
          seller_name: tourInfo.seller_name,
          lots_sold: 0,
          revenue: 0,
          m2_sold: 0,
          tours_count: tourInfo.tours,
        });
      } else {
        map.get(sid)!.tours_count = tourInfo.tours;
      }
    }

    const rows = Array.from(map.values())
      .map((r) => ({
        ...r,
        revenue: this.round(r.revenue),
        m2_sold: this.round(r.m2_sold),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return { filters: this.filtersMeta(query), rows };
  }

  async getLeadOrigins(tenantId: string, query: QueryDivinoDashboardDto) {
    this.assertTenant(tenantId);
    const sales = await this.fetchSales(tenantId, query);
    const map = new Map<string, { origin: string; count: number; revenue: number }>();

    for (const row of sales) {
      const origin = row.origin_name ?? 'Sin origen';
      if (!map.has(origin)) {
        map.set(origin, { origin, count: 0, revenue: 0 });
      }
      const entry = map.get(origin)!;
      entry.count += 1;
      entry.revenue += Number(row.total_price);
    }

    return {
      filters: this.filtersMeta(query),
      rows: Array.from(map.values())
        .map((r) => ({
          ...r,
          revenue: this.round(r.revenue),
          pct_of_sales:
            sales.length > 0
              ? this.round((r.count / sales.length) * 100)
              : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue),
    };
  }

  async getRevenueSeries(tenantId: string, query: QueryRevenueSeriesDto) {
    this.assertTenant(tenantId);

    if (this.isAllTime(query)) {
      const rows: { bucket: string; revenue: number; lots: number }[] =
        await this.contractRepo.manager.query(
          `
          SELECT
            CAST(YEAR(c.contract_date) AS CHAR) AS bucket,
            COALESCE(SUM(c.total_price), 0) AS revenue,
            COUNT(*) AS lots
          FROM contracts c
          WHERE c.tenant_id = ?
            AND c.status IN ('activo', 'completado')
          GROUP BY YEAR(c.contract_date)
          ORDER BY bucket ASC
          `,
          [tenantId],
        );

      return {
        filters: this.filtersMeta(query),
        period: 'annual' as const,
        year: null,
        month: null,
        series: rows.map((r) => ({
          bucket: r.bucket,
          revenue: this.round(Number(r.revenue)),
          lots_sold: Number(r.lots),
        })),
      };
    }

    const period = query.period ?? 'monthly';
    const { dateFrom, dateTo } = this.resolveRange(query.year!, query.month);

    const rows: { bucket: string; revenue: number; lots: number }[] =
      await this.contractRepo.manager.query(
        `
        SELECT
          CASE
            WHEN ? = 'annual' THEN CAST(YEAR(c.contract_date) AS CHAR)
            WHEN ? = 'semiannual' THEN CONCAT(YEAR(c.contract_date), '-S', IF(MONTH(c.contract_date) <= 6, 1, 2))
            WHEN ? = 'quarterly' THEN CONCAT(YEAR(c.contract_date), '-Q', QUARTER(c.contract_date))
            ELSE DATE_FORMAT(c.contract_date, '%Y-%m')
          END AS bucket,
          COALESCE(SUM(c.total_price), 0) AS revenue,
          COUNT(*) AS lots
        FROM contracts c
        WHERE c.tenant_id = ?
          AND c.status IN ('activo', 'completado')
          AND c.contract_date >= ?
          AND c.contract_date <= ?
        GROUP BY bucket
        ORDER BY bucket ASC
        `,
        [period, period, period, tenantId, dateFrom, dateTo],
      );

    return {
      filters: this.filtersMeta(query),
      period,
      year: query.year ?? null,
      month: query.month ?? null,
      series: rows.map((r) => ({
        bucket: r.bucket,
        revenue: this.round(Number(r.revenue)),
        lots_sold: Number(r.lots),
      })),
    };
  }

  computeKpisFromSales(sales: SaleRow[]) {
    const count = sales.length;
    let totalRevenue = 0;
    let totalM2 = 0;
    let listTotal = 0;
    let closeTotal = 0;
    let cashCount = 0;
    let financedCount = 0;
    let downSum = 0;
    let downCount = 0;
    let monthlySum = 0;
    let monthlyCount = 0;
    const pricePerM2: number[] = [];

    for (const row of sales) {
      const close = Number(row.total_price);
      const list = Number(row.list_price ?? row.total_price);
      const area = Number(row.total_area) || 0;
      totalRevenue += close;
      totalM2 += area;
      listTotal += list;
      closeTotal += close;
      if (area > 0) {
        pricePerM2.push(close / area);
      }

      const isFinanced =
        Number(row.down_payment_financed) === 1 ||
        Number(row.payment_months) > 0;
      if (isFinanced) {
        financedCount += 1;
        const enganche = Number(
          row.down_payment_target ?? row.down_payment ?? 0,
        );
        if (enganche > 0) {
          downSum += enganche;
          downCount += 1;
        }
        const monthly = Number(row.monthly_payment);
        if (monthly > 0) {
          monthlySum += monthly;
          monthlyCount += 1;
        }
      } else {
        cashCount += 1;
      }
    }

    const avgList = count > 0 ? listTotal / count : 0;
    const avgClose = count > 0 ? closeTotal / count : 0;
    const listVsCloseDiff =
      avgList > 0 ? ((avgClose - avgList) / avgList) * 100 : 0;

    return {
      avg_price_per_m2:
        totalM2 > 0 ? this.round(totalRevenue / totalM2) : 0,
      total_sold_amount: this.round(totalRevenue),
      total_sold_m2: this.round(totalM2),
      lots_sold: count,
      avg_list_price: this.round(avgList),
      avg_close_price: this.round(avgClose),
      list_vs_close_diff_amount: this.round(avgClose - avgList),
      list_vs_close_diff_pct: this.round(listVsCloseDiff),
      max_price_per_m2:
        pricePerM2.length > 0 ? this.round(Math.max(...pricePerM2)) : 0,
      min_price_per_m2:
        pricePerM2.length > 0 ? this.round(Math.min(...pricePerM2)) : 0,
      cash_pct: count > 0 ? this.round((cashCount / count) * 100) : 0,
      financed_pct:
        count > 0 ? this.round((financedCount / count) * 100) : 0,
      cash_count: cashCount,
      financed_count: financedCount,
      avg_down_payment:
        downCount > 0 ? this.round(downSum / downCount) : 0,
      avg_monthly_payment:
        monthlyCount > 0 ? this.round(monthlySum / monthlyCount) : 0,
    };
  }

  private buildYearlyBreakdown(
    sales: SaleRow[],
  ): Array<DivinoDashboardKpis & { year: number }> {
    const byYear = new Map<number, SaleRow[]>();

    for (const row of sales) {
      const year = new Date(row.contract_date).getFullYear();
      if (!byYear.has(year)) {
        byYear.set(year, []);
      }
      byYear.get(year)!.push(row);
    }

    return Array.from(byYear.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, rows]) => ({
        year,
        ...this.computeKpisFromSales(rows),
      }));
  }

  private async fetchSales(
    tenantId: string,
    query: QueryDivinoDashboardDto,
  ): Promise<SaleRow[]> {
    const dateClause = this.isAllTime(query)
      ? ''
      : 'AND c.contract_date >= ? AND c.contract_date <= ?';
    const params: (string | number)[] = [tenantId];
    if (!this.isAllTime(query)) {
      const { dateFrom, dateTo } = this.resolveRange(query.year!, query.month);
      params.push(dateFrom, dateTo);
    }

    return this.contractRepo.manager.query(
      `
      SELECT
        c.id AS contract_id,
        c.contract_date,
        c.total_price,
        COALESCE(c.list_price, p.list_price, p.total_price) AS list_price,
        c.down_payment,
        c.down_payment_target,
        c.down_payment_financed,
        c.payment_months,
        c.monthly_payment,
        p.total_area,
        c.seller_id,
        u.first_name AS seller_first_name,
        u.last_name AS seller_last_name,
        c.lead_group_id,
        COALESCE(lg.name, lg_lead.name, 'Sin origen') AS origin_name,
        p.code AS property_code
      FROM contracts c
      INNER JOIN properties p ON p.id = c.property_id
      LEFT JOIN users u ON u.id = c.seller_id
      LEFT JOIN lead_groups lg ON lg.id = c.lead_group_id
      LEFT JOIN leads l ON l.id = c.lead_id
      LEFT JOIN lead_groups lg_lead ON lg_lead.id = l.group_id
      WHERE c.tenant_id = ?
        AND c.status IN ('activo', 'completado')
        ${dateClause}
      ORDER BY c.contract_date DESC
      `,
      params,
    );
  }

  private async fetchToursBySeller(
    tenantId: string,
    query: QueryDivinoDashboardDto,
  ): Promise<Map<string, { tours: number; seller_name: string }>> {
    const dateClause = this.isAllTime(query)
      ? ''
      : 'AND la.activity_date >= ? AND la.activity_date <= ?';
    const params: (string | number)[] = [tenantId];
    if (!this.isAllTime(query)) {
      const { dateFrom, dateTo } = this.resolveRange(query.year!, query.month);
      params.push(dateFrom, dateTo);
    }

    const rows: {
      seller_id: string;
      tours: number;
      seller_first_name: string | null;
      seller_last_name: string | null;
    }[] = await this.contractRepo.manager.query(
      `
      SELECT
        la.user_id AS seller_id,
        COUNT(*) AS tours,
        u.first_name AS seller_first_name,
        u.last_name AS seller_last_name
      FROM lead_activities la
      LEFT JOIN users u ON u.id = la.user_id
      WHERE la.tenant_id = ?
        AND la.type = 'meeting'
        AND la.status = 'completed'
        AND la.user_id IS NOT NULL
        ${dateClause}
      GROUP BY la.user_id, u.first_name, u.last_name
      `,
      params,
    );

    const map = new Map<string, { tours: number; seller_name: string }>();
    for (const row of rows) {
      const name =
        `${row.seller_first_name ?? ''} ${row.seller_last_name ?? ''}`.trim() ||
        'Sin vendedor';
      map.set(row.seller_id, {
        tours: Number(row.tours),
        seller_name: name,
      });
    }
    return map;
  }

  private isAllTime(query: QueryDivinoDashboardDto): boolean {
    return (query.scope ?? 'period') === 'all_time';
  }

  private resolveRange(
    year: number,
    month?: number,
  ): { dateFrom: string; dateTo: string } {
    if (month) {
      const lastDay = new Date(year, month, 0).getDate();
      return {
        dateFrom: `${year}-${String(month).padStart(2, '0')}-01`,
        dateTo: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      };
    }
    return {
      dateFrom: `${year}-01-01`,
      dateTo: `${year}-12-31`,
    };
  }

  private filtersMeta(query: QueryDivinoDashboardDto) {
    const scope: DivinoDashboardScope = query.scope ?? 'period';
    if (scope === 'all_time') {
      return {
        scope: 'all_time' as const,
        year: null,
        month: null,
        mode: 'all_time' as const,
      };
    }
    return {
      scope: 'period' as const,
      year: query.year ?? null,
      month: query.month ?? null,
      mode: query.month ? ('month' as const) : ('year' as const),
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
