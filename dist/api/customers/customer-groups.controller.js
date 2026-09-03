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
exports.CustomerGroupsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const customer_groups_service_1 = require("./customer-groups.service");
const create_customer_group_dto_1 = require("./dto/create-customer-group.dto");
const update_customer_group_dto_1 = require("./dto/update-customer-group.dto");
let CustomerGroupsController = class CustomerGroupsController {
    groupsService;
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    async create(dto, req) {
        return this.groupsService.create(dto, this.organizationId(req));
    }
    async findAll(req) {
        return this.groupsService.findAll(this.organizationId(req));
    }
    async findOne(id, req) {
        return this.groupsService.findOne(id, this.organizationId(req));
    }
    async update(id, dto, req) {
        return this.groupsService.update(id, dto, this.organizationId(req));
    }
    async remove(id, req) {
        return this.groupsService.remove(id, this.organizationId(req));
    }
    organizationId(req) {
        const organizationId = req.user?.tenantId ?? req.user?.tenant_id;
        if (!organizationId) {
            throw new common_1.UnauthorizedException('El contexto de la organización es obligatorio');
        }
        return organizationId;
    }
};
exports.CustomerGroupsController = CustomerGroupsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerGroup', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Crear grupo de clientes de esta organización' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Grupo creado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Nombre duplicado' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_customer_group_dto_1.CreateCustomerGroupDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerGroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerGroup', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Listar grupos de clientes de esta organización' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomerGroupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerGroup', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de un grupo de clientes' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'UUID del grupo' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'El grupo no existe' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerGroupsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerGroup', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar nombre o descripción del grupo' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'UUID del grupo' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_customer_group_dto_1.UpdateCustomerGroupDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerGroupsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerGroup', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar un grupo sin clientes asignados' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'UUID del grupo' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerGroupsController.prototype, "remove", null);
exports.CustomerGroupsController = CustomerGroupsController = __decorate([
    (0, swagger_1.ApiTags)('Customer Groups'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/customer-groups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [customer_groups_service_1.CustomerGroupsService])
], CustomerGroupsController);
//# sourceMappingURL=customer-groups.controller.js.map