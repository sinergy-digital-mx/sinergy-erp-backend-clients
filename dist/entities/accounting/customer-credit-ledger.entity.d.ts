export type CustomerCreditLedgerEntryType = 'credit' | 'reversal';
export type CustomerCreditLedgerCurrency = 'MXN' | 'USD';
export declare class CustomerCreditLedger {
    id: string;
    tenant_id: string;
    customer_id: number;
    fiscal_configuration_id: string;
    currency: CustomerCreditLedgerCurrency;
    entry_type: CustomerCreditLedgerEntryType;
    amount: number;
    sales_order_id: string;
    electronic_invoice_id: string;
    notes: string | null;
    created_by: string | null;
    created_at: Date;
}
