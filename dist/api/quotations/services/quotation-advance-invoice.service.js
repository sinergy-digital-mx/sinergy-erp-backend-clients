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
exports.QuotationAdvanceInvoiceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quotation_entity_1 = require("../../../entities/quotations/quotation.entity");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const advance_cfdi_service_1 = require("../../electronic-invoicing/services/advance-cfdi.service");
const electronic_invoice_service_1 = require("../../electronic-invoicing/services/electronic-invoice.service");
const advance_cfdi_util_1 = require("../../electronic-invoicing/utils/advance-cfdi.util");
const pos_shifts_service_1 = require("../../pos-shifts/pos-shifts.service");
const pos_sale_collection_mapper_1 = require("../../pos-shifts/mappers/pos-sale-collection.mapper");
const PUBLIC_RFC = 'XAXX010101000';
const PUBLIC_NAME = 'PUBLICO EN GENERAL';
let QuotationAdvanceInvoiceService = class QuotationAdvanceInvoiceService {
    quotationRepo;
    salesOrderRepo;
    advanceCfdi;
    electronicInvoiceService;
    posShiftsService;
    constructor(quotationRepo, salesOrderRepo, advanceCfdi, electronicInvoiceService, posShiftsService) {
        this.quotationRepo = quotationRepo;
        this.salesOrderRepo = salesOrderRepo;
        this.advanceCfdi = advanceCfdi;
        this.electronicInvoiceService = electronicInvoiceService;
        this.posShiftsService = posShiftsService;
    }
    async collectionPreview(id, tenantId) {
        const quotation = await this.requireQuotation(id, tenantId);
        const branch = quotation.billing_branch ?? quotation.warehouse?.billing_branch ?? null;
        const branchId = quotation.billing_branch_id ?? branch?.id ?? null;
        if (!branchId) {
            throw new common_1.BadRequestException('La cotización no tiene sucursal');
        }
        const caja = await this.posShiftsService.resolveBranchCajaShift(tenantId, branchId);
        const shift = caja.shift && !caja.queued ? caja.shift : null;
        return {
            billing_branch_id: branchId,
            sucursal: branch?.code ?? null,
            open_shift: shift
                ? { id: shift.id, shift_date: shift.shift_date }
                : null,
        };
    }
    async describe(quotation) {
        const enabled = Boolean(quotation.fiscal_configuration?.advance_invoicing_enabled);
        const advance = await this.advanceCfdi.findVigenteAdvance(quotation.tenant_id, 'quotations', quotation.id);
        const summary = await this.advanceCfdi.summarize(quotation.tenant_id, advance);
        const blocks = !!summary && quotation.general_status === 'Creada';
        return {
            enabled,
            summary,
            canStamp: enabled &&
                quotation.general_status === 'Creada' &&
                !summary &&
                !!quotation.customer?.fiscal_rfc,
            blocksCancel: blocks,
            blocksEdit: blocks,
        };
    }
    async list(id, tenantId) {
        await this.requireQuotation(id, tenantId);
        return this.electronicInvoiceService.findBySource(tenantId, 'quotations', id);
    }
    async stamp(id, tenantId, userId, dto) {
        const quotation = await this.requireQuotation(id, tenantId);
        if (!quotation.fiscal_configuration?.advance_invoicing_enabled) {
            throw new common_1.BadRequestException('Esta razón social no tiene activada la factura de anticipo');
        }
        if (quotation.general_status !== 'Creada') {
            throw new common_1.BadRequestException('Solo se factura anticipo de una cotización en estado Creada');
        }
        const parties = this.parties(quotation);
        const saved = await this.advanceCfdi.stampAdvance(tenantId, userId, {
            sourceModule: 'quotations',
            sourceId: quotation.id,
            folio: quotation.folio,
            subtotal: Number(quotation.subtotal),
            discountTotal: Number(quotation.discount_total),
            globalDiscount: Number(quotation.global_discount_amount),
            ivaTotal: Number(quotation.iva_total),
            fiscalConfigurationId: quotation.fiscal_configuration_id,
            series: quotation.fiscal_configuration?.prefix,
            emisor: parties.emisor,
            receptor: parties.receptor,
        }, dto);
        return saved;
    }
    async cancel(id, invoiceId, tenantId, userId, dto) {
        await this.requireQuotation(id, tenantId);
        const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);
        if (invoice.source_module !== 'quotations' || invoice.source_id !== id) {
            throw new common_1.NotFoundException('La factura no pertenece a esta cotización');
        }
        await this.advanceCfdi.assertAdvanceCancellable(tenantId, invoice);
        return this.electronicInvoiceService.cancel(invoiceId, tenantId, userId, dto);
    }
    async assertQuotationCancellable(quotation) {
        const advance = await this.advanceCfdi.findVigenteAdvance(quotation.tenant_id, 'quotations', quotation.id);
        if (advance) {
            const uuid = advance.uuid ? ` (UUID ${advance.uuid})` : '';
            throw new common_1.BadRequestException(`No se puede cancelar la cotización: tiene una factura de anticipo vigente${uuid}. Cancela la factura primero.`);
        }
    }
    async attachToSalesOrder(tenantId, quotationId, salesOrderId) {
        const advance = await this.advanceCfdi.findVigenteAdvance(tenantId, 'quotations', quotationId);
        if (!advance)
            return;
        await this.salesOrderRepo.update({ id: salesOrderId, tenant_id: tenantId }, { advance_invoice_id: advance.id });
    }
    async requireQuotation(id, tenantId) {
        const quotation = await this.quotationRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['customer', 'billing_branch', 'warehouse', 'warehouse.billing_branch', 'fiscal_configuration'],
        });
        if (!quotation) {
            throw new common_1.NotFoundException(`Cotización no encontrada: ${id}`);
        }
        return quotation;
    }
    parties(quotation) {
        const fiscal = quotation.fiscal_configuration;
        const branch = quotation.billing_branch ?? quotation.warehouse?.billing_branch ?? null;
        const lugar = (0, advance_cfdi_util_1.fiveDigitPostalCode)(branch?.postal_code);
        if (!fiscal?.rfc || !fiscal.razon_social || !fiscal.fiscal_regime) {
            throw new common_1.BadRequestException('La razón emisora no tiene RFC, nombre o régimen fiscal');
        }
        if (!lugar) {
            throw new common_1.BadRequestException('La sucursal no tiene código postal de expedición');
        }
        const customer = quotation.customer;
        const generic = !customer?.fiscal_rfc || (0, pos_sale_collection_mapper_1.isWalkInCustomer)(customer) && !customer.fiscal_rfc;
        const rfc = generic ? PUBLIC_RFC : customer.fiscal_rfc;
        if (!rfc) {
            throw new common_1.BadRequestException('El cliente debe tener RFC');
        }
        const domicilio = generic ? lugar : (0, advance_cfdi_util_1.fiveDigitPostalCode)(customer.fiscal_postal_code);
        if (!domicilio) {
            throw new common_1.BadRequestException('El cliente debe tener código postal fiscal de 5 dígitos');
        }
        return {
            emisor: {
                rfc: fiscal.rfc,
                nombre: fiscal.razon_social,
                regimen: fiscal.fiscal_regime,
                postalCode: lugar,
            },
            receptor: {
                rfc,
                nombre: generic
                    ? PUBLIC_NAME
                    : customer.fiscal_razon_social || customer.name || PUBLIC_NAME,
                regimen: '601',
                postalCode: domicilio,
            },
        };
    }
};
exports.QuotationAdvanceInvoiceService = QuotationAdvanceInvoiceService;
exports.QuotationAdvanceInvoiceService = QuotationAdvanceInvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quotation_entity_1.Quotation)),
    __param(1, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        advance_cfdi_service_1.AdvanceCfdiService,
        electronic_invoice_service_1.ElectronicInvoiceService,
        pos_shifts_service_1.PosShiftsService])
], QuotationAdvanceInvoiceService);
//# sourceMappingURL=quotation-advance-invoice.service.js.map