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
exports.SalesOrderInvoicingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const electronic_invoice_service_1 = require("../../electronic-invoicing/services/electronic-invoice.service");
const advance_cfdi_service_1 = require("../../electronic-invoicing/services/advance-cfdi.service");
const advance_cfdi_util_1 = require("../../electronic-invoicing/utils/advance-cfdi.util");
const pos_shifts_service_1 = require("../../pos-shifts/pos-shifts.service");
const advance_shift_payment_service_1 = require("../../pos-shifts/services/advance-shift-payment.service");
const advance_payment_method_util_1 = require("../../pos-shifts/utils/advance-payment-method.util");
let SalesOrderInvoicingService = class SalesOrderInvoicingService {
    salesOrderRepo;
    customerRepo;
    electronicInvoiceService;
    advanceCfdi;
    posShiftsService;
    advancePayments;
    constructor(salesOrderRepo, customerRepo, electronicInvoiceService, advanceCfdi, posShiftsService, advancePayments) {
        this.salesOrderRepo = salesOrderRepo;
        this.customerRepo = customerRepo;
        this.electronicInvoiceService = electronicInvoiceService;
        this.advanceCfdi = advanceCfdi;
        this.posShiftsService = posShiftsService;
        this.advancePayments = advancePayments;
    }
    async listInvoices(salesOrderId, tenantId) {
        await this.getSalesOrderOrFail(salesOrderId, tenantId);
        return this.electronicInvoiceService.findBySource(tenantId, 'sales_orders', salesOrderId);
    }
    async stampInvoice(salesOrderId, tenantId, userId, dto) {
        const order = await this.getSalesOrderWithRelations(salesOrderId, tenantId);
        if (order.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede facturar una orden cancelada');
        }
        if (order.advance_invoice_id) {
            const advance = await this.electronicInvoiceService
                .findOne(order.advance_invoice_id, tenantId)
                .catch(() => null);
            const summary = await this.advanceCfdi.summarize(tenantId, advance);
            if (summary && !summary.applied) {
                throw new common_1.BadRequestException('Esta orden tiene un anticipo sin aplicar. Factura la mercancía aplicando el anticipo.');
            }
        }
        const customer = await this.customerRepo.findOne({
            where: { id: order.customer_id },
        });
        if (!customer?.fiscal_rfc) {
            throw new common_1.BadRequestException('El cliente debe tener RFC configurado');
        }
        const xml = dto.xml ?? this.buildXmlPlaceholder(order, customer);
        return this.electronicInvoiceService.stamp(tenantId, userId, {
            fiscal_configuration_id: order.fiscal_configuration_id,
            source_module: 'sales_orders',
            source_id: salesOrderId,
            xml,
            rfc_receptor: customer.fiscal_rfc,
            receptor_nombre: customer.fiscal_razon_social ?? customer.name ?? undefined,
            subtotal: Number(order.subtotal),
            total: Number(order.total),
            series: dto.series,
            folio: dto.folio ?? order.folio,
            tipo_comprobante: dto.tipo_comprobante ?? 'I',
            certificate_serial: dto.certificate_serial,
            environment: dto.environment,
            metadata: {
                sales_order_folio: order.folio,
                customer_id: order.customer_id,
            },
        });
    }
    async cancelInvoice(salesOrderId, invoiceId, tenantId, userId, dto) {
        await this.getSalesOrderOrFail(salesOrderId, tenantId);
        const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);
        if (invoice.source_module !== 'sales_orders' || invoice.source_id !== salesOrderId) {
            throw new common_1.NotFoundException('La factura no pertenece a esta orden de venta');
        }
        await this.advanceCfdi.assertAdvanceCancellable(tenantId, invoice);
        await this.advancePayments.assertVoidable(tenantId, invoiceId);
        const cancelled = await this.electronicInvoiceService.cancel(invoiceId, tenantId, userId, dto);
        await this.advancePayments.voidByInvoice(tenantId, userId, invoiceId);
        return cancelled;
    }
    async syncInvoiceSat(salesOrderId, invoiceId, tenantId, userId) {
        await this.getSalesOrderOrFail(salesOrderId, tenantId);
        const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);
        if (invoice.source_module !== 'sales_orders' || invoice.source_id !== salesOrderId) {
            throw new common_1.NotFoundException('La factura no pertenece a esta orden de venta');
        }
        return this.electronicInvoiceService.syncSatStatus(invoiceId, tenantId, userId, 'manual');
    }
    async getInvoicePdf(salesOrderId, invoiceId, tenantId, regenerate = false, preview = false) {
        await this.getSalesOrderOrFail(salesOrderId, tenantId);
        const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);
        if (invoice.source_module !== 'sales_orders' || invoice.source_id !== salesOrderId) {
            throw new common_1.NotFoundException('La factura no pertenece a esta orden de venta');
        }
        return this.electronicInvoiceService.getPdfDownload(invoiceId, tenantId, regenerate, preview);
    }
    async getInvoiceXml(salesOrderId, invoiceId, tenantId) {
        await this.getSalesOrderOrFail(salesOrderId, tenantId);
        const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);
        if (invoice.source_module !== 'sales_orders' || invoice.source_id !== salesOrderId) {
            throw new common_1.NotFoundException('La factura no pertenece a esta orden de venta');
        }
        return this.electronicInvoiceService.getXmlDownload(invoiceId, tenantId);
    }
    buildXmlPlaceholder(order, customer) {
        throw new common_1.BadRequestException('Debe enviar el XML CFDI en el campo xml. La generación automática desde la orden estará disponible próximamente.');
    }
    async getSalesOrderOrFail(id, tenantId) {
        const order = await this.salesOrderRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden de venta no encontrada');
        }
        return order;
    }
    async getSalesOrderWithRelations(id, tenantId) {
        const order = await this.salesOrderRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['line_items', 'fiscal_configuration'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden de venta no encontrada');
        }
        return order;
    }
    async stampAdvance(salesOrderId, tenantId, userId, dto) {
        const order = await this.getAdvanceOrder(salesOrderId, tenantId);
        if (!order.fiscal_configuration?.advance_invoicing_enabled) {
            throw new common_1.BadRequestException('Esta razón social no tiene activada la factura de anticipo');
        }
        if (order.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede facturar una orden cancelada');
        }
        if (order.advance_invoice_id) {
            throw new common_1.BadRequestException('La orden ya tiene un anticipo ligado');
        }
        const branch = order.billing_branch ?? order.warehouse?.billing_branch ?? null;
        const branchId = order.billing_branch_id ?? branch?.id ?? null;
        if (!branchId) {
            throw new common_1.BadRequestException('La orden no tiene sucursal');
        }
        const formaPago = dto.forma_pago ?? '01';
        const paymentMethod = (0, advance_payment_method_util_1.paymentMethodFromFormaPago)(formaPago);
        if (!paymentMethod) {
            throw new common_1.BadRequestException('La forma de pago del anticipo debe ser efectivo (01), cheque (02), transferencia (03) o tarjeta (04 o 28)');
        }
        const caja = await this.posShiftsService.resolveBranchCajaShift(tenantId, branchId);
        if (!caja.shift) {
            const sucursal = branch?.code ?? 'la sucursal';
            throw new common_1.BadRequestException(`No hay corte abierto en ${sucursal}. Abre el corte para registrar el dinero del anticipo.`);
        }
        const parties = this.parties(order);
        const invoice = await this.advanceCfdi.stampAdvance(tenantId, userId, {
            sourceModule: 'sales_orders',
            sourceId: order.id,
            folio: order.folio,
            subtotal: Number(order.subtotal),
            discountTotal: Number(order.discount_total),
            globalDiscount: Number(order.global_discount_amount),
            ivaTotal: Number(order.iva_total),
            fiscalConfigurationId: order.fiscal_configuration_id,
            series: order.fiscal_configuration?.prefix,
            emisor: parties.emisor,
            receptor: parties.receptor,
        }, { ...dto, forma_pago: formaPago });
        await this.salesOrderRepo.update({ id: order.id, tenant_id: tenantId }, { advance_invoice_id: invoice.id });
        await this.advancePayments.record({
            tenantId,
            userId,
            shiftId: caja.shift.id,
            invoiceId: invoice.id,
            amountMxn: Number(invoice.total),
            paymentMethod,
            documentFolio: order.folio,
            salesOrderId: order.id,
        });
        return invoice;
    }
    async applyAdvance(salesOrderId, tenantId, userId, dto) {
        const order = await this.getAdvanceOrder(salesOrderId, tenantId);
        if (order.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede facturar una orden cancelada');
        }
        const advanceId = order.advance_invoice_id;
        if (!advanceId) {
            throw new common_1.BadRequestException('La orden no tiene factura de anticipo');
        }
        const advance = await this.electronicInvoiceService.findOne(advanceId, tenantId);
        const parties = this.parties(order);
        const lines = (order.line_items ?? []).map((line) => {
            const unit = (0, advance_cfdi_util_1.resolveSatUnit)(line.product_uom?.uom?.name, line.product?.item_kind);
            const quantity = Number(line.quantity) || 0;
            return {
                satClave: line.product?.sat_clave || '01010101',
                quantity,
                unitPrice: Number(line.unit_price) || 0,
                lineDiscount: (Number(line.discount_unit) || 0) * quantity,
                ivaPercentage: Number(line.iva_percentage) || 0,
                iepsPercentage: Number(line.ieps_percentage) || 0,
                unitCode: unit.code,
                unitName: unit.name,
                description: line.product?.name || 'Producto',
            };
        });
        return this.advanceCfdi.applyToSalesOrder(tenantId, userId, {
            sourceModule: 'sales_orders',
            sourceId: order.id,
            folio: order.folio,
            subtotal: Number(order.subtotal),
            discountTotal: Number(order.discount_total),
            globalDiscount: Number(order.global_discount_amount),
            ivaTotal: Number(order.iva_total),
            fiscalConfigurationId: order.fiscal_configuration_id,
            series: dto.series ?? order.fiscal_configuration?.prefix,
            emisor: parties.emisor,
            receptor: parties.receptor,
            lines,
        }, advance, dto);
    }
    parties(order) {
        const fiscal = order.fiscal_configuration;
        const branch = order.billing_branch ?? order.warehouse?.billing_branch ?? null;
        const lugar = (0, advance_cfdi_util_1.fiveDigitPostalCode)(branch?.postal_code);
        if (!fiscal?.rfc || !fiscal.razon_social || !fiscal.fiscal_regime) {
            throw new common_1.BadRequestException('La razón emisora no tiene RFC, nombre o régimen fiscal');
        }
        if (!lugar) {
            throw new common_1.BadRequestException('La sucursal no tiene código postal de expedición');
        }
        const customer = order.customer;
        const generic = !customer?.fiscal_rfc;
        const rfc = generic ? 'XAXX010101000' : customer.fiscal_rfc;
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
                    ? 'PUBLICO EN GENERAL'
                    : customer.fiscal_razon_social || customer.name || 'PUBLICO EN GENERAL',
                regimen: '601',
                postalCode: domicilio,
            },
        };
    }
    async getAdvanceOrder(id, tenantId) {
        const order = await this.salesOrderRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: [
                'customer',
                'billing_branch',
                'warehouse',
                'warehouse.billing_branch',
                'fiscal_configuration',
                'line_items',
                'line_items.product',
                'line_items.product_uom',
                'line_items.product_uom.uom',
            ],
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden de venta no encontrada');
        }
        return order;
    }
};
exports.SalesOrderInvoicingService = SalesOrderInvoicingService;
exports.SalesOrderInvoicingService = SalesOrderInvoicingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        electronic_invoice_service_1.ElectronicInvoiceService,
        advance_cfdi_service_1.AdvanceCfdiService,
        pos_shifts_service_1.PosShiftsService,
        advance_shift_payment_service_1.AdvanceShiftPaymentService])
], SalesOrderInvoicingService);
//# sourceMappingURL=sales-order-invoicing.service.js.map