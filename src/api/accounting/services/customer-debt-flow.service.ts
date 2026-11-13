import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomerDebtLedgerMovementType } from '../../../entities/accounting/customer-debt-ledger-movement-type.enum';
import {
  buildExportSubtitle,
  buildStyledExcelBuffer,
  ExcelColumnDef,
} from '../../../common/utils/excel-export.util';
import { DebtFlowPeriod, DebtFlowView, QueryDebtFlowDto } from '../dto/query-debt-flow.dto';
import {
  DebtAgingBucket,
  debtAgingBucket,
  debtMovementDescription,
  debtMovementLabel,
  debtPaymentMethodLabel,
  formatDebtDateTime,
  formatDebtDay,
  roundDebtMoney,
  stripAdvanceFromDebtMovements,
} from '../utils/customer-debt-ledger.util';

type FlowOptions = {
  allRows?: boolean;
};

type DebtMovementRow = {
  id: string;
  customer_id: number | string;
  customer_name: string;
  customer_rfc: string | null;
  fiscal_razon_social: string | null;
  sales_order_id: string;
  folio: string;
  movement_type: CustomerDebtLedgerMovementType;
  amount_delta: number | string;
  balance_after: number | string;
  order_balance_after: number | string;
  occurred_at: Date | string;
  due_date: Date | string | null;
  payment_method: string | null;
  reference_number: string | null;
  source: string | null;
  occurred_key: string;
  currency: string | null;
  order_total: number | string | null;
  payment_source: string | null;
  advance_requested: number | string | null;
  advance_paid: number | string | null;
  advance_invoiced: number | string | null;
};

export type DebtAgingRow = {
  customer_id: number;
  customer_name: string;
  customer_rfc: string | null;
  fiscal_razon_social: string | null;
  open_order_count: number;
  mxn_order_count: number;
  usd_order_count: number;
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d91_plus: number;
  total: number;
  usd_current: number;
  usd_d1_30: number;
  usd_d31_60: number;
  usd_d61_90: number;
  usd_d91_plus: number;
  usd_total: number;
  credit_days: number | null;
  credit_limit: number | null;
};

export type DebtAgingTotals = {
  customer_count: number;
  open_order_count: number;
  mxn_order_count: number;
  usd_order_count: number;
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d91_plus: number;
  total: number;
  usd_current: number;
  usd_d1_30: number;
  usd_d31_60: number;
  usd_d61_90: number;
  usd_d91_plus: number;
  usd_total: number;
};

export type DebtLedgerRow = {
  id: string;
  occurred_at: string;
  movement_type: CustomerDebtLedgerMovementType | 'opening';
  title: string;
  description: string;
  customer_id: number;
  customer_name: string;
  customer_rfc: string | null;
  fiscal_razon_social: string | null;
  sales_order_id: string | null;
  folio: string | null;
  payment_method: string | null;
  payment_method_label: string | null;
  reference_number: string | null;
  charge_amount: number | null;
  payment_amount: number | null;
  order_balance_after: number | null;
  balance_after: number | null;
  currency: 'MXN' | 'USD';
  balance_mxn: number | null;
  balance_usd: number | null;
  due_date: string | null;
  is_opening: boolean;
};

export type DebtFlowResponse = {
  filters_applied: {
    fiscal_configuration_id: string;
    customer_id: number | null;
    search: string | null;
    view: DebtFlowView;
    period: DebtFlowPeriod;
    date_from: string;
    date_to: string;
    period_label: string;
  };
  aging: DebtAgingRow[];
  aging_totals: DebtAgingTotals;
  ledger: DebtLedgerRow[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

@Injectable()
export class CustomerDebtFlowService {
  constructor(private readonly dataSource: DataSource) {}

  async getReport(
    tenantId: string,
    filters: QueryDebtFlowDto,
    options: FlowOptions = {},
  ): Promise<DebtFlowResponse> {
    const view = filters.view ?? DebtFlowView.AGING;
    const { dateFrom, dateTo } = this.resolveDateRange(
      filters.period ?? DebtFlowPeriod.MONTH,
      filters.date_from,
      filters.date_to,
    );
    const page = options.allRows ? 1 : Math.max(1, filters.page ?? 1);
    const limit = options.allRows ? 100 : Math.min(100, Math.max(1, filters.limit ?? 50));
    const filtersApplied = this.filtersApplied(filters, view, dateFrom, dateTo);

    if (view === DebtFlowView.LEDGER) {
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

  async exportExcel(tenantId: string, filters: QueryDebtFlowDto): Promise<Buffer> {
    const report = await this.getReport(tenantId, filters, { allRows: true });
    const view = filters.view ?? DebtFlowView.AGING;

    if (view === DebtFlowView.LEDGER) {
      return buildStyledExcelBuffer({
        sheetName: 'Flujo de deuda',
        title: 'Flujo de deuda',
        subtitle: buildExportSubtitle([
          report.filters_applied.period_label,
          'Histórico capturado',
        ]),
        headerColor: 'FF4338CA',
        titleColor: 'FF312E81',
        columns: ledgerColumns(),
        rows: report.ledger.map((row) => ({
          occurred_at: formatDebtDateTime(row.occurred_at),
          customer_name: row.customer_name,
          customer_rfc: row.customer_rfc ?? '',
          fiscal_razon_social: row.fiscal_razon_social ?? '',
          title: row.title,
          folio: row.folio ?? '',
          description: row.description,
          payment_method_label: row.payment_method_label ?? '',
          reference_number: row.reference_number ?? '',
          due_date: row.due_date ? formatDebtDay(row.due_date) : '',
          charge_amount: row.charge_amount,
          payment_amount: row.payment_amount,
          order_balance_after: row.order_balance_after,
          currency: row.currency,
          balance_mxn: row.balance_mxn,
          balance_usd: row.balance_usd,
        })),
      });
    }

    return buildStyledExcelBuffer({
      sheetName: 'Antigüedad de saldos',
      title: 'Antigüedad de saldos',
      subtitle: buildExportSubtitle([
        `Corte ${formatDebtDay(report.filters_applied.date_to.slice(0, 10))}`,
        'Histórico capturado',
      ]),
      headerColor: 'FF4338CA',
      titleColor: 'FF312E81',
      columns: agingColumns(),
      rows: [
        ...report.aging.map((row) => ({
          customer_name: row.customer_name,
          customer_rfc: row.customer_rfc ?? '',
          fiscal_razon_social: row.fiscal_razon_social ?? '',
          mxn_order_count: row.mxn_order_count,
          current: row.current,
          d1_30: row.d1_30,
          d31_60: row.d31_60,
          d61_90: row.d61_90,
          d91_plus: row.d91_plus,
          total: row.total,
          usd_order_count: row.usd_order_count,
          usd_current: row.usd_current,
          usd_d1_30: row.usd_d1_30,
          usd_d31_60: row.usd_d31_60,
          usd_d61_90: row.usd_d61_90,
          usd_d91_plus: row.usd_d91_plus,
          usd_total: row.usd_total,
          credit_days: row.credit_days,
          credit_limit: row.credit_limit,
        })),
        {
          customer_name: 'Total',
          customer_rfc: '',
          fiscal_razon_social: '',
          mxn_order_count: report.aging_totals.mxn_order_count,
          current: report.aging_totals.current,
          d1_30: report.aging_totals.d1_30,
          d31_60: report.aging_totals.d31_60,
          d61_90: report.aging_totals.d61_90,
          d91_plus: report.aging_totals.d91_plus,
          total: report.aging_totals.total,
          usd_order_count: report.aging_totals.usd_order_count,
          usd_current: report.aging_totals.usd_current,
          usd_d1_30: report.aging_totals.usd_d1_30,
          usd_d31_60: report.aging_totals.usd_d31_60,
          usd_d61_90: report.aging_totals.usd_d61_90,
          usd_d91_plus: report.aging_totals.usd_d91_plus,
          usd_total: report.aging_totals.usd_total,
          credit_days: null,
          credit_limit: null,
        },
      ],
    });
  }

  getFilename(view: DebtFlowView = DebtFlowView.AGING): string {
    const day = new Date().toISOString().slice(0, 10);
    return view === DebtFlowView.LEDGER
      ? `flujo-deuda-${day}.xlsx`
      : `antiguedad-saldos-${day}.xlsx`;
  }

  private async buildAging(
    tenantId: string,
    filters: QueryDebtFlowDto,
    asOf: Date,
  ): Promise<{ rows: DebtAgingRow[]; totals: DebtAgingTotals }> {
    const openRows = lastDebtOrder(await this.movementsUntil(tenantId, filters, asOf)).filter(
      (row) => Number(row.order_balance_after || 0) > 0.009,
    );

    const grouped = new Map<number | string, DebtAgingRow>();
    for (const row of openRows) {
      const pending = roundDebtMoney(Number(row.order_balance_after || 0));
      if (pending <= 0) continue;
      const bucket = debtAgingBucket(row.due_date ? String(row.due_date).slice(0, 10) : null, asOf);
      const current = grouped.get(row.customer_id) ?? blankAging(row);
      const currency = debtCurrency(row.currency);
      if (currency === 'USD') {
        addUsdBucket(current, bucket, pending);
        current.usd_order_count += 1;
        current.usd_total = roundDebtMoney(current.usd_total + pending);
      } else {
        addBucket(current, bucket, pending);
        current.mxn_order_count += 1;
        current.total = roundDebtMoney(current.total + pending);
      }
      current.open_order_count += 1;
      current.fiscal_razon_social = keepRazon(current.fiscal_razon_social, row.fiscal_razon_social);
      grouped.set(row.customer_id, current);
    }

    const rows = Array.from(grouped.values()).sort(
      (a, b) =>
        b.open_order_count - a.open_order_count ||
        b.total - a.total ||
        b.usd_total - a.usd_total ||
        a.customer_name.localeCompare(b.customer_name, 'es'),
    );
    await this.attachCredit(tenantId, filters.fiscal_configuration_id, rows);
    return { rows, totals: sumAging(rows) };
  }

  private async buildLedger(
    tenantId: string,
    filters: QueryDebtFlowDto,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<DebtLedgerRow[]> {
    const history = await this.movementsUntil(tenantId, filters, dateTo);
    const fromKey = this.formatSqlDateTime(dateFrom);
    const openingOrders = lastDebtOrder(
      history.filter((row) => String(row.occurred_key) < fromKey),
    ).filter((row) => Number(row.order_balance_after || 0) > 0.009);
    const movements = history.filter((row) => String(row.occurred_key) >= fromKey);

    const rows: DebtLedgerRow[] = [];
    for (const order of openingOrders) {
      const pending = roundDebtMoney(Number(order.order_balance_after || 0));
      if (pending <= 0) continue;
      rows.push(this.toOpeningRow(order, dateFrom, pending));
    }
    for (const movement of movements) {
      rows.push(this.toMovementRow(movement));
    }

    rows.sort((a, b) => {
      const name = a.customer_name.localeCompare(b.customer_name, 'es');
      if (name !== 0) return name;
      if (a.is_opening !== b.is_opening) return a.is_opening ? -1 : 1;
      const time = new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime();
      if (time !== 0) return time;
      return (a.folio ?? '').localeCompare(b.folio ?? '');
    });
    applyCurrencyBalances(rows);
    return rows;
  }

  private toOpeningRow(order: DebtMovementRow, dateFrom: Date, pending: number): DebtLedgerRow {
    const due = order.due_date ? String(order.due_date).slice(0, 10) : null;
    return {
      id: `opening:${order.sales_order_id}`,
      occurred_at: dateFrom.toISOString(),
      movement_type: 'opening',
      title: 'Saldo inicial',
      description: debtMovementDescription({
        movementType: 'opening',
        folio: order.folio,
        dueDate: due,
      }),
      customer_id: Number(order.customer_id),
      customer_name: order.customer_name,
      customer_rfc: order.customer_rfc,
      fiscal_razon_social: order.fiscal_razon_social,
      sales_order_id: order.sales_order_id,
      folio: order.folio,
      payment_method: null,
      payment_method_label: null,
      reference_number: null,
      charge_amount: null,
      payment_amount: null,
      order_balance_after: pending,
      balance_after: null,
      currency: debtCurrency(order.currency),
      balance_mxn: null,
      balance_usd: null,
      due_date: due,
      is_opening: true,
    };
  }

  private toMovementRow(row: DebtMovementRow): DebtLedgerRow {
    const delta = roundDebtMoney(Number(row.amount_delta || 0));
    const type = row.movement_type;
    const isCharge =
      type === CustomerDebtLedgerMovementType.CHARGE ||
      type === CustomerDebtLedgerMovementType.PAYMENT_REVERSAL ||
      type === CustomerDebtLedgerMovementType.CREDIT_NOTE_REVERSAL;
    const due = row.due_date ? String(row.due_date).slice(0, 10) : null;
    return {
      id: row.id,
      occurred_at: toIso(row.occurred_at),
      movement_type: type,
      title: debtMovementLabel(type),
      description: debtMovementDescription({
        movementType: type,
        folio: row.folio,
        dueDate: due,
        paymentMethod: row.payment_method,
        referenceNumber: row.reference_number,
      }),
      customer_id: Number(row.customer_id),
      customer_name: row.customer_name,
      customer_rfc: row.customer_rfc,
      fiscal_razon_social: row.fiscal_razon_social,
      sales_order_id: row.sales_order_id,
      folio: row.folio,
      payment_method: row.payment_method,
      payment_method_label: debtPaymentMethodLabel(row.payment_method),
      reference_number: row.reference_number,
      charge_amount: isCharge ? roundDebtMoney(Math.abs(delta)) : null,
      payment_amount: isCharge ? null : roundDebtMoney(Math.abs(delta)),
      order_balance_after: roundDebtMoney(Number(row.order_balance_after || 0)),
      balance_after: roundDebtMoney(Number(row.balance_after || 0)),
      currency: debtCurrency(row.currency),
      balance_mxn: null,
      balance_usd: null,
      due_date: due,
      is_opening: false,
    };
  }

  private async movementsUntil(
    tenantId: string,
    filters: QueryDebtFlowDto,
    asOf: Date,
  ): Promise<DebtMovementRow[]> {
    const { where, params } = this.baseWhere(
      tenantId,
      filters,
      ['l.occurred_at <= ?'],
      [this.formatSqlDateTime(asOf)],
    );
    const rows: DebtMovementRow[] = await this.dataSource.query(
      `
      SELECT
        l.id, l.customer_id, l.customer_name, l.customer_rfc, l.fiscal_razon_social,
        l.sales_order_id, l.folio, l.movement_type, l.amount_delta, l.balance_after,
        l.order_balance_after, l.occurred_at, l.due_date, l.payment_method, l.reference_number,
        l.source,
        DATE_FORMAT(l.occurred_at, '%Y-%m-%d %H:%i:%s') AS occurred_key,
        COALESCE(NULLIF(so.currency, ''), 'MXN') AS currency,
        so.total AS order_total,
        pay.source AS payment_source,
        COALESCE(adv_q.advance_requested, 0) AS advance_requested,
        COALESCE(adv_p.advance_paid, 0) AS advance_paid,
        COALESCE(adv_i.advance_invoiced, 0) AS advance_invoiced
      FROM acc_customer_debt_ledger l
      INNER JOIN inv_s_sales_orders so
        ON so.id = l.sales_order_id
       AND so.tenant_id = l.tenant_id
       AND so.is_credit = 1
      LEFT JOIN inv_s_sales_order_payments pay
        ON pay.id = l.sales_order_payment_id
       AND pay.tenant_id = l.tenant_id
      LEFT JOIN (
        SELECT converted_to_sales_order_id AS sales_order_id,
               MAX(advance_requested_total) AS advance_requested
        FROM inv_s_quotations
        WHERE tenant_id = ?
          AND converted_to_sales_order_id IS NOT NULL
        GROUP BY converted_to_sales_order_id
      ) adv_q ON adv_q.sales_order_id = so.id
      LEFT JOIN (
        SELECT sales_order_id, SUM(amount) AS advance_paid
        FROM inv_s_sales_order_payments
        WHERE tenant_id = ? AND source = 'advance'
        GROUP BY sales_order_id
      ) adv_p ON adv_p.sales_order_id = so.id
      LEFT JOIN (
        SELECT source_id AS sales_order_id, SUM(total) AS advance_invoiced
        FROM electronic_invoices
        WHERE tenant_id = ?
          AND invoice_role = 'advance'
          AND (sat_status IS NULL OR sat_status <> 'Cancelado')
          AND (
            sat_status = 'Vigente'
            OR stamp_status IN ('stamped', 'cancel_pending', 'cancel_error')
          )
        GROUP BY source_id
      ) adv_i ON adv_i.sales_order_id = so.id
      WHERE ${where}
      ORDER BY l.occurred_at ASC, l.created_at ASC, l.id ASC
      `,
      [tenantId, tenantId, tenantId, ...params],
    );
    return stripAdvanceFromDebtMovements(rows);
  }

  private baseWhere(
    tenantId: string,
    filters: QueryDebtFlowDto,
    extra: string[],
    extraParams: unknown[] = [],
  ): { where: string; params: unknown[] } {
    const clauses = ['l.tenant_id = ?', 'l.fiscal_configuration_id = ?', ...extra];
    const params: unknown[] = [tenantId, filters.fiscal_configuration_id, ...extraParams];
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

  private async attachCredit(
    tenantId: string,
    fiscalConfigurationId: string,
    rows: DebtAgingRow[],
  ): Promise<void> {
    if (!rows.length) return;
    const ids = rows.map((row) => row.customer_id);
    const credits: Array<{
      customer_id: number | string;
      credit_days: number | string | null;
      credit_amount: number | string | null;
      credit_enabled: number | string | boolean;
    }> = await this.dataSource.query(
      `
      SELECT customer_id, credit_days, credit_amount, credit_enabled
      FROM customer_credits
      WHERE tenant_id = ?
        AND fiscal_configuration_id = ?
        AND customer_id IN (${ids.map(() => '?').join(',')})
      `,
      [tenantId, fiscalConfigurationId, ...ids],
    );
    const byCustomer = new Map<number, (typeof credits)[number]>();
    for (const credit of credits) {
      byCustomer.set(Number(credit.customer_id), credit);
    }
    for (const row of rows) {
      const credit = byCustomer.get(row.customer_id);
      if (!credit || !Number(credit.credit_enabled)) continue;
      row.credit_days = credit.credit_days != null ? Number(credit.credit_days) : null;
      row.credit_limit =
        credit.credit_amount != null ? roundDebtMoney(Number(credit.credit_amount)) : null;
    }
  }

  private filtersApplied(
    filters: QueryDebtFlowDto,
    view: DebtFlowView,
    dateFrom: Date,
    dateTo: Date,
  ): DebtFlowResponse['filters_applied'] {
    const fromLabel = formatDebtDay(this.formatSqlDate(dateFrom));
    const toLabel = formatDebtDay(this.formatSqlDate(dateTo));
    return {
      fiscal_configuration_id: filters.fiscal_configuration_id,
      customer_id: filters.customer_id ?? null,
      search: filters.search?.trim() || null,
      view,
      period: filters.period ?? DebtFlowPeriod.MONTH,
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString(),
      period_label: view === DebtFlowView.AGING ? `Al ${toLabel}` : `${fromLabel} – ${toLabel}`,
    };
  }

  private resolveDateRange(
    period: DebtFlowPeriod,
    dateFrom?: string,
    dateTo?: string,
  ): { dateFrom: Date; dateTo: Date } {
    const now = new Date();
    switch (period) {
      case DebtFlowPeriod.TODAY:
        return { dateFrom: startOfDay(now), dateTo: endOfDay(now) };
      case DebtFlowPeriod.WEEK: {
        const start = new Date(now);
        const day = start.getDay();
        start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
        return { dateFrom: startOfDay(start), dateTo: endOfDay(now) };
      }
      case DebtFlowPeriod.YEAR:
        return {
          dateFrom: startOfDay(new Date(now.getFullYear(), 0, 1)),
          dateTo: endOfDay(now),
        };
      case DebtFlowPeriod.RANGE: {
        if (!dateFrom || !dateTo) {
          throw new BadRequestException('El rango requiere fecha inicial y final');
        }
        const from = parseLocalDay(dateFrom, false);
        const to = parseLocalDay(dateTo, true);
        if (!from || !to || from > to) {
          throw new BadRequestException('El rango de fechas no es válido');
        }
        return { dateFrom: from, dateTo: to };
      }
      case DebtFlowPeriod.MONTH:
      default:
        return {
          dateFrom: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
          dateTo: endOfDay(now),
        };
    }
  }

  private formatSqlDateTime(value: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  private formatSqlDate(value: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

function endOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

function parseLocalDay(value: string, end: boolean): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = end
    ? new Date(year, month, day, 23, 59, 59, 999)
    : new Date(year, month, day, 0, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function lastDebtOrder<T extends { sales_order_id: string }>(rows: T[]): T[] {
  const latest = new Map<string, T>();
  for (const row of rows) latest.set(row.sales_order_id, row);
  return [...latest.values()];
}

function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function blankAging(row: DebtMovementRow): DebtAgingRow {
  return {
    customer_id: Number(row.customer_id),
    customer_name: row.customer_name,
    customer_rfc: row.customer_rfc,
    fiscal_razon_social: row.fiscal_razon_social,
    open_order_count: 0,
    mxn_order_count: 0,
    usd_order_count: 0,
    current: 0,
    d1_30: 0,
    d31_60: 0,
    d61_90: 0,
    d91_plus: 0,
    total: 0,
    usd_current: 0,
    usd_d1_30: 0,
    usd_d31_60: 0,
    usd_d61_90: 0,
    usd_d91_plus: 0,
    usd_total: 0,
    credit_days: null,
    credit_limit: null,
  };
}

type UsdBucketKey = 'usd_current' | 'usd_d1_30' | 'usd_d31_60' | 'usd_d61_90' | 'usd_d91_plus';

const USD_BUCKET: Record<DebtAgingBucket, UsdBucketKey> = {
  current: 'usd_current',
  d1_30: 'usd_d1_30',
  d31_60: 'usd_d31_60',
  d61_90: 'usd_d61_90',
  d91_plus: 'usd_d91_plus',
};

function debtCurrency(value: string | null | undefined): 'MXN' | 'USD' {
  return String(value ?? '').trim().toUpperCase() === 'USD' ? 'USD' : 'MXN';
}

function addUsdBucket(row: DebtAgingRow, bucket: DebtAgingBucket, amount: number): void {
  const key = USD_BUCKET[bucket];
  row[key] = roundDebtMoney(row[key] + amount);
}

function applyCurrencyBalances(rows: DebtLedgerRow[]): void {
  let customerId: number | null = null;
  let mxn = 0;
  let usd = 0;
  for (const row of rows) {
    if (row.customer_id !== customerId) {
      customerId = row.customer_id;
      mxn = 0;
      usd = 0;
    }
    const delta = row.is_opening
      ? roundDebtMoney(Number(row.order_balance_after || 0))
      : roundDebtMoney(Number(row.charge_amount || 0) - Number(row.payment_amount || 0));
    if (row.currency === 'USD') usd = roundDebtMoney(usd + delta);
    else mxn = roundDebtMoney(mxn + delta);
    row.balance_mxn = mxn;
    row.balance_usd = usd;
  }
}

function addBucket(row: DebtAgingRow, bucket: DebtAgingBucket, amount: number): void {
  row[bucket] = roundDebtMoney(row[bucket] + amount);
}

function keepRazon(current: string | null, next: string | null): string | null {
  const name = next?.trim() || null;
  if (!current) return name;
  return current;
}

function emptyTotals(): DebtAgingTotals {
  return {
    customer_count: 0,
    open_order_count: 0,
    mxn_order_count: 0,
    usd_order_count: 0,
    current: 0,
    d1_30: 0,
    d31_60: 0,
    d61_90: 0,
    d91_plus: 0,
    total: 0,
    usd_current: 0,
    usd_d1_30: 0,
    usd_d31_60: 0,
    usd_d61_90: 0,
    usd_d91_plus: 0,
    usd_total: 0,
  };
}

function sumAging(rows: DebtAgingRow[]): DebtAgingTotals {
  const totals = emptyTotals();
  totals.customer_count = rows.length;
  for (const row of rows) {
    totals.open_order_count += row.open_order_count;
    totals.mxn_order_count += row.mxn_order_count;
    totals.usd_order_count += row.usd_order_count;
    totals.current = roundDebtMoney(totals.current + row.current);
    totals.d1_30 = roundDebtMoney(totals.d1_30 + row.d1_30);
    totals.d31_60 = roundDebtMoney(totals.d31_60 + row.d31_60);
    totals.d61_90 = roundDebtMoney(totals.d61_90 + row.d61_90);
    totals.d91_plus = roundDebtMoney(totals.d91_plus + row.d91_plus);
    totals.total = roundDebtMoney(totals.total + row.total);
    totals.usd_current = roundDebtMoney(totals.usd_current + row.usd_current);
    totals.usd_d1_30 = roundDebtMoney(totals.usd_d1_30 + row.usd_d1_30);
    totals.usd_d31_60 = roundDebtMoney(totals.usd_d31_60 + row.usd_d31_60);
    totals.usd_d61_90 = roundDebtMoney(totals.usd_d61_90 + row.usd_d61_90);
    totals.usd_d91_plus = roundDebtMoney(totals.usd_d91_plus + row.usd_d91_plus);
    totals.usd_total = roundDebtMoney(totals.usd_total + row.usd_total);
  }
  return totals;
}

function agingColumns(): ExcelColumnDef[] {
  return [
    { header: 'Cliente', key: 'customer_name', width: 36 },
    { header: 'RFC', key: 'customer_rfc', width: 16 },
    { header: 'Razón social', key: 'fiscal_razon_social', width: 28 },
    { header: 'Órdenes MXN', key: 'mxn_order_count', width: 14, type: 'integer' },
    { header: 'Por vencer MXN', key: 'current', width: 16, type: 'currency' },
    { header: '1-30 MXN', key: 'd1_30', width: 14, type: 'currency' },
    { header: '31-60 MXN', key: 'd31_60', width: 14, type: 'currency' },
    { header: '61-90 MXN', key: 'd61_90', width: 14, type: 'currency' },
    { header: '+90 MXN', key: 'd91_plus', width: 14, type: 'currency' },
    { header: 'Debe MXN', key: 'total', width: 16, type: 'currency' },
    { header: 'Órdenes USD', key: 'usd_order_count', width: 14, type: 'integer' },
    { header: 'Por vencer USD', key: 'usd_current', width: 16, type: 'currency' },
    { header: '1-30 USD', key: 'usd_d1_30', width: 14, type: 'currency' },
    { header: '31-60 USD', key: 'usd_d31_60', width: 14, type: 'currency' },
    { header: '61-90 USD', key: 'usd_d61_90', width: 14, type: 'currency' },
    { header: '+90 USD', key: 'usd_d91_plus', width: 14, type: 'currency' },
    { header: 'Debe USD', key: 'usd_total', width: 16, type: 'currency' },
    { header: 'Días de crédito', key: 'credit_days', width: 16, type: 'integer' },
    { header: 'Límite', key: 'credit_limit', width: 16, type: 'currency' },
  ];
}

function ledgerColumns(): ExcelColumnDef[] {
  return [
    { header: 'Fecha', key: 'occurred_at', width: 20 },
    { header: 'Cliente', key: 'customer_name', width: 32 },
    { header: 'RFC', key: 'customer_rfc', width: 16 },
    { header: 'Razón social', key: 'fiscal_razon_social', width: 28 },
    { header: 'Movimiento', key: 'title', width: 18 },
    { header: 'OV', key: 'folio', width: 16 },
    { header: 'Detalle', key: 'description', width: 42 },
    { header: 'Método', key: 'payment_method_label', width: 16 },
    { header: 'Referencia', key: 'reference_number', width: 18 },
    { header: 'Vence', key: 'due_date', width: 14 },
    { header: 'Cargo', key: 'charge_amount', width: 14, type: 'currency' },
    { header: 'Abono', key: 'payment_amount', width: 14, type: 'currency' },
    { header: 'Moneda', key: 'currency', width: 10 },
    { header: 'Saldo OV', key: 'order_balance_after', width: 14, type: 'currency' },
    { header: 'Saldo MXN', key: 'balance_mxn', width: 16, type: 'currency' },
    { header: 'Saldo USD', key: 'balance_usd', width: 16, type: 'currency' },
  ];
}
