import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
export declare const SALES_ORDER_PAYMENT_METHOD_LABELS: Record<PosSalePaymentMethod, string>;
export type SalesOrderPaymentDisplayLine = {
    method: 'cash' | 'card' | 'transfer' | 'credit';
    label: string;
    amount_mxn: number;
    amount_usd: number;
};
export type SalesOrderPaymentDisplay = {
    payment_method: PosSalePaymentMethod | null;
    payment_method_label: string | null;
    payment_breakdown_label: string | null;
    lines: SalesOrderPaymentDisplayLine[];
};
export type PaymentDisplayCollectionInput = {
    payment_method: PosSalePaymentMethod | string;
    amount_cash_mxn?: number | string | null;
    amount_cash_usd?: number | string | null;
    amount_transfer_mxn?: number | string | null;
    amount_card_mxn?: number | string | null;
    amount_credit_mxn?: number | string | null;
};
export type PaymentDisplayPaymentInput = {
    payment_method: PosSalePaymentMethod | string;
    amount: number | string;
    currency?: string | null;
};
export declare function buildSalesOrderPaymentDisplay(input: {
    collection?: PaymentDisplayCollectionInput | null;
    payments?: PaymentDisplayPaymentInput[] | null;
    isCredit?: boolean;
}): SalesOrderPaymentDisplay;
