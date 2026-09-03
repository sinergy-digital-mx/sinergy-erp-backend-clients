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
exports.ProductPriceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const product_price_service_1 = require("./product-price.service");
const create_product_price_dto_1 = require("./dto/create-product-price.dto");
const update_product_price_dto_1 = require("./dto/update-product-price.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let ProductPriceController = class ProductPriceController {
    productPriceService;
    constructor(productPriceService) {
        this.productPriceService = productPriceService;
    }
    create(productId, dto, req) {
        return this.productPriceService.create(productId, dto, req.user.tenant_id);
    }
    findAll(productId, req) {
        return this.productPriceService.findAll(productId, req.user.tenant_id);
    }
    findOne(productId, id, req) {
        return this.productPriceService.findOne(id, productId, req.user.tenant_id);
    }
    update(productId, id, dto, req) {
        return this.productPriceService.update(id, productId, dto, req.user.tenant_id);
    }
    remove(productId, id, req) {
        return this.productPriceService.remove(id, productId, req.user.tenant_id);
    }
};
exports.ProductPriceController = ProductPriceController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Agregar precio al producto' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Precio agregado' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_product_price_dto_1.CreateProductPriceDto, Object]),
    __metadata("design:returntype", void 0)
], ProductPriceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar precios del producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Precios obtenidos' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductPriceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener precio específico' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Precio encontrado' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductPriceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar precio' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Precio actualizado' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_product_price_dto_1.UpdateProductPriceDto, Object]),
    __metadata("design:returntype", void 0)
], ProductPriceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar precio' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Precio eliminado' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductPriceController.prototype, "remove", null);
exports.ProductPriceController = ProductPriceController = __decorate([
    (0, swagger_1.ApiTags)('Product Prices'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/products/:productId/prices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [product_price_service_1.ProductPriceService])
], ProductPriceController);
//# sourceMappingURL=product-price.controller.js.map