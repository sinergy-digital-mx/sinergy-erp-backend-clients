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
exports.GoalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const goals_service_1 = require("./goals.service");
const create_sales_goal_dto_1 = require("./dto/create-sales-goal.dto");
const update_goals_settings_dto_1 = require("./dto/update-goals-settings.dto");
let GoalsController = class GoalsController {
    goalsService;
    constructor(goalsService) {
        this.goalsService = goalsService;
    }
    getSettings(req) {
        return this.goalsService.getSettings(req.user.tenant_id);
    }
    updateSettings(dto, req) {
        return this.goalsService.updateSettings(req.user.tenant_id, dto, req.user.id);
    }
    findAll(query, req) {
        return this.goalsService.findAll(req.user.tenant_id, query);
    }
    findOne(id, req) {
        return this.goalsService.findOne(id, req.user.tenant_id);
    }
    create(dto, req) {
        return this.goalsService.create(dto, req.user.tenant_id, req.user.id);
    }
    update(id, dto, req) {
        return this.goalsService.update(id, dto, req.user.tenant_id);
    }
    remove(id, req) {
        return this.goalsService.remove(id, req.user.tenant_id);
    }
};
exports.GoalsController = GoalsController;
__decorate([
    (0, common_1.Get)('settings'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Goals', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Configuración de metas (comisión activa %)',
        description: 'Comisión por tenant usada en el reporte de ventas Zona Norte.',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)('settings'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Goals', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar comisión activa (%)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_goals_settings_dto_1.UpdateGoalsSettingsDto, Object]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Goals', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Listar metas de ventas' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sales_goal_dto_1.QuerySalesGoalsDto, Object]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Goals', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de una meta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Goals', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Crear meta de ventas' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sales_goal_dto_1.CreateSalesGoalDto, Object]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Goals', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar meta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_sales_goal_dto_1.UpdateSalesGoalDto, Object]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Goals', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar meta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "remove", null);
exports.GoalsController = GoalsController = __decorate([
    (0, swagger_1.ApiTags)('Goals'),
    (0, common_1.Controller)('tenant/goals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [goals_service_1.GoalsService])
], GoalsController);
//# sourceMappingURL=goals.controller.js.map