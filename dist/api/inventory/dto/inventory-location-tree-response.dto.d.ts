export declare class InventoryLocationWarehouseDto {
    id: string;
    name: string;
    status: string;
}
export declare class InventoryLocationBranchDto {
    id: string;
    name: string;
    status: number;
    warehouses: InventoryLocationWarehouseDto[];
}
export declare class InventoryLocationFiscalDto {
    id: string;
    razon_social: string;
    rfc: string;
    status: string;
    branches: InventoryLocationBranchDto[];
}
export declare class InventoryLocationTreeResponseDto {
    data: InventoryLocationFiscalDto[];
}
