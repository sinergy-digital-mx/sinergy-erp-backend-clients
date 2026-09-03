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
exports.ProductUoMController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const product_uom_service_1 = require("./product-uom.service");
const create_product_uom_dto_1 = require("./dto/create-product-uom.dto");
const update_product_uom_dto_1 = require("./dto/update-product-uom.dto");
const query_uom_catalog_dto_1 = require("../uom-catalog/dto/query-uom-catalog.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let ProductUoMController = class ProductUoMController {
    productUoMService;
    constructor(productUoMService) {
        this.productUoMService = productUoMService;
    }
    create(productId, dto, req) {
        return this.productUoMService.create(productId, dto, req.user.tenant_id);
    }
    findAll(productId, req) {
        return this.productUoMService.findAll(productId, req.user.tenant_id);
    }
    findCatalog(productId, query, req) {
        return this.productUoMService.findCatalogForProduct(productId, query, req.user.tenant_id);
    }
    findOne(productId, id, req) {
        return this.productUoMService.findOne(id, productId, req.user.tenant_id);
    }
    update(productId, id, dto, req) {
        return this.productUoMService.update(id, productId, dto, req.user.tenant_id);
    }
    remove(productId, id, req) {
        return this.productUoMService.remove(id, productId, req.user.tenant_id);
    }
};
exports.ProductUoMController = ProductUoMController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Agregar UoM a producto' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'UoM agregada exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'UoM ya existe para este producto' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_product_uom_dto_1.CreateProductUoMDto, Object]),
    __metadata("design:returntype", void 0)
], ProductUoMController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar UoMs del producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de UoMs' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductUoMController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('catalog'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Catálogo UoM del tenant (para asignar al producto)',
        description: 'Misma respuesta que GET /api/uom-catalog. Debe declararse antes de GET :id para no confundir "catalog" con un UUID.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listado paginado del catálogo UoM' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_uom_catalog_dto_1.QueryUoMCatalogDto, Object]),
    __metadata("design:returntype", void 0)
], ProductUoMController.prototype, "findCatalog", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener UoM específica' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'UoM encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'UoM no encontrada' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductUoMController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar UoM del producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'UoM actualizada exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'UoM no encontrada' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_product_uom_dto_1.UpdateProductUoMDto, Object]),
    __metadata("design:returntype", void 0)
], ProductUoMController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar UoM del producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'UoM eliminada exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'No se puede eliminar UoM base' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'UoM no encontrada' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductUoMController.prototype, "remove", null);
exports.ProductUoMController = ProductUoMController = __decorate([
    (0, swagger_1.ApiTags)('Product UoMs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/products/:productId/uoms'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [product_uom_service_1.ProductUoMService])
], ProductUoMController);
//# sourceMappingURL=product-uom.controller.js.map