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
exports.ElectronicInvoiceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const electronic_invoice_service_1 = require("./services/electronic-invoice.service");
const electronic_invoice_sat_sync_service_1 = require("./services/electronic-invoice-sat-sync.service");
const dto_1 = require("./dto");
let ElectronicInvoiceController = class ElectronicInvoiceController {
    invoiceService;
    syncService;
    constructor(invoiceService, syncService) {
        this.invoiceService = invoiceService;
        this.syncService = syncService;
    }
    stamp(dto, req) {
        return this.invoiceService.stamp(req.user.tenantId, req.user.id, dto);
    }
    findAll(query, req) {
        return this.invoiceService.findAll(req.user.tenantId, query);
    }
    syncStatus(req) {
        return this.syncService.getSyncStatus(req.user.tenantId);
    }
    syncBatch(req) {
        return this.syncService.syncTenantBatch(req.user.tenantId, req.user.id);
    }
    getPdf(id, regenerate, preview, req) {
        return this.invoiceService.getPdfDownload(id, req.user.tenantId, regenerate === 'true' || regenerate === '1', preview === 'true' || preview === '1');
    }
    async getXml(id, req, res) {
        const { xml, fileName } = await this.invoiceService.getXmlDownload(id, req.user.tenantId);
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(xml);
    }
    findOne(id, req) {
        return this.invoiceService.findOne(id, req.user.tenantId);
    }
    cancel(id, dto, req) {
        return this.invoiceService.cancel(id, req.user.tenantId, req.user.id, dto);
    }
    syncSat(id, req) {
        return this.invoiceService.syncSatStatus(id, req.user.tenantId, req.user.id, 'manual');
    }
};
exports.ElectronicInvoiceController = ElectronicInvoiceController;
__decorate([
    (0, common_1.Post)('stamp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'electronic_invoices', action: 'Stamp' }),
    (0, swagger_1.ApiOperation)({ summary: 'Timbrar XML vía Finkok Sign_Stamp' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.StampElectronicInvoiceDto, Object]),
    __metadata("design:returntype", void 0)
], ElectronicInvoiceController.prototype, "stamp", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'electronic_invoices', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Listar facturas electrónicas' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryElectronicInvoiceDto, Object]),
    __metadata("design:returntype", void 0)
], ElectronicInvoiceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('sync-status'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'electronic_invoices', action: 'SyncSat' }),
    (0, swagger_1.ApiOperation)({ summary: 'Estado de sincronización SAT del cliente' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ElectronicInvoiceController.prototype, "syncStatus", null);
__decorate([
    (0, common_1.Post)('sync-batch'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'electronic_invoices', action: 'SyncSat' }),
    (0, swagger_1.ApiOperation)({ summary: 'Ejecutar lote manual de sync SAT para el cliente' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ElectronicInvoiceController.prototype, "syncBatch", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'electronic_invoices', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener URL firmada del PDF CFDI' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('regenerate')),
    __param(2, (0, common_1.Query)('preview')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ElectronicInvoiceController.prototype, "getPdf", null);
__decorate([
    (0, common_1.Get)(':id/xml'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'electronic_invoices', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar XML CFDI timbrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ElectronicInvoiceController.prototype, "getXml", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'electronic_invoices', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de factura electrónica' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ElectronicInvoiceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'electronic_invoices', action: 'Cancel' }),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar CFDI vía Finkok Sign_Cancel' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CancelElectronicInvoiceDto, Object]),
    __metadata("design:returntype", void 0)
], ElectronicInvoiceController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/sync-sat'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'electronic_invoices', action: 'SyncSat' }),
    (0, swagger_1.ApiOperation)({ summary: 'Sincronizar estatus SAT de una factura' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ElectronicInvoiceController.prototype, "syncSat", null);
exports.ElectronicInvoiceController = ElectronicInvoiceController = __decorate([
    (0, swagger_1.ApiTags)('Electronic Invoicing'),
    (0, common_1.Controller)('tenant/electronic-invoices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [electronic_invoice_service_1.ElectronicInvoiceService,
        electronic_invoice_sat_sync_service_1.ElectronicInvoiceSatSyncService])
], ElectronicInvoiceController);
//# sourceMappingURL=electronic-invoice.controller.js.map