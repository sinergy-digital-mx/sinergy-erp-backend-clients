export interface StockLotQty {
    quantity: number;
    uomName: string;
}
export interface StockByUom {
    uom_name: string;
    quantity: string;
}
export declare function roundQty(value: number): number;
export declare function parseQty(value: unknown): number;
export declare function formatQty(value: number): string;
export declare function summarizeStock(lots: StockLotQty[]): {
    totalQuantity: number;
    lotCount: number;
    byUom: StockByUom[];
};
