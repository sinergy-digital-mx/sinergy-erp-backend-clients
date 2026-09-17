export type QuotationSellerAccess = {
    userId: string;
    isAdmin: boolean;
};
export declare function resolveQuotationSellerScopeUserId(isAdmin: boolean, actorUserId: string, requestedSellerUserId?: string): string | null;
export declare function quotationIsVisibleToSeller(quotation: {
    seller_user_id?: string | null;
    assigned_seller_user_id?: string | null;
}, userId: string): boolean;
export declare function assertQuotationSellerAccess(quotation: {
    id: string;
    seller_user_id?: string | null;
    assigned_seller_user_id?: string | null;
}, access?: QuotationSellerAccess): void;
