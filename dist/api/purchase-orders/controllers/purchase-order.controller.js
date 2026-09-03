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
exports.PurchaseOrderController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const tenant_module_validation_guard_1 = require("../../auth/tenant-module-validation.guard");
const purchase_order_service_1 = require("../services/purchase-order.service");
const purchase_order_documents_service_1 = require("../services/purchase-order-documents.service");
const purchase_order_export_service_1 = require("../services/purchase-order-export.service");
const purchase_order_movements_service_1 = require("../services/purchase-order-movements.service");
const dto_1 = require("../dto");
let PurchaseOrderController = class PurchaseOrderController {
    purchaseOrderService;
    documentsService;
    exportService;
    movementsService;
    constructor(purchaseOrderService, documentsService, exportService, movementsService) {
        this.purchaseOrderService = purchaseOrderService;
        this.documentsService = documentsService;
        this.exportService = exportService;
        this.movementsService = movementsService;
    }
    async create(dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.create(dto, tenantId, userId);
    }
    async findAll(filters, req) {
        const tenantId = req.user.tenant_id;
        return this.purchaseOrderService.findAll(tenantId, filters);
    }
    async exportHeadersExcel(filters, req, res) {
        const buffer = await this.exportService.exportHeaders(req.user.tenant_id, filters);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.exportService.getHeadersFilename()}"`);
        res.send(buffer);
    }
    async exportDetailsExcel(filters, req, res) {
        const buffer = await this.exportService.exportDetails(req.user.tenant_id, filters);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.exportService.getDetailsFilename(filters.created_from, filters.created_to)}"`);
        res.send(buffer);
    }
    async receive(id, dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.receive(id, dto, tenantId, userId);
    }
    async addLineItem(id, dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.addLineItem(id, dto, tenantId, userId);
    }
    async getPayments(id, req) {
        const tenantId = req.user.tenant_id;
        return this.purchaseOrderService.getPayments(id, tenantId);
    }
    async getMovements(id, req) {
        const tenantId = req.user.tenant_id;
        return this.movementsService.list(id, tenantId);
    }
    async createPayment(id, dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.createPayment(id, dto, tenantId, userId);
    }
    async deletePayment(id, paymentId, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.deletePayment(id, paymentId, tenantId, userId);
    }
    async regenerateDocumentoOriginal(id, dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.regenerateDocumentoOriginal(id, tenantId, userId, dto.language, dto.keep_previous ?? false);
    }
    async regenerateRecepcion(id, dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.regenerateRecepcionDocument(id, tenantId, userId, dto.language, dto.keep_previous ?? false);
    }
    async updateLineItem(orderId, lineItemId, dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.updateLineItem(orderId, lineItemId, dto, tenantId, userId);
    }
    async removeLineItem(orderId, lineItemId, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.removeLineItem(orderId, lineItemId, tenantId, userId);
    }
    async updateNotes(id, dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.updateNotes(id, dto, tenantId, userId);
    }
    async updatePedimento(id, dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.updatePedimento(id, dto, tenantId, userId);
    }
    async updateRealCost(id, dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.updateRealCost(id, dto, tenantId, userId);
    }
    async replacePurchaseOrderPut(id, dto, req) {
        return this.runReplacePurchaseOrder(id, dto, req);
    }
    async replacePurchaseOrderPatch(id, dto, req) {
        return this.runReplacePurchaseOrder(id, dto, req);
    }
    runReplacePurchaseOrder(id, dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.replacePurchaseOrder(id, dto, tenantId, userId);
    }
    async cancel(id, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.purchaseOrderService.cancel(id, tenantId, userId);
    }
    async findOne(id, req) {
        const tenantId = req.user.tenant_id;
        const purchaseOrder = await this.purchaseOrderService.findOne(id, tenantId);
        const paymentData = await this.purchaseOrderService.getPayments(id, tenantId);
        const documents = await this.documentsService.getDocuments(id);
        const movements = await this.movementsService.list(id, tenantId);
        return {
            data: {
                header: purchaseOrder,
                products: purchaseOrder.line_items || [],
                batches: purchaseOrder.batches || [],
                batches_summary: purchaseOrder.batches_summary ?? {
                    received_lots: 0,
                    migrated_lots: 0,
                    received_quantity: '0.000',
                    remaining_on_received_lots: '0.000',
                    remaining_total: '0.000',
                    migrated_quantity: '0.000',
                    amount_total: 0,
                },
                documents: documents,
                payments: paymentData.payments,
                payments_summary: paymentData.summary,
                movements: movements.data,
                movements_count: movements.total,
            },
        };
    }
};
exports.PurchaseOrderController = PurchaseOrderController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePurchaseOrderDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryPurchaseOrderDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('export/excel/headers'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryPurchaseOrderHeaderExportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "exportHeadersExcel", null);
__decorate([
    (0, common_1.Get)('export/excel/details'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryPurchaseOrderDetailExportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "exportDetailsExcel", null);
__decorate([
    (0, common_1.Post)(':id/receive'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ReceivePurchaseOrderDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "receive", null);
__decorate([
    (0, common_1.Post)(':id/line-items'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateLineItemDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "addLineItem", null);
__decorate([
    (0, common_1.Get)(':id/payments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Get)(':id/movements'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "getMovements", null);
__decorate([
    (0, common_1.Post)(':id/payments'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreatePurchaseOrderPaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Delete)(':id/payments/:paymentId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "deletePayment", null);
__decorate([
    (0, common_1.Post)(':id/regenerate-documento-original'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.RegenerateDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "regenerateDocumentoOriginal", null);
__decorate([
    (0, common_1.Post)(':id/regenerate-recepcion'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.RegenerateDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "regenerateRecepcion", null);
__decorate([
    (0, common_1.Patch)(':orderId/line-items/:lineItemId'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Param)('lineItemId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateLineItemDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "updateLineItem", null);
__decorate([
    (0, common_1.Delete)(':orderId/line-items/:lineItemId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Param)('lineItemId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "removeLineItem", null);
__decorate([
    (0, common_1.Patch)(':id/notes'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePurchaseOrderNotesDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "updateNotes", null);
__decorate([
    (0, common_1.Patch)(':id/pedimento'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePurchaseOrderPedimentoDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "updatePedimento", null);
__decorate([
    (0, common_1.Put)(':id/real-cost'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePurchaseOrderRealCostDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "updateRealCost", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreatePurchaseOrderDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "replacePurchaseOrderPut", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreatePurchaseOrderDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "replacePurchaseOrderPatch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderController.prototype, "findOne", null);
exports.PurchaseOrderController = PurchaseOrderController = __decorate([
    (0, common_1.Controller)('tenant/purchase-orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_module_validation_guard_1.TenantModuleValidationGuard),
    __metadata("design:paramtypes", [purchase_order_service_1.PurchaseOrderService,
        purchase_order_documents_service_1.PurchaseOrderDocumentsService,
        purchase_order_export_service_1.PurchaseOrderExportService,
        purchase_order_movements_service_1.PurchaseOrderMovementsService])
], PurchaseOrderController);
//# sourceMappingURL=purchase-order.controller.js.map