export type StockLedgerCostInput = {
    real_unit_cost_mxn?: number | string | null;
    unit_cost?: number | string | null;
    uom_scale?: number | null;
    payment_currency?: string | null;
    customs_exchange_rate?: number | string | null;
};
export declare function resolveUnitCostMxn(input: StockLedgerCostInput): number | null;
export declare function formatStockMoney(value: unknown): string;
export declare function roundStockMoney(value: number): number;
