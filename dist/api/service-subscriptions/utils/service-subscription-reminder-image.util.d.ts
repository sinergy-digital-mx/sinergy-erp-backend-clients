import { SubscriptionSummaryMonth } from './service-subscription-summary-email.util';
export interface PaymentReminderImageInput {
    title: string;
    customerName: string;
    issuerName: string;
    issuerRfc: string | null;
    monthlyAmount: number;
    ivaPercentage: number;
    totalDue: number;
    month: SubscriptionSummaryMonth;
}
export declare function buildPaymentReminderSvg(input: PaymentReminderImageInput): string;
export declare function renderPaymentReminderImage(input: PaymentReminderImageInput): Buffer | null;
export declare function buildPaymentReminderCaption(input: PaymentReminderImageInput): string;
