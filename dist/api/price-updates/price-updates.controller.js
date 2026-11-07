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
exports.PriceUpdatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const query_price_update_dto_1 = require("./dto/query-price-update.dto");
const update_price_update_row_dto_1 = require("./dto/update-price-update-row.dto");
const price_updates_constants_1 = require("./price-updates.constants");
const price_updates_service_1 = require("./price-updates.service");
let PriceUpdatesController = class PriceUpdatesController {
    priceUpdatesService;
    constructor(priceUpdatesService) {
        this.priceUpdatesService = priceUpdatesService;
    }
    getSheet(query, req) {
        return this.priceUpdatesService.getSheet(req.user.tenant_id, query);
    }
    updateRow(productId, dto, req) {
        return this.priceUpdatesService.updateRow(req.user.tenant_id, productId, dto);
    }
};
exports.PriceUpdatesController = PriceUpdatesController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: price_updates_constants_1.PRICE_UPDATE_ENTITY_CODE, action: 'Read' }, { entityType: price_updates_constants_1.PRICE_UPDATE_ENTITY_CODE, action: 'ViewMenu' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Hoja de actualización de precio',
        description: 'Productos con las dos últimas compras, costo promedio y precio por lista y unidad.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_price_update_dto_1.QueryPriceUpdateDto, Object]),
    __metadata("design:returntype", void 0)
], PriceUpdatesController.prototype, "getSheet", null);
__decorate([
    (0, common_1.Patch)('products/:productId'),
    (0, require_permissions_decorator_1.RequirePermission)(price_updates_constants_1.PRICE_UPDATE_ENTITY_CODE, 'Update'),
    (0, swagger_1.ApiOperation)({
        summary: 'Guardar costo promedio o precios de un producto',
        description: 'Si llega el costo promedio, recalcula las listas que tienen margen. Los precios enviados se guardan tal cual.',
    }),
    __param(0, (0, common_1.Param)('productId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_price_update_row_dto_1.UpdatePriceUpdateRowDto, Object]),
    __metadata("design:returntype", void 0)
], PriceUpdatesController.prototype, "updateRow", null);
exports.PriceUpdatesController = PriceUpdatesController = __decorate([
    (0, swagger_1.ApiTags)('Actualización de precio'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/price-updates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [price_updates_service_1.PriceUpdatesService])
], PriceUpdatesController);
//# sourceMappingURL=price-updates.controller.js.map