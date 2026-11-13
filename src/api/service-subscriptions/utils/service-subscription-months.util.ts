import { BadRequestException } from '@nestjs/common';
import { MAX_SUBSCRIPTION_MONTHS } from '../service-subscription.constants';

const MONTH_LABELS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
  isoDate: string;
}

export function normalizeMonthStart(value: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(String(value ?? '').trim());
  if (!match) {
    throw new BadRequestException('Indica el mes con formato AAAA-MM');
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new BadRequestException('El mes no es válido');
  }
  return `${match[1]}-${match[2]}-01`;
}

export function listPeriodMonths(start: string, end: string): string[] {
  const from = normalizeMonthStart(start);
  const to = normalizeMonthStart(end);
  if (to < from) {
    throw new BadRequestException('El mes final no puede ser anterior al inicial');
  }
  const months: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    months.push(cursor);
    if (months.length > MAX_SUBSCRIPTION_MONTHS) {
      throw new BadRequestException(
        `La suscripción cubre como máximo ${MAX_SUBSCRIPTION_MONTHS} meses`,
      );
    }
    cursor = addMonths(cursor, 1);
  }
  return months;
}

export function addMonths(monthStart: string, count: number): string {
  const [yearText, monthText] = normalizeMonthStart(monthStart).split('-');
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + count, 1));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export function formatPeriodLabel(monthStart: string): string {
  const normalized = normalizeMonthStart(monthStart);
  const month = Number(normalized.slice(5, 7));
  const year = normalized.slice(0, 4);
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

export function billingDate(monthStart: string, billingDay: number): string {
  const day = Math.min(Math.max(Math.trunc(billingDay) || 1, 1), 28);
  return `${normalizeMonthStart(monthStart).slice(0, 8)}${String(day).padStart(2, '0')}`;
}

export function todayInTimeZone(
  timeZone = 'America/Tijuana',
  now = new Date(),
): CalendarDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { year, month, day, isoDate };
}

export function isCurrentMonth(
  monthStart: string,
  today: CalendarDate = todayInTimeZone(),
): boolean {
  return normalizeMonthStart(monthStart).slice(0, 7) === today.isoDate.slice(0, 7);
}
