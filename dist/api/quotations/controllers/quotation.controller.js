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
exports.QuotationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const tenant_module_validation_guard_1 = require("../../auth/tenant-module-validation.guard");
const sales_order_products_picker_service_1 = require("../../sales-orders/services/sales-order-products-picker.service");
const quotation_service_1 = require("../services/quotation.service");
const quotation_documents_service_1 = require("../services/quotation-documents.service");
const quotation_email_service_1 = require("../services/quotation-email.service");
const regenerate_document_dto_1 = require("../../../common/dto/regenerate-document.dto");
const dto_1 = require("../dto");
let QuotationController = class QuotationController {
    quotationService;
    documentsService;
    emailService;
    productsPicker;
    constructor(quotationService, documentsService, emailService, productsPicker) {
        this.quotationService = quotationService;
        this.documentsService = documentsService;
        this.emailService = emailService;
        this.productsPicker = productsPicker;
    }
    create(dto, req) {
        return this.quotationService.create(dto, req.user.tenant_id, req.user.id);
    }
    replace(id, dto, req) {
        return this.quotationService.replace(id, dto, req.user.tenant_id, req.user.id);
    }
    updateNotes(id, dto, req) {
        return this.quotationService.updateNotes(id, dto, req.user.tenant_id, req.user.id);
    }
    findAll(query, req) {
        return this.quotationService.findAll(req.user.tenant_id, query);
    }
    getProductsSummary(query, req) {
        return this.productsPicker.getSummary(req.user.tenant_id, query);
    }
    async findOne(id, req) {
        const detail = await this.quotationService.findOneDetail(id, req.user.tenant_id);
        const documents = await this.documentsService.getDocuments(id);
        const emails = await this.emailService.list(id, req.user.tenant_id);
        const lineItems = (detail.line_items ?? []).map((lineItem) => ({
            ...lineItem,
            uom_name: lineItem.product_uom?.uom?.name ?? null,
            base_uom_name: lineItem.base_uom?.name ?? null,
        }));
        return {
            data: {
                header: detail.header,
                line_items: lineItems,
                documents,
                emails,
                discount_summary: detail.discount_summary,
                applied_line_discounts: detail.applied_line_discounts,
                applied_global_discount: detail.applied_global_discount,
            },
        };
    }
    convert(id, dto, req) {
        return this.quotationService.convert(id, dto ?? {}, req.user.tenant_id, req.user.id);
    }
    regenerateDocumentoOriginal(id, dto, req) {
        return this.quotationService.regenerateDocumentoOriginal(id, req.user.tenant_id, req.user.id, dto.language, dto.keep_previous === true);
    }
    sendEmail(id, dto, req) {
        return this.emailService.send(id, dto ?? {}, req.user.tenant_id, req.user.id);
    }
    cancel(id, req) {
        return this.quotationService.cancel(id, req.user.tenant_id, req.user.id);
    }
    remove(id, req) {
        return this.quotationService.cancel(id, req.user.tenant_id, req.user.id);
    }
};
exports.QuotationController = QuotationController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear cotización',
        description: 'Misma captura que OV (POS o MANUAL). No descuenta inventario ni genera factura. Persiste unit_price del payload.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateQuotationDto, Object]),
    __metadata("design:returntype", void 0)
], QuotationController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Reemplazar cotización mientras está Creada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateQuotationDto, Object]),
    __metadata("design:returntype", void 0)
], QuotationController.prototype, "replace", null);
__decorate([
    (0, common_1.Patch)(':id/notes'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar notas de la cotización' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateQuotationNotesDto, Object]),
    __metadata("design:returntype", void 0)
], QuotationController.prototype, "updateNotes", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar cotizaciones' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryQuotationDto, Object]),
    __metadata("design:returntype", void 0)
], QuotationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('products-summary'),
    (0, swagger_1.ApiOperation)({
        summary: 'Inventario de sucursal para el tab Productos (alta manual)',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryQuotationProductsSummaryDto, Object]),
    __metadata("design:returntype", void 0)
], QuotationController.prototype, "getProductsSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de cotización con líneas, descuentos y PDF' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/convert'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Convertir cotización a orden de venta',
        description: 'Crea una OV con los mismos unit_price, impuestos y descuentos. POS descuenta inventario; MANUAL queda Creada.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ConvertQuotationDto, Object]),
    __metadata("design:returntype", void 0)
], QuotationController.prototype, "convert", null);
__decorate([
    (0, common_1.Post)(':id/regenerate-documento-original'),
    (0, swagger_1.ApiOperation)({ summary: 'Regenerar PDF DOCUMENTO_ORIGINAL' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, regenerate_document_dto_1.RegenerateDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], QuotationController.prototype, "regenerateDocumentoOriginal", null);
__decorate([
    (0, common_1.Post)(':id/send-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Enviar cotización por correo',
        description: 'Genera el PDF y lo envía como adjunto usando la configuración de correo activa. Guarda el envío en el historial.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SendQuotationEmailDto, Object]),
    __metadata("design:returntype", void 0)
], QuotationController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar cotización (solo Creada)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuotationController.prototype, "cancel", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Alias de cancelar' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuotationController.prototype, "remove", null);
exports.QuotationController = QuotationController = __decorate([
    (0, swagger_1.ApiTags)('Quotations'),
    (0, common_1.Controller)('tenant/quotations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_module_validation_guard_1.TenantModuleValidationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [quotation_service_1.QuotationService,
        quotation_documents_service_1.QuotationDocumentsService,
        quotation_email_service_1.QuotationEmailService,
        sales_order_products_picker_service_1.SalesOrderProductsPickerService])
], QuotationController);
//# sourceMappingURL=quotation.controller.js.map