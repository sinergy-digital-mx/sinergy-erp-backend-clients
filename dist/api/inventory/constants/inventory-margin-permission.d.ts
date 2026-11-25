export declare const INVENTORY_MARGIN_ACTION = "ViewMargin";
export declare const INVENTORY_MARGIN_PERMISSION = "inventory:ViewMargin";
type MarginUser = {
    permissions?: unknown;
};
export declare function userCanViewInventoryMargin(user: MarginUser | null | undefined): boolean;
export {};
