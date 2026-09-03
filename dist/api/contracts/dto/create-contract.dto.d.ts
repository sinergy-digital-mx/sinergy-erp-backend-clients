export declare class CreateContractDto {
    customer_id: number;
    property_id: string;
    seller_id?: string;
    lead_id?: number;
    lead_group_id?: string;
    list_price?: number;
    contract_number?: string;
    contract_date: Date;
    total_price: number;
    down_payment: number;
    down_payment_financed?: boolean;
    down_payment_months?: number;
    down_payment_first_payment_date?: Date;
    down_payment_payment_day?: number;
    payment_months: number;
    first_payment_date: Date;
    currency?: 'USD' | 'MXN';
    notes?: string;
    metadata?: Record<string, any>;
}
