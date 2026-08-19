import { Customer } from '../../../entities/customers/customer.entity';

export const GENERIC_INVOICE_RFCS = new Set(['XAXX010101000', 'XEXX010101000']);

export const FISCAL_INVOICE_REQUIRED_FIELDS = [
  'fiscal_rfc',
  'fiscal_razon_social',
  'fiscal_postal_code',
] as const;

export type FiscalInvoiceField = (typeof FISCAL_INVOICE_REQUIRED_FIELDS)[number];

export interface FiscalInvoiceReadiness {
  fiscal_ready_for_invoice: boolean;
  fiscal_missing_fields: FiscalInvoiceField[];
}

export function getFiscalInvoiceReadiness(
  customer?: Customer | null,
): FiscalInvoiceReadiness {
  const missing: FiscalInvoiceField[] = [];
  if (!customer) {
    return { fiscal_ready_for_invoice: false, fiscal_missing_fields: [...FISCAL_INVOICE_REQUIRED_FIELDS] };
  }

  const rfc = customer.fiscal_rfc?.trim().toUpperCase() ?? '';
  const razon = customer.fiscal_razon_social?.trim() ?? '';
  const postalCode = customer.fiscal_postal_code?.trim() ?? '';

  if (!rfc || GENERIC_INVOICE_RFCS.has(rfc)) {
    missing.push('fiscal_rfc');
  }
  if (!razon) {
    missing.push('fiscal_razon_social');
  }
  if (!/^\d{5}$/.test(postalCode)) {
    missing.push('fiscal_postal_code');
  }

  return {
    fiscal_ready_for_invoice: missing.length === 0,
    fiscal_missing_fields: missing,
  };
}
