const TICKET_TIME_ZONE = 'America/Tijuana';

function coerceTicketDate(value: Date | string): Date {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function daysLeftInMonth(date: Date | string, timeZone = TICKET_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(coerceTicketDate(date));
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  const lastDay = new Date(year, month, 0).getDate();
  return Math.max(0, lastDay - day);
}

export function invoiceMonthDeadlineLine(date: Date | string): string {
  const remaining = daysLeftInMonth(date);
  if (remaining <= 0) {
    return 'Solo este mes. Ultimo dia.';
  }
  if (remaining === 1) {
    return 'Solo este mes. Te queda 1 dia.';
  }
  return `Solo este mes. Te quedan ${remaining} dias.`;
}

export function invoiceMonthDeadlineLabel(
  date: Date | string,
  language: 'es' | 'en' = 'es',
): string {
  const remaining = daysLeftInMonth(date);
  if (language === 'en') {
    if (remaining <= 0) return 'This month only. Last day.';
    if (remaining === 1) return 'This month only. 1 day left.';
    return `This month only. ${remaining} days left.`;
  }
  if (remaining <= 0) return 'Solo este mes. Último día.';
  if (remaining === 1) return 'Solo este mes. Te queda 1 día.';
  return `Solo este mes. Te quedan ${remaining} días.`;
}
