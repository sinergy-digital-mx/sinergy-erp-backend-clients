import { BadRequestException } from '@nestjs/common';
import { isFiscalFlagOn } from '../../billing/utils/fiscal-tax-policy.util';

export const DEFAULT_PUBLIC_INVOICE_TIME_ZONE = 'America/Tijuana';

export const MEXICO_TIME_ZONES = [
  { id: 'America/Tijuana', label: 'Tijuana' },
  { id: 'America/Hermosillo', label: 'Hermosillo' },
  { id: 'America/Mazatlan', label: 'Mazatlán' },
  { id: 'America/Chihuahua', label: 'Chihuahua' },
  { id: 'America/Mexico_City', label: 'Ciudad de México' },
  { id: 'America/Monterrey', label: 'Monterrey' },
  { id: 'America/Matamoros', label: 'Matamoros' },
  { id: 'America/Ojinaga', label: 'Ojinaga' },
  { id: 'America/Bahia_Banderas', label: 'Bahía de Banderas' },
  { id: 'America/Merida', label: 'Mérida' },
  { id: 'America/Cancun', label: 'Cancún' },
] as const;

export const MEXICO_TIME_ZONE_IDS: string[] = MEXICO_TIME_ZONES.map((zone) => zone.id);

export interface PublicInvoicePolicy {
  autoEnabled: boolean;
  blockAfterMonth: boolean;
  hour: number | null;
  timeZone: string;
}

export interface PublicInvoicePolicySource {
  global_invoice_auto_enabled?: unknown;
  global_invoice_block_after_month?: unknown;
  global_invoice_hour?: unknown;
  global_invoice_timezone?: unknown;
}

export interface PublicInvoicePolicyView {
  auto_enabled: boolean;
  block_after_month: boolean;
  hour: number | null;
  timezone: string;
  timezone_label: string;
  calendar_month: string;
}

export interface PublicInvoiceSettingsInput {
  global_invoice_auto_enabled?: boolean;
  global_invoice_block_after_month?: boolean;
  global_invoice_hour?: number | null;
  global_invoice_timezone?: string | null;
}

export interface PublicInvoiceSettings {
  global_invoice_auto_enabled: boolean;
  global_invoice_block_after_month: boolean;
  global_invoice_hour: number | null;
  global_invoice_timezone: string | null;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function isMexicoTimeZone(value: string): boolean {
  return MEXICO_TIME_ZONE_IDS.includes(value);
}

export function mexicoTimeZoneLabel(timeZone: string): string {
  return MEXICO_TIME_ZONES.find((zone) => zone.id === timeZone)?.label ?? timeZone;
}

export function readPublicInvoicePolicy(
  row: PublicInvoicePolicySource | null | undefined,
): PublicInvoicePolicy {
  const rawZone =
    typeof row?.global_invoice_timezone === 'string' ? row.global_invoice_timezone : '';
  const hour = normalizeHour(row?.global_invoice_hour);
  return {
    autoEnabled: isFiscalFlagOn(row?.global_invoice_auto_enabled, false),
    blockAfterMonth: isFiscalFlagOn(row?.global_invoice_block_after_month, false),
    hour,
    timeZone: isMexicoTimeZone(rawZone) ? rawZone : DEFAULT_PUBLIC_INVOICE_TIME_ZONE,
  };
}

export function toPublicInvoicePolicyView(
  row: PublicInvoicePolicySource | null | undefined,
  now: Date = new Date(),
): PublicInvoicePolicyView {
  const policy = readPublicInvoicePolicy(row);
  return {
    auto_enabled: policy.autoEnabled,
    block_after_month: policy.blockAfterMonth,
    hour: policy.hour,
    timezone: policy.timeZone,
    timezone_label: mexicoTimeZoneLabel(policy.timeZone),
    calendar_month: currentMonthInTimeZone(policy.timeZone, now),
  };
}

export function resolvePublicInvoiceSettings(
  input: PublicInvoiceSettingsInput,
  current?: PublicInvoicePolicySource | null,
): PublicInvoiceSettings {
  const auto =
    input.global_invoice_auto_enabled ??
    isFiscalFlagOn(current?.global_invoice_auto_enabled, false);
  const block =
    input.global_invoice_block_after_month ??
    isFiscalFlagOn(current?.global_invoice_block_after_month, false);
  let hour =
    input.global_invoice_hour !== undefined
      ? input.global_invoice_hour
      : normalizeHour(current?.global_invoice_hour);
  let timeZone =
    input.global_invoice_timezone !== undefined
      ? input.global_invoice_timezone
      : typeof current?.global_invoice_timezone === 'string'
        ? current.global_invoice_timezone
        : null;

  if (hour != null && !Number.isInteger(hour)) {
    throw new BadRequestException(
      'La hora del cierre tiene que ser una hora en punto, del 0 al 23',
    );
  }
  if (hour != null && (hour < 0 || hour > 23)) {
    throw new BadRequestException('La hora del cierre tiene que estar entre 0 y 23');
  }
  if (timeZone != null && timeZone !== '' && !isMexicoTimeZone(timeZone)) {
    throw new BadRequestException('Elige una zona horaria de México');
  }
  if (timeZone === '') timeZone = null;

  if (auto || block) {
    if (hour == null) hour = 9;
    if (!timeZone) timeZone = DEFAULT_PUBLIC_INVOICE_TIME_ZONE;
  }

  return {
    global_invoice_auto_enabled: auto,
    global_invoice_block_after_month: block,
    global_invoice_hour: hour,
    global_invoice_timezone: timeZone,
  };
}

export function currentMonthInTimeZone(timeZone: string, now: Date = new Date()): string {
  const local = zonedParts(now, timeZone);
  return `${local.year}-${String(local.month).padStart(2, '0')}`;
}

export function automaticRunPeriod(
  policy: PublicInvoicePolicy,
  now: Date = new Date(),
): { year: number; month: number } | null {
  if (!policy.autoEnabled || policy.hour == null) return null;
  const local = zonedParts(now, policy.timeZone);
  if (local.day !== lastDayOfMonth(local.year, local.month)) return null;
  if (local.hour < policy.hour) return null;
  return { year: local.year, month: local.month };
}

export function isOrderMonthClosed(
  createdAt: Date | string | null | undefined,
  policy: PublicInvoicePolicy,
  now: Date = new Date(),
): boolean {
  if (!policy.blockAfterMonth || policy.hour == null) return false;
  const created = coerceDate(createdAt);
  if (!created) return false;
  const local = zonedParts(created, policy.timeZone);
  const cutoff = zonedTimeToUtc(
    local.year,
    local.month,
    lastDayOfMonth(local.year, local.month),
    policy.hour,
    0,
    policy.timeZone,
  );
  return now.getTime() >= cutoff.getTime();
}

export function assertOrderMonthStillOpen(
  createdAt: Date | string | null | undefined,
  fiscal: PublicInvoicePolicySource | null | undefined,
  now: Date = new Date(),
): void {
  const policy = readPublicInvoicePolicy(fiscal);
  if (!isOrderMonthClosed(createdAt, policy, now)) return;
  throw new BadRequestException(orderMonthClosedMessage(createdAt, policy));
}

export function orderMonthClosedMessage(
  createdAt: Date | string | null | undefined,
  policy: PublicInvoicePolicy,
): string {
  const created = coerceDate(createdAt);
  const local = created ? zonedParts(created, policy.timeZone) : null;
  const month =
    local == null
      ? 'ese mes'
      : new Intl.DateTimeFormat('es-MX', {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(Date.UTC(local.year, local.month - 1, 1)));
  const hour = `${String(policy.hour ?? 0).padStart(2, '0')}:00`;
  return (
    `Esta orden es de ${month}. ` +
    `La razón social no permite facturarla por separado después del último día de ese mes a las ${hour} ` +
    `(${mexicoTimeZoneLabel(policy.timeZone)}).`
  );
}

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  let hour = read('hour');
  if (hour === 24) hour = 0;
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour,
    minute: read('minute'),
  };
}

export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const local = zonedParts(utc, timeZone);
    const shown = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
    const wanted = Date.UTC(year, month - 1, day, hour, minute);
    utc = new Date(utc.getTime() + (wanted - shown));
  }
  return utc;
}

function normalizeHour(value: unknown): number | null {
  if (value == null || value === '') return null;
  const hour = Number(value);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  return hour;
}

function coerceDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
