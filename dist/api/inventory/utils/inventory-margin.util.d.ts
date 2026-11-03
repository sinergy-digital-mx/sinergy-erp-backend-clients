export type MarginSource = 'purchase' | 'configuration' | 'mixed' | 'none';
export type MarginCostBasis = 'landed_mxn' | 'vendor_mxn' | 'vendor_usd' | 'configuration' | 'mixed' | 'none';
export interface MarginSnapshot {
    unit_price: string | null;
    price_list_name: string | null;
    unit_cost: string | null;
    margin_amount: string | null;
    margin_percentage: string | null;
    source: MarginSource;
    source_label: string;
    hint: string;
    purchase_count: number;
    configuration_count: number;
    missing_count: number;
    cost_basis: MarginCostBasis;
    purchase_folio: string | null;
}
export interface MarginExplanationLine {
    label: string;
    detail: string | null;
    amount: string | null;
    currency: 'MXN' | 'USD' | null;
    included: boolean;
}
export interface MarginExplanationGroup {
    title: string;
    note: string | null;
    lines: MarginExplanationLine[];
}
export interface MarginExplanation {
    margin: MarginSnapshot;
    headline: string;
    formula_sentence: string;
    price_note: string;
    cost_note: string;
    groups: MarginExplanationGroup[];
}
export interface MarginPriceInput {
    amount: number | null;
    listName: string | null;
}
export interface MarginPurchaseInput {
    hasPurchase: boolean;
    folio: string | null;
    currency: string | null;
    vendorUnitCost: number | null;
    realUnitCostMxn: number | null;
    originalQuantity: number | null;
    convertedQuantity: number | null;
    customsExchangeRate: number | null;
}
export interface MarginConfigLineInput {
    vendorName: string;
    uomName: string;
    cost: number;
    currency: string;
}
export interface LotMarginRef {
    label: string;
    detail: string | null;
    margin: MarginSnapshot;
}
export declare function formatMarginAmount(value: number): string;
interface PurchaseResolution {
    cost: number | null;
    basis: 'landed_mxn' | 'vendor_mxn' | 'vendor_usd';
    missingRate: boolean;
    scaled: boolean;
}
export declare function resolvePurchaseUnitCost(purchase: MarginPurchaseInput): PurchaseResolution;
export declare function resolveLotMargin(purchase: MarginPurchaseInput | null, configLines: MarginConfigLineInput[], price: MarginPriceInput): {
    margin: MarginSnapshot;
    explanation: MarginExplanation;
};
export declare function explainLotAverage(lots: LotMarginRef[], price: MarginPriceInput, configLines: MarginConfigLineInput[], scope: string): MarginExplanation;
export declare function explainConfigurationOnly(configLines: MarginConfigLineInput[], price: MarginPriceInput, uomName: string | null): MarginExplanation;
export {};
