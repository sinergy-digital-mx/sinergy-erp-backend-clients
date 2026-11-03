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
exports.GlobalInvoiceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const billing_branch_entity_1 = require("../../../entities/billing/billing-branch.entity");
const fiscal_configuration_entity_1 = require("../../../entities/billing/fiscal-configuration.entity");
const global_invoice_entity_1 = require("../../../entities/accounting/global-invoice.entity");
const global_invoice_order_entity_1 = require("../../../entities/accounting/global-invoice-order.entity");
const electronic_invoice_entity_1 = require("../../../entities/electronic-invoicing/electronic-invoice.entity");
const pos_sale_collection_entity_1 = require("../../../entities/pos/pos-sale-collection.entity");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const sales_order_payment_entity_1 = require("../../../entities/sales-orders/sales-order-payment.entity");
const fiscal_tax_policy_util_1 = require("../../billing/utils/fiscal-tax-policy.util");
const electronic_invoice_service_1 = require("../../electronic-invoicing/services/electronic-invoice.service");
const self_invoice_cfdi_xml_util_1 = require("../../self-invoice/utils/self-invoice-cfdi-xml.util");
const sales_order_payment_display_util_1 = require("../../sales-orders/utils/sales-order-payment-display.util");
const pos_sale_collection_mapper_1 = require("../../pos-shifts/mappers/pos-sale-collection.mapper");
const global_invoice_util_1 = require("../utils/global-invoice.util");
const PUBLIC_RFC = 'XAXX010101000';
const PUBLIC_NAME = 'PUBLICO EN GENERAL';
const PENDING_GRACE_MS = 120_000;
let GlobalInvoiceService = class GlobalInvoiceService {
    globalRepo;
    linkRepo;
    salesOrderRepo;
    paymentRepo;
    collectionRepo;
    fiscalRepo;
    branchRepo;
    invoiceRepo;
    electronicInvoiceService;
    constructor(globalRepo, linkRepo, salesOrderRepo, paymentRepo, collectionRepo, fiscalRepo, branchRepo, invoiceRepo, electronicInvoiceService) {
        this.globalRepo = globalRepo;
        this.linkRepo = linkRepo;
        this.salesOrderRepo = salesOrderRepo;
        this.paymentRepo = paymentRepo;
        this.collectionRepo = collectionRepo;
        this.fiscalRepo = fiscalRepo;
        this.branchRepo = branchRepo;
        this.invoiceRepo = invoiceRepo;
        this.electronicInvoiceService = electronicInvoiceService;
    }
    async get(tenantId, month, fiscalConfigurationId) {
        const period = this.periodOrFail(month);
        const fiscals = await this.fiscalRepo.find({
            where: { tenant_id: tenantId },
            order: { razon_social: 'ASC' },
        });
        const options = fiscals.map((fiscal) => ({
            id: fiscal.id,
            razon_social: fiscal.razon_social,
            rfc: fiscal.rfc,
        }));
        const fiscal = fiscals.find((item) => item.id === fiscalConfigurationId) ??
            (fiscals.length === 1 ? fiscals[0] : null);
        if (!fiscal) {
            return {
                month: `${period.year}-${String(period.month).padStart(2, '0')}`,
                period_label: period.label,
                fiscal_configurations: options,
                fiscal_configuration_id: null,
                invoice: null,
                cancelled_invoice: null,
                orders: [],
                orders_count: 0,
                orders_total: null,
                currency: null,
                can_generate: false,
                blocked_reason: options.length
                    ? 'Selecciona la razón social.'
                    : 'No hay una razón social para facturar.',
            };
        }
        await this.releaseStalePending(tenantId, fiscal.id, period);
        const open = await this.findOpen(tenantId, fiscal.id, period);
        const cancelled = await this.globalRepo.findOne({
            where: {
                tenant_id: tenantId,
                fiscal_configuration_id: fiscal.id,
                period_year: period.year,
                period_month: period.month,
                status: 'cancelled',
            },
            order: { created_at: 'DESC' },
        });
        const orders = open
            ? await this.loadLinkedOrders(tenantId, open.id)
            : await this.loadUninvoicedOrders(tenantId, fiscal.id, period);
        const invoice = await this.toCard(tenantId, open);
        const cancelledInvoice = open?.status === 'active' ? null : await this.toCard(tenantId, cancelled);
        const currencies = [
            ...new Set(orders.map((order) => order.currency || 'MXN')),
        ];
        const currency = currencies.length === 1 ? currencies[0] : null;
        let blocked = null;
        if (fiscal.finkok_registration_status !== 'registered' || !fiscal.fiscal_regime) {
            blocked = 'Esta razón social aún no puede timbrar.';
        }
        else if (open?.status === 'pending') {
            blocked = 'Hay una factura global en proceso para este mes.';
        }
        else if (!open && currencies.length > 1) {
            blocked =
                'Este mes tiene órdenes en pesos y en dólares. La factura global es un solo comprobante y solo puede llevar una moneda.';
        }
        const total = currency
            ? round2(orders.reduce((sum, order) => sum + order.total, 0))
            : null;
        return {
            month: `${period.year}-${String(period.month).padStart(2, '0')}`,
            period_label: period.label,
            fiscal_configurations: options,
            fiscal_configuration_id: fiscal.id,
            invoice,
            cancelled_invoice: cancelledInvoice,
            orders,
            orders_count: orders.length,
            orders_total: total,
            currency,
            can_generate: !open && orders.length > 0 && !blocked,
            blocked_reason: blocked,
        };
    }
    async generate(tenantId, userId, dto) {
        const period = this.periodOrFail(dto.month);
        const fiscal = await this.fiscalRepo.findOne({
            where: { id: dto.fiscal_configuration_id, tenant_id: tenantId },
        });
        if (!fiscal) {
            throw new common_1.NotFoundException('Razón social no encontrada');
        }
        if (fiscal.finkok_registration_status !== 'registered' || !fiscal.fiscal_regime) {
            throw new common_1.BadRequestException('Esta razón social aún no puede timbrar.');
        }
        await this.releaseStalePending(tenantId, fiscal.id, period);
        const open = await this.findOpen(tenantId, fiscal.id, period);
        if (open?.status === 'active') {
            throw new common_1.BadRequestException('Este mes ya tiene una factura global.');
        }
        if (open?.status === 'pending') {
            throw new common_1.BadRequestException('Hay una factura global en proceso para este mes.');
        }
        const orders = await this.loadOrderEntities(tenantId, fiscal.id, period, true);
        this.assertSelection(orders, dto.order_ids);
        const currency = this.singleCurrency(orders);
        const exchangeRate = this.exchangeRate(orders, currency);
        const branches = await this.branchRepo.find({
            where: { fiscal_configuration_id: fiscal.id },
        });
        const lugarExpedicion = this.lugarExpedicion(orders, branches);
        const previous = await this.globalRepo.count({
            where: {
                tenant_id: tenantId,
                fiscal_configuration_id: fiscal.id,
                period_year: period.year,
                period_month: period.month,
                status: 'cancelled',
            },
        });
        const mm = String(period.month).padStart(2, '0');
        const folio = previous === 0 ? `${period.year}${mm}` : `${period.year}${mm}-${previous + 1}`;
        const serie = (fiscal.prefix?.trim() || 'FG').slice(0, 25);
        const lines = this.conceptLines(orders, fiscal);
        const payment = (0, global_invoice_util_1.resolveGlobalInvoicePayment)(await this.paymentSnapshots(tenantId, orders));
        let xml;
        try {
            xml = (0, self_invoice_cfdi_xml_util_1.buildSelfInvoiceCfdiXml)({
                serie,
                folio,
                fecha: (0, self_invoice_cfdi_xml_util_1.formatCfdiFecha)(new Date()),
                formaPago: payment.formaPago,
                metodoPago: payment.metodoPago,
                lugarExpedicion,
                currency,
                exchangeRate,
                informacionGlobal: {
                    periodicidad: '04',
                    meses: mm,
                    anio: String(period.year),
                },
                emisor: {
                    rfc: fiscal.rfc,
                    nombre: fiscal.razon_social.trim().toUpperCase(),
                    regimenFiscal: fiscal.fiscal_regime,
                },
                receptor: {
                    rfc: PUBLIC_RFC,
                    nombre: PUBLIC_NAME,
                    domicilioFiscal: lugarExpedicion,
                    regimenFiscal: '616',
                    usoCfdi: 'S01',
                },
                lines,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo armar la factura';
            throw new common_1.BadRequestException(message);
        }
        const id = (0, crypto_1.randomUUID)();
        try {
            await this.globalRepo.insert({
                id,
                tenant_id: tenantId,
                fiscal_configuration_id: fiscal.id,
                period_year: period.year,
                period_month: period.month,
                status: 'pending',
                active_key: (0, global_invoice_util_1.globalInvoiceActiveKey)(fiscal.id, period.year, period.month),
                created_by: userId,
            });
        }
        catch (error) {
            if (this.isDuplicate(error)) {
                throw new common_1.BadRequestException('Este mes ya tiene una factura global.');
            }
            throw error;
        }
        let stamped = false;
        try {
            await this.linkRepo.insert(orders.map((order) => ({
                id: (0, crypto_1.randomUUID)(),
                global_invoice_id: id,
                sales_order_id: order.id,
            })));
            await this.electronicInvoiceService.assertNoActiveProductionInvoice(tenantId, 'global_invoices', id, dto.environment);
            const invoice = await this.electronicInvoiceService.stamp(tenantId, userId, {
                fiscal_configuration_id: fiscal.id,
                source_module: 'global_invoices',
                source_id: id,
                xml,
                rfc_receptor: PUBLIC_RFC,
                receptor_nombre: PUBLIC_NAME,
                rfc_emisor: fiscal.rfc,
                subtotal: Number((0, global_invoice_util_1.readXmlAttr)(xml, 'SubTotal')) || 0,
                total: Number((0, global_invoice_util_1.readXmlAttr)(xml, 'Total')) || 0,
                series: serie,
                folio,
                tipo_comprobante: 'I',
                currency,
                environment: dto.environment,
                invoice_role: 'standard',
                metadata: {
                    global_invoice: true,
                    month: `${period.year}-${mm}`,
                    order_ids: orders.map((order) => order.id),
                },
            });
            stamped = true;
            await this.globalRepo.update(id, {
                status: 'active',
                electronic_invoice_id: invoice.id,
            });
        }
        catch (error) {
            if (!stamped) {
                await this.linkRepo.delete({ global_invoice_id: id }).catch(() => undefined);
                await this.globalRepo.delete({ id }).catch(() => undefined);
            }
            throw error;
        }
        return this.get(tenantId, dto.month, fiscal.id);
    }
    async cancel(id, tenantId, userId) {
        const row = await this.globalRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!row) {
            throw new common_1.NotFoundException('Factura global no encontrada');
        }
        if (row.status === 'cancelled') {
            throw new common_1.BadRequestException('Esta factura global ya está cancelada');
        }
        if (row.status !== 'active' || !row.electronic_invoice_id) {
            throw new common_1.BadRequestException('Esta factura global todavía no se puede cancelar');
        }
        const invoice = await this.electronicInvoiceService.cancel(row.electronic_invoice_id, tenantId, userId, { motivo: '02' });
        if (invoice.stamp_status === 'cancelled' || invoice.sat_status === 'Cancelado') {
            await this.globalRepo.query(`UPDATE global_invoices
         SET status = 'cancelled', active_key = NULL
         WHERE id = ? AND tenant_id = ?`, [row.id, tenantId]);
        }
        const month = `${row.period_year}-${String(row.period_month).padStart(2, '0')}`;
        return this.get(tenantId, month, row.fiscal_configuration_id);
    }
    periodOrFail(month) {
        const period = (0, global_invoice_util_1.parseGlobalInvoiceMonth)(month);
        if (!period) {
            throw new common_1.BadRequestException('Indica el mes con formato AAAA-MM');
        }
        return period;
    }
    async findOpen(tenantId, fiscalConfigurationId, period) {
        const active = await this.globalRepo.findOne({
            where: {
                tenant_id: tenantId,
                fiscal_configuration_id: fiscalConfigurationId,
                period_year: period.year,
                period_month: period.month,
                status: 'active',
            },
        });
        if (active)
            return active;
        return this.globalRepo.findOne({
            where: {
                tenant_id: tenantId,
                fiscal_configuration_id: fiscalConfigurationId,
                period_year: period.year,
                period_month: period.month,
                status: 'pending',
            },
        });
    }
    async releaseStalePending(tenantId, fiscalConfigurationId, period) {
        const pending = await this.globalRepo.findOne({
            where: {
                tenant_id: tenantId,
                fiscal_configuration_id: fiscalConfigurationId,
                period_year: period.year,
                period_month: period.month,
                status: 'pending',
            },
        });
        if (!pending)
            return;
        const invoices = await this.electronicInvoiceService.findBySource(tenantId, 'global_invoices', pending.id);
        const vigente = invoices.find((invoice) => this.electronicInvoiceService.isCfdiVigente(invoice));
        if (vigente) {
            await this.globalRepo.update(pending.id, {
                status: 'active',
                electronic_invoice_id: vigente.id,
            });
            return;
        }
        const age = Date.now() - new Date(pending.created_at).getTime();
        if (age < PENDING_GRACE_MS)
            return;
        await this.linkRepo.delete({ global_invoice_id: pending.id });
        await this.globalRepo.delete({ id: pending.id });
    }
    async loadUninvoicedOrders(tenantId, fiscalConfigurationId, period) {
        const orders = await this.loadOrderEntities(tenantId, fiscalConfigurationId, period, true);
        return this.toRows(tenantId, orders);
    }
    async loadLinkedOrders(tenantId, globalInvoiceId) {
        const links = await this.linkRepo.find({ where: { global_invoice_id: globalInvoiceId } });
        if (!links.length)
            return [];
        const orders = await this.salesOrderRepo.find({
            where: { tenant_id: tenantId, id: (0, typeorm_2.In)(links.map((link) => link.sales_order_id)) },
            relations: {
                customer: true,
                billing_branch: true,
                line_items: { product: true, product_uom: { uom: true } },
            },
            order: { created_at: 'ASC' },
        });
        return this.toRows(tenantId, orders);
    }
    loadOrderEntities(tenantId, fiscalConfigurationId, period, onlyUninvoiced) {
        const qb = this.salesOrderRepo
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.customer', 'customer')
            .leftJoinAndSelect('so.billing_branch', 'branch')
            .leftJoinAndSelect('so.line_items', 'line')
            .leftJoinAndSelect('line.product', 'product')
            .leftJoinAndSelect('line.product_uom', 'product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.fiscal_configuration_id = :fiscalId', { fiscalId: fiscalConfigurationId })
            .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
            .andWhere(`DATE(CONVERT_TZ(so.created_at, '+00:00', 'America/Tijuana')) BETWEEN :from AND :to`, { from: period.from, to: period.to })
            .orderBy('so.created_at', 'ASC')
            .addOrderBy('so.folio', 'ASC');
        if (onlyUninvoiced) {
            qb.andWhere(`NOT EXISTS (
        SELECT 1 FROM electronic_invoices ei
        WHERE ei.tenant_id = so.tenant_id
          AND ei.source_module = 'sales_orders'
          AND ei.source_id = so.id
          AND ei.tipo_comprobante = 'I'
          AND (ei.sat_status IS NULL OR ei.sat_status <> 'Cancelado')
          AND (
            ei.sat_status = 'Vigente'
            OR ei.stamp_status IN ('stamped', 'cancel_pending', 'cancel_error')
          )
      )`).andWhere(`NOT EXISTS (
        SELECT 1 FROM global_invoice_orders gio
        INNER JOIN global_invoices gi ON gi.id = gio.global_invoice_id
        WHERE gio.sales_order_id = so.id
          AND gi.tenant_id = so.tenant_id
          AND gi.status IN ('pending', 'active')
      )`);
        }
        return qb.getMany();
    }
    async toRows(tenantId, orders) {
        if (!orders.length)
            return [];
        const ids = orders.map((order) => order.id);
        const [payments, collections] = await Promise.all([
            this.paymentRepo.find({ where: { tenant_id: tenantId, sales_order_id: (0, typeorm_2.In)(ids) } }),
            this.collectionRepo.find({ where: { tenant_id: tenantId, sales_order_id: (0, typeorm_2.In)(ids) } }),
        ]);
        const paymentsByOrder = new Map();
        for (const payment of payments) {
            const list = paymentsByOrder.get(payment.sales_order_id) ?? [];
            list.push(payment);
            paymentsByOrder.set(payment.sales_order_id, list);
        }
        const collectionByOrder = new Map(collections.map((item) => [item.sales_order_id, item]));
        return orders.map((order) => {
            const display = (0, sales_order_payment_display_util_1.buildSalesOrderPaymentDisplay)({
                collection: collectionByOrder.get(order.id) ?? null,
                payments: paymentsByOrder.get(order.id) ?? [],
                isCredit: order.is_credit,
            });
            const names = customerLabels(order);
            const branch = order.billing_branch;
            return {
                id: order.id,
                folio: order.folio,
                created_at: toIso(order.created_at),
                customer_name: names.name,
                company_name: names.company,
                branch_label: branch ? `${branch.city} (${branch.code})` : null,
                general_status: order.general_status,
                payment_status: order.payment_status,
                currency: (order.currency || 'MXN').toUpperCase(),
                subtotal: round2(Number(order.subtotal) || 0),
                iva_total: round2(Number(order.iva_total) || 0),
                ieps_total: round2(Number(order.ieps_total) || 0),
                discount_total: round2(Number(order.discount_total) || 0),
                total: round2(Number(order.total) || 0),
                payment_method: display.payment_method,
                payment_method_label: display.payment_method_label,
                payment_breakdown_label: display.payment_breakdown_label,
                payment_lines: display.lines,
            };
        });
    }
    async paymentSnapshots(tenantId, orders) {
        const rows = await this.toRows(tenantId, orders);
        return rows.map((row) => ({
            payment_status: row.payment_status,
            payment_method: row.payment_method,
            lines: row.payment_lines,
        }));
    }
    assertSelection(orders, orderIds) {
        const current = new Set(orders.map((order) => order.id));
        const wanted = new Set(orderIds);
        const same = current.size === wanted.size && [...current].every((id) => wanted.has(id));
        if (!same) {
            throw new common_1.BadRequestException('Selecciona todas las órdenes sin facturar de este mes. La lista cambió: vuelve a cargarla.');
        }
    }
    singleCurrency(orders) {
        const currencies = [...new Set(orders.map((order) => (order.currency || 'MXN').toUpperCase()))];
        if (currencies.length !== 1) {
            throw new common_1.BadRequestException('Este mes tiene órdenes en pesos y en dólares. La factura global es un solo comprobante y solo puede llevar una moneda.');
        }
        return currencies[0];
    }
    exchangeRate(orders, currency) {
        if (currency === 'MXN')
            return null;
        const missing = orders.find((order) => !(Number(order.exchange_rate) > 0));
        if (missing) {
            throw new common_1.BadRequestException(`La orden ${missing.folio} no tiene tipo de cambio.`);
        }
        return Number(orders[orders.length - 1].exchange_rate);
    }
    lugarExpedicion(orders, branches) {
        const counts = new Map();
        for (const order of orders) {
            const postal = (0, global_invoice_util_1.fiveDigitPostalCode)(order.billing_branch?.postal_code);
            if (!postal)
                continue;
            counts.set(postal, (counts.get(postal) ?? 0) + 1);
        }
        let best = '';
        let bestCount = 0;
        for (const [postal, count] of counts) {
            if (count > bestCount) {
                best = postal;
                bestCount = count;
            }
        }
        if (best)
            return best;
        for (const branch of branches) {
            const postal = (0, global_invoice_util_1.fiveDigitPostalCode)(branch.postal_code);
            if (postal)
                return postal;
        }
        throw new common_1.BadRequestException('La sucursal no tiene código postal de 5 dígitos para expedir la factura.');
    }
    conceptLines(orders, fiscal) {
        const ivaOn = (0, fiscal_tax_policy_util_1.isFiscalFlagOn)(fiscal.iva_enabled, true);
        const iepsOn = (0, fiscal_tax_policy_util_1.isFiscalFlagOn)(fiscal.ieps_enabled, true);
        const lines = [];
        for (const order of orders) {
            const raw = (order.line_items ?? []).filter((line) => Number(line.quantity) > 0);
            if (!raw.length) {
                throw new common_1.BadRequestException(`La orden ${order.folio} no tiene partidas para facturar`);
            }
            const gross = raw.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unit_price), 0);
            const extra = Number(order.global_discount_amount) || 0;
            for (const line of raw) {
                lines.push(conceptFromLine(order.folio, line, extra, gross, ivaOn, iepsOn));
            }
        }
        return lines;
    }
    async toCard(tenantId, row) {
        if (!row)
            return null;
        const invoice = row.electronic_invoice_id
            ? await this.invoiceRepo.findOne({
                where: { id: row.electronic_invoice_id, tenant_id: tenantId },
            })
            : null;
        const vigente = invoice ? this.electronicInvoiceService.isCfdiVigente(invoice) : false;
        return {
            id: row.id,
            status: row.status,
            electronic_invoice_id: invoice?.id ?? row.electronic_invoice_id,
            series: invoice?.series ?? null,
            folio: invoice?.folio ?? null,
            uuid: invoice?.uuid ?? null,
            subtotal: round2(Number(invoice?.subtotal) || 0),
            total: round2(Number(invoice?.total) || 0),
            currency: (invoice?.currency || 'MXN').toUpperCase(),
            stamp_status: invoice?.stamp_status ?? null,
            sat_status: invoice?.sat_status ?? null,
            can_cancel: row.status === 'active' && vigente && invoice?.stamp_status !== 'cancel_pending',
        };
    }
    isDuplicate(error) {
        if (!(error instanceof typeorm_2.QueryFailedError))
            return false;
        const driver = error
            .driverError;
        return driver?.errno === 1062 || driver?.code === 'ER_DUP_ENTRY';
    }
};
exports.GlobalInvoiceService = GlobalInvoiceService;
exports.GlobalInvoiceService = GlobalInvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(global_invoice_entity_1.GlobalInvoice)),
    __param(1, (0, typeorm_1.InjectRepository)(global_invoice_order_entity_1.GlobalInvoiceOrder)),
    __param(2, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(3, (0, typeorm_1.InjectRepository)(sales_order_payment_entity_1.SalesOrderPayment)),
    __param(4, (0, typeorm_1.InjectRepository)(pos_sale_collection_entity_1.PosSaleCollection)),
    __param(5, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __param(6, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(7, (0, typeorm_1.InjectRepository)(electronic_invoice_entity_1.ElectronicInvoice)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        electronic_invoice_service_1.ElectronicInvoiceService])
], GlobalInvoiceService);
function conceptFromLine(folio, line, globalDiscount, gross, ivaOn, iepsOn) {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unit_price) || 0;
    const share = gross > 0 ? ((qty * price) / gross) * globalDiscount : 0;
    const extraUnit = qty > 0 ? share / qty : 0;
    const name = line.custom_description?.trim() || line.product?.name || 'PRODUCTO';
    return {
        identifier: folio,
        description: `${folio} · ${name}`.slice(0, 1000),
        quantity: qty,
        unitPrice: price,
        discountUnit: (Number(line.discount_unit) || 0) + extraUnit,
        ivaPercentage: ivaOn ? Number(line.iva_percentage) || 0 : 0,
        iepsPercentage: iepsOn ? Number(line.ieps_percentage) || 0 : 0,
        satClave: line.product?.sat_clave,
        uomName: line.product_uom?.uom?.name,
    };
}
function customerLabels(order) {
    const walkIn = order.walk_in_name?.trim();
    const company = order.customer?.company_name?.trim() || null;
    const person = [order.customer?.name, order.customer?.lastname].filter(Boolean).join(' ').trim();
    if (walkIn) {
        return { name: walkIn, company: company && company !== walkIn ? company : null };
    }
    if (person && company && person !== company) {
        return { name: person, company };
    }
    return {
        name: person || company || (0, pos_sale_collection_mapper_1.formatCustomerDisplayName)(order.customer) || 'Público en general',
        company: null,
    };
}
function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function toIso(value) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}
//# sourceMappingURL=global-invoice.service.js.map