import { BadRequestException } from '@nestjs/common';

export const VENDOR_INVOICE_MAX_LENGTH = 60;
export const VENDOR_INVOICE_MAX_COUNT = 20;

export function firstVendorInvoiceNumber(numbers: string[]): string | null {
  return numbers[0] ?? null;
}

export function formatVendorInvoiceNumbers(numbers: string[]): string | null {
  return numbers.length ? numbers.join(' · ') : null;
}

export function parseStoredVendorInvoiceNumbers(
  stored: unknown,
  fallback?: string | null,
): string[] {
  if (Array.isArray(stored)) {
    return stored
      .map((item) => String(item ?? '').trim())
      .filter((item) => item.length > 0);
  }
  if (typeof stored === 'string' && stored.trim()) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parseStoredVendorInvoiceNumbers(parsed, fallback);
      }
    } catch {
      const trimmed = stored.trim();
      if (trimmed) {
        return [trimmed];
      }
    }
  }
  const single = fallback?.trim() ?? '';
  return single ? [single] : [];
}

export function normalizeVendorInvoiceNumbers(
  value?: Array<string | null | undefined> | string | null,
): string[] {
  const raw = Array.isArray(value)
    ? value
    : value == null || value === ''
      ? []
      : [value];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of raw) {
    const trimmed = String(item ?? '').trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.length > VENDOR_INVOICE_MAX_LENGTH) {
      throw new BadRequestException(
        `Cada factura de proveedor no puede exceder ${VENDOR_INVOICE_MAX_LENGTH} caracteres`,
      );
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }
  if (result.length > VENDOR_INVOICE_MAX_COUNT) {
    throw new BadRequestException(
      `No se pueden registrar más de ${VENDOR_INVOICE_MAX_COUNT} facturas de proveedor`,
    );
  }
  return result;
}

export function resolveVendorInvoiceInput(dto: {
  vendor_invoice_numbers?: Array<string | null> | null;
  vendor_invoice_number?: string | null;
}): string[] | undefined {
  if (dto.vendor_invoice_numbers !== undefined) {
    return normalizeVendorInvoiceNumbers(dto.vendor_invoice_numbers);
  }
  if (dto.vendor_invoice_number !== undefined) {
    return normalizeVendorInvoiceNumbers(dto.vendor_invoice_number);
  }
  return undefined;
}
