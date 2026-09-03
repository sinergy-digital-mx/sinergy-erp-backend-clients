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
exports.SalesOrderController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const tenant_module_validation_guard_1 = require("../../auth/tenant-module-validation.guard");
const sales_order_service_1 = require("../services/sales-order.service");
const sales_order_documents_service_1 = require("../services/sales-order-documents.service");
const sales_order_pos_receipt_service_1 = require("../services/sales-order-pos-receipt.service");
const sales_order_export_service_1 = require("../services/sales-order-export.service");
const sales_order_invoicing_service_1 = require("../services/sales-order-invoicing.service");
const shippings_service_1 = require("../../shippings/shippings.service");
const cancel_electronic_invoice_dto_1 = require("../../electronic-invoicing/dto/cancel-electronic-invoice.dto");
const stamp_sales_order_invoice_dto_1 = require("../dto/stamp-sales-order-invoice.dto");
const inventory_service_1 = require("../../inventory/inventory.service");
const dto_1 = require("../dto");
let SalesOrderController = class SalesOrderController {
    salesOrderService;
    documentsService;
    posReceiptService;
    inventoryService;
    exportService;
    invoicingService;
    shippingsService;
    constructor(salesOrderService, documentsService, posReceiptService, inventoryService, exportService, invoicingService, shippingsService) {
        this.salesOrderService = salesOrderService;
        this.documentsService = documentsService;
        this.posReceiptService = posReceiptService;
        this.inventoryService = inventoryService;
        this.exportService = exportService;
        this.invoicingService = invoicingService;
        this.shippingsService = shippingsService;
    }
    async create(dto, req) {
        return this.salesOrderService.create(dto, req.user.tenant_id, req.user.id);
    }
    async replace(id, dto, req) {
        return this.salesOrderService.replace(id, dto, req.user.tenant_id, req.user.id);
    }
    async addLineItem(id, dto, req) {
        await this.salesOrderService.addLineItem(id, dto, req.user.tenant_id, req.user.id);
        return this.findOne(id, req);
    }
    async updateLineItem(orderId, lineItemId, dto, req) {
        await this.salesOrderService.updateLineItem(orderId, lineItemId, dto, req.user.tenant_id, req.user.id);
        return this.findOne(orderId, req);
    }
    async removeLineItem(orderId, lineItemId, req) {
        await this.salesOrderService.removeLineItem(orderId, lineItemId, req.user.tenant_id, req.user.id);
        return this.findOne(orderId, req);
    }
    async updateNotes(id, dto, req) {
        return this.salesOrderService.updateNotes(id, dto, req.user.tenant_id, req.user.id);
    }
    async updateSeller(id, dto, req) {
        return this.salesOrderService.updateSeller(id, dto.seller_user_id, req.user.tenant_id, req.user.id);
    }
    async updateAssignedSeller(id, dto, req) {
        return this.salesOrderService.updateAssignedSeller(id, dto.assigned_seller_user_id, req.user.tenant_id, req.user.id);
    }
    async getPayments(id, req) {
        return this.salesOrderService.getPayments(id, req.user.tenant_id);
    }
    async createPayment(id, dto, req) {
        return this.salesOrderService.createPayment(id, dto, req.user.tenant_id, req.user.id, 'manual');
    }
    async deletePayment(id, paymentId, req) {
        return this.salesOrderService.deletePayment(id, paymentId, req.user.tenant_id, req.user.id);
    }
    async getPaymentDocuments(id, paymentId, req) {
        return this.salesOrderService.getPaymentDocuments(id, paymentId, req.user.tenant_id);
    }
    async uploadPaymentDocument(id, paymentId, file, notes, req) {
        if (!file) {
            throw new common_1.BadRequestException('El archivo es obligatorio');
        }
        const allowed = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/heic',
            'image/heif',
        ];
        if (!allowed.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Tipo no permitido. Use PDF, JPEG, PNG o HEIC');
        }
        if (file.size > 10 * 1024 * 1024) {
            throw new common_1.BadRequestException('El archivo no puede superar 10MB');
        }
        return this.salesOrderService.uploadPaymentDocument(id, paymentId, req.user.tenant_id, req.user.id, file, notes);
    }
    async deletePaymentDocument(id, paymentId, documentId, req) {
        return this.salesOrderService.deletePaymentDocument(id, paymentId, documentId, req.user.tenant_id);
    }
    async getInvoices(id, req) {
        return this.invoicingService.listInvoices(id, req.user.tenant_id);
    }
    async stampInvoice(id, dto, req) {
        return this.invoicingService.stampInvoice(id, req.user.tenant_id, req.user.id, dto);
    }
    async cancelInvoice(id, invoiceId, dto, req) {
        return this.invoicingService.cancelInvoice(id, invoiceId, req.user.tenant_id, req.user.id, dto);
    }
    async syncInvoiceSat(id, invoiceId, req) {
        return this.invoicingService.syncInvoiceSat(id, invoiceId, req.user.tenant_id, req.user.id);
    }
    async getInvoicePdf(id, invoiceId, regenerate, preview, req) {
        return this.invoicingService.getInvoicePdf(id, invoiceId, req.user.tenant_id, regenerate === 'true' || regenerate === '1', preview === 'true' || preview === '1');
    }
    async getInvoiceXml(id, invoiceId, req, res) {
        const { xml, fileName } = await this.invoicingService.getInvoiceXml(id, invoiceId, req.user.tenant_id);
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(xml);
    }
    async findAll(filters, req) {
        return this.salesOrderService.findAll(req.user.tenant_id, filters);
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
    async getProductsSummary(query, req) {
        return this.inventoryService.getBranchInventorySummary(req.user.tenant_id, query.billing_branch_id, {
            fiscal_configuration_id: query.fiscal_configuration_id,
            search: query.search,
            only_available: true,
            page: query.page ?? 1,
            limit: query.limit ?? 40,
        });
    }
    async getWarehouseProductsSummary(warehouseId, req) {
        return this.inventoryService.getInventorySummary(req.user.tenant_id, {
            warehouse_id: warehouseId,
            only_available: true,
            page: 1,
            limit: 500,
        });
    }
    async regenerateDocumentoOriginal(id, dto, req) {
        return this.salesOrderService.regenerateDocumentoOriginal(id, req.user.tenant_id, req.user.id, dto.language, dto.keep_previous ?? false);
    }
    async getTicketRecibo(id, req) {
        const receipt = await this.posReceiptService.reprintPosTicket(req.user.tenant_id, id);
        return {
            success: true,
            message: 'Ticket existente listo para imprimir',
            regenerated: false,
            receipt,
        };
    }
    async reprintTicketRecibo(id, req) {
        const receipt = await this.posReceiptService.reprintPosTicket(req.user.tenant_id, id);
        return {
            success: true,
            message: 'Ticket existente listo para imprimir',
            regenerated: false,
            receipt,
        };
    }
    async regenerateTicketRecibo(id, req) {
        const receipt = await this.posReceiptService.regeneratePosTicket(req.user.tenant_id, id, req.user.id);
        const documents = await this.documentsService.getDocuments(id);
        return {
            success: true,
            message: 'TICKET / RECIBO regenerado exitosamente',
            regenerated: true,
            receipt,
            documents,
        };
    }
    async downloadTicketReciboRaw(id, req, res) {
        const { buffer, fileName } = await this.posReceiptService.getPosTicketRawBuffer(req.user.tenant_id, id);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.send(buffer);
    }
    async findOne(id, req) {
        const detail = await this.salesOrderService.findOneDetail(id, req.user.tenant_id);
        const documents = await this.documentsService.getDocuments(id);
        const shipping = await this.shippingsService.getShippingSummaryForOrder(id, req.user.tenant_id);
        const lineItems = (detail.sales_order.line_items ?? []).map((lineItem) => ({
            ...lineItem,
            uom_name: lineItem.product_uom?.uom?.name ?? null,
            base_uom_name: lineItem.base_uom?.name ?? null,
        }));
        return {
            data: {
                header: detail.header,
                line_items: lineItems,
                documents,
                pos_collection: detail.pos_collection,
                payment_display: detail.payment_display,
                payments: detail.payments,
                payments_summary: detail.payments_summary,
                discount_summary: detail.discount_summary,
                applied_line_discounts: detail.applied_line_discounts,
                applied_global_discount: detail.applied_global_discount,
                shipping,
            },
        };
    }
    async fulfill(id, dto, req) {
        return this.salesOrderService.fulfill(id, dto, req.user.tenant_id, req.user.id);
    }
    async cancelPost(id, req) {
        return this.salesOrderService.cancel(id, req.user.tenant_id, req.user.id);
    }
    async cancel(id, req) {
        return this.salesOrderService.cancel(id, req.user.tenant_id, req.user.id);
    }
};
exports.SalesOrderController = SalesOrderController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new sales order',
        description: 'Orders with sales_order_type POS are automatically fulfilled (inventory deducted via FIFO) in the same transaction.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateSalesOrderDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Replace/edit a sales order while it is Creada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateSalesOrderDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "replace", null);
__decorate([
    (0, common_1.Post)(':id/line-items'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Agregar una línea a la orden de venta',
        description: 'Solo Creada o En Selección, si el picking de Mesa de Control no empezó. No usar PUT para una sola línea.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateSalesOrderLineItemDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "addLineItem", null);
__decorate([
    (0, common_1.Patch)(':orderId/line-items/:lineItemId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Editar una línea de la orden de venta',
        description: 'Cantidad, precio, IVA e IEPS. Recalcula totales. Solo Creada o En Selección.',
    }),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Param)('lineItemId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateSalesOrderLineItemDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "updateLineItem", null);
__decorate([
    (0, common_1.Delete)(':orderId/line-items/:lineItemId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Eliminar una línea de la orden de venta',
        description: 'Recalcula totales. La orden debe quedar con al menos un producto.',
    }),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Param)('lineItemId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "removeLineItem", null);
__decorate([
    (0, common_1.Patch)(':id/notes'),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualizar notas de la orden',
        description: 'Permite editar solo el campo notes sin reemplazar líneas. Disponible en cualquier estado excepto Cancelada.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSalesOrderNotesDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "updateNotes", null);
__decorate([
    (0, common_1.Patch)(':id/seller'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cambiar vendedor de la orden',
        description: 'Actualiza seller_user_id. Debe ser un usuario no-POS (quien usa código de vendedor).',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSalesOrderSellerDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "updateSeller", null);
__decorate([
    (0, common_1.Patch)(':id/assigned-seller'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cambiar comisionado de la orden',
        description: 'Actualiza assigned_seller_user_id (quien cobra comisión). Independiente del vendedor que vendió.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSalesOrderAssignedSellerDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "updateAssignedSeller", null);
__decorate([
    (0, common_1.Get)(':id/payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar pagos de la orden de venta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Post)(':id/payments'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Registrar pago en la orden de venta',
        description: 'Pago parcial o total. Métodos: cash, card, transfer, mixed. Si el saldo llega a 0 → payment_status = Pagado.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateSalesOrderPaymentDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Delete)(':id/payments/:paymentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar un pago manual de la orden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "deletePayment", null);
__decorate([
    (0, common_1.Get)(':id/payments/:paymentId/documents'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar comprobantes de un pago' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "getPaymentDocuments", null);
__decorate([
    (0, common_1.Post)(':id/payments/:paymentId/documents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Subir comprobante de pago (PDF/imagen)' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Body)('notes')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "uploadPaymentDocument", null);
__decorate([
    (0, common_1.Delete)(':id/payments/:paymentId/documents/:documentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar comprobante de un pago' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Param)('documentId')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "deletePaymentDocument", null);
__decorate([
    (0, common_1.Get)(':id/invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar facturas electrónicas de la orden de venta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "getInvoices", null);
__decorate([
    (0, common_1.Post)(':id/invoices/stamp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Timbrar factura de la orden de venta',
        description: 'Timbrado vía Finkok Sign_Stamp. Requiere XML CFDI 4.0 en el body hasta implementar generador automático.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, stamp_sales_order_invoice_dto_1.StampSalesOrderInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "stampInvoice", null);
__decorate([
    (0, common_1.Post)(':id/invoices/:invoiceId/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar factura electrónica de la orden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('invoiceId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, cancel_electronic_invoice_dto_1.CancelElectronicInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "cancelInvoice", null);
__decorate([
    (0, common_1.Post)(':id/invoices/:invoiceId/sync-sat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Sincronizar estatus SAT de una factura de la orden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('invoiceId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "syncInvoiceSat", null);
__decorate([
    (0, common_1.Get)(':id/invoices/:invoiceId/pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener URL firmada del PDF CFDI de la factura' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('invoiceId')),
    __param(2, (0, common_1.Query)('regenerate')),
    __param(3, (0, common_1.Query)('preview')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "getInvoicePdf", null);
__decorate([
    (0, common_1.Get)(':id/invoices/:invoiceId/xml'),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar XML CFDI de la factura' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('invoiceId')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "getInvoiceXml", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List sales orders with filters and pagination' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QuerySalesOrderDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('export/excel/headers'),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar Excel de cabeceras de órdenes de venta' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QuerySalesOrderHeaderExportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "exportHeadersExcel", null);
__decorate([
    (0, common_1.Get)('export/excel/details'),
    (0, swagger_1.ApiOperation)({
        summary: 'Descargar Excel detalle de líneas de venta',
        description: 'Requiere created_from y created_to (rango de fechas obligatorio).',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QuerySalesOrderDetailExportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "exportDetailsExcel", null);
__decorate([
    (0, common_1.Get)('products-summary'),
    (0, swagger_1.ApiOperation)({
        summary: 'Inventario de la sucursal para el tab Productos al crear OV',
        description: 'Agrega stock de todos los almacenes de la sucursal. No enviar warehouse_id. Con search, SKU exacto primero y el resto por relevancia.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QuerySalesOrderProductsSummaryDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "getProductsSummary", null);
__decorate([
    (0, common_1.Get)('warehouse/:warehouseId/products-summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get summarized inventory products for a warehouse' }),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "getWarehouseProductsSummary", null);
__decorate([
    (0, common_1.Post)(':id/regenerate-documento-original'),
    (0, swagger_1.ApiOperation)({ summary: 'Regenerate DOCUMENTO_ORIGINAL PDF with selected language' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.RegenerateDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "regenerateDocumentoOriginal", null);
__decorate([
    (0, common_1.Get)(':id/ticket-recibo'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener ticket existente para reimpresión',
        description: 'Devuelve el TICKET / RECIBO ya guardado. No genera ni reemplaza documentos (404 si no existe).',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "getTicketRecibo", null);
__decorate([
    (0, common_1.Post)(':id/reprint-ticket-recibo'),
    (0, swagger_1.ApiOperation)({
        summary: 'Reimprimir ticket existente (sin regenerar)',
        description: 'Lee el documento TICKET / RECIBO guardado y devuelve bytes para impresora. No modifica documentos.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "reprintTicketRecibo", null);
__decorate([
    (0, common_1.Post)(':id/regenerate-ticket-recibo'),
    (0, swagger_1.ApiOperation)({
        summary: '[TEMPORAL] Regenerar TICKET / RECIBO ESC/POS (Bixolon)',
        description: 'Elimina el ticket anterior y crea uno nuevo. Usar solo cuando haga falta actualizar formato o corregir datos. Para reimprimir el guardado usar reprint-ticket-recibo.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "regenerateTicketRecibo", null);
__decorate([
    (0, common_1.Get)(':id/ticket-recibo/raw'),
    (0, swagger_1.ApiOperation)({
        summary: 'Descargar bytes ESC/POS del ticket (binario)',
        description: 'application/octet-stream listo para enviar RAW a Bixolon. Alternativa a escpos_base64/escpos_hex en JSON.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "downloadTicketReciboRaw", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get a single sales order with line items, documents and POS collection',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/fulfill'),
    (0, swagger_1.ApiOperation)({ summary: 'Fulfill (surtir) a sales order — runs FIFO batch allocation' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.FulfillSalesOrderDto, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "fulfill", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancelar orden de venta',
        description: 'Pasa a Cancelada y libera lotes asignados. Bloqueado si hay factura CFDI vigente.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "cancelPost", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancelar orden de venta (alias de POST :id/cancel)',
        description: 'Pasa a Cancelada y libera lotes asignados. Bloqueado si hay factura CFDI vigente.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesOrderController.prototype, "cancel", null);
exports.SalesOrderController = SalesOrderController = __decorate([
    (0, swagger_1.ApiTags)('Sales Orders'),
    (0, common_1.Controller)('tenant/sales-orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_module_validation_guard_1.TenantModuleValidationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [sales_order_service_1.SalesOrderService,
        sales_order_documents_service_1.SalesOrderDocumentsService,
        sales_order_pos_receipt_service_1.SalesOrderPosReceiptService,
        inventory_service_1.InventoryService,
        sales_order_export_service_1.SalesOrderExportService,
        sales_order_invoicing_service_1.SalesOrderInvoicingService,
        shippings_service_1.ShippingsService])
], SalesOrderController);
//# sourceMappingURL=sales-order.controller.js.map