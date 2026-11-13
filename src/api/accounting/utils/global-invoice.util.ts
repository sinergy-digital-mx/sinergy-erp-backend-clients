import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { formaPagoFromSalesMethod } from '../../electronic-invoicing/utils/payment-cfdi.util';

const BUSINESS_TIME_ZONE = 'America/Tijuana';

export interface GlobalInvoicePeriod {
  year: number;
  month: number;
  from: string;
  to: string;
  label: string;
}

export function parseGlobalInvoiceMonth(
  value: string | null | undefined,
): GlobalInvoicePeriod | null {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return null;
  const lastDay = new Date(year, month, 0).getDate();
  const mm = match[2];
  return {
    year,
    month,
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
    label: monthLabel(year, month),
  };
}

export function currentGlobalInvoiceMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  return `${year}-${month}`;
}

export function globalInvoiceActiveKey(
  billingBranchId: string,
  year: number,
  month: number,
): string {
  return `${billingBranchId}:${year}:${String(month).padStart(2, '0')}`;
}

export function monthLabel(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1));
  const label = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function resolveGlobalInvoicePayment(
  orders: Array<{
    payment_status: string;
    payment_method: string | null;
    lines: Array<{ method: string }>;
  }>,
): { formaPago: string; metodoPago: 'PUE' | 'PPD' } {
  const unpaid = orders.some((order) => order.payment_status !== 'Pagado');
  if (unpaid) {
    return { formaPago: '99', metodoPago: 'PPD' };
  }

  const codes = new Set<string>();
  for (const order of orders) {
    const methods = order.lines
      .map((line) => line.method)
      .filter((method) => method && method !== 'credit');
    if (methods.length > 1) {
      codes.add('99');
      continue;
    }
    const method = methods[0] ?? order.payment_method;
    codes.add(formaPagoFromSalesMethod(method) ?? '99');
  }

  if (codes.size === 1) {
    return { formaPago: [...codes][0], metodoPago: 'PUE' };
  }
  return { formaPago: '99', metodoPago: 'PUE' };
}

export function fiveDigitPostalCode(value: string | null | undefined): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  return /^\d{5}$/.test(digits) ? digits : '';
}

export function readXmlAttr(xml: string, name: string): string {
  const match = new RegExp(`\\b${name}="([^"]*)"`).exec(xml);
  return match?.[1] ?? '';
}

export async function assertSalesOrderNotInGlobalInvoice(
  manager: EntityManager,
  tenantId: string,
  salesOrderId: string,
): Promise<void> {
  const rows = await manager.query(
    `SELECT gi.id
     FROM global_invoice_orders gio
     INNER JOIN global_invoices gi ON gi.id = gio.global_invoice_id
     WHERE gio.sales_order_id = ?
       AND gi.tenant_id = ?
       AND gi.status IN ('pending', 'active')
     LIMIT 1`,
    [salesOrderId, tenantId],
  );
  if (Array.isArray(rows) && rows.length > 0) {
    throw new BadRequestException(
      'Esta orden ya está en la factura a público en general del mes. Cancélala en Cobranza si quieres facturarla sola.',
    );
  }
}
