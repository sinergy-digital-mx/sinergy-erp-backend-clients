"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PURCHASE_ORDER_REAL_COST_MOVEMENT_TYPE = exports.PURCHASE_ORDER_REAL_COST_PERMISSION = exports.PURCHASE_ORDER_REAL_COST_ACTION = exports.PURCHASE_ORDER_REAL_COST_ENTITY = exports.PURCHASE_ORDER_REAL_COST_MODULE_CODE = void 0;
exports.userCanViewPurchaseOrderRealCost = userCanViewPurchaseOrderRealCost;
const madereria_inventory_import_constants_1 = require("../../madereria-inventory-import/madereria-inventory-import.constants");
exports.PURCHASE_ORDER_REAL_COST_MODULE_CODE = 'purchase_order_real_cost';
exports.PURCHASE_ORDER_REAL_COST_ENTITY = 'purchase_order_real_cost';
exports.PURCHASE_ORDER_REAL_COST_ACTION = 'Read';
exports.PURCHASE_ORDER_REAL_COST_PERMISSION = `${exports.PURCHASE_ORDER_REAL_COST_ENTITY}:${exports.PURCHASE_ORDER_REAL_COST_ACTION}`;
exports.PURCHASE_ORDER_REAL_COST_MOVEMENT_TYPE = 'real_cost_updated';
function userCanViewPurchaseOrderRealCost(user) {
    const tenantId = user?.tenant_id ?? user?.tenantId ?? null;
    if (tenantId !== madereria_inventory_import_constants_1.MADERERIA_ORGANIZATION_ID) {
        return false;
    }
    const permissions = Array.isArray(user?.permissions)
        ? user.permissions.map((permission) => String(permission).toLowerCase())
        : [];
    const exact = exports.PURCHASE_ORDER_REAL_COST_PERMISSION.toLowerCase();
    if (permissions.includes(exact)) {
        return true;
    }
    if (!user?.hasAdminRole) {
        return false;
    }
    const prefix = `${exports.PURCHASE_ORDER_REAL_COST_ENTITY}:`.toLowerCase();
    return permissions.some((permission) => permission.startsWith(prefix));
}
//# sourceMappingURL=purchase-order-real-cost-permission.js.map