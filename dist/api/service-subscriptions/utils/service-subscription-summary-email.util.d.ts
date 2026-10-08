export interface SubscriptionSummaryMonth {
    label: string;
    amount: number;
    orderFolio: string | null;
    invoiceFolio: string | null;
    invoiceUuid: string | null;
    invoiceTotal: number | null;
    stampStatus: string | null;
    satStatus: string | null;
    stampedAt: string | null;
    paid: boolean | null;
}
export interface SubscriptionSummaryEmailInput {
    title: string;
    customerName: string;
    issuerName: string;
    issuerRfc: string | null;
    startLabel: string;
    endLabel: string;
    monthlyAmount: number;
    ivaPercentage: number;
    months: SubscriptionSummaryMonth[];
    zipFileName: string | null;
    pdfCount: number;
}
export declare function stampStatusLabel(status: string | null | undefined): string | null;
export declare function buildSubscriptionSummaryEmail(input: SubscriptionSummaryEmailInput): {
    subject: string;
    html: string;
};
