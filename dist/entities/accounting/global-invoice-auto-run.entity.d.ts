export type GlobalInvoiceAutoRunStatus = 'running' | 'done' | 'failed' | 'skipped';
export declare class GlobalInvoiceAutoRun {
    id: string;
    tenant_id: string;
    fiscal_configuration_id: string;
    billing_branch_id: string;
    period_year: number;
    period_month: number;
    folio: string;
    status: GlobalInvoiceAutoRunStatus;
    message: string | null;
    global_invoice_id: string | null;
    created_at: Date;
    updated_at: Date;
}
