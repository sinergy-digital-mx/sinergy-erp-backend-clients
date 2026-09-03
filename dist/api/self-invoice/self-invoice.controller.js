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
exports.SelfInvoiceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const self_invoice_service_1 = require("./self-invoice.service");
const identify_self_invoice_dto_1 = require("./dto/identify-self-invoice.dto");
const stamp_self_invoice_dto_1 = require("./dto/stamp-self-invoice.dto");
let SelfInvoiceController = class SelfInvoiceController {
    selfInvoiceService;
    constructor(selfInvoiceService) {
        this.selfInvoiceService = selfInvoiceService;
    }
    getReceipt(code) {
        return this.selfInvoiceService.getReceipt(code);
    }
    identify(code, dto) {
        return this.selfInvoiceService.identify(code, dto);
    }
    stamp(code, dto) {
        return this.selfInvoiceService.stamp(code, dto);
    }
    getPdf(code) {
        return this.selfInvoiceService.getInvoicePdf(code);
    }
    async getXml(code, res) {
        const { xml, fileName } = await this.selfInvoiceService.getInvoiceXml(code);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(xml);
    }
};
exports.SelfInvoiceController = SelfInvoiceController;
__decorate([
    (0, common_1.Get)(':code'),
    (0, swagger_1.ApiOperation)({ summary: 'Vista previa pública del recibo (total, emisor, si ya está facturado)' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SelfInvoiceController.prototype, "getReceipt", null);
__decorate([
    (0, common_1.Post)(':code/identify'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar datos fiscales por correo y teléfono' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, identify_self_invoice_dto_1.IdentifySelfInvoiceDto]),
    __metadata("design:returntype", void 0)
], SelfInvoiceController.prototype, "identify", null);
__decorate([
    (0, common_1.Post)(':code/stamp'),
    (0, swagger_1.ApiOperation)({ summary: 'Timbrar CFDI 4.0 desde el portal del cliente' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, stamp_self_invoice_dto_1.StampSelfInvoiceDto]),
    __metadata("design:returntype", void 0)
], SelfInvoiceController.prototype, "stamp", null);
__decorate([
    (0, common_1.Get)(':code/invoice/pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'URL firmada del PDF timbrado' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SelfInvoiceController.prototype, "getPdf", null);
__decorate([
    (0, common_1.Get)(':code/invoice/xml'),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar XML timbrado' }),
    (0, common_1.Header)('Content-Type', 'application/xml'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SelfInvoiceController.prototype, "getXml", null);
exports.SelfInvoiceController = SelfInvoiceController = __decorate([
    (0, swagger_1.ApiTags)('Self Invoice Portal'),
    (0, common_1.Controller)('public/self-invoice'),
    __metadata("design:paramtypes", [self_invoice_service_1.SelfInvoiceService])
], SelfInvoiceController);
//# sourceMappingURL=self-invoice.controller.js.map