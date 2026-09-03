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
exports.PropertyGroupsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const property_groups_service_1 = require("./property-groups.service");
const create_property_group_dto_1 = require("./dto/create-property-group.dto");
const update_property_group_dto_1 = require("./dto/update-property-group.dto");
let PropertyGroupsController = class PropertyGroupsController {
    propertyGroupsService;
    tenantContext;
    constructor(propertyGroupsService, tenantContext) {
        this.propertyGroupsService = propertyGroupsService;
        this.tenantContext = tenantContext;
    }
    async create(dto) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.propertyGroupsService.create(tenantId, dto);
    }
    async findAll() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.propertyGroupsService.findAll(tenantId);
    }
    async findOne(id) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.propertyGroupsService.findOne(tenantId, id);
    }
    async update(id, dto) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.propertyGroupsService.update(tenantId, id, dto);
    }
    async remove(id) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.propertyGroupsService.remove(tenantId, id);
    }
    async getStats(id) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.propertyGroupsService.getStats(tenantId, id);
    }
};
exports.PropertyGroupsController = PropertyGroupsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Property', action: 'Create' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new property group/lot',
        description: 'Creates a new property group (lote) for the current tenant',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Property group created successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_property_group_dto_1.CreatePropertyGroupDto]),
    __metadata("design:returntype", Promise)
], PropertyGroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Property', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all property groups',
        description: 'Returns all property groups for the current tenant',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of property groups',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PropertyGroupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Property', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get property group details',
        description: 'Returns a specific property group with its properties',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Property group details',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PropertyGroupsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Property', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Update property group',
        description: 'Updates a property group information',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Property group updated successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_property_group_dto_1.UpdatePropertyGroupDto]),
    __metadata("design:returntype", Promise)
], PropertyGroupsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Property', action: 'Delete' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete property group',
        description: 'Deletes a property group and all its properties',
    }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'Property group deleted successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PropertyGroupsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Property', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get property group statistics',
        description: 'Returns statistics for a property group',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Property group statistics',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PropertyGroupsController.prototype, "getStats", null);
exports.PropertyGroupsController = PropertyGroupsController = __decorate([
    (0, swagger_1.ApiTags)('Tenant - Property Groups'),
    (0, common_1.Controller)('tenant/property-groups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [property_groups_service_1.PropertyGroupsService,
        tenant_context_service_1.TenantContextService])
], PropertyGroupsController);
//# sourceMappingURL=property-groups.controller.js.map