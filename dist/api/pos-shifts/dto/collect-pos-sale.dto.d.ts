import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
export declare class CollectPosSaleDto {
    customer_id?: number;
    payment_method: PosSalePaymentMethod;
    amount_cash_mxn?: number;
    amount_cash_usd?: number;
    usd_exchange_rate?: number;
    amount_transfer_mxn?: number;
    transfer_reference?: string;
    amount_card_mxn?: number;
    card_reference?: string;
    amount_credit_mxn?: number;
    generate_invoice?: boolean;
    received_cash_mxn?: number;
    received_cash_usd?: number;
    notes?: string;
}
