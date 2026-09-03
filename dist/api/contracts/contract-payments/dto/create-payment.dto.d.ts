export declare class CreatePaymentDto {
    contract_id: string;
    payment_number: string;
    payment_date: Date;
    amount_paid: number;
    payment_method?: string;
    status?: string;
    notes?: string;
    metadata?: Record<string, any>;
}
