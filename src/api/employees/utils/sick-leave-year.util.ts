import { inclusiveDayCount, parseCalendarDate } from './mexican-labor-law';

export interface SickLeaveSpan {
  start_date: Date | string;
  end_date: Date | string;
  days: number | string;
  status: string;
}

export interface SickLeaveYearSummary {
  year: number;
  approved_days: number;
  pending_days: number;
  request_count: number;
}

export function calendarYearInMexico(reference: Date = new Date()): number {
  const year = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
  }).format(reference);
  return Number(year);
}

export function sickLeaveDaysInYear(request: SickLeaveSpan, year: number): number {
  const start = toIsoDate(request.start_date);
  const end = toIsoDate(request.end_date);
  if (!start || !end || end < start) {
    return 0;
  }
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  if (end < yearStart || start > yearEnd) {
    return 0;
  }
  if (start >= yearStart && end <= yearEnd) {
    const stored = Number(request.days);
    return Number.isFinite(stored) && stored > 0 ? round1(stored) : 0;
  }
  const from = start > yearStart ? start : yearStart;
  const to = end < yearEnd ? end : yearEnd;
  return inclusiveDayCount(from, to);
}

export function summarizeSickLeaveYear(
  requests: SickLeaveSpan[],
  year: number,
): SickLeaveYearSummary {
  let approved = 0;
  let pending = 0;
  let requestCount = 0;
  for (const request of requests) {
    if (request.status !== 'approved' && request.status !== 'pending') {
      continue;
    }
    const days = sickLeaveDaysInYear(request, year);
    if (days <= 0) {
      continue;
    }
    requestCount += 1;
    if (request.status === 'approved') {
      approved += days;
    } else {
      pending += days;
    }
  }
  return {
    year,
    approved_days: round1(approved),
    pending_days: round1(pending),
    request_count: requestCount,
  };
}

function toIsoDate(value: Date | string | null | undefined): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  const date = parseCalendarDate(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
