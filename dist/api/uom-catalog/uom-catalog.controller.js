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
exports.UoMCatalogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const uom_catalog_service_1 = require("./uom-catalog.service");
const create_uom_catalog_dto_1 = require("./dto/create-uom-catalog.dto");
const update_uom_catalog_dto_1 = require("./dto/update-uom-catalog.dto");
const query_uom_catalog_dto_1 = require("./dto/query-uom-catalog.dto");
const paginated_uom_catalog_dto_1 = require("./dto/paginated-uom-catalog.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let UoMCatalogController = class UoMCatalogController {
    uomCatalogService;
    constructor(uomCatalogService) {
        this.uomCatalogService = uomCatalogService;
    }
    create(dto, req) {
        return this.uomCatalogService.create(dto, req.user.tenant_id);
    }
    findAll(query, req) {
        return this.uomCatalogService.findAll(query, req.user.tenant_id);
    }
    findOne(id, req) {
        return this.uomCatalogService.findOne(id, req.user.tenant_id);
    }
    update(id, dto, req) {
        return this.uomCatalogService.update(id, dto, req.user.tenant_id);
    }
    remove(id, req) {
        return this.uomCatalogService.remove(id, req.user.tenant_id);
    }
};
exports.UoMCatalogController = UoMCatalogController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermission)('UoMCatalog', 'Create'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear nueva unidad de medida' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'UoM creada exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'El código ya existe' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_uom_catalog_dto_1.CreateUoMCatalogDto, Object]),
    __metadata("design:returntype", void 0)
], UoMCatalogController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)('UoMCatalog', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar unidades de medida' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: paginated_uom_catalog_dto_1.PaginatedUoMCatalogDto }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_uom_catalog_dto_1.QueryUoMCatalogDto, Object]),
    __metadata("design:returntype", void 0)
], UoMCatalogController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('UoMCatalog', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener unidad de medida por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'UoM encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'UoM no encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UoMCatalogController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('UoMCatalog', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar unidad de medida' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'UoM actualizada exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'UoM no encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_uom_catalog_dto_1.UpdateUoMCatalogDto, Object]),
    __metadata("design:returntype", void 0)
], UoMCatalogController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('UoMCatalog', 'Delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar unidad de medida' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'UoM eliminada exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'UoM no encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UoMCatalogController.prototype, "remove", null);
exports.UoMCatalogController = UoMCatalogController = __decorate([
    (0, swagger_1.ApiTags)('UoM Catalog'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('uom-catalog'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [uom_catalog_service_1.UoMCatalogService])
], UoMCatalogController);
//# sourceMappingURL=uom-catalog.controller.js.map