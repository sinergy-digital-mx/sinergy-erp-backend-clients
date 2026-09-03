export declare class UpdateContractDto {
    contract_number?: string;
    contract_date?: Date;
    total_price?: number;
    down_payment?: number;
    down_payment_financed?: boolean;
    down_payment_months?: number;
    down_payment_first_payment_date?: Date;
    down_payment_payment_day?: number;
    payment_months?: number;
    first_payment_date?: Date;
    seller_id?: string;
    lead_id?: number | null;
    lead_group_id?: string | null;
    list_price?: number;
    currency?: 'USD' | 'MXN';
    status?: string;
    notes?: string;
    metadata?: Record<string, any>;
}
