import { normalizeClock, round2 } from './overtime-pay.util';

export const WORK_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export type WorkWeekday = (typeof WORK_WEEKDAYS)[number];

export const WORK_WEEKDAY_LABELS: Record<WorkWeekday, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export interface WorkScheduleDay {
  weekday: WorkWeekday;
  is_workday: boolean;
  start_time: string | null;
  end_time: string | null;
  hours: number;
}

export interface WorkSchedule {
  days: WorkScheduleDay[];
  weekly_hours: number;
  notes: string | null;
}

export interface WorkScheduleDayInput {
  weekday: number;
  is_workday: boolean;
  start_time?: string | null;
  end_time?: string | null;
}

function clockMinutes(value: string | null | undefined): number | null {
  const clock = normalizeClock(value);
  if (!clock) return null;
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
}

export function hoursBetweenClocks(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): number | null {
  const start = clockMinutes(startTime);
  const end = clockMinutes(endTime);
  if (start == null || end == null || start === end) {
    return null;
  }
  const minutes = end > start ? end - start : 1440 - start + end;
  return round2(minutes / 60);
}

export function draftWorkSchedule(): WorkSchedule {
  const days = WORK_WEEKDAYS.map((weekday) => {
    const isWorkday = weekday <= 5;
    return buildDay(
      weekday,
      isWorkday,
      isWorkday ? '09:00' : null,
      isWorkday ? '18:00' : null,
    );
  });
  return {
    days,
    weekly_hours: sumHours(days),
    notes: null,
  };
}

export function presentWorkSchedule(raw: unknown): WorkSchedule | null {
  try {
    const parsed: unknown =
      typeof raw === 'string'
        ? JSON.parse(raw)
        : raw;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const resolved = resolveWorkSchedule(parsed);
    return resolved.ok ? resolved.schedule : null;
  } catch {
    return null;
  }
}

export function resolveWorkSchedule(
  raw: unknown,
):
  | { ok: true; schedule: WorkSchedule }
  | { ok: false; message: string } {
  const source: Record<string, unknown> =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const incoming = Array.isArray(source['days']) ? (source['days'] as unknown[]) : [];
  const byWeekday = new Map<WorkWeekday, WorkScheduleDayInput>();

  for (const item of incoming) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const weekday = Number(row['weekday']) as WorkWeekday;
    if (!WORK_WEEKDAYS.includes(weekday)) {
      return { ok: false, message: 'El día de la semana no es válido.' };
    }
    if (byWeekday.has(weekday)) {
      return { ok: false, message: 'Hay un día repetido en el horario.' };
    }
    byWeekday.set(weekday, {
      weekday,
      is_workday: row['is_workday'] === true || row['is_workday'] === 1,
      start_time: row['start_time'] == null ? null : String(row['start_time']),
      end_time: row['end_time'] == null ? null : String(row['end_time']),
    });
  }

  const days: WorkScheduleDay[] = [];
  for (const weekday of WORK_WEEKDAYS) {
    const row = byWeekday.get(weekday);
    const isWorkday = row?.is_workday === true;
    if (isWorkday) {
      const start = normalizeClock(row?.start_time);
      const end = normalizeClock(row?.end_time);
      if (!start || !end) {
        return {
          ok: false,
          message: `Indica entrada y salida para ${WORK_WEEKDAY_LABELS[weekday]}.`,
        };
      }
      const hours = hoursBetweenClocks(start, end);
      if (hours == null) {
        return {
          ok: false,
          message: `La entrada y la salida de ${WORK_WEEKDAY_LABELS[weekday]} no pueden ser iguales.`,
        };
      }
      days.push(buildDay(weekday, true, start, end, hours));
    } else {
      days.push(buildDay(weekday, false, null, null, 0));
    }
  }

  if (!days.some((day) => day.is_workday)) {
    return { ok: false, message: 'Marca al menos un día laboral.' };
  }

  const notesRaw = source['notes'];
  const notes =
    notesRaw == null || notesRaw === ''
      ? null
      : String(notesRaw).trim() || null;
  if (notes && notes.length > 255) {
    return { ok: false, message: 'Las notas del horario admiten máximo 255 caracteres.' };
  }

  return {
    ok: true,
    schedule: {
      days,
      weekly_hours: sumHours(days),
      notes,
    },
  };
}

function buildDay(
  weekday: WorkWeekday,
  isWorkday: boolean,
  startTime: string | null,
  endTime: string | null,
  hours?: number,
): WorkScheduleDay {
  return {
    weekday,
    is_workday: isWorkday,
    start_time: startTime,
    end_time: endTime,
    hours: hours ?? (isWorkday ? hoursBetweenClocks(startTime, endTime) ?? 0 : 0),
  };
}

function sumHours(days: WorkScheduleDay[]): number {
  return round2(days.reduce((total, day) => total + (day.hours || 0), 0));
}
