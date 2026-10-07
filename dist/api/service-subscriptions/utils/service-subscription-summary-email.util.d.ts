export interface SubscriptionSummaryMonth {
    label: string;
    amount: number;
    orderFolio: string | null;
    invoiceLabel: string | null;
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
}
export declare function buildSubscriptionSummaryEmail(input: SubscriptionSummaryEmailInput): {
    subject: string;
    html: string;
};
