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
exports.EmployeePortalController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const employee_portal_service_1 = require("./employee-portal.service");
const update_my_profile_dto_1 = require("./dto/update-my-profile.dto");
const create_leave_request_dto_1 = require("../employees/dto/create-leave-request.dto");
const query_leave_request_dto_1 = require("../employees/dto/query-leave-request.dto");
const employee_portal_constants_1 = require("./employee-portal.constants");
let EmployeePortalController = class EmployeePortalController {
    service;
    tenantContext;
    constructor(service, tenantContext) {
        this.service = service;
        this.tenantContext = tenantContext;
    }
    getMyProfile() {
        return this.service.getMyProfile(this.getTenantId(), this.getUserId());
    }
    updateMyProfile(dto) {
        return this.service.updateMyProfile(this.getTenantId(), this.getUserId(), dto);
    }
    uploadMyPhoto(file) {
        return this.service.uploadMyPhoto(this.getTenantId(), this.getUserId(), file);
    }
    getMyLeaveRequests(query) {
        return this.service.getMyLeaveRequests(this.getTenantId(), this.getUserId(), query);
    }
    createMyLeaveRequest(dto) {
        return this.service.createMyLeaveRequest(this.getTenantId(), this.getUserId(), dto);
    }
    cancelMyLeaveRequest(requestId) {
        return this.service.cancelMyLeaveRequest(this.getTenantId(), this.getUserId(), requestId);
    }
    getTenantId() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return tenantId;
    }
    getUserId() {
        const userId = this.tenantContext.getCurrentUserId();
        if (!userId) {
            throw new Error('User context is required');
        }
        return userId;
    }
};
exports.EmployeePortalController = EmployeePortalController;
__decorate([
    (0, common_1.Get)('me'),
    (0, require_permissions_decorator_1.RequirePermission)(employee_portal_constants_1.EMPLOYEE_PORTAL_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Ver mi información de empleado (puesto, foto, nómina, vacaciones)' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'La cuenta no es de tipo empleado' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmployeePortalController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Put)('me'),
    (0, require_permissions_decorator_1.RequirePermission)(employee_portal_constants_1.EMPLOYEE_PORTAL_ENTITY_CODE, 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar mi nombre, teléfono o contraseña' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_my_profile_dto_1.UpdateMyProfileDto]),
    __metadata("design:returntype", void 0)
], EmployeePortalController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Post)('me/photo'),
    (0, require_permissions_decorator_1.RequirePermission)(employee_portal_constants_1.EMPLOYEE_PORTAL_ENTITY_CODE, 'Update'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Subir/actualizar mi foto' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmployeePortalController.prototype, "uploadMyPhoto", null);
__decorate([
    (0, common_1.Get)('me/leave-requests'),
    (0, require_permissions_decorator_1.RequirePermission)(employee_portal_constants_1.EMPLOYEE_PORTAL_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Ver mis solicitudes de vacaciones/faltas' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_leave_request_dto_1.QueryLeaveRequestDto]),
    __metadata("design:returntype", void 0)
], EmployeePortalController.prototype, "getMyLeaveRequests", null);
__decorate([
    (0, common_1.Post)('me/leave-requests'),
    (0, require_permissions_decorator_1.RequirePermission)(employee_portal_constants_1.EMPLOYEE_PORTAL_ENTITY_CODE, 'RequestLeave'),
    (0, swagger_1.ApiOperation)({ summary: 'Solicitar vacaciones o reportar una falta/permiso' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_leave_request_dto_1.CreateLeaveRequestDto]),
    __metadata("design:returntype", void 0)
], EmployeePortalController.prototype, "createMyLeaveRequest", null);
__decorate([
    (0, common_1.Put)('me/leave-requests/:requestId/cancel'),
    (0, require_permissions_decorator_1.RequirePermission)(employee_portal_constants_1.EMPLOYEE_PORTAL_ENTITY_CODE, 'RequestLeave'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar una de mis solicitudes pendientes' }),
    (0, swagger_1.ApiParam)({ name: 'requestId', type: 'string' }),
    __param(0, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeePortalController.prototype, "cancelMyLeaveRequest", null);
exports.EmployeePortalController = EmployeePortalController = __decorate([
    (0, swagger_1.ApiTags)('Employee Portal'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/employee-portal'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [employee_portal_service_1.EmployeePortalService,
        tenant_context_service_1.TenantContextService])
], EmployeePortalController);
//# sourceMappingURL=employee-portal.controller.js.map