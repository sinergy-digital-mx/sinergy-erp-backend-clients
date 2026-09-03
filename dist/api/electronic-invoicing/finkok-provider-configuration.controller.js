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
exports.FinkokProviderConfigurationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const finkok_provider_configuration_service_1 = require("./services/finkok-provider-configuration.service");
const upsert_finkok_provider_configuration_dto_1 = require("./dto/upsert-finkok-provider-configuration.dto");
const set_finkok_stamping_environment_dto_1 = require("./dto/set-finkok-stamping-environment.dto");
let FinkokProviderConfigurationController = class FinkokProviderConfigurationController {
    service;
    constructor(service) {
        this.service = service;
    }
    get(req) {
        return this.service.getAllForTenant(req.user.tenantId);
    }
    upsert(dto, req) {
        return this.service.upsert(req.user.tenantId, req.user.id, dto);
    }
    setStampingEnvironment(dto, req) {
        return this.service.setStampingEnvironment(req.user.tenantId, dto.environment);
    }
    testConnection(req, environment) {
        return this.service.testConnection(req.user.tenantId, environment);
    }
};
exports.FinkokProviderConfigurationController = FinkokProviderConfigurationController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener credenciales Finkok del cliente (demo y production por separado)',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinkokProviderConfigurationController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Guardar credenciales Finkok para un ambiente (demo o production)',
        description: 'Body.environment es el tab (demo|production), no el ambiente activo de timbrado. Respuesta = mismo bundle que GET.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_finkok_provider_configuration_dto_1.UpsertFinkokProviderConfigurationDto, Object]),
    __metadata("design:returntype", void 0)
], FinkokProviderConfigurationController.prototype, "upsert", null);
__decorate([
    (0, common_1.Patch)('stamping-environment'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Definir qué ambiente Finkok usar al timbrar/cancelar por defecto',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [set_finkok_stamping_environment_dto_1.SetFinkokStampingEnvironmentDto, Object]),
    __metadata("design:returntype", void 0)
], FinkokProviderConfigurationController.prototype, "setStampingEnvironment", null);
__decorate([
    (0, common_1.Post)('test-connection'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'FiscalConfiguration', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Probar conexión con Finkok' }),
    (0, swagger_1.ApiQuery)({ name: 'environment', required: false, enum: ['demo', 'production'] }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('environment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FinkokProviderConfigurationController.prototype, "testConnection", null);
exports.FinkokProviderConfigurationController = FinkokProviderConfigurationController = __decorate([
    (0, swagger_1.ApiTags)('Finkok Configuration'),
    (0, common_1.Controller)('tenant/billing/finkok-configuration'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [finkok_provider_configuration_service_1.FinkokProviderConfigurationService])
], FinkokProviderConfigurationController);
//# sourceMappingURL=finkok-provider-configuration.controller.js.map