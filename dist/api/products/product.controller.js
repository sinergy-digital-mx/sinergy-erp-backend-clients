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
exports.ProductController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const product_service_1 = require("./product.service");
const products_export_service_1 = require("./services/products-export.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const query_product_dto_1 = require("./dto/query-product.dto");
const query_product_export_dto_1 = require("./dto/query-product-export.dto");
const paginated_product_dto_1 = require("./dto/paginated-product.dto");
const toggle_status_dto_1 = require("./dto/toggle-status.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let ProductController = class ProductController {
    productService;
    productsExportService;
    constructor(productService, productsExportService) {
        this.productService = productService;
        this.productsExportService = productsExportService;
    }
    create(dto, req) {
        return this.productService.create(dto, req.user.tenant_id);
    }
    findAll(query, req) {
        return this.productService.findAll(query, req.user.tenant_id);
    }
    async exportExcel(query, req, res) {
        const buffer = await this.productsExportService.exportCatalog(req.user.tenant_id, query);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.productsExportService.getFilename()}"`);
        res.send(buffer);
    }
    findOne(id, req) {
        return this.productService.findOne(id, req.user.tenant_id);
    }
    update(id, dto, req) {
        return this.productService.update(id, dto, req.user.tenant_id);
    }
    toggleStatus(id, dto, req) {
        return this.productService.toggleStatus(id, dto, req.user.tenant_id);
    }
    remove(id, req) {
        return this.productService.remove(id, req.user.tenant_id);
    }
    uploadPhoto(id, file, req) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return this.productService.uploadPhoto(id, req.user.tenant_id, file);
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Create'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear nuevo producto' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Producto creado exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'El SKU ya existe' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar productos' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: paginated_product_dto_1.PaginatedProductDto }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_product_dto_1.QueryProductDto, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('export/excel'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Export'),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar Excel del catálogo de productos' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Archivo Excel generado' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_product_export_dto_1.QueryProductExportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "exportExcel", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener producto por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Producto encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Producto no encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Producto actualizado exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Producto no encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_dto_1.UpdateProductDto, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Cambiar estado activo/inactivo del producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estado actualizado exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Producto no encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, toggle_status_dto_1.ToggleStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "toggleStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Producto eliminado exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Producto no encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/photo'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({ summary: 'Subir foto del producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Foto subida exitosamente' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "uploadPhoto", null);
exports.ProductController = ProductController = __decorate([
    (0, swagger_1.ApiTags)('Products'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [product_service_1.ProductService,
        products_export_service_1.ProductsExportService])
], ProductController);
//# sourceMappingURL=product.controller.js.map