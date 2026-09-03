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
exports.MailerConfigurationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const mailer_configuration_service_1 = require("../services/mailer-configuration.service");
const create_mailer_configuration_dto_1 = require("../dto/create-mailer-configuration.dto");
const update_mailer_configuration_dto_1 = require("../dto/update-mailer-configuration.dto");
const query_mailer_configuration_dto_1 = require("../dto/query-mailer-configuration.dto");
const mailer_configuration_dto_1 = require("../dto/mailer-configuration.dto");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permission_guard_1 = require("../../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../../rbac/services/tenant-context.service");
let MailerConfigurationController = class MailerConfigurationController {
    service;
    tenantContext;
    constructor(service, tenantContext) {
        this.service = service;
        this.tenantContext = tenantContext;
    }
    async create(dto) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        const userId = this.tenantContext.getCurrentUserId();
        if (!tenantId || !userId) {
            throw new Error('Tenant context is required');
        }
        const config = await this.service.create(tenantId, dto, userId);
        return (0, class_transformer_1.plainToInstance)(mailer_configuration_dto_1.MailerConfigurationDto, config);
    }
    async findAll(query) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const result = await this.service.list(tenantId, query);
        return {
            ...result,
            data: (0, class_transformer_1.plainToInstance)(mailer_configuration_dto_1.MailerConfigurationDto, result.data),
        };
    }
    async getActive() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const config = await this.service.findActive(tenantId);
        return (0, class_transformer_1.plainToInstance)(mailer_configuration_dto_1.MailerConfigurationDto, config);
    }
    async findOne(id) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const config = await this.service.findById(tenantId, id);
        return (0, class_transformer_1.plainToInstance)(mailer_configuration_dto_1.MailerConfigurationDto, config);
    }
    async update(id, dto) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        const userId = this.tenantContext.getCurrentUserId();
        if (!tenantId || !userId) {
            throw new Error('Tenant context is required');
        }
        const config = await this.service.update(tenantId, id, dto, userId);
        return (0, class_transformer_1.plainToInstance)(mailer_configuration_dto_1.MailerConfigurationDto, config);
    }
    async remove(id) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        const userId = this.tenantContext.getCurrentUserId();
        if (!tenantId || !userId) {
            throw new Error('Tenant context is required');
        }
        return this.service.delete(tenantId, id, userId);
    }
    async activate(id) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        const userId = this.tenantContext.getCurrentUserId();
        if (!tenantId || !userId) {
            throw new Error('Tenant context is required');
        }
        const config = await this.service.activate(tenantId, id, userId);
        return (0, class_transformer_1.plainToInstance)(mailer_configuration_dto_1.MailerConfigurationDto, config);
    }
};
exports.MailerConfigurationController = MailerConfigurationController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'mailer_configurations', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new Resend configuration' }),
    (0, swagger_1.ApiBody)({ type: create_mailer_configuration_dto_1.CreateMailerConfigurationDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Configuration created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_mailer_configuration_dto_1.CreateMailerConfigurationDto]),
    __metadata("design:returntype", Promise)
], MailerConfigurationController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'mailer_configurations', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'List Resend configurations' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configurations retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_mailer_configuration_dto_1.QueryMailerConfigurationDto]),
    __metadata("design:returntype", Promise)
], MailerConfigurationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'mailer_configurations', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get active configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active configuration retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No active configuration' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MailerConfigurationController.prototype, "getActive", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'mailer_configurations', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get configuration by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configuration retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MailerConfigurationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'mailer_configurations', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update configuration' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiBody)({ type: update_mailer_configuration_dto_1.UpdateMailerConfigurationDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configuration updated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_mailer_configuration_dto_1.UpdateMailerConfigurationDto]),
    __metadata("design:returntype", Promise)
], MailerConfigurationController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'mailer_configurations', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete configuration' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configuration deleted' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MailerConfigurationController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'mailer_configurations', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Activate configuration' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configuration activated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MailerConfigurationController.prototype, "activate", null);
exports.MailerConfigurationController = MailerConfigurationController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, common_1.Controller)('tenant/mailer-configurations'),
    (0, swagger_1.ApiTags)('Mailer Configurations'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [mailer_configuration_service_1.MailerConfigurationService,
        tenant_context_service_1.TenantContextService])
], MailerConfigurationController);
//# sourceMappingURL=mailer-configuration.controller.js.map