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
var TenantController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantController = exports.UpdateTenantStatusDto = exports.CreateTenantDto = void 0;
const common_1 = require("@nestjs/common");
const tenant_service_1 = require("../services/tenant.service");
const require_permissions_decorator_1 = require("../decorators/require-permissions.decorator");
const permission_guard_1 = require("../guards/permission.guard");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
class CreateTenantDto {
    name;
    subdomain;
    isActive;
    skipSystemRoles;
    customRoleTemplates;
}
exports.CreateTenantDto = CreateTenantDto;
class UpdateTenantStatusDto {
    isActive;
}
exports.UpdateTenantStatusDto = UpdateTenantStatusDto;
let TenantController = TenantController_1 = class TenantController {
    tenantService;
    logger = new common_1.Logger(TenantController_1.name);
    constructor(tenantService) {
        this.tenantService = tenantService;
    }
    async createTenant(createTenantDto) {
        this.logger.log(`Creating tenant: ${createTenantDto.name}`);
        const options = {
            name: createTenantDto.name,
            subdomain: createTenantDto.subdomain,
            isActive: createTenantDto.isActive,
            skipSystemRoles: createTenantDto.skipSystemRoles,
            customRoleTemplates: createTenantDto.customRoleTemplates,
        };
        const result = await this.tenantService.createTenant(options);
        return {
            message: 'Tenant created successfully',
            tenant: {
                id: result.tenant.id,
                name: result.tenant.name,
                subdomain: result.tenant.subdomain,
                isActive: result.tenant.is_active,
                createdAt: result.tenant.created_at,
            },
            systemRoles: {
                totalRoles: result.systemRoles.totalRoles,
                totalPermissions: result.systemRoles.totalPermissions,
                errors: result.systemRoles.errors,
            },
            customRoles: {
                totalRoles: result.customRoles.totalRoles,
                totalPermissions: result.customRoles.totalPermissions,
                errors: result.customRoles.errors,
            },
            warnings: result.warnings,
        };
    }
    async getTenant(tenantId) {
        const tenant = await this.tenantService.getTenantById(tenantId);
        if (!tenant) {
            throw new Error(`Tenant with ID ${tenantId} not found`);
        }
        return {
            tenant: {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                isActive: tenant.is_active,
                createdAt: tenant.created_at,
                updatedAt: tenant.updated_at,
            },
        };
    }
    async initializeRoles(tenantId) {
        this.logger.log(`Initializing roles for tenant: ${tenantId}`);
        const result = await this.tenantService.initializeRolesForTenant(tenantId);
        return {
            message: 'Roles initialized successfully',
            systemRoles: {
                totalRoles: result.systemRoles.totalRoles,
                totalPermissions: result.systemRoles.totalPermissions,
                errors: result.systemRoles.errors,
            },
            customRoles: {
                totalRoles: result.customRoles.totalRoles,
                totalPermissions: result.customRoles.totalPermissions,
                errors: result.customRoles.errors,
            },
        };
    }
    async updateTenantStatus(tenantId, updateStatusDto) {
        this.logger.log(`Updating status for tenant: ${tenantId} to ${updateStatusDto.isActive}`);
        const tenant = await this.tenantService.updateTenantStatus(tenantId, updateStatusDto.isActive);
        return {
            message: 'Tenant status updated successfully',
            tenant: {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                isActive: tenant.is_active,
                updatedAt: tenant.updated_at,
            },
        };
    }
    async deleteTenant(tenantId, request) {
        this.logger.log(`Deleting tenant: ${tenantId}`);
        const actorId = request.user?.id;
        const deletionResult = await this.tenantService.deleteTenant(tenantId, actorId);
        return {
            message: 'Tenant deleted successfully with cascade cleanup',
            deletionResult: {
                tenantId: deletionResult.tenantId,
                tenantName: deletionResult.tenantName,
                deletedAt: deletionResult.deletedAt,
                cascadeResults: deletionResult.cascadeResults,
                warnings: deletionResult.warnings,
            },
        };
    }
    async validateOrphanedReferences(tenantId) {
        this.logger.log(`Validating orphaned references for tenant: ${tenantId}`);
        const warnings = await this.tenantService.validateOrphanedReferences(tenantId);
        return {
            tenantId,
            warnings,
            isValid: warnings.length === 0,
        };
    }
};
exports.TenantController = TenantController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Tenant', action: 'Create' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "createTenant", null);
__decorate([
    (0, common_1.Get)(':tenantId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Tenant', action: 'Read' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "getTenant", null);
__decorate([
    (0, common_1.Post)(':tenantId/initialize-roles'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Tenant', action: 'Update' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "initializeRoles", null);
__decorate([
    (0, common_1.Put)(':tenantId/status'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Tenant', action: 'Update' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateTenantStatusDto]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "updateTenantStatus", null);
__decorate([
    (0, common_1.Delete)(':tenantId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Tenant', action: 'Delete' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "deleteTenant", null);
__decorate([
    (0, common_1.Get)(':tenantId/validate-references'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Tenant', action: 'Read' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "validateOrphanedReferences", null);
exports.TenantController = TenantController = TenantController_1 = __decorate([
    (0, common_1.Controller)('rbac/tenants'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [tenant_service_1.TenantService])
], TenantController);
//# sourceMappingURL=tenant.controller.js.map