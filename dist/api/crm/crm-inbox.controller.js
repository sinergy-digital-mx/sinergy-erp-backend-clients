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
exports.CrmInboxController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const query_crm_activity_dto_1 = require("./dto/query-crm-activity.dto");
const crm_inbox_service_1 = require("./services/crm-inbox.service");
let CrmInboxController = class CrmInboxController {
    crmInboxService;
    tenantContext;
    constructor(crmInboxService, tenantContext) {
        this.crmInboxService = crmInboxService;
        this.tenantContext = tenantContext;
    }
    findActivities(query, req) {
        return this.crmInboxService.list(this.requireTenantId(), req.user.sub, Boolean(req.user.hasAdminRole), query);
    }
    getStats(query, req) {
        return this.crmInboxService.stats(this.requireTenantId(), req.user.sub, Boolean(req.user.hasAdminRole), query);
    }
    getAuthors(req) {
        return this.crmInboxService.authors(this.requireTenantId(), req.user.sub, Boolean(req.user.hasAdminRole));
    }
    requireTenantId() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Se requiere contexto de organización');
        }
        return tenantId;
    }
};
exports.CrmInboxController = CrmInboxController;
__decorate([
    (0, common_1.Get)('activities'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Listado de actividades CRM (propias o de todos si es admin CRM)',
    }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'user_id', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'period', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'date_from', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'date_to', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'attention', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Actividades paginadas' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_crm_activity_dto_1.QueryCrmActivityDto, Object]),
    __metadata("design:returntype", void 0)
], CrmInboxController.prototype, "findActivities", null);
__decorate([
    (0, common_1.Get)('activities/stats'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Stats y pendientes del portal CRM' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Totales del periodo y pendientes' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_crm_activity_dto_1.QueryCrmActivityDto, Object]),
    __metadata("design:returntype", void 0)
], CrmInboxController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('activities/authors'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Vendedores que han creado al menos una actividad',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Autores con actividades' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CrmInboxController.prototype, "getAuthors", null);
exports.CrmInboxController = CrmInboxController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, common_1.Controller)('tenant/crm'),
    (0, swagger_1.ApiTags)('CRM'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [crm_inbox_service_1.CrmInboxService,
        tenant_context_service_1.TenantContextService])
], CrmInboxController);
//# sourceMappingURL=crm-inbox.controller.js.map