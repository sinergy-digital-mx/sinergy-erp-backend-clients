export declare class BranchReportProductHitDto {
    id: string;
    sku: string;
    name: string;
}
export declare class BranchReportProductSearchResponseDto {
    products: BranchReportProductHitDto[];
}
export declare class BranchReportSettingsBranchDto {
    id: string;
    name: string;
    city: string | null;
    razon_social: string | null;
    visible: boolean;
}
export declare class BranchReportSettingsResponseDto {
    configured: boolean;
    branches: BranchReportSettingsBranchDto[];
}
export declare class UpdateBranchReportSettingsDto {
    branch_ids: string[];
}
export declare class BranchReportLineDto {
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
export declare class BranchReportProductDto {
    id: string;
    sku: string;
    name: string;
}
export declare class BranchStockReportResponseDto {
    product: BranchReportProductDto;
    uom_name: string | null;
    mixed_uom: boolean;
    total_quantity: string | null;
    average_unit_cost: string | null;
    total_cost: string | null;
    cost_complete: boolean;
    lines: BranchReportLineDto[];
}
export declare class QueryBranchReportDto {
    product_id: string;
}
export declare class QueryBranchReportProductsDto {
    search?: string;
}
