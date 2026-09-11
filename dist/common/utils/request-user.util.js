"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRequestUserId = resolveRequestUserId;
exports.resolveHasAdminRole = resolveHasAdminRole;
const common_1 = require("@nestjs/common");
function resolveRequestUserId(user) {
    const id = user?.sub ?? user?.id ?? user?.user_id;
    if (id == null || String(id).trim() === '') {
        throw new common_1.UnauthorizedException('No se pudo identificar al usuario');
    }
    return String(id);
}
function resolveHasAdminRole(user) {
    if (user?.hasAdminRole === true) {
        return true;
    }
    const roles = user?.roles;
    if (!Array.isArray(roles)) {
        return false;
    }
    return roles.some((role) => {
        const name = typeof role === 'string' ? role : role && typeof role === 'object' ? role.name : '';
        return String(name).toLowerCase() === 'admin';
    });
}
//# sourceMappingURL=request-user.util.js.map