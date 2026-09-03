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
exports.FiscalConfigurationController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const fiscal_configuration_service_1 = require("./fiscal-configuration.service");
const fiscal_configuration_finkok_service_1 = require("../electronic-invoicing/services/fiscal-configuration-finkok.service");
const register_fiscal_configuration_finkok_dto_1 = require("../electronic-invoicing/dto/register-fiscal-configuration-finkok.dto");
const create_fiscal_configuration_dto_1 = require("./dto/create-fiscal-configuration.dto");
const update_fiscal_configuration_dto_1 = require("./dto/update-fiscal-configuration.dto");
const query_fiscal_configuration_dto_1 = require("./dto/query-fiscal-configuration.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let FiscalConfigurationController = class FiscalConfigurationController {
    service;
    finkokService;
    constructor(service, finkokService) {
        this.service = service;
        this.finkokService = finkokService;
    }
    create(dto, req) {
        return this.service.create(dto, req.user.tenantId, req.user.id);
    }
    findAll(query, req) {
        return this.service.findAll(req.user.tenantId, query);
    }
    getFinkokStatus(id, environment, req) {
        return this.finkokService.getFinkokStatus(id, req.user.tenantId, environment);
    }
    registerFinkok(id, dto, req) {
        return this.finkokService.registerIssuer(id, req.user.tenantId, req.user.id, dto);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user.tenantId);
    }
    update(id, dto, req) {
        return this.service.update(id, dto, req.user.tenantId);
    }
    uploadLogo(id, file, req) {
        if (!file) {
            throw new common_1.BadRequestException('No se envió ningún archivo');
        }
        return this.service.uploadLogo(id, req.user.tenantId, file);
    }
    remove(id, req) {
        return this.service.remove(id, req.user.tenantId);
    }
};
exports.FiscalConfigurationController = FiscalConfigurationController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new fiscal configuration' }),
    (0, swagger_1.ApiBody)({ type: create_fiscal_configuration_dto_1.CreateFiscalConfigurationDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Fiscal configuration created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_fiscal_configuration_dto_1.CreateFiscalConfigurationDto, Object]),
    __metadata("design:returntype", void 0)
], FiscalConfigurationController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated fiscal configurations with search and filters' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of fiscal configurations retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_fiscal_configuration_dto_1.QueryFiscalConfigurationDto, Object]),
    __metadata("design:returntype", Promise)
], FiscalConfigurationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/finkok-status'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Consultar si el RFC de la razón emisora existe en Finkok',
    }),
    (0, swagger_1.ApiQuery)({ name: 'environment', required: false, enum: ['demo', 'production'] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('environment')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], FiscalConfigurationController.prototype, "getFinkokStatus", null);
__decorate([
    (0, common_1.Post)(':id/register-finkok'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Vincular o registrar razón emisora en Finkok' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, register_fiscal_configuration_finkok_dto_1.RegisterFiscalConfigurationFinkokDto, Object]),
    __metadata("design:returntype", void 0)
], FiscalConfigurationController.prototype, "registerFinkok", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific fiscal configuration by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', description: 'Fiscal Configuration ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fiscal configuration retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FiscalConfigurationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing fiscal configuration' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiBody)({ type: update_fiscal_configuration_dto_1.UpdateFiscalConfigurationDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fiscal configuration updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_fiscal_configuration_dto_1.UpdateFiscalConfigurationDto, Object]),
    __metadata("design:returntype", void 0)
], FiscalConfigurationController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/logo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Upload logo for a fiscal configuration' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logo uploaded successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], FiscalConfigurationController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a fiscal configuration by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fiscal configuration deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FiscalConfigurationController.prototype, "remove", null);
exports.FiscalConfigurationController = FiscalConfigurationController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, common_1.Controller)('tenant/fiscal-configurations'),
    (0, swagger_1.ApiTags)('Fiscal Configurations'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [fiscal_configuration_service_1.FiscalConfigurationService,
        fiscal_configuration_finkok_service_1.FiscalConfigurationFinkokService])
], FiscalConfigurationController);
//# sourceMappingURL=fiscal-configuration.controller.js.map