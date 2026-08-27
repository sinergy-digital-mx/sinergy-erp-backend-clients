export function normalizeEmail(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

export function emailsMatch(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = normalizeEmail(left);
  const b = normalizeEmail(right);
  return Boolean(a && b && a === b);
}

/** Últimos 10 dígitos: compara celular MX aunque uno traiga +52. */
export function normalizePhoneDigits(value: string | null | undefined): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function phonesMatch(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = normalizePhoneDigits(left);
  const b = normalizePhoneDigits(right);
  return Boolean(a && b && a.length >= 8 && a === b);
}

export function composePhoneDigits(
  phone?: string | null,
  phoneCode?: string | null,
): string {
  return normalizePhoneDigits(`${phoneCode ?? ''}${phone ?? ''}`);
}

export function isUsableEmail(value: string | null | undefined): boolean {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
