export declare class DownpaymentInitialPaymentDto {
    amount: number;
    due_date: string;
}
export declare class GenerateDownpaymentPaymentsDto {
    down_payment_target?: number;
    down_payment_months?: number;
    first_payment_date?: string;
    payment_day?: number;
    initial_payments?: DownpaymentInitialPaymentDto[];
}
