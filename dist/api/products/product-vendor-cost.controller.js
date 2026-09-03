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
exports.ProductVendorCostController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const product_vendor_cost_service_1 = require("./product-vendor-cost.service");
const create_product_vendor_cost_dto_1 = require("./dto/create-product-vendor-cost.dto");
const update_product_vendor_cost_dto_1 = require("./dto/update-product-vendor-cost.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let ProductVendorCostController = class ProductVendorCostController {
    productVendorCostService;
    constructor(productVendorCostService) {
        this.productVendorCostService = productVendorCostService;
    }
    create(productId, dto, req) {
        return this.productVendorCostService.create(productId, dto, req.user.tenant_id);
    }
    findAll(productId, req) {
        return this.productVendorCostService.findAll(productId, req.user.tenant_id);
    }
    findOne(productId, id, req) {
        return this.productVendorCostService.findOne(id, productId, req.user.tenant_id);
    }
    update(productId, id, dto, req) {
        return this.productVendorCostService.update(id, productId, dto, req.user.tenant_id);
    }
    remove(productId, id, req) {
        return this.productVendorCostService.remove(id, productId, req.user.tenant_id);
    }
};
exports.ProductVendorCostController = ProductVendorCostController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Agregar costo de proveedor al producto' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Costo agregado' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_product_vendor_cost_dto_1.CreateProductVendorCostDto, Object]),
    __metadata("design:returntype", void 0)
], ProductVendorCostController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar costos de proveedores del producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Costos obtenidos' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductVendorCostController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener costo específico' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Costo encontrado' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductVendorCostController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar costo de proveedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Costo actualizado' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_product_vendor_cost_dto_1.UpdateProductVendorCostDto, Object]),
    __metadata("design:returntype", void 0)
], ProductVendorCostController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar costo de proveedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Costo eliminado' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductVendorCostController.prototype, "remove", null);
exports.ProductVendorCostController = ProductVendorCostController = __decorate([
    (0, swagger_1.ApiTags)('Product Vendor Costs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/products/:productId/vendor-costs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [product_vendor_cost_service_1.ProductVendorCostService])
], ProductVendorCostController);
//# sourceMappingURL=product-vendor-cost.controller.js.map