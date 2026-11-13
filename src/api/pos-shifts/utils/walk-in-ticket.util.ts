export const WALK_IN_RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

export function normalizeWalkInName(value?: string | null): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return null;
  return trimmed.slice(0, 120);
}

export function normalizeWalkInRfc(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  const rfc = value.trim().toUpperCase().replace(/[\s-]/g, '');
  return rfc || null;
}

export function normalizeWalkInPhone(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  return digits ? digits.slice(0, 15) : null;
}

export function isValidWalkInRfc(value?: string | null): boolean {
  const rfc = normalizeWalkInRfc(value);
  return rfc == null || WALK_IN_RFC_PATTERN.test(rfc);
}
