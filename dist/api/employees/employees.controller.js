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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const employees_service_1 = require("./employees.service");
const employee_leave_service_1 = require("./employee-leave.service");
const create_employee_dto_1 = require("./dto/create-employee.dto");
const update_employee_dto_1 = require("./dto/update-employee.dto");
const query_employee_dto_1 = require("./dto/query-employee.dto");
const create_leave_request_dto_1 = require("./dto/create-leave-request.dto");
const review_leave_request_dto_1 = require("./dto/review-leave-request.dto");
const update_leave_request_dto_1 = require("./dto/update-leave-request.dto");
const query_leave_request_dto_1 = require("./dto/query-leave-request.dto");
const employees_constants_1 = require("./employees.constants");
let EmployeesController = class EmployeesController {
    employeesService;
    leaveService;
    tenantContext;
    constructor(employeesService, leaveService, tenantContext) {
        this.employeesService = employeesService;
        this.leaveService = leaveService;
        this.tenantContext = tenantContext;
    }
    create(dto) {
        return this.employeesService.create(this.getTenantId(), dto);
    }
    findAll(query) {
        return this.employeesService.findAll(this.getTenantId(), query);
    }
    findOne(id) {
        return this.employeesService.findOne(this.getTenantId(), id);
    }
    update(id, dto) {
        return this.employeesService.update(this.getTenantId(), id, dto);
    }
    async remove(id) {
        await this.employeesService.remove(this.getTenantId(), id);
        return { success: true };
    }
    uploadPhoto(id, file) {
        return this.employeesService.uploadPhoto(this.getTenantId(), id, file);
    }
    findAllLeaveRequests(query) {
        return this.leaveService.findAll(this.getTenantId(), query);
    }
    findEmployeeLeaveRequests(id, query) {
        return this.leaveService.findAllByEmployee(this.getTenantId(), id, query);
    }
    createLeaveRequest(id, dto) {
        return this.leaveService.create(this.getTenantId(), id, dto, this.tenantContext.getCurrentUserId());
    }
    updateLeaveRequest(requestId, dto) {
        return this.leaveService.update(this.getTenantId(), requestId, dto);
    }
    reviewLeaveRequest(requestId, dto) {
        return this.leaveService.review(this.getTenantId(), requestId, dto, this.tenantContext.getCurrentUserId());
    }
    cancelLeaveRequest(requestId) {
        return this.leaveService.cancel(this.getTenantId(), requestId);
    }
    getTenantId() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return tenantId;
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Create'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear perfil de empleado ligado a un usuario' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Empleado creado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_employee_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar empleados con búsqueda, filtros y vacaciones' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'department', required: false, type: String }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_employee_dto_1.QueryEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle del empleado (nómina, vacaciones, solicitudes)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar datos de RH/nómina del empleado' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_employee_dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar el perfil de empleado' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/photo'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Update'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Subir/actualizar la foto del empleado' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.Get)('leave-requests/all'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas las solicitudes de la organización' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_leave_request_dto_1.QueryLeaveRequestDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findAllLeaveRequests", null);
__decorate([
    (0, common_1.Get)(':id/leave-requests'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar solicitudes de un empleado' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_leave_request_dto_1.QueryLeaveRequestDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findEmployeeLeaveRequests", null);
__decorate([
    (0, common_1.Post)(':id/leave-requests'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar una solicitud a nombre de un empleado' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_leave_request_dto_1.CreateLeaveRequestDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "createLeaveRequest", null);
__decorate([
    (0, common_1.Put)('leave-requests/:requestId'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'Update'),
    (0, swagger_1.ApiOperation)({
        summary: 'Corregir fechas o días de una solicitud (p. ej. hábiles vs naturales)',
    }),
    (0, swagger_1.ApiParam)({ name: 'requestId', type: 'string' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_leave_request_dto_1.UpdateLeaveRequestDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "updateLeaveRequest", null);
__decorate([
    (0, common_1.Put)('leave-requests/:requestId/review'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'ManageLeave'),
    (0, swagger_1.ApiOperation)({ summary: 'Aprobar o rechazar una solicitud' }),
    (0, swagger_1.ApiParam)({ name: 'requestId', type: 'string' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_leave_request_dto_1.ReviewLeaveRequestDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "reviewLeaveRequest", null);
__decorate([
    (0, common_1.Put)('leave-requests/:requestId/cancel'),
    (0, require_permissions_decorator_1.RequirePermission)(employees_constants_1.EMPLOYEES_ENTITY_CODE, 'ManageLeave'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar una solicitud pendiente' }),
    (0, swagger_1.ApiParam)({ name: 'requestId', type: 'string' }),
    __param(0, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "cancelLeaveRequest", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, swagger_1.ApiTags)('Employees'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/employees'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService,
        employee_leave_service_1.EmployeeLeaveService,
        tenant_context_service_1.TenantContextService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map