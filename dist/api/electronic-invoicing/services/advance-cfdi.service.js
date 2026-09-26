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
exports.AdvanceCfdiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const electronic_invoice_entity_1 = require("../../../entities/electronic-invoicing/electronic-invoice.entity");
const electronic_invoice_service_1 = require("./electronic-invoice.service");
const advance_cfdi_util_1 = require("../utils/advance-cfdi.util");
let AdvanceCfdiService = class AdvanceCfdiService {
    invoiceRepo;
    electronicInvoiceService;
    constructor(invoiceRepo, electronicInvoiceService) {
        this.invoiceRepo = invoiceRepo;
        this.electronicInvoiceService = electronicInvoiceService;
    }
    async findVigenteAdvance(tenantId, sourceModule, sourceId) {
        const invoices = await this.electronicInvoiceService.findBySource(tenantId, sourceModule, sourceId);
        return (invoices.find((invoice) => invoice.invoice_role === 'advance' &&
            this.electronicInvoiceService.isCfdiVigente(invoice)) ?? null);
    }
    async summarize(tenantId, invoice) {
        if (!invoice)
            return null;
        const related = await this.invoiceRepo.find({
            where: { tenant_id: tenantId, related_advance_invoice_id: invoice.id },
        });
        const merchandise = related.find((row) => row.invoice_role === 'merchandise' &&
            this.electronicInvoiceService.isCfdiVigente(row)) ?? null;
        const application = related.find((row) => row.invoice_role === 'advance_application' &&
            this.electronicInvoiceService.isCfdiVigente(row)) ?? null;
        return {
            id: invoice.id,
            uuid: invoice.uuid,
            folio: invoice.folio,
            subtotal: Number(invoice.subtotal),
            total: Number(invoice.total),
            stamp_status: invoice.stamp_status,
            sat_status: invoice.sat_status,
            invoice_role: invoice.invoice_role,
            applied: !!merchandise && !!application,
            merchandise_invoice_id: merchandise?.id ?? null,
            application_invoice_id: application?.id ?? null,
        };
    }
    async stampAdvance(tenantId, userId, document, dto) {
        const existing = await this.findVigenteAdvance(tenantId, document.sourceModule, document.sourceId);
        if (existing) {
            throw new common_1.BadRequestException('Ya hay una factura de anticipo vigente. Cancélala antes de timbrar otra.');
        }
        const defaultBase = (0, advance_cfdi_util_1.taxableBaseOfDocument)(document.subtotal, document.discountTotal, document.globalDiscount);
        const base = dto.base_amount ?? defaultBase;
        const iva = dto.iva_percentage ??
            (0, advance_cfdi_util_1.inferIvaPercentage)(document.ivaTotal, defaultBase);
        const built = (0, advance_cfdi_util_1.buildAdvanceConceptCfdi)({
            series: dto.series ?? document.series,
            folio: dto.folio ?? document.folio,
            baseAmount: base,
            ivaPercentage: iva,
            usoCfdi: dto.uso_cfdi ?? 'G01',
            formaPago: dto.forma_pago ?? '03',
            metodoPago: dto.metodo_pago ?? 'PUE',
            emisor: document.emisor,
            receptor: { ...document.receptor, regimen: dto.regimen_fiscal_receptor },
            tipoComprobante: 'I',
            descripcion: advance_cfdi_util_1.ADVANCE_DESCRIPTION,
        });
        return this.electronicInvoiceService.stamp(tenantId, userId, {
            fiscal_configuration_id: document.fiscalConfigurationId,
            source_module: document.sourceModule,
            source_id: document.sourceId,
            xml: built.xml,
            rfc_receptor: document.receptor.rfc,
            receptor_nombre: document.receptor.nombre,
            subtotal: built.subtotal,
            total: built.total,
            series: dto.series ?? document.series ?? undefined,
            folio: dto.folio ?? document.folio,
            tipo_comprobante: 'I',
            environment: dto.environment,
            invoice_role: 'advance',
            metadata: { invoice_role: 'advance', document_folio: document.folio },
        });
    }
    async applyToSalesOrder(tenantId, userId, document, advance, dto) {
        if (!advance.uuid) {
            throw new common_1.BadRequestException('El anticipo no tiene UUID');
        }
        const summary = await this.summarize(tenantId, advance);
        if (summary?.applied) {
            throw new common_1.BadRequestException('Ese anticipo ya fue aplicado');
        }
        const related = await this.invoiceRepo.find({
            where: { tenant_id: tenantId, related_advance_invoice_id: advance.id },
        });
        let merchandise = related.find((row) => row.invoice_role === 'merchandise' &&
            this.electronicInvoiceService.isCfdiVigente(row)) ?? null;
        let application = related.find((row) => row.invoice_role === 'advance_application' &&
            this.electronicInvoiceService.isCfdiVigente(row)) ?? null;
        const receptor = {
            ...document.receptor,
            regimen: dto.regimen_fiscal_receptor,
        };
        const formaPago = dto.forma_pago ?? '03';
        const metodoPago = dto.metodo_pago ?? 'PUE';
        if (!merchandise) {
            let built;
            try {
                built = (0, advance_cfdi_util_1.buildMerchandiseCfdi)({
                    series: dto.series ?? document.series,
                    folio: document.folio,
                    lines: document.lines,
                    globalDiscount: document.globalDiscount,
                    advanceBase: Number(advance.subtotal),
                    usoCfdi: dto.uso_cfdi ?? 'G01',
                    formaPago,
                    metodoPago,
                    emisor: document.emisor,
                    receptor,
                    relatedUuid: advance.uuid,
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'No se pudo armar la factura';
                throw new common_1.BadRequestException(message);
            }
            merchandise = await this.electronicInvoiceService.stamp(tenantId, userId, {
                fiscal_configuration_id: document.fiscalConfigurationId,
                source_module: 'sales_orders',
                source_id: document.sourceId,
                xml: built.xml,
                rfc_receptor: document.receptor.rfc,
                receptor_nombre: document.receptor.nombre,
                subtotal: built.subtotal,
                total: built.total,
                series: dto.series ?? document.series ?? undefined,
                folio: document.folio,
                tipo_comprobante: 'I',
                environment: dto.environment,
                invoice_role: 'merchandise',
                related_advance_invoice_id: advance.id,
                metadata: { invoice_role: 'merchandise', advance_uuid: advance.uuid },
            });
        }
        if (!application) {
            const built = (0, advance_cfdi_util_1.buildAdvanceConceptCfdi)({
                series: dto.series ?? document.series,
                folio: `${document.folio}-ANT`,
                baseAmount: Number(advance.subtotal),
                ivaPercentage: this.rateFromInvoice(advance),
                usoCfdi: dto.uso_cfdi_aplicacion ?? 'G02',
                formaPago,
                metodoPago,
                emisor: document.emisor,
                receptor,
                tipoComprobante: 'E',
                descripcion: advance_cfdi_util_1.ADVANCE_APPLICATION_DESCRIPTION,
                relatedUuid: advance.uuid,
            });
            try {
                application = await this.electronicInvoiceService.stamp(tenantId, userId, {
                    fiscal_configuration_id: document.fiscalConfigurationId,
                    source_module: 'sales_orders',
                    source_id: document.sourceId,
                    xml: built.xml,
                    rfc_receptor: document.receptor.rfc,
                    receptor_nombre: document.receptor.nombre,
                    subtotal: built.subtotal,
                    total: built.total,
                    series: dto.series ?? document.series ?? undefined,
                    folio: `${document.folio}-ANT`,
                    tipo_comprobante: 'E',
                    environment: dto.environment,
                    invoice_role: 'advance_application',
                    related_advance_invoice_id: advance.id,
                    metadata: { invoice_role: 'advance_application', advance_uuid: advance.uuid },
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Error al timbrar la nota de crédito';
                throw new common_1.BadRequestException(`La factura de mercancía ya se timbró. Falta la nota de crédito del anticipo: ${message}`);
            }
        }
        return { merchandise, application: application };
    }
    async assertAdvanceCancellable(tenantId, invoice) {
        if (invoice.invoice_role !== 'advance') {
            return;
        }
        const summary = await this.summarize(tenantId, invoice);
        if (summary?.merchandise_invoice_id || summary?.application_invoice_id) {
            throw new common_1.BadRequestException('Este anticipo ya tiene factura de mercancía o nota de crédito. Cancela esas primero.');
        }
    }
    rateFromInvoice(invoice) {
        const subtotal = Number(invoice.subtotal) || 0;
        const total = Number(invoice.total) || 0;
        if (subtotal <= 0)
            return 0;
        const rate = ((total - subtotal) / subtotal) * 100;
        if (Math.abs(rate - 8) < 0.25)
            return 8;
        if (Math.abs(rate - 16) < 0.25)
            return 16;
        if (rate < 0.25)
            return 0;
        return Math.round(rate * 100) / 100;
    }
};
exports.AdvanceCfdiService = AdvanceCfdiService;
exports.AdvanceCfdiService = AdvanceCfdiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(electronic_invoice_entity_1.ElectronicInvoice)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        electronic_invoice_service_1.ElectronicInvoiceService])
], AdvanceCfdiService);
//# sourceMappingURL=advance-cfdi.service.js.map