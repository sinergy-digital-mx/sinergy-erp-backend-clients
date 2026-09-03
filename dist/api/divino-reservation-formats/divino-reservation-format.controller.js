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
exports.DivinoReservationFormatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const divino_reservation_format_service_1 = require("./divino-reservation-format.service");
const create_divino_reservation_format_dto_1 = require("./dto/create-divino-reservation-format.dto");
const update_divino_reservation_format_dto_1 = require("./dto/update-divino-reservation-format.dto");
const query_divino_reservation_format_dto_1 = require("./dto/query-divino-reservation-format.dto");
const send_divino_reservation_format_dto_1 = require("./dto/send-divino-reservation-format.dto");
const divino_reservation_formats_constants_1 = require("./divino-reservation-formats.constants");
let DivinoReservationFormatController = class DivinoReservationFormatController {
    service;
    tenantContext;
    constructor(service, tenantContext) {
        this.service = service;
        this.tenantContext = tenantContext;
    }
    create(dto) {
        return this.service.create(this.getTenantId(), dto, this.tenantContext.getCurrentUserId());
    }
    findAll(query) {
        return this.service.findAll(this.getTenantId(), query);
    }
    findOne(id) {
        return this.service.findOne(this.getTenantId(), id);
    }
    async generatePdf(id, res) {
        const buffer = await this.service.generatePdf(this.getTenantId(), id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="formato-reservacion-${id}.pdf"`);
        res.send(buffer);
    }
    send(id, dto) {
        return this.service.send(this.getTenantId(), id, dto, this.tenantContext.getCurrentUserId());
    }
    update(id, dto) {
        return this.service.update(this.getTenantId(), id, dto);
    }
    async remove(id) {
        await this.service.remove(this.getTenantId(), id);
        return { success: true };
    }
    getTenantId() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return tenantId;
    }
};
exports.DivinoReservationFormatController = DivinoReservationFormatController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermission)(divino_reservation_formats_constants_1.DIVINO_RESERVATION_ENTITY_CODE, 'Create'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un nuevo formato de reservación Divino' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Formato creado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_divino_reservation_format_dto_1.CreateDivinoReservationFormatDto]),
    __metadata("design:returntype", void 0)
], DivinoReservationFormatController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)(divino_reservation_formats_constants_1.DIVINO_RESERVATION_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar formatos de reservación con búsqueda y paginación',
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_divino_reservation_format_dto_1.QueryDivinoReservationFormatDto]),
    __metadata("design:returntype", void 0)
], DivinoReservationFormatController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)(divino_reservation_formats_constants_1.DIVINO_RESERVATION_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener un formato de reservación por ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DivinoReservationFormatController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, require_permissions_decorator_1.RequirePermission)(divino_reservation_formats_constants_1.DIVINO_RESERVATION_ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Generar el PDF del formato de reservación' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Response)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DivinoReservationFormatController.prototype, "generatePdf", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, require_permissions_decorator_1.RequirePermission)(divino_reservation_formats_constants_1.DIVINO_RESERVATION_ENTITY_CODE, 'Send'),
    (0, swagger_1.ApiOperation)({
        summary: 'Enviar el formato de reservación por correo con el PDF adjunto',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_divino_reservation_format_dto_1.SendDivinoReservationFormatDto]),
    __metadata("design:returntype", void 0)
], DivinoReservationFormatController.prototype, "send", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)(divino_reservation_formats_constants_1.DIVINO_RESERVATION_ENTITY_CODE, 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar un formato de reservación' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_divino_reservation_format_dto_1.UpdateDivinoReservationFormatDto]),
    __metadata("design:returntype", void 0)
], DivinoReservationFormatController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)(divino_reservation_formats_constants_1.DIVINO_RESERVATION_ENTITY_CODE, 'Delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar un formato de reservación' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DivinoReservationFormatController.prototype, "remove", null);
exports.DivinoReservationFormatController = DivinoReservationFormatController = __decorate([
    (0, swagger_1.ApiTags)('Divino Reservation Formats'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/divino-reservation-formats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [divino_reservation_format_service_1.DivinoReservationFormatService,
        tenant_context_service_1.TenantContextService])
], DivinoReservationFormatController);
//# sourceMappingURL=divino-reservation-format.controller.js.map