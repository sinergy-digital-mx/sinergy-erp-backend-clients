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
var ServiceSubscriptionBillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceSubscriptionBillingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_subscription_period_entity_1 = require("../../entities/service-subscriptions/service-subscription-period.entity");
const service_subscription_period_status_enum_1 = require("../../entities/service-subscriptions/service-subscription-period-status.enum");
const service_subscription_status_enum_1 = require("../../entities/service-subscriptions/service-subscription-status.enum");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const product_entity_1 = require("../../entities/products/product.entity");
const product_item_kind_enum_1 = require("../../entities/products/product-item-kind.enum");
const sales_order_service_1 = require("../sales-orders/services/sales-order.service");
const electronic_invoice_service_1 = require("../electronic-invoicing/services/electronic-invoice.service");
const self_invoice_cfdi_xml_util_1 = require("../self-invoice/utils/self-invoice-cfdi-xml.util");
const service_subscription_constants_1 = require("./service-subscription.constants");
const service_subscription_months_util_1 = require("./utils/service-subscription-months.util");
let ServiceSubscriptionBillingService = ServiceSubscriptionBillingService_1 = class ServiceSubscriptionBillingService {
    periodRepo;
    salesOrderRepo;
    productRepo;
    dataSource;
    salesOrderService;
    electronicInvoiceService;
    logger = new common_1.Logger(ServiceSubscriptionBillingService_1.name);
    constructor(periodRepo, salesOrderRepo, productRepo, dataSource, salesOrderService, electronicInvoiceService) {
        this.periodRepo = periodRepo;
        this.salesOrderRepo = salesOrderRepo;
        this.productRepo = productRepo;
        this.dataSource = dataSource;
        this.salesOrderService = salesOrderService;
        this.electronicInvoiceService = electronicInvoiceService;
    }
    async billDuePeriods() {
        const today = (0, service_subscription_months_util_1.todayInTimeZone)();
        const periodMonth = `${today.isoDate.slice(0, 7)}-01`;
        const due = await this.periodRepo
            .createQueryBuilder('period')
            .innerJoinAndSelect('period.subscription', 'subscription')
            .where('period.tenant_id = :tenantId', { tenantId: service_subscription_constants_1.VEXIA_TENANT_ID })
            .andWhere('period.period_month = :periodMonth', { periodMonth })
            .andWhere('period.status = :status', { status: service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Pending })
            .andWhere('subscription.status = :active', { active: service_subscription_status_enum_1.ServiceSubscriptionStatus.Active })
            .andWhere('subscription.billing_day <= :day', { day: today.day })
            .getMany();
        for (const period of due) {
            try {
                await this.generatePeriod(period.subscription, period, period.subscription.created_by);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.error(`No se generó la suscripción ${period.subscription_id} ${periodMonth}: ${message}`);
            }
        }
    }
    async generatePeriod(subscription, period, userId) {
        if (period.status !== service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Pending || period.sales_order_id) {
            throw new common_1.BadRequestException('Este mes ya tiene orden o no está pendiente');
        }
        if (subscription.status !== service_subscription_status_enum_1.ServiceSubscriptionStatus.Active) {
            throw new common_1.BadRequestException('La suscripción no está activa');
        }
        const product = await this.productRepo.findOne({
            where: { id: subscription.product_id, tenant_id: subscription.tenant_id },
        });
        if (!product || product.item_kind !== product_item_kind_enum_1.ProductItemKind.Service) {
            throw new common_1.BadRequestException('El producto de la suscripción debe ser un servicio');
        }
        const month = String(period.period_month).slice(0, 10);
        const date = (0, service_subscription_months_util_1.billingDate)(month, subscription.billing_day);
        const label = (0, service_subscription_months_util_1.formatPeriodLabel)(month);
        const order = await this.salesOrderService.create({
            fiscal_configuration_id: subscription.fiscal_configuration_id,
            billing_branch_id: subscription.billing_branch_id,
            customer_id: subscription.customer_id,
            expected_delivery_date: date,
            sales_order_type: 'MANUAL',
            sale_scope: 'services',
            payment_status: 'Pendiente',
            notes: `Suscripción de servicio ${subscription.title} — ${label}`,
            line_items: [
                {
                    product_id: subscription.product_id,
                    product_uom_id: subscription.product_uom_id,
                    quantity: 1,
                    unit_price: Number(period.amount),
                    iva_percentage: Number(subscription.iva_percentage),
                    ieps_percentage: 0,
                    discount_percentage: 0,
                },
            ],
        }, subscription.tenant_id, userId);
        await this.alignOrderDate(order.id, subscription.tenant_id, date);
        period.sales_order_id = order.id;
        period.linked_manually = false;
        period.generated_at = new Date();
        period.status = service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Linked;
        period.invoice_error = null;
        await this.periodRepo.save(period);
        if ((0, service_subscription_months_util_1.isCurrentMonth)(month)) {
            return this.stampPeriod(subscription, period, userId);
        }
        period.invoice_error =
            'La orden quedó en ese mes. Tímbrala desde la orden: el SAT no acepta facturar meses anteriores con la fecha de hoy.';
        return this.periodRepo.save(period);
    }
    async stampPeriod(subscription, period, userId) {
        if (!period.sales_order_id) {
            throw new common_1.BadRequestException('Este mes todavía no tiene orden de venta');
        }
        const existing = await this.findVigenteInvoice(subscription.tenant_id, period.sales_order_id);
        if (existing) {
            period.electronic_invoice_id = existing.id;
            period.status = service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Invoiced;
            period.invoice_error = null;
            return this.periodRepo.save(period);
        }
        try {
            const invoice = await this.stampOrder(subscription, period.sales_order_id, userId);
            period.electronic_invoice_id = invoice.id;
            period.status = service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Invoiced;
            period.invoice_error = null;
        }
        catch (error) {
            period.status = service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Linked;
            period.invoice_error =
                error instanceof Error ? error.message : 'No se pudo timbrar la factura';
        }
        return this.periodRepo.save(period);
    }
    async syncPeriodInvoices(subscription) {
        const dirty = [];
        for (const period of subscription.periods ?? []) {
            if (!period.sales_order_id || period.status === service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Skipped) {
                continue;
            }
            const invoice = await this.findVigenteInvoice(subscription.tenant_id, period.sales_order_id);
            if (!invoice)
                continue;
            if (period.status === service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Invoiced &&
                period.electronic_invoice_id === invoice.id) {
                continue;
            }
            period.electronic_invoice_id = invoice.id;
            period.status = service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Invoiced;
            period.invoice_error = null;
            dirty.push(period);
        }
        if (dirty.length) {
            await this.periodRepo.save(dirty);
        }
    }
    async findVigenteInvoice(tenantId, salesOrderId) {
        const invoices = await this.electronicInvoiceService.findVigenteBySource(tenantId, 'sales_orders', salesOrderId);
        return invoices[0] ?? null;
    }
    async alignOrderDate(orderId, tenantId, date) {
        await this.dataSource.query(`UPDATE inv_s_sales_orders
       SET created_at = ?, expected_delivery_date = ?
       WHERE id = ? AND tenant_id = ?`, [`${date} 12:00:00`, date, orderId, tenantId]);
    }
    async stampOrder(subscription, salesOrderId, userId) {
        const order = await this.salesOrderRepo.findOne({
            where: { id: salesOrderId, tenant_id: subscription.tenant_id },
            relations: [
                'line_items',
                'line_items.product',
                'line_items.product_uom',
                'line_items.product_uom.uom',
                'fiscal_configuration',
                'billing_branch',
                'customer',
            ],
        });
        if (!order) {
            throw new common_1.BadRequestException('No se encontró la orden de venta');
        }
        if (order.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede facturar una orden cancelada');
        }
        const customer = order.customer;
        const fiscal = order.fiscal_configuration;
        const rfc = customer?.fiscal_rfc?.trim().toUpperCase();
        const razon = customer?.fiscal_razon_social?.trim() || customer?.name?.trim();
        const postal = String(customer?.fiscal_postal_code ?? '').replace(/\D/g, '');
        const expedicion = String(order.billing_branch?.postal_code ?? '').replace(/\D/g, '');
        if (!rfc || !razon) {
            throw new common_1.BadRequestException('El cliente necesita RFC y razón social para facturar');
        }
        if (!/^\d{5}$/.test(postal)) {
            throw new common_1.BadRequestException('El cliente necesita código postal fiscal de 5 dígitos');
        }
        if (!/^\d{5}$/.test(expedicion)) {
            throw new common_1.BadRequestException('La sucursal necesita código postal de 5 dígitos');
        }
        if (!fiscal?.rfc || !fiscal.razon_social || !fiscal.fiscal_regime) {
            throw new common_1.BadRequestException('La razón social no tiene datos fiscales completos');
        }
        const xml = (0, self_invoice_cfdi_xml_util_1.buildSelfInvoiceCfdiXml)({
            serie: fiscal.prefix ?? undefined,
            folio: order.folio,
            fecha: (0, self_invoice_cfdi_xml_util_1.formatCfdiFecha)(new Date()),
            formaPago: subscription.forma_pago,
            metodoPago: subscription.metodo_pago,
            lugarExpedicion: expedicion,
            emisor: {
                rfc: fiscal.rfc,
                nombre: fiscal.razon_social,
                regimenFiscal: fiscal.fiscal_regime,
            },
            receptor: {
                rfc,
                nombre: razon,
                domicilioFiscal: postal,
                regimenFiscal: subscription.regimen_fiscal_receptor,
                usoCfdi: subscription.uso_cfdi.toUpperCase(),
            },
            lines: (order.line_items ?? []).map((line) => ({
                description: line.product?.name ?? subscription.title,
                quantity: Number(line.quantity) || 0,
                unitPrice: Number(line.unit_price) || 0,
                discountUnit: Number(line.discount_unit) || 0,
                ivaPercentage: Number(line.iva_percentage) || 0,
                iepsPercentage: Number(line.ieps_percentage) || 0,
                satClave: line.product?.sat_clave,
                uomName: line.product_uom?.uom?.name,
            })),
        });
        return this.electronicInvoiceService.stamp(subscription.tenant_id, userId, {
            fiscal_configuration_id: order.fiscal_configuration_id,
            source_module: 'sales_orders',
            source_id: order.id,
            xml,
            rfc_receptor: rfc,
            receptor_nombre: razon,
            subtotal: Number(order.subtotal),
            total: Number(order.total),
            series: fiscal.prefix ?? undefined,
            folio: order.folio,
            tipo_comprobante: 'I',
            metadata: {
                source: 'service_subscription',
                subscription_id: subscription.id,
                customer_id: subscription.customer_id,
            },
        });
    }
};
exports.ServiceSubscriptionBillingService = ServiceSubscriptionBillingService;
exports.ServiceSubscriptionBillingService = ServiceSubscriptionBillingService = ServiceSubscriptionBillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_subscription_period_entity_1.ServiceSubscriptionPeriod)),
    __param(1, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sales_order_service_1.SalesOrderService,
        electronic_invoice_service_1.ElectronicInvoiceService])
], ServiceSubscriptionBillingService);
//# sourceMappingURL=service-subscription-billing.service.js.map