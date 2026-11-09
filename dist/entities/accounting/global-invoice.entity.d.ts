export type GlobalInvoiceStatus = 'pending' | 'active' | 'cancelled';
export declare class GlobalInvoice {
    id: string;
    tenant_id: string;
    fiscal_configuration_id: string;
    billing_branch_id: string | null;
    period_year: number;
    period_month: number;
    status: GlobalInvoiceStatus;
    active_key: string | null;
    electronic_invoice_id: string | null;
    created_by: string | null;
    process_folio: string | null;
    created_at: Date;
    updated_at: Date;
}
