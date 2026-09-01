import { BadRequestException } from '@nestjs/common';

export const DEFAULT_CONTRACT_CURRENCY = 'USD';
export const CONTRACT_CURRENCIES = ['USD', 'MXN'] as const;
export type ContractCurrency = (typeof CONTRACT_CURRENCIES)[number];

export function isContractCurrency(value: string): value is ContractCurrency {
  return value === 'USD' || value === 'MXN';
}

/** Lectura: ISO USD/MXN; cualquier otro valor se trata como USD. */
export function resolveStoredContractCurrency(
  value?: string | null,
): ContractCurrency {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();
  return isContractCurrency(normalized)
    ? normalized
    : DEFAULT_CONTRACT_CURRENCY;
}

/** Escritura: solo USD o MXN. Si no hay valor, usa fallback (default USD). */
export function normalizeContractCurrency(
  value?: string | null,
  fallback: string = DEFAULT_CONTRACT_CURRENCY,
): ContractCurrency {
  const normalized = String(value ?? fallback)
    .trim()
    .toUpperCase();

  if (!isContractCurrency(normalized)) {
    throw new BadRequestException('La moneda debe ser USD o MXN');
  }

  return normalized;
}
