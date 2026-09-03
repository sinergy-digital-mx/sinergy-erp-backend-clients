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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const permission_service_1 = require("../rbac/services/permission.service");
let AuthController = class AuthController {
    authService;
    tenantContextService;
    permissionService;
    constructor(authService, tenantContextService, permissionService) {
        this.authService = authService;
        this.tenantContextService = tenantContextService;
        this.permissionService = permissionService;
    }
    login(dto) {
        return this.authService.login(dto.email, dto.password);
    }
    async refresh(req) {
        const { userId, tenantId } = this.resolveAuthContext(req);
        return this.authService.refresh(userId, tenantId);
    }
    async getCurrentUserPermissions(req) {
        const { userId, tenantId } = this.resolveAuthContext(req);
        const permissions = await this.permissionService.getUserPermissions(userId, tenantId);
        const permissionsByModule = permissions.reduce((acc, perm) => {
            const moduleName = perm.module?.name || 'System';
            if (!acc[moduleName]) {
                acc[moduleName] = [];
            }
            acc[moduleName].push({
                id: perm.id,
                action: perm.action,
                description: perm.description,
            });
            return acc;
        }, {});
        return {
            user_id: userId,
            tenant_id: tenantId,
            permissions: permissions.map(p => `${p.entity_type}:${p.action}`),
            permissions_by_module: permissionsByModule,
        };
    }
    resolveAuthContext(req) {
        const user = req?.user;
        const userId = (typeof user?.id === 'string' && user.id) ||
            (typeof user?.user_id === 'string' && user.user_id) ||
            this.tenantContextService.getCurrentUserId();
        const tenantId = (typeof user?.tenant_id === 'string' && user.tenant_id) ||
            (typeof user?.tenantId === 'string' && user.tenantId) ||
            this.tenantContextService.getCurrentTenantId();
        if (!userId || !tenantId) {
            throw new common_1.UnauthorizedException('User context is required');
        }
        return { userId, tenantId };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginDto }),
    (0, swagger_1.ApiOperation)({ summary: 'Login user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful with permissions',
        schema: {
            example: {
                access_token: 'eyJhbGc...',
                user: {
                    id: 'uuid',
                    email: 'user@example.com',
                    tenant_id: 'uuid',
                    status: 'Active',
                    roles: ['Sales Rep'],
                    is_pos_user: true,
                    pos_user_type: 'COBRANZA',
                    billing_branch_id: 'uuid',
                    fiscal_configuration_id: 'uuid',
                    permissions: {
                        'Lead Management': [
                            { id: 1, action: 'Read', description: 'View leads' },
                            { id: 2, action: 'Create', description: 'Create leads' }
                        ]
                    }
                }
            }
        }
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh authentication token with current permissions' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Token refreshed successfully with updated permissions',
        schema: {
            example: {
                access_token: 'eyJhbGc...',
                user: {
                    id: 'uuid',
                    email: 'user@example.com',
                    tenant_id: 'uuid',
                    status: 'Active',
                    roles: ['Sales Rep'],
                    permissions_flat: ['customer:read', 'customer:create'],
                    permissions_version: 2
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid or expired token',
        schema: {
            example: {
                statusCode: 401,
                message: 'Invalid or expired token',
                error: 'Unauthorized'
            }
        }
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('me/permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user permissions' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User permissions grouped by module',
        schema: {
            example: {
                user_id: 'uuid',
                tenant_id: 'uuid',
                permissions: ['Customer:Read', 'Customer:Create', 'Lead:Read'],
                permissions_by_module: {
                    'Customer Management': [
                        { id: 1, action: 'Read', description: 'View customers' },
                        { id: 2, action: 'Create', description: 'Create customers' }
                    ],
                    'Lead Management': [
                        { id: 3, action: 'Read', description: 'View leads' }
                    ]
                }
            }
        }
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUserPermissions", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        tenant_context_service_1.TenantContextService,
        permission_service_1.PermissionService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map