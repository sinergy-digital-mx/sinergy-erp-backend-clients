"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVENTORY_MARGIN_PERMISSION = exports.INVENTORY_MARGIN_ACTION = void 0;
exports.userCanViewInventoryMargin = userCanViewInventoryMargin;
exports.INVENTORY_MARGIN_ACTION = 'ViewMargin';
exports.INVENTORY_MARGIN_PERMISSION = `inventory:${exports.INVENTORY_MARGIN_ACTION}`;
function userCanViewInventoryMargin(user) {
    const permissions = Array.isArray(user?.permissions)
        ? user.permissions.map((permission) => String(permission).toLowerCase())
        : [];
    return permissions.includes(exports.INVENTORY_MARGIN_PERMISSION.toLowerCase());
}
//# sourceMappingURL=inventory-margin-permission.js.map