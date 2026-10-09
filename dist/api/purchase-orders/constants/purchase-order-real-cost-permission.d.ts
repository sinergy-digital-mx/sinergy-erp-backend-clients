export declare const PURCHASE_ORDER_REAL_COST_MODULE_CODE = "purchase_order_real_cost";
export declare const PURCHASE_ORDER_REAL_COST_ENTITY = "purchase_order_real_cost";
export declare const PURCHASE_ORDER_REAL_COST_ACTION = "Read";
export declare const PURCHASE_ORDER_REAL_COST_PERMISSION = "purchase_order_real_cost:Read";
export declare const PURCHASE_ORDER_REAL_COST_MOVEMENT_TYPE = "real_cost_updated";
type RealCostUser = {
    tenant_id?: string | null;
    tenantId?: string | null;
    hasAdminRole?: boolean;
    permissions?: unknown;
};
export declare function userCanViewPurchaseOrderRealCost(user: RealCostUser | null | undefined): boolean;
export {};
