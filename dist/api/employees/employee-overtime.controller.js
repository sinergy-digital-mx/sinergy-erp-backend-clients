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
exports.EmployeeOvertimeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const permission_service_1 = require("../rbac/services/permission.service");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const create_overtime_request_dto_1 = require("./dto/create-overtime-request.dto");
const preview_overtime_request_dto_1 = require("./dto/preview-overtime-request.dto");
const query_overtime_request_dto_1 = require("./dto/query-overtime-request.dto");
const review_overtime_request_dto_1 = require("./dto/review-overtime-request.dto");
const update_overtime_request_dto_1 = require("./dto/update-overtime-request.dto");
const upsert_overtime_policy_dto_1 = require("./dto/upsert-overtime-policy.dto");
const employee_overtime_service_1 = require("./employee-overtime.service");
const employees_constants_1 = require("./employees.constants");
const employees_service_1 = require("./employees.service");
let EmployeeOvertimeController = class EmployeeOvertimeController {
    overtimeService;
    employeesService;
    tenantContext;
    permissionService;
    constructor(overtimeService, employeesService, tenantContext, permissionService) {
        this.overtimeService = overtimeService;
        this.employeesService = employeesService;
        this.tenantContext = tenantContext;
        this.permissionService = permissionService;
    }
    getPolicy() {
        return this.overtimeService.getPolicy(this.getTenantId());
    }
    upsertPolicy(dto) {
        return this.overtimeService.upsertPolicy(this.getTenantId(), dto);
    }
    findAll(query) {
        return this.overtimeService.findAll(this.getTenantId(), query);
    }
    preview(requestId, query) {
        return this.overtimeService.preview(this.getTenantId(), requestId, query.approved_hours);
    }
    async update(requestId, dto) {
        const ownerEmployeeId = await this.ownerEmployeeIdUnlessCanUpdate();
        return this.overtimeService.update(this.getTenantId(), requestId, dto, ownerEmployeeId);
    }
    review(requestId, dto) {
        return this.overtimeService.review(this.getTenantId(), requestId, dto, this.tenantContext.getCurrentUserId());
    }
    markPaid(requestId) {
        return this.overtimeService.markPaid(this.getTenantId(), requestId, this.tenantContext.getCurrentUserId());
    }
    async findByEmployee(id, query) {
        const scope = await this.getScope();
        await this.employeesService.assertAccessible(scope.tenantId, id, scope);
        return this.overtimeService.findAllByEmployee(scope.tenantId, id, query);
    }
    async create(id, dto) {
        const scope = await this.getScope();
        await this.employeesService.assertAccessible(scope.tenantId, id, scope);
        return this.overtimeService.create(scope.tenantId, id, dto, this.tenantContext.getCurrentUserId());
    }
    getTenantId() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return tenantId;
    }
    async getScope() {
        const tenantId = this.getTenantId();
        const userId = this.tenantContext.getCurrentUserId();
        const seeAll = userId
            ? await this.permissionService.hasPermission(userId, tenantId, employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Read')
            : false;
        return { tenantId, userId, seeAll };
    }
    async ownerEmployeeIdUnlessCanUpdate() {
        const scope = await this.getScope();
        if (!scope.userId) {
            return '00000000-0000-0000-0000-000000000000';
        }
        const canUpdate = await this.permissionService.hasPermission(scope.userId, scope.tenantId, employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Update');
        if (canUpdate)
            return undefined;
        const own = await this.employeesService.findEntityByUser(scope.tenantId, scope.userId);
        return own?.id ?? '00000000-0000-0000-0000-000000000000';
    }
};
exports.EmployeeOvertimeController = EmployeeOvertimeController;
__decorate([
    (0, common_1.Get)('overtime/policy'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Reglas de pago de horas extras' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmployeeOvertimeController.prototype, "getPolicy", null);
__decorate([
    (0, common_1.Put)('overtime/policy'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Configurar las reglas de pago de horas extras' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_overtime_policy_dto_1.UpsertOvertimePolicyDto]),
    __metadata("design:returntype", void 0)
], EmployeeOvertimeController.prototype, "upsertPolicy", null);
__decorate([
    (0, common_1.Get)('overtime-requests/all'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar solicitudes de horas extras' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_overtime_request_dto_1.QueryOvertimeRequestDto]),
    __metadata("design:returntype", void 0)
], EmployeeOvertimeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('overtime-requests/:requestId/preview'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'ManageLeave'),
    (0, swagger_1.ApiOperation)({ summary: 'Calcular el importe antes de autorizar' }),
    (0, swagger_1.ApiParam)({ name: 'requestId', type: 'string' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, preview_overtime_request_dto_1.PreviewOvertimeRequestDto]),
    __metadata("design:returntype", void 0)
], EmployeeOvertimeController.prototype, "preview", null);
__decorate([
    (0, common_1.Put)('overtime-requests/:requestId'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: employees_constants_1.EMPLOYEES_ENTITY_CODE, action: 'Update' }, { entityType: employees_constants_1.EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' }),
    (0, swagger_1.ApiOperation)({ summary: 'Corregir una solicitud de horas extras pendiente' }),
    (0, swagger_1.ApiParam)({ name: 'requestId', type: 'string' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_overtime_request_dto_1.UpdateOvertimeRequestDto]),
    __metadata("design:returntype", Promise)
], EmployeeOvertimeController.prototype, "update", null);
__decorate([
    (0, common_1.Put)('overtime-requests/:requestId/review'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'ManageLeave'),
    (0, swagger_1.ApiOperation)({
        summary: 'Aprobar o rechazar horas extras. Se puede autorizar otro número de horas.',
    }),
    (0, swagger_1.ApiParam)({ name: 'requestId', type: 'string' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_overtime_request_dto_1.ReviewOvertimeRequestDto]),
    __metadata("design:returntype", void 0)
], EmployeeOvertimeController.prototype, "review", null);
__decorate([
    (0, common_1.Put)('overtime-requests/:requestId/pay'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'ManageLeave'),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar como pagadas las horas ya autorizadas' }),
    (0, swagger_1.ApiParam)({ name: 'requestId', type: 'string' }),
    __param(0, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeOvertimeController.prototype, "markPaid", null);
__decorate([
    (0, common_1.Get)(':id/overtime-requests'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: employees_constants_1.EMPLOYEES_ENTITY_CODE, action: 'Read' }, { entityType: employees_constants_1.EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' }),
    (0, swagger_1.ApiOperation)({ summary: 'Horas extras de un empleado' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_overtime_request_dto_1.QueryOvertimeRequestDto]),
    __metadata("design:returntype", Promise)
], EmployeeOvertimeController.prototype, "findByEmployee", null);
__decorate([
    (0, common_1.Post)(':id/overtime-requests'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: employees_constants_1.EMPLOYEES_ENTITY_CODE, action: 'Update' }, { entityType: employees_constants_1.EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' }),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar horas extras a nombre de un empleado' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_overtime_request_dto_1.CreateOvertimeRequestDto]),
    __metadata("design:returntype", Promise)
], EmployeeOvertimeController.prototype, "create", null);
exports.EmployeeOvertimeController = EmployeeOvertimeController = __decorate([
    (0, swagger_1.ApiTags)('Employees'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/employees'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [employee_overtime_service_1.EmployeeOvertimeService,
        employees_service_1.EmployeesService,
        tenant_context_service_1.TenantContextService,
        permission_service_1.PermissionService])
], EmployeeOvertimeController);
//# sourceMappingURL=employee-overtime.controller.js.map