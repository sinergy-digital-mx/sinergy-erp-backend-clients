export const CUSTOMER_LIST_PREFILTERS = ['off', 'sellers', 'everyone'] as const;

export type CustomerListPrefilter = (typeof CUSTOMER_LIST_PREFILTERS)[number];

export interface CustomerListSettings {
  prefilter: CustomerListPrefilter;
}

/** Sin fila guardada: los vendedores entran con su razón y sucursal. */
export function normalizeCustomerListSettings(raw: unknown): CustomerListSettings {
  const value =
    raw && typeof raw === 'object'
      ? (raw as { prefilter?: unknown }).prefilter
      : raw;
  if (value === 'off' || value === 'sellers' || value === 'everyone') {
    return { prefilter: value };
  }
  return { prefilter: 'sellers' };
}

/**
 * `sellers`: quien no tiene customers:ViewAll.
 * `everyone`: cualquier usuario con razón o sucursal asignada.
 * `off`: el listado abre sin ubicación.
 */
export function shouldPrefilterCustomerList(
  prefilter: CustomerListPrefilter,
  canViewAll: boolean,
): boolean {
  if (prefilter === 'off') return false;
  if (prefilter === 'everyone') return true;
  return !canViewAll;
}
