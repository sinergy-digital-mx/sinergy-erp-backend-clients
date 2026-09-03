import { Customer } from '../../../entities/customers/customer.entity';
export declare const GENERIC_INVOICE_RFCS: Set<string>;
export declare const FISCAL_INVOICE_REQUIRED_FIELDS: readonly ["fiscal_rfc", "fiscal_razon_social", "fiscal_postal_code"];
export type FiscalInvoiceField = (typeof FISCAL_INVOICE_REQUIRED_FIELDS)[number];
export interface FiscalInvoiceReadiness {
    fiscal_ready_for_invoice: boolean;
    fiscal_missing_fields: FiscalInvoiceField[];
}
export declare function getFiscalInvoiceReadiness(customer?: Customer | null): FiscalInvoiceReadiness;
