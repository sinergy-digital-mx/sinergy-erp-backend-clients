"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBAC_CONSTANTS = exports.RBACUtils = exports.AuditLog = exports.RBACTenant = exports.RolePermission = exports.UserRole = exports.Role = exports.Permission = exports.rbacConfig = void 0;
__exportStar(require("./rbac.module"), exports);
__exportStar(require("./services/permission.service"), exports);
__exportStar(require("./services/role.service"), exports);
__exportStar(require("./services/role-template.service"), exports);
__exportStar(require("./services/tenant-context.service"), exports);
__exportStar(require("./services/tenant.service"), exports);
__exportStar(require("./services/permission-cache.service"), exports);
__exportStar(require("./services/query-cache.service"), exports);
__exportStar(require("./services/audit-log.service"), exports);
__exportStar(require("./services/migration.service"), exports);
__exportStar(require("./services/data-cleanup.service"), exports);
__exportStar(require("./guards"), exports);
__exportStar(require("./decorators"), exports);
__exportStar(require("./errors"), exports);
__exportStar(require("./middleware/tenant-context.middleware"), exports);
__exportStar(require("./controllers/tenant.controller"), exports);
__exportStar(require("./controllers/audit-log.controller"), exports);
__exportStar(require("./controllers/data-cleanup.controller"), exports);
__exportStar(require("./templates"), exports);
var rbac_config_1 = require("./config/rbac.config");
Object.defineProperty(exports, "rbacConfig", { enumerable: true, get: function () { return __importDefault(rbac_config_1).default; } });
__exportStar(require("./filters/rbac-exception.filter"), exports);
var permission_entity_1 = require("../../entities/rbac/permission.entity");
Object.defineProperty(exports, "Permission", { enumerable: true, get: function () { return permission_entity_1.Permission; } });
var role_entity_1 = require("../../entities/rbac/role.entity");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return role_entity_1.Role; } });
var user_role_entity_1 = require("../../entities/rbac/user-role.entity");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return user_role_entity_1.UserRole; } });
var role_permission_entity_1 = require("../../entities/rbac/role-permission.entity");
Object.defineProperty(exports, "RolePermission", { enumerable: true, get: function () { return role_permission_entity_1.RolePermission; } });
var tenant_entity_1 = require("../../entities/rbac/tenant.entity");
Object.defineProperty(exports, "RBACTenant", { enumerable: true, get: function () { return tenant_entity_1.RBACTenant; } });
var audit_log_entity_1 = require("../../entities/rbac/audit-log.entity");
Object.defineProperty(exports, "AuditLog", { enumerable: true, get: function () { return audit_log_entity_1.AuditLog; } });
class RBACUtils {
    static createPermissionString(entityType, action) {
        return `${entityType}:${action}`;
    }
    static parsePermissionString(permissionString) {
        const [entityType, action] = permissionString.split(':');
        return { entityType, action };
    }
    static isValidPermissionString(permissionString) {
        return /^[A-Za-z][A-Za-z0-9_]*:[A-Za-z][A-Za-z0-9_]*$/.test(permissionString);
    }
    static generateRoleName(templateName, tenantName) {
        return tenantName ? `${templateName}_${tenantName}` : templateName;
    }
    static isSystemRole(roleName) {
        const systemRoles = ['Admin', 'Operator', 'Viewer', 'SuperAdmin', 'SystemAdmin'];
        return systemRoles.includes(roleName);
    }
    static normalizeEntityType(entityType) {
        return entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase();
    }
    static normalizeAction(action) {
        return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
    }
}
exports.RBACUtils = RBACUtils;
exports.RBAC_CONSTANTS = {
    DEFAULT_CACHE_TTL: 300,
    MAX_ROLES_PER_USER: 50,
    MAX_PERMISSIONS_PER_ROLE: 200,
    SYSTEM_ROLES: {
        ADMIN: 'Admin',
        OPERATOR: 'Operator',
        VIEWER: 'Viewer',
    },
    ENTITY_TYPES: {
        USER: 'User',
        CUSTOMER: 'Customer',
        LEAD: 'Lead',
        ORDER: 'Order',
        PRODUCT: 'Product',
        INVOICE: 'Invoice',
        REPORT: 'Report',
    },
    ACTIONS: {
        CREATE: 'Create',
        READ: 'Read',
        UPDATE: 'Update',
        DELETE: 'Delete',
        EXPORT: 'Export',
        IMPORT: 'Import',
        DOWNLOAD_REPORT: 'Download_Report',
        BULK_UPDATE: 'Bulk_Update',
        BULK_DELETE: 'Bulk_Delete',
    },
    HEADERS: {
        TENANT_ID: 'X-Tenant-ID',
        USER_ID: 'X-User-ID',
    },
    METADATA_KEYS: {
        PERMISSIONS: 'permissions',
        ROLES: 'roles',
        TENANT_REQUIRED: 'tenant_required',
    },
};
//# sourceMappingURL=index.js.map