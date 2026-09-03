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
let SalesOrderInvoicingService = class SalesOrderInvoicingService {
    salesOrderRepo;
    customerRepo;
    electronicInvoiceService;
    constructor(salesOrderRepo, customerRepo, electronicInvoiceService) {
        this.salesOrderRepo = salesOrderRepo;
        this.customerRepo = customerRepo;
        this.electronicInvoiceService = electronicInvoiceService;
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
        return this.electronicInvoiceService.cancel(invoiceId, tenantId, userId, dto);
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
};
exports.SalesOrderInvoicingService = SalesOrderInvoicingService;
exports.SalesOrderInvoicingService = SalesOrderInvoicingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        electronic_invoice_service_1.ElectronicInvoiceService])
], SalesOrderInvoicingService);
//# sourceMappingURL=sales-order-invoicing.service.js.map