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
export type PosCollectionTenderKey = Exclude<PosCollectionPaymentMethodKey, 'credit'>;
export type PosCollectionTenderAmounts = Record<PosCollectionTenderKey, number>;
export declare function isCreditChargeCollection(input: {
    isCredit?: boolean | number | null;
    paymentMethod?: string | null;
    amountCreditMxn?: number | string | null;
}): boolean;
export declare function creditPaymentAmountMxn(input: {
    amount?: number | string | null;
    currency?: string | null;
    exchangeRate?: number | string | null;
}): number;
export declare function collectionTenderAmounts(input: {
    amount_cash_mxn?: number | string | null;
    amount_cash_usd?: number | string | null;
    amount_transfer_mxn?: number | string | null;
    amount_card_mxn?: number | string | null;
    amount_check_mxn?: number | string | null;
    amount_check_usd?: number | string | null;
    usd_exchange_rate?: number | string | null;
}): PosCollectionTenderAmounts;
export interface PaidCreditListRow {
    total: number;
    isWalkIn: boolean;
    invoiced: boolean;
    isCreditPayment: boolean;
    forShipping?: boolean;
    amounts: PosCollectionTenderAmounts;
}
export declare function summarizePaidCreditRows(rows: PaidCreditListRow[]): {
    orders_collected: number;
    amount_collected: number;
    walk_in_count: number;
    invoiced_count: number;
    shipping_count: number;
    shipping_amount: number;
    by_payment_method: PosCollectionPaymentMethodTotals;
};
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
