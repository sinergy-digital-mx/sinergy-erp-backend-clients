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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const query_stock_replenishment_dto_1 = require("./dto/query-stock-replenishment.dto");
const reports_constants_1 = require("./reports.constants");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    listVendors(req) {
        return this.reportsService.listVendors(req.user.tenant_id);
    }
    getStockReplenishment(query, req) {
        return this.reportsService.getStockReplenishment(req.user.tenant_id, query);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('stock-replenishment/vendors'),
    (0, require_permissions_decorator_1.RequirePermission)(reports_constants_1.REPORTS_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Proveedores con productos para el reporte de existencias',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "listVendors", null);
__decorate([
    (0, common_1.Get)('stock-replenishment'),
    (0, require_permissions_decorator_1.RequirePermission)(reports_constants_1.REPORTS_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Existencias por proveedor con pronóstico de compra',
        description: 'Por razón social trae los productos del proveedor, existencia y venta por sucursal, y una cantidad recomendada a comprar.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_stock_replenishment_dto_1.QueryStockReplenishmentDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getStockReplenishment", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('Reportes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map