export interface BranchReportBranchInput {
    id: string;
    name: string;
    city: string | null;
    razon_social: string | null;
}
export interface BranchReportLotInput {
    billing_branch_id: string;
    quantity: number;
    uom_name: string | null;
    unit_cost: number | null;
}
export interface BranchReportLine {
    billing_branch_id: string;
    name: string;
    city: string | null;
    razon_social: string | null;
    uom_name: string | null;
    quantity: string;
    average_unit_cost: string | null;
    total_cost: string | null;
    cost_complete: boolean;
}
export interface BranchReportView {
    uom_name: string | null;
    mixed_uom: boolean;
    total_quantity: string | null;
    average_unit_cost: string | null;
    total_cost: string | null;
    cost_complete: boolean;
    lines: BranchReportLine[];
}
export declare function selectVisibleBranchIds(branchIds: string[], savedIds: string[] | null | undefined): string[];
export declare function orderBranchRows<T extends {
    id: string;
}>(branches: T[], orderIds: string[] | null | undefined): T[];
export declare function buildBranchStockReport(branches: BranchReportBranchInput[], lots: BranchReportLotInput[]): BranchReportView;
