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
exports.InventoryAuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const add_inventory_audit_line_dto_1 = require("./dto/add-inventory-audit-line.dto");
const authorize_inventory_audit_dto_1 = require("./dto/authorize-inventory-audit.dto");
const cancel_inventory_audit_dto_1 = require("./dto/cancel-inventory-audit.dto");
const create_inventory_audit_dto_1 = require("./dto/create-inventory-audit.dto");
const inventory_audit_context_query_dto_1 = require("./dto/inventory-audit-context-query.dto");
const inventory_audit_response_dto_1 = require("./dto/inventory-audit-response.dto");
const query_inventory_audit_dto_1 = require("./dto/query-inventory-audit.dto");
const reject_inventory_audit_dto_1 = require("./dto/reject-inventory-audit.dto");
const update_inventory_audit_lines_dto_1 = require("./dto/update-inventory-audit-lines.dto");
const inventory_audit_service_1 = require("./services/inventory-audit.service");
let InventoryAuditController = class InventoryAuditController {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    getContext(query, req) {
        return this.auditService.getContext(req.user.tenant_id, query.warehouse_id, query.product_id);
    }
    findAll(filters, req) {
        return this.auditService.findAll(req.user.tenant_id, filters);
    }
    findOne(id, req) {
        return this.auditService.findById(id, req.user.tenant_id);
    }
    create(dto, req) {
        return this.auditService.create(dto, req.user.tenant_id, req.user.id);
    }
    updateLines(id, dto, req) {
        return this.auditService.updateLines(id, dto, req.user.tenant_id, req.user.id);
    }
    addLine(id, dto, req) {
        return this.auditService.addLine(id, dto, req.user.tenant_id);
    }
    submit(id, req) {
        return this.auditService.submit(id, req.user.tenant_id, req.user.id);
    }
    authorize(id, dto, req) {
        return this.auditService.authorize(id, dto, req.user.tenant_id, req.user.id);
    }
    reject(id, dto, req) {
        return this.auditService.reject(id, dto, req.user.tenant_id, req.user.id);
    }
    cancel(id, dto, req) {
        return this.auditService.cancel(id, dto, req.user.tenant_id, req.user.id);
    }
};
exports.InventoryAuditController = InventoryAuditController;
__decorate([
    (0, common_1.Get)('context'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Count' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Contexto para iniciar un conteo',
        description: 'Lotes del almacén, ubicación y si ya hay una auditoría abierta. Requiere Inventory:Count.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_audit_response_dto_1.InventoryAuditContextResponseDto }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_audit_context_query_dto_1.InventoryAuditContextQueryDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryAuditController.prototype, "getContext", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Listar auditorías de inventario por lote' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_audit_response_dto_1.InventoryAuditListResponseDto }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_inventory_audit_dto_1.QueryInventoryAuditDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryAuditController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de una auditoría con líneas por lote' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_audit_response_dto_1.InventoryAuditResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryAuditController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Count' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear auditoría (snapshot de lotes)',
        description: 'Congela la existencia de cada lote del almacén (o de un producto) y deja el documento en borrador.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, type: inventory_audit_response_dto_1.InventoryAuditResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_inventory_audit_dto_1.CreateInventoryAuditDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryAuditController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/lines'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Count' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Capturar cantidades contadas',
        description: 'Solo en borrador. El motivo es obligatorio si hay diferencia al enviar.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_audit_response_dto_1.InventoryAuditResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_inventory_audit_lines_dto_1.UpdateInventoryAuditLinesDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryAuditController.prototype, "updateLines", null);
__decorate([
    (0, common_1.Post)(':id/lines'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Count' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Agregar un lote extra al conteo',
        description: 'Útil para lotes en cero que no entraron al snapshot. Solo en borrador.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 201, type: inventory_audit_response_dto_1.InventoryAuditResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_inventory_audit_line_dto_1.AddInventoryAuditLineDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryAuditController.prototype, "addLine", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Count' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Enviar a autorización',
        description: 'Todas las líneas deben estar contadas. Diferencias requieren motivo.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_audit_response_dto_1.InventoryAuditResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryAuditController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/authorize'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Authorize' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Autorizar y aplicar corrección',
        description: 'Pone available_quantity de cada lote igual a la cantidad contada. Requiere Inventory:Authorize.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_audit_response_dto_1.InventoryAuditResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, authorize_inventory_audit_dto_1.AuthorizeInventoryAuditDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryAuditController.prototype, "authorize", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Authorize' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Rechazar auditoría',
        description: 'Vuelve a borrador para recapturar. Requiere Inventory:Authorize.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_audit_response_dto_1.InventoryAuditResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_inventory_audit_dto_1.RejectInventoryAuditDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryAuditController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Count' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancelar auditoría',
        description: 'No aplica correcciones. Solo borrador o en revisión.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_audit_response_dto_1.InventoryAuditResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cancel_inventory_audit_dto_1.CancelInventoryAuditDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryAuditController.prototype, "cancel", null);
exports.InventoryAuditController = InventoryAuditController = __decorate([
    (0, common_1.Controller)('tenant/inventory/audits'),
    (0, swagger_1.ApiTags)('Inventory Audits'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [inventory_audit_service_1.InventoryAuditService])
], InventoryAuditController);
//# sourceMappingURL=inventory-audit.controller.js.map