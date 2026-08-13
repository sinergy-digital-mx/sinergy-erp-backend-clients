import { BadRequestException } from '@nestjs/common';

const PREFIX_PATTERN = /^[A-Z0-9]{1,10}$/;

/**
 * Prefijo de documento/lote: mayúsculas, sin guiones, 1–10 caracteres.
 * Vacío → null.
 */
export function normalizeDocumentPrefix(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (!PREFIX_PATTERN.test(normalized)) {
    throw new BadRequestException(
      'El prefijo solo admite letras y números (máx. 10), sin guiones. Ejemplo: MZN',
    );
  }

  return normalized;
}

export function requireDocumentPrefix(
  value: string | null | undefined,
  message: string,
): string {
  const normalized = normalizeDocumentPrefix(value);
  if (!normalized) {
    throw new BadRequestException(message);
  }
  return normalized;
}
