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
exports.ShippingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const shippings_service_1 = require("./shippings.service");
const shipping_dto_1 = require("./dto/shipping.dto");
let ShippingsController = class ShippingsController {
    service;
    constructor(service) {
        this.service = service;
    }
    preview(dto, req) {
        return this.service.preview(dto, req.user.tenant_id);
    }
    resolveOrders(dto, req) {
        return this.service.resolveOrders(dto, req.user.tenant_id);
    }
    create(dto, req) {
        return this.service.create(dto, req.user.tenant_id, req.user.id);
    }
    findAll(query, req) {
        return this.service.findAll(req.user.tenant_id, query);
    }
    findAvailableOrders(query, req) {
        return this.service.findAvailableOrders(req.user.tenant_id, query);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user.tenant_id);
    }
    addStops(id, dto, req) {
        return this.service.addStops(id, dto, req.user.tenant_id);
    }
    recalculate(id, req) {
        return this.service.recalculateDistance(id, req.user.tenant_id);
    }
    updateStatus(id, dto, req) {
        return this.service.updateStatus(id, dto, req.user.tenant_id, req.user.id);
    }
};
exports.ShippingsController = ShippingsController;
__decorate([
    (0, common_1.Post)('preview'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Shipping', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Preview de ruta (km + GPS faltante, sin guardar)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shipping_dto_1.PreviewShippingDto, Object]),
    __metadata("design:returntype", void 0)
], ShippingsController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)('resolve-orders'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Shipping', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Resolver GPS de órdenes de venta' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shipping_dto_1.ResolveOrdersDto, Object]),
    __metadata("design:returntype", void 0)
], ShippingsController.prototype, "resolveOrders", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Shipping', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Crear envío con paradas' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shipping_dto_1.CreateShippingDto, Object]),
    __metadata("design:returntype", void 0)
], ShippingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Shipping', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Listar envíos' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shipping_dto_1.QueryShippingDto, Object]),
    __metadata("design:returntype", void 0)
], ShippingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available-orders'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Shipping', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Órdenes Surtida / Lista para entrega de la sucursal (elegibles para envío)',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shipping_dto_1.QueryAvailableShippingOrdersDto, Object]),
    __metadata("design:returntype", void 0)
], ShippingsController.prototype, "findAvailableOrders", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Shipping', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de envío' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShippingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/stops'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Shipping', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Agregar paradas (solo estado Creado)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shipping_dto_1.AddShippingStopsDto, Object]),
    __metadata("design:returntype", void 0)
], ShippingsController.prototype, "addStops", null);
__decorate([
    (0, common_1.Post)(':id/recalculate-distance'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Shipping', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Recalcular distancia tras cargar GPS' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShippingsController.prototype, "recalculate", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Shipping', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Cambiar estado del envío' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shipping_dto_1.UpdateShippingStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ShippingsController.prototype, "updateStatus", null);
exports.ShippingsController = ShippingsController = __decorate([
    (0, swagger_1.ApiTags)('Shippings'),
    (0, common_1.Controller)('tenant/shippings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [shippings_service_1.ShippingsService])
], ShippingsController);
//# sourceMappingURL=shippings.controller.js.map