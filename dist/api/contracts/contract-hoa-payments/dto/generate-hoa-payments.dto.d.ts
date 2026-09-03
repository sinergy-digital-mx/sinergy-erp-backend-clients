export declare class GenerateHoaPaymentsDto {
    first_payment_date?: string;
    payments_count?: number;
    payment_day?: number;
    start_date?: string;
    end_date?: string;
    monthly_amount: number;
    currency?: 'USD' | 'MXN';
}
