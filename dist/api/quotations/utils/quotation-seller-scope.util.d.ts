export type QuotationSellerAccess = {
    userId: string;
    canViewAll: boolean;
    canViewAllBranches: boolean;
    assignedBranchIds?: string[];
};
export declare function userCanViewAllQuotations(user: {
    permissions?: unknown;
} | null | undefined): boolean;
export declare function userCanViewAllQuotationBranches(user: {
    permissions?: unknown;
} | null | undefined): boolean;
export declare function resolveQuotationSellerScopeUserId(canViewAll: boolean, actorUserId: string, requestedSellerUserId?: string): string | null;
export declare function quotationIsVisibleToSeller(quotation: {
    seller_user_id?: string | null;
    assigned_seller_user_id?: string | null;
}, userId: string): boolean;
export declare function assertQuotationSellerAccess(quotation: {
    id: string;
    seller_user_id?: string | null;
    assigned_seller_user_id?: string | null;
}, access?: QuotationSellerAccess): void;
export declare function quotationBillingBranchId(quotation: {
    billing_branch_id?: string | null;
    warehouse?: {
        billing_branch_id?: string | null;
    } | null;
}): string | null;
export declare function resolveQuotationBranchScopeIds(canViewAllBranches: boolean, assignedBranchIds: string[], requestedBranchId?: string): string[] | null;
export declare function quotationIsVisibleToBranches(quotation: {
    billing_branch_id?: string | null;
    warehouse?: {
        billing_branch_id?: string | null;
    } | null;
}, assignedBranchIds: string[]): boolean;
export declare function assertQuotationBranchAccess(quotation: {
    id: string;
    billing_branch_id?: string | null;
    warehouse?: {
        billing_branch_id?: string | null;
    } | null;
}, access?: QuotationSellerAccess): void;
