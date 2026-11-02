"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userHasJwtPermission = userHasJwtPermission;
function userHasJwtPermission(user, entity, action) {
    const permissions = Array.isArray(user?.permissions)
        ? user.permissions.map((permission) => String(permission).toLowerCase())
        : [];
    const exact = `${entity}:${action}`.toLowerCase();
    if (permissions.includes(exact)) {
        return true;
    }
    if (!user?.hasAdminRole) {
        return false;
    }
    const prefix = `${entity.toLowerCase()}:`;
    return permissions.some((permission) => permission.startsWith(prefix));
}
//# sourceMappingURL=jwt-permission.util.js.map