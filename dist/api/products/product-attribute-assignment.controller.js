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
exports.ProductAttributeAssignmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const product_attribute_assignment_service_1 = require("./product-attribute-assignment.service");
const assign_product_attribute_value_dto_1 = require("./dto/assign-product-attribute-value.dto");
const replace_product_attribute_assignments_dto_1 = require("./dto/replace-product-attribute-assignments.dto");
let ProductAttributeAssignmentController = class ProductAttributeAssignmentController {
    assignmentService;
    constructor(assignmentService) {
        this.assignmentService = assignmentService;
    }
    findAll(productId, req) {
        return this.assignmentService.findAll(productId, req.user.tenant_id);
    }
    replaceAll(productId, dto, req) {
        return this.assignmentService.replaceAll(productId, dto, req.user.tenant_id);
    }
    assign(productId, dto, req) {
        return this.assignmentService.assign(productId, dto, req.user.tenant_id);
    }
    remove(productId, assignmentId, req) {
        return this.assignmentService.remove(assignmentId, productId, req.user.tenant_id);
    }
};
exports.ProductAttributeAssignmentController = ProductAttributeAssignmentController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar atributos asignados a este producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Atributos del producto, agrupados' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeAssignmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Put)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Reemplazar atributos asignados al producto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Asignaciones actualizadas' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, replace_product_attribute_assignments_dto_1.ReplaceProductAttributeAssignmentsDto, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeAssignmentController.prototype, "replaceAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Asignar un valor de catálogo al producto' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Valor asignado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'El valor ya está asignado' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_product_attribute_value_dto_1.AssignProductAttributeValueDto, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeAssignmentController.prototype, "assign", null);
__decorate([
    (0, common_1.Delete)(':assignmentId'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Quitar un valor asignado (no borra el catálogo)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Asignación eliminada' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('assignmentId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductAttributeAssignmentController.prototype, "remove", null);
exports.ProductAttributeAssignmentController = ProductAttributeAssignmentController = __decorate([
    (0, swagger_1.ApiTags)('Product Attribute Assignments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/products/:productId/attributes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [product_attribute_assignment_service_1.ProductAttributeAssignmentService])
], ProductAttributeAssignmentController);
//# sourceMappingURL=product-attribute-assignment.controller.js.map