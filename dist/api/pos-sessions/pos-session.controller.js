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
exports.PosSessionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pos_session_service_1 = require("./pos-session.service");
const open_pos_session_dto_1 = require("./dto/open-pos-session.dto");
const close_pos_session_dto_1 = require("./dto/close-pos-session.dto");
const query_pos_session_dto_1 = require("./dto/query-pos-session.dto");
const paginated_pos_session_dto_1 = require("./dto/paginated-pos-session.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let PosSessionController = class PosSessionController {
    posSessionService;
    constructor(posSessionService) {
        this.posSessionService = posSessionService;
    }
    openSession(dto, req) {
        return this.posSessionService.openSession(dto, req.user.id, req.user.tenant_id);
    }
    closeSession(id, dto, req) {
        return this.posSessionService.closeSession(id, dto, req.user.id, req.user.tenant_id);
    }
    findAll(query, req) {
        return this.posSessionService.findAll(query, req.user.tenant_id);
    }
    getCurrentSession(posConfigId, req) {
        return this.posSessionService.getCurrentOpenSession(posConfigId, req.user.tenant_id);
    }
    findOne(id, req) {
        return this.posSessionService.findOne(id, req.user.tenant_id);
    }
};
exports.PosSessionController = PosSessionController;
__decorate([
    (0, common_1.Post)('open'),
    (0, require_permissions_decorator_1.RequirePermission)('PosSession', 'Create'),
    (0, swagger_1.ApiOperation)({ summary: 'Open a new POS session' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Session opened successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Ya existe una sesión abierta para este POS' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [open_pos_session_dto_1.OpenPosSessionDto, Object]),
    __metadata("design:returntype", void 0)
], PosSessionController.prototype, "openSession", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    (0, require_permissions_decorator_1.RequirePermission)('PosSession', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Close an open POS session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session closed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sesión no encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'La sesión no está abierta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, close_pos_session_dto_1.ClosePosSessionDto, Object]),
    __metadata("design:returntype", void 0)
], PosSessionController.prototype, "closeSession", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)('PosSession', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'List POS sessions' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: paginated_pos_session_dto_1.PaginatedPosSessionDto }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_pos_session_dto_1.QueryPosSessionDto, Object]),
    __metadata("design:returntype", void 0)
], PosSessionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('current/:posConfigId'),
    (0, require_permissions_decorator_1.RequirePermission)('PosSession', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current open session for a POS configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current open session' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No hay sesión abierta' }),
    __param(0, (0, common_1.Param)('posConfigId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PosSessionController.prototype, "getCurrentSession", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('PosSession', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get POS session by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sesión no encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PosSessionController.prototype, "findOne", null);
exports.PosSessionController = PosSessionController = __decorate([
    (0, swagger_1.ApiTags)('POS Sessions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/pos-sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [pos_session_service_1.PosSessionService])
], PosSessionController);
//# sourceMappingURL=pos-session.controller.js.map