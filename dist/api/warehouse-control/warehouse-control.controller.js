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
exports.WarehouseControlController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const tenant_module_validation_guard_1 = require("../auth/tenant-module-validation.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const warehouse_control_service_1 = require("./warehouse-control.service");
const query_control_desk_board_dto_1 = require("./dto/query-control-desk-board.dto");
const assign_position_dto_1 = require("./dto/assign-position.dto");
const complete_pick_task_dto_1 = require("./dto/complete-pick-task.dto");
const corroborate_sales_order_dto_1 = require("./dto/corroborate-sales-order.dto");
const create_control_desk_position_dto_1 = require("./dto/create-control-desk-position.dto");
const update_control_desk_position_dto_1 = require("./dto/update-control-desk-position.dto");
const query_control_desk_positions_dto_1 = require("./dto/query-control-desk-positions.dto");
let WarehouseControlController = class WarehouseControlController {
    service;
    constructor(service) {
        this.service = service;
    }
    getBoard(query, req) {
        return this.service.getBoard(req.user.tenant_id, this.actor(req), query);
    }
    getStats(query, req) {
        return this.service.getStats(req.user.tenant_id, this.actor(req), query);
    }
    listPositions(query, req) {
        return this.service.listPositions(req.user.tenant_id, query);
    }
    createPosition(dto, req) {
        return this.service.createPosition(req.user.tenant_id, dto);
    }
    updatePosition(positionId, dto, req) {
        return this.service.updatePosition(positionId, req.user.tenant_id, dto);
    }
    deletePosition(positionId, req) {
        return this.service.deletePosition(positionId, req.user.tenant_id);
    }
    findOne(jobId, req) {
        return this.service.findOneJob(jobId, req.user.tenant_id, this.actor(req));
    }
    assignPosition(jobId, dto, req) {
        return this.service.assignPosition(jobId, dto, req.user.tenant_id, this.actor(req));
    }
    startTask(jobId, taskId, req) {
        return this.service.startTask(jobId, taskId, req.user.tenant_id, this.actor(req));
    }
    completeTask(jobId, taskId, dto, req) {
        return this.service.completeTask(jobId, taskId, dto, req.user.tenant_id, this.actor(req));
    }
    assemble(jobId, req) {
        return this.service.assemble(jobId, req.user.tenant_id, this.actor(req));
    }
    corroborate(jobId, dto, req) {
        return this.service.corroborate(jobId, dto, req.user.tenant_id, this.actor(req));
    }
    actor(req) {
        return {
            userId: req.user.id,
            hasAdminRole: Boolean(req.user.hasAdminRole),
        };
    }
};
exports.WarehouseControlController = WarehouseControlController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Tablero Mesa de Control (KPIs, mapa, cola)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_control_desk_board_dto_1.QueryControlDeskBoardDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "getBoard", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Conteos de Mesa de Control' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_control_desk_board_dto_1.QueryControlDeskBoardDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('positions'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Catálogo de posiciones de piso' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_control_desk_positions_dto_1.QueryControlDeskPositionsDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "listPositions", null);
__decorate([
    (0, common_1.Post)('positions'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Crear posición de piso' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_control_desk_position_dto_1.CreateControlDeskPositionDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "createPosition", null);
__decorate([
    (0, common_1.Put)('positions/:positionId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Editar posición de piso' }),
    __param(0, (0, common_1.Param)('positionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_control_desk_position_dto_1.UpdateControlDeskPositionDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "updatePosition", null);
__decorate([
    (0, common_1.Delete)('positions/:positionId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar posición de piso' }),
    __param(0, (0, common_1.Param)('positionId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "deletePosition", null);
__decorate([
    (0, common_1.Get)(':jobId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de job / OV en Mesa de Control' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':jobId/assign-position'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Asignar posición de piso (o la siguiente libre)' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_position_dto_1.AssignPositionDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "assignPosition", null);
__decorate([
    (0, common_1.Post)(':jobId/tasks/:taskId/start'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Iniciar picking de un almacén' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "startTask", null);
__decorate([
    (0, common_1.Post)(':jobId/tasks/:taskId/complete'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Cerrar picking de un almacén (FIFO de ese almacén)' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, complete_pick_task_dto_1.CompletePickTaskDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "completeTask", null);
__decorate([
    (0, common_1.Post)(':jobId/assemble'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar armando / armada' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "assemble", null);
__decorate([
    (0, common_1.Post)(':jobId/corroborate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'WarehouseControl', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Corroborar armado → Lista para entrega' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, corroborate_sales_order_dto_1.CorroborateSalesOrderDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseControlController.prototype, "corroborate", null);
exports.WarehouseControlController = WarehouseControlController = __decorate([
    (0, swagger_1.ApiTags)('Mesa de Control'),
    (0, common_1.Controller)('tenant/warehouse-control'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_module_validation_guard_1.TenantModuleValidationGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [warehouse_control_service_1.WarehouseControlService])
], WarehouseControlController);
//# sourceMappingURL=warehouse-control.controller.js.map