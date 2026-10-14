export type AverageCostBasis = 'real' | 'purchase' | 'mixed';
export type AverageCostReceiptInput = {
    product_id: string;
    sku: string;
    name: string;
    sat_clave: string | null;
    received_original_quantity: number | string | null;
    received_converted_quantity: number | string | null;
    received_original_unit_total: number | string | null;
    unit_total: number | string | null;
    real_unit_cost_mxn: number | string | null;
    payment_currency: string | null;
    customs_exchange_rate: number | string | null;
    pedimento_number: string | null;
    customs_date: string | Date | null;
};
export type AverageCostPriceInput = {
    product_id: string;
    price: number | string | null;
    price_list_name: string | null;
    price_list_created_at: string | Date | null;
    is_base: boolean | number | string | null;
};
export type AverageCostPedimentoInput = {
    product_id: string;
    number: string | null;
    date: string | Date | null;
    customs: string | null;
    vendor: string | null;
    raw: string | null;
};
export type AverageCostReportRow = {
    product_id: string;
    sku: string;
    name: string;
    sat_clave: string | null;
    pedimentos: string[];
    price: number | null;
    price_list_name: string | null;
    average_cost: number;
    quantity: number;
    total_cost: number;
    margin_amount: number | null;
    margin_percent: number | null;
    cost_basis: AverageCostBasis;
    receipt_count: number;
};
export type AverageCostReportSummary = {
    product_count: number;
    total_quantity: number;
    total_cost: number;
    real_cost_product_count: number;
};
export declare function roundAverageCost(value: number, scale: number): number;
export declare function isoDay(value: unknown): string | null;
export declare function formatSlashDate(value: unknown): string | null;
export declare function formatPedimentoLabel(entry: {
    number?: string | null;
    date?: string | Date | null;
    customs?: string | null;
    vendor?: string | null;
    raw?: string | null;
}): string | null;
export declare function valuePurchaseReceipt(line: AverageCostReceiptInput): {
    quantity: number;
    unitCost: number;
    usedRealCost: boolean;
} | null;
export declare function pickPrice1(options: AverageCostPriceInput[]): {
    price: number;
    price_list_name: string | null;
} | null;
export declare function buildAverageCostRows(input: {
    receipts: AverageCostReceiptInput[];
    prices: AverageCostPriceInput[];
    pedimentos: AverageCostPedimentoInput[];
}): AverageCostReportRow[];
export declare function filterAverageCostRows(rows: AverageCostReportRow[], search?: string): AverageCostReportRow[];
export declare function summarizeAverageCostRows(rows: AverageCostReportRow[]): AverageCostReportSummary;
