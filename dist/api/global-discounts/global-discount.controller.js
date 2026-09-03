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
exports.GlobalDiscountController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const global_discount_service_1 = require("./global-discount.service");
const create_global_discount_dto_1 = require("./dto/create-global-discount.dto");
const update_global_discount_dto_1 = require("./dto/update-global-discount.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let GlobalDiscountController = class GlobalDiscountController {
    globalDiscountService;
    constructor(globalDiscountService) {
        this.globalDiscountService = globalDiscountService;
    }
    findApplicable(req) {
        return this.globalDiscountService.findApplicable(req.user.tenant_id);
    }
    create(dto, req) {
        return this.globalDiscountService.create(dto, req.user.tenant_id);
    }
    findAll(req) {
        return this.globalDiscountService.findAll(req.user.tenant_id);
    }
    findOne(id, req) {
        return this.globalDiscountService.findOne(id, req.user.tenant_id);
    }
    update(id, dto, req) {
        return this.globalDiscountService.update(id, dto, req.user.tenant_id);
    }
    remove(id, req) {
        return this.globalDiscountService.remove(id, req.user.tenant_id);
    }
};
exports.GlobalDiscountController = GlobalDiscountController;
__decorate([
    (0, common_1.Get)('applicable'),
    (0, require_permissions_decorator_1.RequirePermission)('GlobalDiscount', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar descuentos globales aplicables en venta/POS' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Descuentos activos y vigentes' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GlobalDiscountController.prototype, "findApplicable", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermission)('GlobalDiscount', 'Create'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear descuento global' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Descuento global creado' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_global_discount_dto_1.CreateGlobalDiscountDto, Object]),
    __metadata("design:returntype", void 0)
], GlobalDiscountController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)('GlobalDiscount', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar descuentos globales' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Descuentos globales obtenidos' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GlobalDiscountController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('GlobalDiscount', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener descuento global' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Descuento global encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GlobalDiscountController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('GlobalDiscount', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar descuento global' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Descuento global actualizado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_global_discount_dto_1.UpdateGlobalDiscountDto, Object]),
    __metadata("design:returntype", void 0)
], GlobalDiscountController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('GlobalDiscount', 'Delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar descuento global' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Descuento global eliminado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GlobalDiscountController.prototype, "remove", null);
exports.GlobalDiscountController = GlobalDiscountController = __decorate([
    (0, swagger_1.ApiTags)('Global Discounts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/global-discounts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [global_discount_service_1.GlobalDiscountService])
], GlobalDiscountController);
//# sourceMappingURL=global-discount.controller.js.map