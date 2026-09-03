export type UnclosedShiftAlert = {
  active: true;
  daily_shift_id: string;
  shift_date: string;
  today: string;
  days_open: number;
  title: string;
  message: string;
  severity: 'blocking';
};

/** Día calendario POS (México). Evita tratar el corte de hoy como “ayer” por UTC. */
const POS_CALENDAR_TIMEZONE = 'America/Mexico_City';

export function getTodayDateString(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: POS_CALENDAR_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function toDateOnlyString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

export function isPreviousDayOpenShift(
  shiftDate: string | Date,
  today = getTodayDateString(),
): boolean {
  return toDateOnlyString(shiftDate) < today;
}

function diffDays(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00.000Z`);
  const to = Date.parse(`${toDate}T00:00:00.000Z`);
  return Math.max(1, Math.round((to - from) / 86_400_000));
}

export function buildUnclosedShiftAlert(
  shift: { id: string; shift_date: string | Date } | null | undefined,
  today = getTodayDateString(),
): UnclosedShiftAlert | null {
  if (!shift || !isPreviousDayOpenShift(shift.shift_date, today)) {
    return null;
  }

  const shiftDate = toDateOnlyString(shift.shift_date);
  const daysOpen = diffDays(shiftDate, today);
  const isYesterday = daysOpen === 1;

  return {
    active: true,
    daily_shift_id: shift.id,
    shift_date: shiftDate,
    today,
    days_open: daysOpen,
    title: 'Corte del día anterior sin cerrar',
    message: isYesterday
      ? `No se cerró el corte de ayer (${shiftDate}). Es necesario cerrarlo para continuar.`
      : `Quedó un corte abierto del ${shiftDate} sin cerrar. Es necesario cerrarlo para continuar.`,
    severity: 'blocking',
  };
}
