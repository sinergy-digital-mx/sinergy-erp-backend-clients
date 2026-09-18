/**
 * TypeORM `dateStrings: true` devuelve `YYYY-MM-DD HH:mm:ss` sin zona.
 * El API corre en UTC: esa pared es UTC. Sin la Z el front la pinta como local.
 */
export function parseDbDateTimeAsUtc(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }
  if (/[zZ]$/.test(raw) || /[+-]\d{2}:?\d{2}$/.test(raw)) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const iso = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const parsed = new Date(`${iso}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Fecha de calendario (cuota, vencimiento). No desplazar por UTC. */
export function parseDateOnly(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    const isUtcMidnight =
      value.getUTCHours() === 0 &&
      value.getUTCMinutes() === 0 &&
      value.getUTCSeconds() === 0;
    if (isUtcMidnight) {
      return new Date(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
      );
    }
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const raw = String(value).trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCalendarMonthKey(value: Date | string | null | undefined): string {
  const date = parseDateOnly(value);
  if (!date) {
    return '';
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isUnpaidOverdue(
  dueDate: Date | string | null | undefined,
  status: string,
  today = new Date(),
): boolean {
  if (status !== 'pendiente' && status !== 'parcial') {
    return false;
  }
  const due = parseDateOnly(dueDate);
  if (!due) {
    return false;
  }
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return due < startToday;
}
