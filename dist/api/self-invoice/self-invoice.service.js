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
var SelfInvoiceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfInvoiceService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const customer_status_entity_1 = require("../../entities/customers/customer-status.entity");
const electronic_invoice_service_1 = require("../electronic-invoicing/services/electronic-invoice.service");
const fiscal_invoice_readiness_util_1 = require("../customers/utils/fiscal-invoice-readiness.util");
const fiscal_domicile_util_1 = require("../customers/utils/fiscal-domicile.util");
const self_invoice_constants_1 = require("./self-invoice.constants");
const public_invoice_code_util_1 = require("../../common/utils/public-invoice-code.util");
const self_invoice_contact_util_1 = require("./utils/self-invoice-contact.util");
const self_invoice_cfdi_xml_util_1 = require("./utils/self-invoice-cfdi-xml.util");
let SelfInvoiceService = SelfInvoiceService_1 = class SelfInvoiceService {
    salesOrderRepo;
    customerRepo;
    customerStatusRepo;
    electronicInvoiceService;
    configService;
    logger = new common_1.Logger(SelfInvoiceService_1.name);
    constructor(salesOrderRepo, customerRepo, customerStatusRepo, electronicInvoiceService, configService) {
        this.salesOrderRepo = salesOrderRepo;
        this.customerRepo = customerRepo;
        this.customerStatusRepo = customerStatusRepo;
        this.electronicInvoiceService = electronicInvoiceService;
        this.configService = configService;
    }
    async getReceipt(rawCode) {
        const order = await this.getOrderByPublicCode(rawCode);
        const invoice = await this.findCurrentInvoice(order);
        let pdf = null;
        if (invoice) {
            try {
                pdf = await this.electronicInvoiceService.getPdfDownload(invoice.id, order.tenant_id);
            }
            catch (error) {
                this.logger.warn(`No se pudo firmar PDF del recibo ${order.public_invoice_code}: ${error}`);
            }
        }
        return {
            code: order.public_invoice_code,
            issuer_name: order.fiscal_razon_social || order.fiscal_configuration?.razon_social || null,
            branch_name: this.resolveBranch(order)?.code ?? null,
            sold_at: order.updated_at,
            total: Number(order.total),
            currency: 'MXN',
            already_invoiced: Boolean(invoice),
            invoice: invoice
                ? {
                    id: invoice.id,
                    uuid: invoice.uuid,
                    stamped_at: invoice.stamped_at,
                    pdf_url: pdf?.signedUrl ?? null,
                    pdf_file_name: pdf?.fileName ?? null,
                }
                : null,
            catalogs: self_invoice_constants_1.SELF_INVOICE_CATALOGS,
        };
    }
    async identify(rawCode, dto) {
        const order = await this.getOrderByPublicCode(rawCode);
        this.assertInvoiceable(order);
        const customer = await this.findMatchingCustomer(order, dto.email, dto.phone);
        const invoice = await this.findCurrentInvoice(order);
        return {
            matched: Boolean(customer),
            code: order.public_invoice_code,
            total: Number(order.total),
            currency: 'MXN',
            issuer_name: order.fiscal_razon_social || order.fiscal_configuration?.razon_social || null,
            already_invoiced: Boolean(invoice),
            fiscal: customer ? this.toFiscalPayload(customer) : null,
            suggested: {
                uso_cfdi: 'G03',
                regimen_fiscal_receptor: this.suggestRegimen(customer),
                forma_pago: '01',
                metodo_pago: order.payment_status === 'Pagado' ? 'PUE' : 'PPD',
            },
        };
    }
    async stamp(rawCode, dto) {
        const order = await this.getOrderByPublicCode(rawCode);
        this.assertInvoiceable(order);
        const existing = await this.findCurrentInvoice(order);
        if (existing) {
            throw new common_1.BadRequestException('Este recibo ya tiene una factura vigente');
        }
        const rfc = dto.fiscal_rfc.trim().toUpperCase();
        if (fiscal_invoice_readiness_util_1.GENERIC_INVOICE_RFCS.has(rfc)) {
            throw new common_1.BadRequestException('Ingresa un RFC fiscal real, no público en general');
        }
        const fiscal = order.fiscal_configuration;
        if (!fiscal) {
            throw new common_1.BadRequestException('Esta sucursal aún no puede emitir facturas en línea');
        }
        if (fiscal.finkok_registration_status !== 'registered') {
            throw new common_1.BadRequestException('Esta sucursal aún no puede emitir facturas en línea');
        }
        if (!fiscal.fiscal_regime) {
            throw new common_1.BadRequestException('Esta sucursal aún no puede emitir facturas en línea');
        }
        const branch = this.resolveBranch(order);
        const lugarExpedicion = String(branch?.postal_code ?? '').replace(/\D/g, '');
        if (!/^\d{5}$/.test(lugarExpedicion)) {
            throw new common_1.BadRequestException('Esta sucursal aún no puede emitir facturas en línea');
        }
        const razonSocial = dto.fiscal_razon_social.trim().toUpperCase();
        const receptor = await this.persistReceptor(order, dto, rfc, razonSocial);
        const xml = (0, self_invoice_cfdi_xml_util_1.buildSelfInvoiceCfdiXml)({
            serie: fiscal.prefix ?? undefined,
            folio: this.folioFromPublicCode(order.public_invoice_code, order.folio),
            fecha: (0, self_invoice_cfdi_xml_util_1.formatCfdiFecha)(new Date()),
            formaPago: dto.forma_pago,
            metodoPago: dto.metodo_pago ?? (order.payment_status === 'Pagado' ? 'PUE' : 'PPD'),
            lugarExpedicion,
            globalDiscountAmount: Number(order.global_discount_amount) || 0,
            emisor: {
                rfc: fiscal.rfc,
                nombre: fiscal.razon_social,
                regimenFiscal: fiscal.fiscal_regime,
            },
            receptor: {
                rfc,
                nombre: razonSocial,
                domicilioFiscal: dto.fiscal_postal_code,
                regimenFiscal: dto.regimen_fiscal_receptor,
                usoCfdi: dto.uso_cfdi.toUpperCase(),
            },
            lines: (order.line_items ?? []).map((line) => ({
                description: line.product?.name ?? 'PRODUCTO',
                quantity: Number(line.quantity) || 0,
                unitPrice: Number(line.unit_price) || 0,
                discountUnit: Number(line.discount_unit) || 0,
                ivaPercentage: Number(line.iva_percentage) || 0,
                iepsPercentage: Number(line.ieps_percentage) || 0,
                satClave: line.product?.sat_clave,
                uomName: line.product_uom?.uom?.name,
            })),
        });
        const stamped = await this.electronicInvoiceService.stamp(order.tenant_id, order.collected_by_user_id ?? order.created_by, {
            fiscal_configuration_id: order.fiscal_configuration_id,
            source_module: 'sales_orders',
            source_id: order.id,
            xml,
            rfc_receptor: rfc,
            receptor_nombre: razonSocial,
            subtotal: Number(order.subtotal),
            total: Number(order.total),
            series: fiscal.prefix ?? undefined,
            folio: this.folioFromPublicCode(order.public_invoice_code, order.folio),
            environment: this.stampEnvironment(),
            metadata: {
                source: 'self_invoice_portal',
                public_invoice_code: order.public_invoice_code,
                customer_id: receptor.id,
                email: (0, self_invoice_contact_util_1.normalizeEmail)(dto.email),
            },
        });
        const pdf = await this.electronicInvoiceService.getPdfDownload(stamped.id, order.tenant_id);
        return {
            code: order.public_invoice_code,
            uuid: stamped.uuid,
            stamp_status: stamped.stamp_status,
            total: Number(order.total),
            pdf_url: pdf.signedUrl,
            pdf_file_name: pdf.fileName,
            invoice_id: stamped.id,
        };
    }
    async getInvoiceXml(rawCode) {
        const order = await this.getOrderByPublicCode(rawCode);
        const invoice = await this.findCurrentInvoice(order);
        if (!invoice) {
            throw new common_1.NotFoundException('Este recibo aún no tiene factura');
        }
        return this.electronicInvoiceService.getXmlDownload(invoice.id, order.tenant_id);
    }
    async getInvoicePdf(rawCode) {
        const order = await this.getOrderByPublicCode(rawCode);
        const invoice = await this.findCurrentInvoice(order);
        if (!invoice) {
            throw new common_1.NotFoundException('Este recibo aún no tiene factura');
        }
        return this.electronicInvoiceService.getPdfDownload(invoice.id, order.tenant_id);
    }
    async getOrderByPublicCode(rawCode) {
        const code = (0, public_invoice_code_util_1.normalizePublicInvoiceCode)(rawCode);
        if (!code) {
            throw new common_1.NotFoundException('Recibo no encontrado');
        }
        const order = await this.salesOrderRepo
            .createQueryBuilder('so')
            .where('UPPER(so.public_invoice_code) = :code', { code })
            .leftJoinAndSelect('so.fiscal_configuration', 'fiscal_configuration')
            .leftJoinAndSelect('so.warehouse', 'warehouse')
            .leftJoinAndSelect('warehouse.billing_branch', 'billing_branch')
            .leftJoinAndSelect('so.customer', 'customer')
            .leftJoinAndSelect('so.line_items', 'line_items')
            .leftJoinAndSelect('line_items.product', 'product')
            .leftJoinAndSelect('line_items.product_uom', 'product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .getOne();
        if (!order) {
            throw new common_1.NotFoundException('Recibo no encontrado');
        }
        return order;
    }
    assertInvoiceable(order) {
        if (order.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('Este recibo no se puede facturar');
        }
    }
    async findCurrentInvoice(order) {
        const vigentes = await this.electronicInvoiceService.findVigenteBySource(order.tenant_id, 'sales_orders', order.id);
        return vigentes[0] ?? null;
    }
    resolveBranch(order) {
        return order.warehouse?.billing_branch ?? null;
    }
    async findMatchingCustomer(order, email, phone) {
        if (!(0, self_invoice_contact_util_1.isUsableEmail)(email)) {
            return null;
        }
        const onOrder = order.customer;
        if (onOrder && this.contactsMatch(onOrder, email, phone) && this.hasRealRfc(onOrder)) {
            return onOrder;
        }
        const candidates = await this.customerRepo
            .createQueryBuilder('customer')
            .where('customer.tenant_id = :tenantId', { tenantId: order.tenant_id })
            .andWhere('LOWER(customer.email) = :email', { email: (0, self_invoice_contact_util_1.normalizeEmail)(email) })
            .getMany();
        return (candidates.find((customer) => this.contactsMatch(customer, email, phone) && this.hasRealRfc(customer)) ?? null);
    }
    contactsMatch(customer, email, phone) {
        const storedPhone = (0, self_invoice_contact_util_1.composePhoneDigits)(customer.phone, customer.phone_code);
        return (0, self_invoice_contact_util_1.emailsMatch)(customer.email, email) && (0, self_invoice_contact_util_1.phonesMatch)(storedPhone || customer.phone, phone);
    }
    hasRealRfc(customer) {
        const rfc = customer.fiscal_rfc?.trim().toUpperCase() ?? '';
        return Boolean(rfc) && !fiscal_invoice_readiness_util_1.GENERIC_INVOICE_RFCS.has(rfc);
    }
    toFiscalPayload(customer) {
        return {
            fiscal_rfc: customer.fiscal_rfc,
            fiscal_person_type: customer.fiscal_person_type,
            fiscal_razon_social: customer.fiscal_razon_social,
            fiscal_postal_code: customer.fiscal_postal_code,
            fiscal_country: customer.fiscal_country ?? 'MEX',
            fiscal_street: customer.fiscal_street,
            fiscal_exterior_number: customer.fiscal_exterior_number,
            fiscal_interior_number: customer.fiscal_interior_number,
            fiscal_colonia: customer.fiscal_colonia,
            fiscal_localidad: customer.fiscal_localidad,
            fiscal_municipio: customer.fiscal_municipio,
            fiscal_state: customer.fiscal_state,
        };
    }
    suggestRegimen(customer) {
        if (customer?.fiscal_person_type === 'fisica') {
            return '612';
        }
        return '601';
    }
    async persistReceptor(order, dto, rfc, razonSocial) {
        const matched = await this.findMatchingCustomer(order, dto.email, dto.phone);
        let target = matched && this.hasRealRfc(matched)
            ? matched
            : await this.customerRepo
                .createQueryBuilder('customer')
                .where('customer.tenant_id = :tenantId', { tenantId: order.tenant_id })
                .andWhere('UPPER(customer.fiscal_rfc) = :rfc', { rfc })
                .getOne();
        const personType = dto.fiscal_person_type ?? (rfc.length === 12 ? 'moral' : 'fisica');
        const country = (dto.fiscal_country ?? 'MEX').toUpperCase();
        const fiscalAddress = (0, fiscal_domicile_util_1.composeFiscalAddress)({
            street: dto.fiscal_street,
            exteriorNumber: dto.fiscal_exterior_number,
            interiorNumber: dto.fiscal_interior_number,
            colonia: dto.fiscal_colonia,
        });
        const patch = {
            email: (0, self_invoice_contact_util_1.normalizeEmail)(dto.email),
            phone: dto.phone.replace(/\D/g, '').slice(-10),
            fiscal_rfc: rfc,
            fiscal_razon_social: razonSocial,
            fiscal_person_type: personType,
            fiscal_postal_code: dto.fiscal_postal_code,
            fiscal_country: country,
            fiscal_street: dto.fiscal_street?.trim() || undefined,
            fiscal_exterior_number: dto.fiscal_exterior_number?.trim() || undefined,
            fiscal_interior_number: dto.fiscal_interior_number?.trim() || undefined,
            fiscal_colonia: dto.fiscal_colonia?.trim() || undefined,
            fiscal_localidad: dto.fiscal_localidad?.trim() || undefined,
            fiscal_municipio: dto.fiscal_municipio?.trim() || undefined,
            fiscal_state: dto.fiscal_state?.trim() || undefined,
            fiscal_city: dto.fiscal_municipio?.trim() || undefined,
            fiscal_address: fiscalAddress ?? undefined,
        };
        if (target && !this.isGenericCustomer(target)) {
            Object.assign(target, patch);
            return this.customerRepo.save(target);
        }
        const status = await this.customerStatusRepo.findOne({ where: { code: 'ACTIVE' } });
        const created = this.customerRepo.create({
            tenant_id: order.tenant_id,
            name: razonSocial,
            company_name: personType === 'moral' ? razonSocial : undefined,
            status_id: status?.id ?? null,
            ...patch,
        });
        return this.customerRepo.save(created);
    }
    isGenericCustomer(customer) {
        const rfc = customer.fiscal_rfc?.trim().toUpperCase() ?? '';
        return !rfc || fiscal_invoice_readiness_util_1.GENERIC_INVOICE_RFCS.has(rfc);
    }
    folioFromPublicCode(publicCode, fallbackFolio) {
        const match = String(publicCode ?? '').match(/(\d+)\s*$/);
        if (match) {
            return String(Number(match[1]));
        }
        const fromOrder = String(fallbackFolio).match(/(\d+)\s*$/);
        return fromOrder ? String(Number(fromOrder[1])) : fallbackFolio;
    }
    stampEnvironment() {
        const configured = this.configService.get('SELF_INVOICE_FINKOK_ENVIRONMENT');
        if (configured === 'demo' || configured === 'production') {
            return configured;
        }
        return this.configService.get('NODE_ENV') === 'production' ? 'production' : 'demo';
    }
};
exports.SelfInvoiceService = SelfInvoiceService;
exports.SelfInvoiceService = SelfInvoiceService = SelfInvoiceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_status_entity_1.CustomerStatus)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        electronic_invoice_service_1.ElectronicInvoiceService,
        config_1.ConfigService])
], SelfInvoiceService);
//# sourceMappingURL=self-invoice.service.js.map