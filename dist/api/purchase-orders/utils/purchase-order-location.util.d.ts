export type LocationWarehouseInput = {
    id: string;
    name: string;
    status: string;
    billing_branch_id?: string | null;
};
export type LocationBranchInput = {
    id: string;
    fiscal_configuration_id: string;
    code: string;
    status: number;
};
export type LocationFiscalInput = {
    id: string;
    razon_social: string;
    rfc: string;
    status: string;
};
export type PurchaseOrderLocationWarehouse = {
    id: string;
    name: string;
    status: string;
};
export type PurchaseOrderLocationBranch = {
    id: string;
    name: string;
    status: number;
    warehouses: PurchaseOrderLocationWarehouse[];
};
export type PurchaseOrderLocationFiscal = {
    id: string;
    razon_social: string;
    rfc: string;
    status: string;
    branches: PurchaseOrderLocationBranch[];
};
export type PurchaseOrderLocationTree = {
    data: PurchaseOrderLocationFiscal[];
    unassigned_warehouses: PurchaseOrderLocationWarehouse[];
};
export declare function buildPurchaseOrderLocationTree(fiscals: LocationFiscalInput[], branches: LocationBranchInput[], warehouses: LocationWarehouseInput[]): PurchaseOrderLocationTree;
