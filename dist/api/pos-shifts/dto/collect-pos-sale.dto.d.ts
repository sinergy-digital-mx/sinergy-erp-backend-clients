import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
export declare class CollectCardPaymentDto {
    amount_mxn: number;
    reference?: string;
}
export declare class CollectPosSaleDto {
    billing_branch_id?: string;
    customer_id?: number;
    payment_method: PosSalePaymentMethod;
    amount_cash_mxn?: number;
    amount_cash_usd?: number;
    usd_exchange_rate?: number;
    amount_transfer_mxn?: number;
    transfer_reference?: string;
    transfer_payer_name?: string;
    transfer_payer_business_name?: string;
    amount_card_mxn?: number;
    card_reference?: string;
    card_payer_name?: string;
    card_payer_phone?: string;
    card_payments?: CollectCardPaymentDto[];
    amount_check_mxn?: number;
    amount_check_usd?: number;
    check_reference?: string;
    check_payer_name?: string;
    check_payer_phone?: string;
    amount_credit_mxn?: number;
    generate_invoice?: boolean;
    order_currency?: 'MXN' | 'USD';
    received_cash_mxn?: number;
    received_cash_usd?: number;
    notes?: string;
    walk_in_name?: string;
    walk_in_phone?: string;
    walk_in_rfc?: string;
}
