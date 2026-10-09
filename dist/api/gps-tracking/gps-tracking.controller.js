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
exports.GpsTrackingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const gps_tracking_configuration_dto_1 = require("./dto/gps-tracking-configuration.dto");
const gps_tracking_service_1 = require("./services/gps-tracking.service");
let GpsTrackingController = class GpsTrackingController {
    service;
    tenantContext;
    constructor(service, tenantContext) {
        this.service = service;
        this.tenantContext = tenantContext;
    }
    positions(truckId) {
        return this.service.positions(this.tenantId(), truckId || undefined);
    }
    units() {
        return this.service.units(this.tenantId());
    }
    list() {
        return this.service.list(this.tenantId());
    }
    create(dto) {
        return this.service.create(this.tenantId(), dto, this.userId());
    }
    active() {
        return this.service.findActive(this.tenantId());
    }
    test(dto) {
        return this.service.test(this.tenantId(), dto);
    }
    update(id, dto) {
        return this.service.update(id, this.tenantId(), dto, this.userId());
    }
    remove(id) {
        return this.service.remove(id, this.tenantId());
    }
    activate(id) {
        return this.service.activate(id, this.tenantId(), this.userId());
    }
    tenantId() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId)
            throw new Error('Se requiere el contexto de la organización');
        return tenantId;
    }
    userId() {
        const userId = this.tenantContext.getCurrentUserId();
        if (!userId)
            throw new Error('Se requiere el contexto de la organización');
        return userId;
    }
};
exports.GpsTrackingController = GpsTrackingController;
__decorate([
    (0, common_1.Get)('positions'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'gps_tracking', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Última posición de las unidades enlazadas' }),
    __param(0, (0, common_1.Query)('truck_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GpsTrackingController.prototype, "positions", null);
__decorate([
    (0, common_1.Get)('units'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'gps_tracking', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Catálogo de unidades GPS para enlazar con un camión' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GpsTrackingController.prototype, "units", null);
__decorate([
    (0, common_1.Get)('configurations'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'gps_tracking', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Listar configuraciones de rastreo GPS' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GpsTrackingController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('configurations'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'gps_tracking', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Crear configuración de 3D Tracking' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gps_tracking_configuration_dto_1.CreateGpsTrackingConfigurationDto]),
    __metadata("design:returntype", void 0)
], GpsTrackingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('configurations/active'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'gps_tracking', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Configuración de rastreo activa' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GpsTrackingController.prototype, "active", null);
__decorate([
    (0, common_1.Post)('configurations/test'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'gps_tracking', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Probar usuario y contraseña contra 3D Tracking' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gps_tracking_configuration_dto_1.TestGpsTrackingConfigurationDto]),
    __metadata("design:returntype", void 0)
], GpsTrackingController.prototype, "test", null);
__decorate([
    (0, common_1.Patch)('configurations/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'gps_tracking', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar configuración de rastreo GPS' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gps_tracking_configuration_dto_1.UpdateGpsTrackingConfigurationDto]),
    __metadata("design:returntype", void 0)
], GpsTrackingController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('configurations/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'gps_tracking', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar configuración de rastreo GPS' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GpsTrackingController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('configurations/:id/activate'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'gps_tracking', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Activar una configuración de rastreo GPS' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GpsTrackingController.prototype, "activate", null);
exports.GpsTrackingController = GpsTrackingController = __decorate([
    (0, swagger_1.ApiTags)('Rastreo GPS'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/gps-tracking'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [gps_tracking_service_1.GpsTrackingService,
        tenant_context_service_1.TenantContextService])
], GpsTrackingController);
//# sourceMappingURL=gps-tracking.controller.js.map