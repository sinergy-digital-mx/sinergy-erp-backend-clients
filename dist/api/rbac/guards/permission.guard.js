"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PermissionGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permission_service_1 = require("../services/permission.service");
const tenant_context_service_1 = require("../services/tenant-context.service");
const require_permissions_decorator_1 = require("../decorators/require-permissions.decorator");
const error_utils_1 = require("../errors/error-utils");
let PermissionGuard = PermissionGuard_1 = class PermissionGuard {
    reflector;
    permissionService;
    tenantContextService;
    logger = new common_1.Logger(PermissionGuard_1.name);
    constructor(reflector, permissionService, tenantContextService) {
        this.reflector = reflector;
        this.permissionService = permissionService;
        this.tenantContextService = tenantContextService;
    }
    async canActivate(context) {
        const targets = [context.getHandler(), context.getClass()];
        const requiredPermissions = this.reflector.getAllAndOverride(require_permissions_decorator_1.PERMISSIONS_KEY, targets);
        if (requiredPermissions?.length) {
            return this.authorizeAll(context, requiredPermissions);
        }
        const anyPermissions = this.reflector.getAllAndOverride(require_permissions_decorator_1.PERMISSIONS_ANY_KEY, targets);
        if (!anyPermissions?.length) {
            this.logger.debug('No permissions required for this route');
            return true;
        }
        return this.authorizeAny(context, anyPermissions);
    }
    async authorizeAll(context, requiredPermissions) {
        const { user, tenantId } = this.requireUserContext(context);
        this.logger.debug(`Checking permissions for user ${user.user_id} in tenant ${tenantId}: ${requiredPermissions
            .map(p => `${p.entityType}:${p.action}`)
            .join(', ')}`);
        for (const permission of requiredPermissions) {
            const hasPermission = await this.checkPermission(user.user_id, tenantId, permission);
            if (!hasPermission) {
                this.logger.warn(`Permission denied for user ${user.user_id} in tenant ${tenantId}: missing ${permission.entityType}:${permission.action}`);
                error_utils_1.RBACErrorUtils.throwPermissionDenied(permission.entityType, permission.action, user.user_id, tenantId);
            }
        }
        this.logger.debug(`All permissions granted for user ${user.user_id} in tenant ${tenantId}`);
        return true;
    }
    async authorizeAny(context, permissions) {
        const { user, tenantId } = this.requireUserContext(context);
        for (const permission of permissions) {
            const hasPermission = await this.checkPermission(user.user_id, tenantId, permission);
            if (hasPermission) {
                this.logger.debug(`Permission granted for user ${user.user_id}: ${permission.entityType}:${permission.action}`);
                return true;
            }
        }
        const denied = permissions[0];
        this.logger.warn(`Permission denied for user ${user.user_id} in tenant ${tenantId}: missing any of ${permissions
            .map(p => `${p.entityType}:${p.action}`)
            .join(', ')}`);
        error_utils_1.RBACErrorUtils.throwPermissionDenied(denied.entityType, denied.action, user.user_id, tenantId);
    }
    requireUserContext(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            this.logger.warn('No user found in request - authentication required');
            error_utils_1.RBACErrorUtils.throwAuthenticationRequired('Authentication required');
        }
        const tenantId = this.extractTenantId(request, user);
        if (!tenantId) {
            this.logger.warn(`No tenant ID found for user ${user.user_id}`);
            error_utils_1.RBACErrorUtils.throwAuthenticationRequired('Tenant context is required');
        }
        this.tenantContextService.setTenantContext(tenantId, user.user_id);
        return { user, tenantId };
    }
    async checkPermission(userId, tenantId, permission) {
        try {
            return await this.permissionService.hasPermission(userId, tenantId, permission.entityType, permission.action);
        }
        catch (error) {
            if (error_utils_1.RBACErrorUtils.isRBACException(error)) {
                throw error;
            }
            this.logger.error(`Error checking permission ${permission.entityType}:${permission.action} for user ${userId}:`, error);
            error_utils_1.RBACErrorUtils.throwSystemError('PermissionGuard', 'canActivate', error);
        }
    }
    extractTenantId(request, user) {
        const headerTenantId = request.headers['x-tenant-id'] ||
            request.headers['X-Tenant-ID'] ||
            request.headers['X-TENANT-ID'];
        if (headerTenantId) {
            this.logger.debug(`Tenant ID from header: ${headerTenantId}`);
            return headerTenantId;
        }
        if (user.tenant_id) {
            this.logger.debug(`Tenant ID from JWT: ${user.tenant_id}`);
            return user.tenant_id;
        }
        if (user.currentTenantId) {
            this.logger.debug(`Tenant ID from user.currentTenantId: ${user.currentTenantId}`);
            return user.currentTenantId;
        }
        this.logger.debug('No tenant ID found in request headers or JWT payload');
        return null;
    }
    async validateUserTenantAccess(userId, tenantId) {
        try {
            return await this.permissionService.validateUserTenantAccess(userId, tenantId);
        }
        catch (error) {
            this.logger.error(`Error validating tenant access for user ${userId} to tenant ${tenantId}:`, error);
            return false;
        }
    }
    async canActivateWithTenantValidation(context) {
        const hasPermissions = await this.canActivate(context);
        if (!hasPermissions) {
            return false;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const tenantId = this.extractTenantId(request, user);
        if (tenantId && user?.user_id) {
            const hasAccess = await this.validateUserTenantAccess(user.user_id, tenantId);
            if (!hasAccess) {
                this.logger.warn(`User ${user.user_id} does not have access to tenant ${tenantId}`);
                error_utils_1.RBACErrorUtils.throwCrossTenantAccessDenied(tenantId, user.currentTenantId || 'unknown', user.user_id);
            }
        }
        return true;
    }
};
exports.PermissionGuard = PermissionGuard;
exports.PermissionGuard = PermissionGuard = PermissionGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        permission_service_1.PermissionService,
        tenant_context_service_1.TenantContextService])
], PermissionGuard);
//# sourceMappingURL=permission.guard.js.map