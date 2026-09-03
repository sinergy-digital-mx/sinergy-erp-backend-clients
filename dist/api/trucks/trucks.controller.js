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
exports.TrucksController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const trucks_service_1 = require("./trucks.service");
const create_truck_dto_1 = require("./dto/create-truck.dto");
const update_truck_dto_1 = require("./dto/update-truck.dto");
const query_truck_dto_1 = require("./dto/query-truck.dto");
let TrucksController = class TrucksController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto, req) {
        return this.service.create(dto, req.user.tenant_id);
    }
    findAll(query, req) {
        return this.service.findAll(req.user.tenant_id, query);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user.tenant_id);
    }
    update(id, dto, req) {
        return this.service.update(id, dto, req.user.tenant_id);
    }
    uploadPhoto(id, file, req) {
        if (!file) {
            throw new common_1.BadRequestException('No se envió ningún archivo');
        }
        return this.service.uploadPhoto(id, req.user.tenant_id, file);
    }
    remove(id, req) {
        return this.service.deactivate(id, req.user.tenant_id);
    }
};
exports.TrucksController = TrucksController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Truck', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Crear camión' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_truck_dto_1.CreateTruckDto, Object]),
    __metadata("design:returntype", void 0)
], TrucksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Truck', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Listar camiones' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_truck_dto_1.QueryTruckDto, Object]),
    __metadata("design:returntype", void 0)
], TrucksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Truck', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de camión' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TrucksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Truck', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar camión' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_truck_dto_1.UpdateTruckDto, Object]),
    __metadata("design:returntype", void 0)
], TrucksController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/photo'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Truck', action: 'Update' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Subir foto del camión' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TrucksController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Truck', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Desactivar camión (baja lógica)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TrucksController.prototype, "remove", null);
exports.TrucksController = TrucksController = __decorate([
    (0, swagger_1.ApiTags)('Trucks'),
    (0, common_1.Controller)('tenant/trucks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [trucks_service_1.TrucksService])
], TrucksController);
//# sourceMappingURL=trucks.controller.js.map