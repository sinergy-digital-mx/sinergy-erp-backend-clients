export function toDateOnlyString(value: Date | string): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addCalendarDays(value: Date | string, days: number): string {
  const [year, month, day] = toDateOnlyString(value).split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function normalizeExpirationDays(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const days = Number(value);
  if (!Number.isFinite(days) || days <= 0) {
    return null;
  }
  return Math.trunc(days);
}

export function resolveQuotationExpiresAt(
  createdAt: Date | string | null | undefined,
  expirationDays: unknown,
): string | null {
  const days = normalizeExpirationDays(expirationDays);
  if (!createdAt || days === null) {
    return null;
  }
  return addCalendarDays(createdAt, days);
}

export function isQuotationExpired(
  createdAt: Date | string,
  expirationDays: unknown,
  today: Date | string = new Date(),
): boolean {
  const expiresAt = resolveQuotationExpiresAt(createdAt, expirationDays);
  if (!expiresAt) {
    return false;
  }
  return toDateOnlyString(today) >= expiresAt;
}
