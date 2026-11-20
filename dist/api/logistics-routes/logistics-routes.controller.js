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
exports.LogisticsRoutesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const jwt_permission_util_1 = require("../rbac/utils/jwt-permission.util");
const logistics_route_dto_1 = require("./dto/logistics-route.dto");
const logistics_routes_service_1 = require("./logistics-routes.service");
let LogisticsRoutesController = class LogisticsRoutesController {
    routes;
    constructor(routes) {
        this.routes = routes;
    }
    list(active, req) {
        this.assertCanRead(req.user);
        return this.routes.list(req.user.tenant_id, active === '1' || active === 'true');
    }
    create(dto, req) {
        this.assertCanWrite(req.user);
        return this.routes.create(req.user.tenant_id, dto);
    }
    update(id, dto, req) {
        this.assertCanWrite(req.user);
        return this.routes.update(req.user.tenant_id, id, dto);
    }
    remove(id, req) {
        this.assertCanWrite(req.user);
        return this.routes.deactivate(req.user.tenant_id, id);
    }
    assertCanRead(user) {
        if ((0, jwt_permission_util_1.userHasJwtPermission)(user, 'route', 'Read') ||
            (0, jwt_permission_util_1.userHasJwtPermission)(user, 'route', 'ViewMenu') ||
            (0, jwt_permission_util_1.userHasJwtPermission)(user, 'sales_orders', 'Read') ||
            (0, jwt_permission_util_1.userHasJwtPermission)(user, 'sales_orders', 'Create') ||
            (0, jwt_permission_util_1.userHasJwtPermission)(user, 'sales_orders', 'Update')) {
            return;
        }
        throw new common_1.ForbiddenException('No puedes consultar las rutas');
    }
    assertCanWrite(user) {
        if ((0, jwt_permission_util_1.userHasJwtPermission)(user, 'route', 'Create') ||
            (0, jwt_permission_util_1.userHasJwtPermission)(user, 'route', 'Update') ||
            (0, jwt_permission_util_1.userHasJwtPermission)(user, 'sales_orders', 'Update')) {
            return;
        }
        throw new common_1.ForbiddenException('No puedes modificar las rutas');
    }
};
exports.LogisticsRoutesController = LogisticsRoutesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar rutas de reparto' }),
    __param(0, (0, common_1.Query)('active')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LogisticsRoutesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear ruta de reparto' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [logistics_route_dto_1.UpsertLogisticsRouteDto, Object]),
    __metadata("design:returntype", void 0)
], LogisticsRoutesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar ruta de reparto' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, logistics_route_dto_1.UpsertLogisticsRouteDto, Object]),
    __metadata("design:returntype", void 0)
], LogisticsRoutesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Desactivar ruta de reparto' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LogisticsRoutesController.prototype, "remove", null);
exports.LogisticsRoutesController = LogisticsRoutesController = __decorate([
    (0, swagger_1.ApiTags)('Logistics routes'),
    (0, common_1.Controller)('tenant/logistics-routes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [logistics_routes_service_1.LogisticsRoutesService])
], LogisticsRoutesController);
//# sourceMappingURL=logistics-routes.controller.js.map