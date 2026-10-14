export type SalesOrderCurrency = 'MXN' | 'USD';
export declare function normalizeSalesOrderCurrency(value: string | null | undefined): SalesOrderCurrency;
export declare function canDocumentOrderInUsd(usdAppliedMxn: number, mxnApplied: number): boolean;
export declare function resolvePosDocumentCurrency(input: {
    requested?: string | null;
    amountCashMxn: number;
    amountCashUsd: number;
    usdExchangeRate: number | null;
    amountTransferMxn: number;
    amountCardMxn: number;
    amountCheckMxn: number;
    amountCreditMxn: number;
}): {
    currency: SalesOrderCurrency;
    exchangeRate: number | null;
    error: string | null;
};
export declare function readCfdiAttribute(xml: string, name: string): string;
export declare function invoiceCurrencyMismatchMessage(orderCurrency: string | null | undefined, xml: string, exchangeRate: number | string | null | undefined): string | null;
