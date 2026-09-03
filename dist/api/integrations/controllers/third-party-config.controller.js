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
exports.ThirdPartyConfigController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permission_guard_1 = require("../../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../../rbac/services/tenant-context.service");
const third_party_config_service_1 = require("../services/third-party-config.service");
const create_third_party_config_dto_1 = require("../dto/create-third-party-config.dto");
const update_third_party_config_dto_1 = require("../dto/update-third-party-config.dto");
let ThirdPartyConfigController = class ThirdPartyConfigController {
    configService;
    tenantContextService;
    constructor(configService, tenantContextService) {
        this.configService = configService;
        this.tenantContextService = tenantContextService;
    }
    async create(dto) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        const userId = this.tenantContextService.getCurrentUserId();
        if (!tenantId || !userId) {
            throw new Error('Tenant context is required');
        }
        const config = await this.configService.create(tenantId, dto, userId);
        return this.maskSensitiveData(config);
    }
    async list() {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const configs = await this.configService.listByTenant(tenantId);
        return {
            configs: configs.map((c) => this.maskSensitiveData(c)),
        };
    }
    async getById(configId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const config = await this.configService.getById(configId, tenantId);
        return config;
    }
    async update(configId, dto) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        const userId = this.tenantContextService.getCurrentUserId();
        if (!tenantId || !userId) {
            throw new Error('Tenant context is required');
        }
        const config = await this.configService.update(configId, tenantId, dto, userId);
        return this.maskSensitiveData(config);
    }
    async delete(configId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.configService.delete(configId, tenantId);
        return { message: 'Configuration deleted successfully' };
    }
    async test(configId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const isValid = await this.configService.testConfig(configId, tenantId);
        return {
            is_valid: isValid,
            message: isValid ? 'Configuration is valid' : 'Configuration test failed',
        };
    }
    maskSensitiveData(config) {
        return {
            ...config,
            encrypted_api_key: this.maskSecret(config.encrypted_api_key),
            encrypted_api_secret: config.encrypted_api_secret
                ? this.maskSecret(config.encrypted_api_secret)
                : null,
            encrypted_webhook_secret: config.encrypted_webhook_secret
                ? this.maskSecret(config.encrypted_webhook_secret)
                : null,
        };
    }
    maskSecret(secret) {
        if (!secret || secret.length < 4)
            return '****';
        return `****${secret.slice(-4)}`;
    }
};
exports.ThirdPartyConfigController = ThirdPartyConfigController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Integration', action: 'Create' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create third-party configuration',
        description: 'Create a new third-party API configuration for the tenant',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Configuration created successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_third_party_config_dto_1.CreateThirdPartyConfigDto]),
    __metadata("design:returntype", Promise)
], ThirdPartyConfigController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Integration', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'List third-party configurations',
        description: 'List all third-party configurations for the tenant',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of configurations',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ThirdPartyConfigController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':configId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Integration', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get third-party configuration',
        description: 'Get a specific third-party configuration with decrypted secrets',
    }),
    (0, swagger_1.ApiParam)({ name: 'configId', description: 'Configuration ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Configuration details',
    }),
    __param(0, (0, common_1.Param)('configId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ThirdPartyConfigController.prototype, "getById", null);
__decorate([
    (0, common_1.Put)(':configId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Integration', action: 'Update' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Update third-party configuration',
        description: 'Update a third-party configuration',
    }),
    (0, swagger_1.ApiParam)({ name: 'configId', description: 'Configuration ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Configuration updated successfully',
    }),
    __param(0, (0, common_1.Param)('configId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_third_party_config_dto_1.UpdateThirdPartyConfigDto]),
    __metadata("design:returntype", Promise)
], ThirdPartyConfigController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':configId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Integration', action: 'Delete' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete third-party configuration',
        description: 'Delete a third-party configuration',
    }),
    (0, swagger_1.ApiParam)({ name: 'configId', description: 'Configuration ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Configuration deleted successfully',
    }),
    __param(0, (0, common_1.Param)('configId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ThirdPartyConfigController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':configId/test'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Integration', action: 'Read' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Test configuration',
        description: 'Test if the configuration is valid and decryptable',
    }),
    (0, swagger_1.ApiParam)({ name: 'configId', description: 'Configuration ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test result',
    }),
    __param(0, (0, common_1.Param)('configId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ThirdPartyConfigController.prototype, "test", null);
exports.ThirdPartyConfigController = ThirdPartyConfigController = __decorate([
    (0, swagger_1.ApiTags)('Tenant - Third-Party Integrations'),
    (0, common_1.Controller)('tenant/integrations/third-party-configs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [third_party_config_service_1.ThirdPartyConfigService,
        tenant_context_service_1.TenantContextService])
], ThirdPartyConfigController);
//# sourceMappingURL=third-party-config.controller.js.map