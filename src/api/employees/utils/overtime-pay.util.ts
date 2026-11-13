export interface OvertimePolicyRules {
  workday_hours: number;
  daily_double_hours: number;
  weekly_double_hours: number;
  double_multiplier: number;
  excess_multiplier: number;
}

export const DEFAULT_OVERTIME_POLICY: OvertimePolicyRules = {
  workday_hours: 8,
  daily_double_hours: 3,
  weekly_double_hours: 9,
  double_multiplier: 2,
  excess_multiplier: 3,
};

export interface ResolvedOvertimeSchedule {
  work_date: string;
  start_time: string;
  end_time: string;
  requested_hours: number;
}

export interface OvertimePayAllocation {
  hourly_rate: number;
  daily_salary: number;
  double_hours: number;
  excess_hours: number;
  amount: number;
}

export interface OvertimePaymentDetail {
  workday_hours: number;
  daily_double_hours: number;
  weekly_double_hours: number;
  double_multiplier: number;
  excess_multiplier: number;
  prior_day_hours: number;
  prior_week_hours: number;
  week_start: string;
  week_end: string;
  daily_salary: number;
  monthly_salary: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)/;

export function todayInMexico(reference: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(reference);
}

export function normalizeClock(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = CLOCK.exec(String(value).trim());
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}

export function calendarDayIndex(isoDate: string): number | null {
  const match = ISO_DATE.exec(isoDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.round(date.getTime() / 86400000);
}

export function isoFromDayIndex(index: number): string {
  const date = new Date(index * 86400000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftIsoDate(isoDate: string, days: number): string | null {
  const index = calendarDayIndex(isoDate);
  if (index == null) return null;
  return isoFromDayIndex(index + days);
}

export function weekRange(
  isoDate: string,
): { week_start: string; week_end: string } | null {
  const index = calendarDayIndex(isoDate);
  if (index == null) return null;
  const date = new Date(index * 86400000);
  const weekday = date.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return {
    week_start: isoFromDayIndex(index + mondayOffset),
    week_end: isoFromDayIndex(index + mondayOffset + 6),
  };
}

export function minuteRange(
  workDate: string,
  startTime: string,
  endTime: string,
): [number, number] | null {
  const day = calendarDayIndex(workDate);
  const start = clockToMinutes(startTime);
  const end = clockToMinutes(endTime);
  if (day == null || start == null || end == null || start === end) {
    return null;
  }
  const startAbs = day * 1440 + start;
  const endAbs = (end > start ? day : day + 1) * 1440 + end;
  return [startAbs, endAbs];
}

export function rangesOverlap(
  left: [number, number],
  right: [number, number],
): boolean {
  return left[0] < right[1] && right[0] < left[1];
}

export function resolveOvertimeSchedule(
  workDate: string,
  startTime: string,
  endTime: string,
  today: string = todayInMexico(),
):
  | { ok: true; schedule: ResolvedOvertimeSchedule }
  | { ok: false; message: string } {
  const date = String(workDate ?? '').slice(0, 10);
  if (calendarDayIndex(date) == null) {
    return { ok: false, message: 'La fecha no es válida' };
  }
  if (date > today) {
    return { ok: false, message: 'La fecha no puede ser posterior a hoy' };
  }
  const start = normalizeClock(startTime);
  const end = normalizeClock(endTime);
  if (!start || !end) {
    return { ok: false, message: 'La hora debe tener formato HH:mm' };
  }
  if (start === end) {
    return {
      ok: false,
      message: 'La hora de término debe ser distinta a la de inicio',
    };
  }
  const range = minuteRange(date, start, end);
  if (!range) {
    return { ok: false, message: 'El horario no es válido' };
  }
  const requested = round2((range[1] - range[0]) / 60);
  if (requested <= 0 || requested > 24) {
    return { ok: false, message: 'El total de horas no es válido' };
  }
  return {
    ok: true,
    schedule: {
      work_date: date,
      start_time: start,
      end_time: end,
      requested_hours: requested,
    },
  };
}

export function allocateOvertimePay(input: {
  hours: number;
  monthlySalary: number;
  priorDayHours: number;
  priorWeekHours: number;
  policy: OvertimePolicyRules;
}): OvertimePayAllocation {
  const hours = round2(input.hours);
  const monthly = Number(input.monthlySalary);
  const workday = input.policy.workday_hours;
  const dailySalary = round2(monthly / 30);
  const hourly = round4(monthly / 30 / workday);
  const remainingDaily = Math.max(0, input.policy.daily_double_hours - input.priorDayHours);
  const remainingWeekly = Math.max(0, input.policy.weekly_double_hours - input.priorWeekHours);
  const doubleHours = round2(Math.min(hours, remainingDaily, remainingWeekly));
  const excessHours = round2(Math.max(0, hours - doubleHours));
  const amount = round2(
    doubleHours * hourly * input.policy.double_multiplier +
      excessHours * hourly * input.policy.excess_multiplier,
  );
  return {
    hourly_rate: hourly,
    daily_salary: dailySalary,
    double_hours: doubleHours,
    excess_hours: excessHours,
    amount,
  };
}

function clockToMinutes(value: string | null | undefined): number | null {
  const clock = normalizeClock(value);
  if (!clock) return null;
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
