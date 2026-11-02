export type CreditCurrency = 'MXN' | 'USD';
export declare function normalizeCreditCurrency(value: unknown): CreditCurrency;
export declare function roundCreditMoneyAmount(value: number): number;
export declare function amountInCreditCurrency(input: {
    amount: number;
    orderCurrency: unknown;
    creditCurrency: unknown;
    exchangeRate?: number | string | null;
}): {
    amount: number | null;
    error: string | null;
};
export declare function creditConversionRate(input: {
    orderCurrency: unknown;
    creditCurrency: unknown;
    orderExchangeRate?: number | string | null;
    dailyExchangeRate?: number | string | null;
}): number | null;
export declare function creditRateDate(value: Date | string | null | undefined): string | null;
