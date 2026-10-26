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
exports.SystemVersionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const query_system_versions_dto_1 = require("./dto/query-system-versions.dto");
const system_versions_service_1 = require("./system-versions.service");
let SystemVersionsController = class SystemVersionsController {
    systemVersionsService;
    constructor(systemVersionsService) {
        this.systemVersionsService = systemVersionsService;
    }
    findLatest(req) {
        return this.systemVersionsService.findLatest(this.getTenantId(req));
    }
    findAll(query, req) {
        return this.systemVersionsService.findAll(this.getTenantId(req), query);
    }
    getTenantId(req) {
        const tenantId = req.user?.tenant_id ?? req.user?.tenantId;
        if (!tenantId) {
            throw new common_1.ForbiddenException('Tenant no disponible en la sesión');
        }
        return tenantId;
    }
};
exports.SystemVersionsController = SystemVersionsController;
__decorate([
    (0, common_1.Get)('latest'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'system-versions', action: 'Read' }, { entityType: 'system-versions', action: 'ViewMenu' }),
    (0, swagger_1.ApiOperation)({ summary: 'Última versión publicada para la organización actual' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Última versión, o null si todavía no hay' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'El módulo no está habilitado para el tenant' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SystemVersionsController.prototype, "findLatest", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'system-versions', action: 'Read' }, { entityType: 'system-versions', action: 'ViewMenu' }),
    (0, swagger_1.ApiOperation)({ summary: 'Historial de versiones de la organización actual' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listado paginado de versiones del tenant' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'El módulo no está habilitado para el tenant' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_system_versions_dto_1.QuerySystemVersionsDto, Object]),
    __metadata("design:returntype", void 0)
], SystemVersionsController.prototype, "findAll", null);
exports.SystemVersionsController = SystemVersionsController = __decorate([
    (0, swagger_1.ApiTags)('Versiones'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/system-versions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [system_versions_service_1.SystemVersionsService])
], SystemVersionsController);
//# sourceMappingURL=system-versions.controller.js.map