import { PosSalePaymentMethod } from './pos-sale-payment-method.enum';
export declare class PosShiftAbono {
    id: string;
    tenant_id: string;
    sales_order_id: string;
    pos_daily_shift_id: string;
    sales_order_payment_id: string;
    payment_method: PosSalePaymentMethod;
    amount_mxn: number;
    amount_cash_mxn: number;
    amount_transfer_mxn: number;
    amount_card_mxn: number;
    amount_check_mxn: number;
    reference_number: string | null;
    created_by: string;
    created_at: Date;
}
