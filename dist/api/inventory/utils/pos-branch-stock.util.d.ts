export declare const POS_BRANCH_STOCK_PRODUCT_LIMIT = 12;
export interface PosBranchStockBranchInput {
    id: string;
    name: string;
    city: string | null;
}
export interface PosBranchStockProductInput {
    id: string;
    sku: string;
    name: string;
}
export interface PosBranchStockQtyInput {
    product_id: string;
    billing_branch_id: string;
    quantity: number;
    uom_name: string | null;
}
export interface PosBranchStockCellView {
    billing_branch_id: string;
    quantity: string;
    uom_name: string | null;
}
export interface PosBranchStockProductView {
    product_id: string;
    sku: string;
    name: string;
    uom_name: string;
    total_quantity: string;
    branches: PosBranchStockCellView[];
}
export declare function formatPosBranchStockQty(value: number): string;
export declare function buildPosBranchStockProducts(products: PosBranchStockProductInput[], branches: PosBranchStockBranchInput[], rows: PosBranchStockQtyInput[]): PosBranchStockProductView[];
