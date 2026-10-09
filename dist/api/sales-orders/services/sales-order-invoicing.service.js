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
const sales_order_payment_entity_1 = require("../../../entities/sales-orders/sales-order-payment.entity");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const electronic_invoice_service_1 = require("../../electronic-invoicing/services/electronic-invoice.service");
const advance_cfdi_service_1 = require("../../electronic-invoicing/services/advance-cfdi.service");
const advance_cfdi_util_1 = require("../../electronic-invoicing/utils/advance-cfdi.util");
const pos_shifts_service_1 = require("../../pos-shifts/pos-shifts.service");
const advance_shift_payment_service_1 = require("../../pos-shifts/services/advance-shift-payment.service");
const advance_payment_method_util_1 = require("../../pos-shifts/utils/advance-payment-method.util");
const service_subscription_period_entity_1 = require("../../../entities/service-subscriptions/service-subscription-period.entity");
const service_subscription_period_status_enum_1 = require("../../../entities/service-subscriptions/service-subscription-period-status.enum");
const cfdi_xml_parser_1 = require("../../electronic-invoicing/utils/cfdi-xml.parser");
const payment_cfdi_util_1 = require("../../electronic-invoicing/utils/payment-cfdi.util");
const cfdi_stamp_date_util_1 = require("../../electronic-invoicing/utils/cfdi-stamp-date.util");
let SalesOrderInvoicingService = class SalesOrderInvoicingService {
    salesOrderRepo;
    paymentRepo;
    customerRepo;
    electronicInvoiceService;
    advanceCfdi;
    posShiftsService;
    advancePayments;
    periodRepo;
    constructor(salesOrderRepo, paymentRepo, customerRepo, electronicInvoiceService, advanceCfdi, posShiftsService, advancePayments, periodRepo) {
        this.salesOrderRepo = salesOrderRepo;
        this.paymentRepo = paymentRepo;
        this.customerRepo = customerRepo;
        this.electronicInvoiceService = electronicInvoiceService;
        this.advanceCfdi = advanceCfdi;
        this.posShiftsService = posShiftsService;
        this.advancePayments = advancePayments;
        this.periodRepo = periodRepo;
    }
    async registerExistingInvoice(salesOrderId, tenantId, userId, files, typedUuid) {
        const order = await this.getSalesOrderWithRelations(salesOrderId, tenantId);
        if (order.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede facturar una orden cancelada');
        }
        if (!order.fiscal_configuration_id || !order.fiscal_configuration?.rfc) {
            throw new common_1.BadRequestException('La orden no tiene razón social');
        }
        const customer = await this.customerRepo.findOne({
            where: { id: order.customer_id },
        });
        if (!customer?.fiscal_rfc) {
            throw new common_1.BadRequestException('El cliente debe tener RFC configurado');
        }
        const parsed = this.readExistingCfdi(files, typedUuid);
        const invoice = await this.electronicInvoiceService.registerExisting(tenantId, userId, {
            fiscal_configuration_id: order.fiscal_configuration_id,
            source_id: salesOrderId,
            uuid: parsed.uuid,
            rfc_emisor: parsed.rfcEmisor || order.fiscal_configuration.rfc,
            rfc_receptor: parsed.rfcReceptor || customer.fiscal_rfc,
            receptor_nombre: parsed.receptorNombre || customer.fiscal_razon_social || customer.name,
            subtotal: parsed.subtotal ?? Number(order.subtotal),
            total: parsed.total ?? Number(order.total),
            series: parsed.series,
            folio: parsed.folio || order.folio,
            currency: parsed.currency || 'MXN',
            stamped_at: parsed.stampedAt,
            xml: parsed.xml,
            pdf: parsed.pdf,
            origin: parsed.origin,
        });
        await this.periodRepo.update({ tenant_id: tenantId, sales_order_id: salesOrderId }, {
            electronic_invoice_id: invoice.id,
            status: service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Invoiced,
            invoice_error: null,
        });
        return invoice;
    }
    async attachManualFiles(salesOrderId, invoiceId, tenantId, files) {
        await this.getSalesOrderWithRelations(salesOrderId, tenantId);
        const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);
        if (invoice.source_id !== salesOrderId || invoice.metadata?.registered_existing !== true) {
            throw new common_1.BadRequestException('Solo se pueden completar facturas registradas a mano');
        }
        if (!files.xml && !files.pdf) {
            throw new common_1.BadRequestException('Sube el XML, el PDF o ambos');
        }
        const parsed = this.readExistingCfdi(files, invoice.uuid ?? undefined);
        if (parsed.uuid !== String(invoice.uuid || '').toUpperCase()) {
            throw new common_1.BadRequestException('El archivo no corresponde al UUID de esta factura');
        }
        return this.electronicInvoiceService.attachManualFiles(invoiceId, tenantId, {
            xml: parsed.xml,
            pdf: parsed.pdf,
            series: parsed.series,
            folio: parsed.folio,
            subtotal: parsed.subtotal,
            total: parsed.total,
            rfcEmisor: parsed.rfcEmisor,
            rfcReceptor: parsed.rfcReceptor,
            receptorNombre: parsed.receptorNombre,
            stampedAt: parsed.stampedAt,
        });
    }
    async unlinkManualInvoice(salesOrderId, invoiceId, tenantId) {
        await this.getSalesOrderWithRelations(salesOrderId, tenantId);
        await this.electronicInvoiceService.unlinkManualRegistration(invoiceId, tenantId, salesOrderId);
        await this.periodRepo.update({ tenant_id: tenantId, sales_order_id: salesOrderId, electronic_invoice_id: invoiceId }, {
            electronic_invoice_id: null,
            status: service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Linked,
            invoice_error: null,
        });
    }
    readExistingCfdi(files, typedUuid) {
        const xmlFile = files?.xml;
        const pdfFile = files?.pdf;
        let fromXml = null;
        if (xmlFile) {
            fromXml = this.readXmlCfdi(xmlFile.buffer.toString('utf8'));
        }
        let pdfUuid = null;
        if (pdfFile) {
            const isPdf = (pdfFile.originalname ?? '').toLowerCase().endsWith('.pdf')
                || pdfFile.buffer.subarray(0, 4).toString() === '%PDF';
            if (!isPdf) {
                throw new common_1.BadRequestException('El archivo PDF no es un PDF');
            }
            pdfUuid = extractUuid(pdfFile.buffer.toString('latin1'));
        }
        const pdfStamp = pdfFile ? (0, cfdi_stamp_date_util_1.extractStampDate)(pdfFile.buffer) : null;
        if (fromXml && pdfUuid && fromXml.uuid !== pdfUuid) {
            throw new common_1.BadRequestException('El UUID del XML y el del PDF no coinciden');
        }
        if (fromXml) {
            return {
                ...fromXml,
                stampedAt: fromXml.stampedAt ?? pdfStamp,
                origin: pdfFile ? 'xml_pdf' : 'xml',
                pdf: pdfFile?.buffer ?? null,
            };
        }
        if (pdfFile) {
            const uuid = pdfUuid ?? extractUuid(typedUuid);
            if (!uuid) {
                throw new common_1.BadRequestException('No encontré el UUID en el PDF. Sube también el XML o escríbelo.');
            }
            return { ...emptyFromUuid(uuid, 'pdf'), pdf: pdfFile.buffer, stampedAt: pdfStamp };
        }
        const uuid = extractUuid(typedUuid);
        if (!uuid) {
            throw new common_1.BadRequestException('Sube el XML, el PDF o ambos, o escribe el UUID');
        }
        return { ...emptyFromUuid(uuid, 'uuid'), pdf: null };
    }
    readXmlCfdi(text) {
        let parsed;
        try {
            parsed = (0, cfdi_xml_parser_1.parseStampedCfdiXml)(text);
        }
        catch {
            throw new common_1.BadRequestException('El XML no trae un CFDI timbrado con UUID');
        }
        return {
            uuid: parsed.timbre.uuid.toUpperCase(),
            origin: 'xml',
            xml: text,
            pdf: null,
            rfcEmisor: parsed.emisor.rfc || null,
            rfcReceptor: parsed.receptor.rfc || null,
            receptorNombre: parsed.receptor.nombre || null,
            subtotal: Number(parsed.subTotal) || null,
            total: Number(parsed.total) || null,
            series: parsed.serie || null,
            folio: parsed.folio || null,
            currency: parsed.moneda || null,
            stampedAt: (0, cfdi_stamp_date_util_1.parseCfdiDate)(parsed.timbre.fechaTimbrado),
        };
    }
    async listInvoices(salesOrderId, tenantId) {
        await this.getSalesOrderOrFail(salesOrderId, tenantId);
        const invoices = await this.electronicInvoiceService.findBySource(tenantId, 'sales_orders', salesOrderId);
        for (const invoice of invoices) {
            await this.repairStoredStampDate(invoice);
        }
        return invoices;
    }
    async getPaymentComplementStatus(salesOrderId, tenantId) {
        return (await this.preparePaymentComplement(salesOrderId, tenantId)).status;
    }
    async stampPaymentComplement(salesOrderId, tenantId, userId) {
        const prepared = await this.preparePaymentComplement(salesOrderId, tenantId);
        if (!prepared.stamp) {
            throw new common_1.BadRequestException(prepared.status.reason || 'No se puede generar el CEP');
        }
        const { income, customerRfc, customerName, xml, amount, environment } = prepared.stamp;
        return this.electronicInvoiceService.stamp(tenantId, userId, {
            fiscal_configuration_id: income.fiscal_configuration_id,
            source_module: 'sales_orders',
            source_id: salesOrderId,
            xml,
            rfc_receptor: customerRfc,
            receptor_nombre: customerName,
            subtotal: 0,
            total: 0,
            series: 'CP',
            folio: prepared.stamp.folio,
            tipo_comprobante: 'P',
            currency: 'XXX',
            environment,
            metadata: {
                kind: 'payment_complement',
                related_invoice_id: income.id,
                related_uuid: prepared.stamp.relatedUuid,
                monto_total_pagos: amount,
                sales_order_folio: prepared.stamp.folio,
            },
        });
    }
    async repairStoredStampDate(invoice) {
        if (invoice.metadata?.registered_existing !== true)
            return;
        const fromXml = (0, cfdi_stamp_date_util_1.stampDateFromXml)(invoice.xml_stamped);
        let next = fromXml;
        if (!next && invoice.pdf_stamped_s3_key) {
            try {
                const pdf = await this.electronicInvoiceService.readPdfBuffer(invoice.id, invoice.tenant_id);
                next = (0, cfdi_stamp_date_util_1.extractStampDate)(pdf);
            }
            catch {
                next = null;
            }
        }
        if (!next)
            return;
        const current = invoice.stamped_at ? new Date(invoice.stamped_at).getTime() : 0;
        if (Math.abs(current - next.getTime()) < 60_000)
            return;
        invoice.stamped_at = next;
        await this.electronicInvoiceService.saveStampDate(invoice.id, invoice.tenant_id, next);
    }
    async stampInvoice(salesOrderId, tenantId, userId, dto) {
        const order = await this.getSalesOrderWithRelations(salesOrderId, tenantId);
        if (order.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede facturar una orden cancelada');
        }
        await this.electronicInvoiceService.assertNoActiveProductionInvoice(tenantId, 'sales_orders', salesOrderId, dto.environment);
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
        const invoice = await this.electronicInvoiceService.stamp(tenantId, userId, {
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
        await this.periodRepo.update({ tenant_id: tenantId, sales_order_id: salesOrderId }, {
            electronic_invoice_id: invoice.id,
            status: service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Invoiced,
            invoice_error: null,
        });
        return invoice;
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
    async preparePaymentComplement(salesOrderId, tenantId) {
        const order = await this.getSalesOrderOrFail(salesOrderId, tenantId);
        const payments = await this.paymentRepo.find({
            where: { sales_order_id: salesOrderId, tenant_id: tenantId },
            order: { payment_date: 'ASC', created_at: 'ASC' },
        });
        const orderTotal = Number(order.total || 0);
        const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const pending = Math.max(Number((orderTotal - paidAmount).toFixed(2)), 0);
        const paid = order.general_status !== 'Cancelada' && orderTotal > 0.009 && pending <= 0.009;
        const invoices = await this.electronicInvoiceService.findBySource(tenantId, 'sales_orders', salesOrderId);
        const empty = {
            paid,
            can_generate: false,
            reason: null,
            payment_complement: null,
        };
        if (order.general_status === 'Cancelada') {
            return { status: { ...empty, paid: false, reason: null }, stamp: null };
        }
        const income = this.pickIncomeInvoice(invoices);
        const complement = this.pickPaymentComplement(invoices, income);
        if (complement) {
            return {
                status: {
                    paid,
                    can_generate: false,
                    reason: null,
                    payment_complement: this.mapPaymentComplement(complement),
                },
                stamp: null,
            };
        }
        if (!paid) {
            return { status: empty, stamp: null };
        }
        if (!income) {
            return {
                status: {
                    ...empty,
                    reason: 'Primero timbra la factura de la venta. El CEP se liga a ese comprobante.',
                },
                stamp: null,
            };
        }
        if (!income.xml_stamped) {
            return {
                status: {
                    ...empty,
                    reason: 'La factura no tiene XML timbrado, así que no se puede armar el CEP.',
                },
                stamp: null,
            };
        }
        let parsed;
        try {
            parsed = (0, cfdi_xml_parser_1.parseCfdiXmlForPdf)(income.xml_stamped);
        }
        catch {
            return {
                status: { ...empty, reason: 'El XML de la factura no se pudo leer.' },
                stamp: null,
            };
        }
        if (!parsed.timbre.uuid && !income.uuid) {
            return {
                status: { ...empty, reason: 'La factura no tiene UUID, así que no se puede ligar el CEP.' },
                stamp: null,
            };
        }
        if (!parsed.emisor.rfc ||
            !parsed.receptor.rfc ||
            !parsed.lugarExpedicion ||
            !parsed.receptor.domicilioFiscalReceptor ||
            !parsed.receptor.regimenFiscalReceptor) {
            return {
                status: {
                    ...empty,
                    reason: 'A la factura le faltan datos fiscales para armar el CEP.',
                },
                stamp: null,
            };
        }
        if ((parsed.metodoPago || '').toUpperCase() !== 'PPD') {
            return {
                status: {
                    ...empty,
                    reason: 'El comprobante electrónico de pago solo aplica si la factura es PPD. Esta se timbró como PUE, y el pago ya quedó en esa factura.',
                },
                stamp: null,
            };
        }
        if (/<(?:[\w.-]+:)?Retencion\b/i.test(income.xml_stamped)) {
            return {
                status: {
                    ...empty,
                    reason: 'Esta factura tiene retenciones. El CEP automático todavía no las arma.',
                },
                stamp: null,
            };
        }
        const selected = [];
        let remaining = Number(parsed.total) || Number(income.total) || 0;
        for (const payment of payments) {
            if (remaining <= 0.009)
                break;
            if (payment.source === 'advance')
                continue;
            const amount = Number(payment.amount || 0);
            if (amount <= 0)
                continue;
            if ((payment.currency || 'MXN') !== 'MXN') {
                return {
                    status: { ...empty, reason: 'El CEP automático solo cubre pagos en MXN.' },
                    stamp: null,
                };
            }
            const formaPago = (0, payment_cfdi_util_1.formaPagoFromSalesMethod)(payment.payment_method);
            if (!formaPago) {
                return {
                    status: {
                        ...empty,
                        reason: 'Para el CEP cada pago debe ser efectivo, cheque, transferencia o tarjeta. Separa un pago mixto.',
                    },
                    stamp: null,
                };
            }
            selected.push({
                amount,
                paymentDate: String(payment.payment_date),
                formaPago,
                reference: payment.reference_number,
            });
            remaining -= amount;
        }
        const taxInfo = (0, payment_cfdi_util_1.taxesFromIncomeCfdi)(parsed);
        try {
            const built = (0, payment_cfdi_util_1.buildPaymentComplementXml)({
                series: 'CP',
                folio: order.folio || income.folio || '1',
                fecha: (0, payment_cfdi_util_1.paymentComplementFecha)(),
                lugarExpedicion: parsed.lugarExpedicion,
                emisor: {
                    rfc: parsed.emisor.rfc,
                    nombre: parsed.emisor.nombre,
                    regimen: parsed.emisor.regimenFiscal,
                },
                receptor: {
                    rfc: parsed.receptor.rfc,
                    nombre: parsed.receptor.nombre,
                    regimen: parsed.receptor.regimenFiscalReceptor,
                    postalCode: parsed.receptor.domicilioFiscalReceptor,
                },
                related: {
                    uuid: parsed.timbre.uuid || income.uuid || '',
                    serie: parsed.serie,
                    folio: parsed.folio,
                    moneda: parsed.moneda || 'MXN',
                    total: Number(parsed.total) || Number(income.total) || 0,
                    fecha: parsed.fecha,
                },
                taxes: taxInfo.taxes,
                objetoImp: taxInfo.objetoImp,
                payments: selected,
            });
            const environment = this.finkokEnvironment(income);
            return {
                status: { ...empty, can_generate: true },
                stamp: {
                    income,
                    xml: built.xml,
                    amount: built.amount,
                    relatedUuid: (parsed.timbre.uuid || income.uuid || '').toUpperCase(),
                    customerRfc: parsed.receptor.rfc,
                    customerName: parsed.receptor.nombre,
                    folio: order.folio || income.folio || '1',
                    environment,
                },
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo armar el CEP';
            return { status: { ...empty, reason: message }, stamp: null };
        }
    }
    pickIncomeInvoice(invoices) {
        const candidates = invoices.filter((invoice) => this.electronicInvoiceService.isCfdiVigente(invoice) &&
            (invoice.tipo_comprobante || 'I') === 'I' &&
            invoice.invoice_role !== 'advance');
        const parsed = candidates.map((invoice) => ({
            invoice,
            metodo: this.readMetodoPago(invoice),
        }));
        const ppd = parsed.filter((row) => row.metodo === 'PPD');
        const pool = (ppd.length ? ppd : parsed).slice().sort((a, b) => {
            const role = (row) => row.invoice.invoice_role === 'merchandise' ? 0 : 1;
            if (role(a) !== role(b))
                return role(a) - role(b);
            return Number(b.invoice.total) - Number(a.invoice.total);
        });
        return pool[0]?.invoice ?? null;
    }
    pickPaymentComplement(invoices, income) {
        const relatedUuid = (income?.uuid || '').toUpperCase();
        const complements = invoices.filter((invoice) => invoice.tipo_comprobante === 'P' && this.electronicInvoiceService.isCfdiVigente(invoice));
        if (relatedUuid) {
            const match = complements.find((invoice) => String(invoice.metadata?.related_uuid || '').toUpperCase() === relatedUuid);
            if (match)
                return match;
            return complements.find((invoice) => !invoice.metadata?.related_uuid) ?? null;
        }
        return complements[0] ?? null;
    }
    mapPaymentComplement(invoice) {
        const amount = Number(invoice.metadata?.monto_total_pagos ?? invoice.total ?? 0);
        return {
            id: invoice.id,
            uuid: invoice.uuid,
            stamp_status: invoice.stamp_status,
            sat_status: invoice.sat_status,
            stamped_at: invoice.stamped_at,
            amount: Number.isFinite(amount) ? amount : 0,
        };
    }
    readMetodoPago(invoice) {
        if (!invoice.xml_stamped)
            return '';
        try {
            return (0, cfdi_xml_parser_1.parseCfdiXmlForPdf)(invoice.xml_stamped).metodoPago.toUpperCase();
        }
        catch {
            return '';
        }
    }
    finkokEnvironment(invoice) {
        const value = invoice.metadata?.finkok_environment;
        return value === 'demo' || value === 'production' ? value : undefined;
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
    __param(1, (0, typeorm_1.InjectRepository)(sales_order_payment_entity_1.SalesOrderPayment)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(7, (0, typeorm_1.InjectRepository)(service_subscription_period_entity_1.ServiceSubscriptionPeriod)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        electronic_invoice_service_1.ElectronicInvoiceService,
        advance_cfdi_service_1.AdvanceCfdiService,
        pos_shifts_service_1.PosShiftsService,
        advance_shift_payment_service_1.AdvanceShiftPaymentService,
        typeorm_2.Repository])
], SalesOrderInvoicingService);
const UUID_PATTERN = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
function extractUuid(value) {
    const match = UUID_PATTERN.exec(value ?? '');
    return match ? match[0].toUpperCase() : null;
}
function emptyFromUuid(uuid, origin) {
    return {
        uuid,
        origin,
        xml: null,
        pdf: null,
        rfcEmisor: null,
        rfcReceptor: null,
        receptorNombre: null,
        subtotal: null,
        total: null,
        series: null,
        folio: null,
        currency: null,
        stampedAt: null,
    };
}
//# sourceMappingURL=sales-order-invoicing.service.js.map