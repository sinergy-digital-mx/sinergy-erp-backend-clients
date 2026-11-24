export declare class PosBranchStockBranchDto {
    id: string;
    name: string;
    city: string | null;
}
export declare class PosBranchStockCellDto {
    billing_branch_id: string;
    quantity: string;
    uom_name: string | null;
}
export declare class PosBranchStockProductDto {
    product_id: string;
    sku: string;
    name: string;
    uom_name: string;
    total_quantity: string;
    branches: PosBranchStockCellDto[];
}
export declare class PosBranchStockResponseDto {
    search: string;
    has_more: boolean;
    branches: PosBranchStockBranchDto[];
    products: PosBranchStockProductDto[];
}
