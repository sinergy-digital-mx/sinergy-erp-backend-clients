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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationPdfService = void 0;
const common_1 = require("@nestjs/common");
const document_language_enum_1 = require("../../../common/enums/document-language.enum");
const sales_order_pdf_service_1 = require("../../sales-orders/services/sales-order-pdf.service");
let QuotationPdfService = class QuotationPdfService {
    salesOrderPdfService;
    constructor(salesOrderPdfService) {
        this.salesOrderPdfService = salesOrderPdfService;
    }
    async generatePdf(quotation, language = document_language_enum_1.DocumentLanguage.ES) {
        const isEn = language === document_language_enum_1.DocumentLanguage.EN;
        return this.salesOrderPdfService.generatePdf(this.toSalesOrderShape(quotation), language, {
            title: isEn ? 'QUOTATION' : 'COTIZACIÓN',
            subtitle: isEn
                ? 'Original quotation document'
                : 'Documento original de cotización',
            hidePayment: true,
        });
    }
    async uploadPdfToS3(quotation, pdfBuffer) {
        return this.salesOrderPdfService.uploadPdfToS3(quotation, pdfBuffer, 'DOCUMENTO_ORIGINAL', 'quotations');
    }
    toSalesOrderShape(quotation) {
        return {
            ...quotation,
            payment_status: null,
            sales_order_type: quotation.quotation_type,
            line_items: quotation.line_items,
        };
    }
};
exports.QuotationPdfService = QuotationPdfService;
exports.QuotationPdfService = QuotationPdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sales_order_pdf_service_1.SalesOrderPdfService])
], QuotationPdfService);
//# sourceMappingURL=quotation-pdf.service.js.map