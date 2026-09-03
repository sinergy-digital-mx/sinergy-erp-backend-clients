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
exports.BillingBranchAllController = exports.BillingBranchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const billing_branch_service_1 = require("./billing-branch.service");
const create_billing_branch_dto_1 = require("./dto/create-billing-branch.dto");
const update_billing_branch_dto_1 = require("./dto/update-billing-branch.dto");
let BillingBranchController = class BillingBranchController {
    branchService;
    tenantContext;
    constructor(branchService, tenantContext) {
        this.branchService = branchService;
        this.tenantContext = tenantContext;
    }
    async create(fiscalConfigId, dto) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId)
            throw new common_1.BadRequestException('No se pudo identificar la organización');
        return await this.branchService.create(fiscalConfigId, tenantId, dto);
    }
    async findAll(fiscalConfigId) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId)
            throw new common_1.BadRequestException('No se pudo identificar la organización');
        return await this.branchService.findAll(fiscalConfigId, tenantId);
    }
    async findOne(fiscalConfigId, id) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId)
            throw new common_1.BadRequestException('No se pudo identificar la organización');
        return await this.branchService.findOne(id, fiscalConfigId, tenantId);
    }
    async update(fiscalConfigId, id, dto) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId)
            throw new common_1.BadRequestException('No se pudo identificar la organización');
        return await this.branchService.update(id, fiscalConfigId, tenantId, dto);
    }
    async remove(fiscalConfigId, id) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId)
            throw new common_1.BadRequestException('No se pudo identificar la organización');
        await this.branchService.remove(id, fiscalConfigId, tenantId);
    }
};
exports.BillingBranchController = BillingBranchController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Create' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new billing branch' }),
    (0, swagger_1.ApiParam)({ name: 'fiscalConfigId', description: 'Fiscal Configuration ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Branch created successfully' }),
    __param(0, (0, common_1.Param)('fiscalConfigId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_billing_branch_dto_1.CreateBillingBranchDto]),
    __metadata("design:returntype", Promise)
], BillingBranchController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get all branches for a fiscal configuration' }),
    (0, swagger_1.ApiParam)({ name: 'fiscalConfigId', description: 'Fiscal Configuration ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of branches' }),
    __param(0, (0, common_1.Param)('fiscalConfigId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingBranchController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific branch' }),
    (0, swagger_1.ApiParam)({ name: 'fiscalConfigId', description: 'Fiscal Configuration ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Branch ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Branch details' }),
    __param(0, (0, common_1.Param)('fiscalConfigId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BillingBranchController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update a branch' }),
    (0, swagger_1.ApiParam)({ name: 'fiscalConfigId', description: 'Fiscal Configuration ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Branch ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Branch updated successfully' }),
    __param(0, (0, common_1.Param)('fiscalConfigId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_billing_branch_dto_1.UpdateBillingBranchDto]),
    __metadata("design:returntype", Promise)
], BillingBranchController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Delete' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a branch' }),
    (0, swagger_1.ApiParam)({ name: 'fiscalConfigId', description: 'Fiscal Configuration ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Branch ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Branch deleted successfully' }),
    __param(0, (0, common_1.Param)('fiscalConfigId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BillingBranchController.prototype, "remove", null);
exports.BillingBranchController = BillingBranchController = __decorate([
    (0, swagger_1.ApiTags)('Billing - Branches'),
    (0, common_1.Controller)('tenant/fiscal-configurations/:fiscalConfigId/branches'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [billing_branch_service_1.BillingBranchService,
        tenant_context_service_1.TenantContextService])
], BillingBranchController);
let BillingBranchAllController = class BillingBranchAllController {
    branchService;
    tenantContext;
    constructor(branchService, tenantContext) {
        this.branchService = branchService;
        this.tenantContext = tenantContext;
    }
    async findAll() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId)
            throw new common_1.BadRequestException('No se pudo identificar la organización');
        return await this.branchService.findAllByTenant(tenantId);
    }
};
exports.BillingBranchAllController = BillingBranchAllController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get all branches for the current tenant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of all branches' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingBranchAllController.prototype, "findAll", null);
exports.BillingBranchAllController = BillingBranchAllController = __decorate([
    (0, swagger_1.ApiTags)('Billing - Branches'),
    (0, common_1.Controller)('tenant/billing/branches'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [billing_branch_service_1.BillingBranchService,
        tenant_context_service_1.TenantContextService])
], BillingBranchAllController);
//# sourceMappingURL=billing-branch.controller.js.map