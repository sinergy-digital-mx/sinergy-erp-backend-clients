import { BadRequestException } from '@nestjs/common';

export const PEDIMENTO_DIGIT_COUNT = 15;
export const PEDIMENTO_FORMATTED_EXAMPLE = '26  47  3807  6000123';
const PEDIMENTO_EXAMPLE_LABEL = '26\u00a0\u00a047\u00a0\u00a03807\u00a0\u00a06000123';
export const PEDIMENTO_FORMAT_ERROR = `El pedimento debe tener 15 dígitos con el formato del SAT: año (2), aduana (2), patente (4) y numeración (7). Ejemplo: ${PEDIMENTO_EXAMPLE_LABEL}.`;
export const PEDIMENTO_YEAR_DIGIT_ERROR =
  'El dígito de año del pedimento debe ser el último dígito del año de validación, o el del año anterior si es un consolidado.';
export const PEDIMENTO_SEQUENCE_ERROR =
  'La numeración progresiva del pedimento debe iniciar en 000001.';

export interface ParsedPedimento {
  valid: boolean;
  empty: boolean;
  formatted: string | null;
  message: string | null;
}

export function pedimentoDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatPedimentoMask(value: string): string {
  const digits = pedimentoDigits(value).slice(0, PEDIMENTO_DIGIT_COUNT);
  const groups: string[] = [];
  if (digits.length > 0) {
    groups.push(digits.slice(0, Math.min(2, digits.length)));
  }
  if (digits.length > 2) {
    groups.push(digits.slice(2, Math.min(4, digits.length)));
  }
  if (digits.length > 4) {
    groups.push(digits.slice(4, Math.min(8, digits.length)));
  }
  if (digits.length > 8) {
    groups.push(digits.slice(8));
  }
  return groups.join('  ');
}

export function formatPedimentoForDisplay(value?: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  if (/[^\d\s-]/.test(trimmed)) {
    return trimmed;
  }
  const digits = pedimentoDigits(trimmed);
  if (digits.length !== PEDIMENTO_DIGIT_COUNT) {
    return trimmed;
  }
  return formatPedimentoMask(digits);
}

export function parsePedimentoNumber(value: unknown): ParsedPedimento {
  if (value === null || value === undefined) {
    return { valid: true, empty: true, formatted: null, message: null };
  }
  const raw = String(value).trim();
  if (!raw) {
    return { valid: true, empty: true, formatted: null, message: null };
  }
  if (/[^\d\s-]/.test(raw)) {
    return { valid: false, empty: false, formatted: null, message: PEDIMENTO_FORMAT_ERROR };
  }
  const digits = pedimentoDigits(raw);
  if (digits.length !== PEDIMENTO_DIGIT_COUNT) {
    return { valid: false, empty: false, formatted: null, message: PEDIMENTO_FORMAT_ERROR };
  }
  const year = Number(digits.slice(0, 2));
  const marker = digits[8];
  const yearLast = String(year % 10);
  const previousLast = String((year + 9) % 10);
  if (marker !== yearLast && marker !== previousLast) {
    return {
      valid: false,
      empty: false,
      formatted: null,
      message: PEDIMENTO_YEAR_DIGIT_ERROR,
    };
  }
  if (digits.slice(9) === '000000') {
    return {
      valid: false,
      empty: false,
      formatted: null,
      message: PEDIMENTO_SEQUENCE_ERROR,
    };
  }
  return {
    valid: true,
    empty: false,
    formatted: formatPedimentoMask(digits),
    message: null,
  };
}

export function normalizePedimentoNumber(value?: string | null): string | null {
  const parsed = parsePedimentoNumber(value);
  if (!parsed.valid) {
    throw new BadRequestException(parsed.message ?? PEDIMENTO_FORMAT_ERROR);
  }
  return parsed.formatted;
}
