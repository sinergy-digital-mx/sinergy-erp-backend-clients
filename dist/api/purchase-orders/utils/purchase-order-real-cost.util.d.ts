export type RealCostCurrency = 'MXN' | 'USD';
export type RealCostLineInput = {
    id: string;
    quantity: number | string;
    received_quantity?: number | string | null;
    vendor_unit_cost: number | string;
    igi_percentage?: number | string | null;
};
export type RealCostExtraInput = {
    amount: number | string;
    currency: RealCostCurrency;
};
export type ComputeRealCostInput = {
    payment_currency: RealCostCurrency;
    customs_exchange_rate: number | string | null;
    lines: RealCostLineInput[];
    extras: RealCostExtraInput[];
};
export type RealCostLineResult = {
    id: string;
    quantity: number;
    vendor_unit_cost: number;
    igi_percentage: number;
    real_unit_cost_usd: number | null;
    real_unit_cost_mxn: number | null;
};
export type ComputeRealCostResult = {
    has_real_cost: boolean;
    increment_ratio: number;
    increment_percentage: number;
    merchandise_amount: number;
    merchandise_mxn: number | null;
    extras_amount: number;
    extras_mxn: number | null;
    lines: RealCostLineResult[];
};
export declare function parseRealCostNumber(value: unknown, fallback?: number): number;
export declare function realCostLineQuantity(line: RealCostLineInput): number;
export declare function parseCustomsExchangeRate(value: unknown): number | null;
export declare function extrasNeedExchangeRate(paymentCurrency: RealCostCurrency, extras: Array<{
    currency: string;
}>): boolean;
export declare function assertExchangeRateIfNeeded(paymentCurrency: RealCostCurrency, extras: Array<{
    currency: string;
}>, exchangeRate: number | null): void;
export declare function computePurchaseOrderRealCost(input: ComputeRealCostInput): ComputeRealCostResult;
export declare function isRealCostEnabled(exchangeRate: unknown, extrasCount: number): boolean;
