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
exports.ProductAttributeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const product_attribute_service_1 = require("./product-attribute.service");
const create_product_attribute_dto_1 = require("./dto/create-product-attribute.dto");
const update_product_attribute_dto_1 = require("./dto/update-product-attribute.dto");
const query_product_attribute_dto_1 = require("./dto/query-product-attribute.dto");
const create_product_attribute_value_dto_1 = require("./dto/create-product-attribute-value.dto");
const update_product_attribute_value_dto_1 = require("./dto/update-product-attribute-value.dto");
let ProductAttributeController = class ProductAttributeController {
    productAttributeService;
    constructor(productAttributeService) {
        this.productAttributeService = productAttributeService;
    }
    createAttribute(dto, req) {
        return this.productAttributeService.createAttribute(dto, req.user.tenant_id);
    }
    findAllAttributes(query, req) {
        return this.productAttributeService.findAllAttributes(query, req.user.tenant_id);
    }
    findOptions(req) {
        return this.productAttributeService.findOptions(req.user.tenant_id);
    }
    findAttributeById(attributeId, req) {
        return this.productAttributeService.findAttributeById(attributeId, req.user.tenant_id);
    }
    updateAttribute(attributeId, dto, req) {
        return this.productAttributeService.updateAttribute(attributeId, dto, req.user.tenant_id);
    }
    removeAttribute(attributeId, req) {
        return this.productAttributeService.removeAttribute(attributeId, req.user.tenant_id);
    }
    createValue(attributeId, dto, req) {
        return this.productAttributeService.createValue(attributeId, dto, req.user.tenant_id);
    }
    findAllValues(attributeId, req) {
        return this.productAttributeService.findAllValues(attributeId, req.user.tenant_id);
    }
    updateValue(attributeId, valueId, dto, req) {
        return this.productAttributeService.updateValue(valueId, attributeId, dto, req.user.tenant_id);
    }
    removeValue(attributeId, valueId, req) {
        return this.productAttributeService.removeValue(valueId, attributeId, req.user.tenant_id);
    }
};
exports.ProductAttributeController = ProductAttributeController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Create'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear atributo de catálogo' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Atributo creado exitosamente' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_attribute_dto_1.CreateProductAttributeDto, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeController.prototype, "createAttribute", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar atributos de producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de atributos' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_product_attribute_dto_1.QueryProductAttributeDto, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeController.prototype, "findAllAttributes", null);
__decorate([
    (0, common_1.Get)('options'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Catálogo activo con valores (para selector en producto)',
        description: 'Sin paginación. Solo atributos y valores activos. No son asignaciones de un producto.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Opciones de catálogo' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeController.prototype, "findOptions", null);
__decorate([
    (0, common_1.Get)(':attributeId'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener atributo por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Atributo encontrado' }),
    __param(0, (0, common_1.Param)('attributeId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeController.prototype, "findAttributeById", null);
__decorate([
    (0, common_1.Patch)(':attributeId'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar atributo de producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Atributo actualizado' }),
    __param(0, (0, common_1.Param)('attributeId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_attribute_dto_1.UpdateProductAttributeDto, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeController.prototype, "updateAttribute", null);
__decorate([
    (0, common_1.Delete)(':attributeId'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar atributo de producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Atributo eliminado' }),
    __param(0, (0, common_1.Param)('attributeId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeController.prototype, "removeAttribute", null);
__decorate([
    (0, common_1.Post)(':attributeId/values'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear valor para un atributo' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Valor creado' }),
    __param(0, (0, common_1.Param)('attributeId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_product_attribute_value_dto_1.CreateProductAttributeValueDto, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeController.prototype, "createValue", null);
__decorate([
    (0, common_1.Get)(':attributeId/values'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar valores de un atributo' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de valores' }),
    __param(0, (0, common_1.Param)('attributeId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeController.prototype, "findAllValues", null);
__decorate([
    (0, common_1.Patch)(':attributeId/values/:valueId'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar valor de atributo' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Valor actualizado' }),
    __param(0, (0, common_1.Param)('attributeId')),
    __param(1, (0, common_1.Param)('valueId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_product_attribute_value_dto_1.UpdateProductAttributeValueDto, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeController.prototype, "updateValue", null);
__decorate([
    (0, common_1.Delete)(':attributeId/values/:valueId'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar valor de atributo' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Valor eliminado' }),
    __param(0, (0, common_1.Param)('attributeId')),
    __param(1, (0, common_1.Param)('valueId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeController.prototype, "removeValue", null);
exports.ProductAttributeController = ProductAttributeController = __decorate([
    (0, swagger_1.ApiTags)('Product Attributes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/products/attributes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [product_attribute_service_1.ProductAttributeService])
], ProductAttributeController);
//# sourceMappingURL=product-attribute.controller.js.map