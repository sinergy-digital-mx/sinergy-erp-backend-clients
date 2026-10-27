export declare const CREDIT_NOTE_RELATION_TYPE = "01";
export declare function roundCreditMoney(value: number): number;
export interface CreditNoteMoneyEffect {
    unpaidBefore: number;
    appliedToPending: number;
    customerCredit: number;
    pendingAfter: number;
}
export declare function splitCreditNoteEffect(input: {
    orderTotal: number;
    amountPaid: number;
    creditNotesTotal: number;
}): CreditNoteMoneyEffect;
export declare function creditNoteIncrement(input: {
    orderTotal: number;
    amountPaid: number;
    previousNotesTotal: number;
    noteTotal: number;
}): {
    appliedToPending: number;
    customerCredit: number;
};
export interface CreditNoteInvoiceRef {
    id: string;
    invoice_role?: string | null;
    tipo_comprobante?: string | null;
    related_invoice_id?: string | null;
    total?: number | string | null;
    sat_status?: string | null;
    stamp_status?: string | null;
    uuid?: string | null;
}
export declare function isInvoiceVigente(invoice: {
    sat_status?: string | null;
    stamp_status?: string | null;
}): boolean;
export declare function isCommercialCreditNote(invoice: CreditNoteInvoiceRef): boolean;
export declare function isCreditableIncomeInvoice(invoice: CreditNoteInvoiceRef): boolean;
export declare function isEgressDocument(invoice: CreditNoteInvoiceRef): boolean;
export declare function sumVigenteCommercialCreditNotes(invoices: CreditNoteInvoiceRef[], relatedInvoiceId?: string): number;
export declare function remainingCreditable(invoiceTotal: number, creditedTotal: number): number;
export declare function isIncomeCoveredByCreditNotes(invoice: CreditNoteInvoiceRef, invoices: CreditNoteInvoiceRef[]): boolean;
export declare function baseFromInclusiveTotal(total: number, ivaPercentage: number): number;
export declare function nextCreditNoteFolio(orderFolio: string, existingFolios: Array<string | null | undefined>): string;
