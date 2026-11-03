export type PosCollectionPaymentMethodKey = 'cash' | 'transfer' | 'card' | 'check' | 'credit';
export interface PosCollectionPaymentMethodTotal {
    orders: number;
    amount: number;
    ticket: number;
}
export type PosCollectionPaymentMethodTotals = Record<PosCollectionPaymentMethodKey, PosCollectionPaymentMethodTotal>;
export declare function buildPaymentMethodTotal(orders: number | string | null | undefined, amount: number | string | null | undefined): PosCollectionPaymentMethodTotal;
export declare function emptyPaymentMethodTotals(): PosCollectionPaymentMethodTotals;
export declare function paymentMethodAmountSql(method: PosCollectionPaymentMethodKey): string;
export declare function paymentMethodMatchSql(method: PosCollectionPaymentMethodKey): string;
export declare function buildPaymentMethodTotals(input: {
    cash_orders?: number | string | null;
    cash_amount?: number | string | null;
    transfer_orders?: number | string | null;
    transfer_amount?: number | string | null;
    card_orders?: number | string | null;
    card_amount?: number | string | null;
    check_orders?: number | string | null;
    check_amount?: number | string | null;
    credit_orders?: number | string | null;
    credit_amount?: number | string | null;
}): PosCollectionPaymentMethodTotals;
