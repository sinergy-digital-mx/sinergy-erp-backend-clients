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
exports.InventoryTransferController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const inventory_transfer_service_1 = require("./services/inventory-transfer.service");
const inventory_transfer_pdf_service_1 = require("./services/inventory-transfer-pdf.service");
const create_inventory_transfer_dto_1 = require("./dto/create-inventory-transfer.dto");
const query_inventory_transfer_dto_1 = require("./dto/query-inventory-transfer.dto");
const transfer_context_query_dto_1 = require("./dto/transfer-context-query.dto");
const inventory_transfer_response_dto_1 = require("./dto/inventory-transfer-response.dto");
const transfer_context_response_dto_1 = require("./dto/transfer-context-response.dto");
let InventoryTransferController = class InventoryTransferController {
    transferService;
    transferPdfService;
    constructor(transferService, transferPdfService) {
        this.transferService = transferService;
        this.transferPdfService = transferPdfService;
    }
    getContext(query, req) {
        return this.transferService.getTransferContext(req.user.tenant_id, query.product_id, query.warehouse_id);
    }
    findAll(filters, req) {
        return this.transferService.findAll(req.user.tenant_id, filters);
    }
    async downloadPdf(id, req, res) {
        const { buffer, filename } = await this.transferPdfService.generatePdf(id, req.user.tenant_id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    }
    findOne(id, req) {
        return this.transferService.findById(id, req.user.tenant_id);
    }
    create(dto, req) {
        return this.transferService.create(dto, req.user.tenant_id, req.user.id);
    }
};
exports.InventoryTransferController = InventoryTransferController;
__decorate([
    (0, common_1.Get)('context'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Transfer' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Contexto para modal de transferencia',
        description: 'Lotes disponibles, origen (razón social + sucursal + almacén) y árbol destino en cascada. Requiere Inventory:Transfer.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: transfer_context_response_dto_1.TransferContextResponseDto }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transfer_context_query_dto_1.TransferContextQueryDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryTransferController.prototype, "getContext", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Listar transferencias de inventario' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_transfer_response_dto_1.InventoryTransferListResponseDto }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_inventory_transfer_dto_1.QueryInventoryTransferDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryTransferController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Descargar PDF de transferencia',
        description: 'Comprobante PDF con folio, usuario, fecha, ruta origen→destino, producto y líneas de lotes',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiProduces)('application/pdf'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'PDF generado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryTransferController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de una transferencia' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_transfer_response_dto_1.InventoryTransferResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryTransferController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Inventory', action: 'Transfer' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear transferencia de inventario',
        description: 'Toma cantidad de uno o más lotes en almacén origen y crea lotes destino. Requiere Inventory:Transfer (no Write genérico).',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, type: inventory_transfer_response_dto_1.InventoryTransferResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_inventory_transfer_dto_1.CreateInventoryTransferDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryTransferController.prototype, "create", null);
exports.InventoryTransferController = InventoryTransferController = __decorate([
    (0, common_1.Controller)('tenant/inventory/transfers'),
    (0, swagger_1.ApiTags)('Inventory Transfers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [inventory_transfer_service_1.InventoryTransferService,
        inventory_transfer_pdf_service_1.InventoryTransferPdfService])
], InventoryTransferController);
//# sourceMappingURL=inventory-transfer.controller.js.map