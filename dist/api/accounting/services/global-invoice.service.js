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
var GlobalInvoiceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalInvoiceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const billing_branch_entity_1 = require("../../../entities/billing/billing-branch.entity");
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
const public_invoice_policy_util_1 = require("../utils/public-invoice-policy.util");
const PUBLIC_RFC = 'XAXX010101000';
const PUBLIC_NAME = 'PUBLICO EN GENERAL';
const PENDING_GRACE_MS = 120_000;
let GlobalInvoiceService = GlobalInvoiceService_1 = class GlobalInvoiceService {
    globalRepo;
    linkRepo;
    salesOrderRepo;
    paymentRepo;
    collectionRepo;
    branchRepo;
    invoiceRepo;
    electronicInvoiceService;
    logger = new common_1.Logger(GlobalInvoiceService_1.name);
    constructor(globalRepo, linkRepo, salesOrderRepo, paymentRepo, collectionRepo, branchRepo, invoiceRepo, electronicInvoiceService) {
        this.globalRepo = globalRepo;
        this.linkRepo = linkRepo;
        this.salesOrderRepo = salesOrderRepo;
        this.paymentRepo = paymentRepo;
        this.collectionRepo = collectionRepo;
        this.branchRepo = branchRepo;
        this.invoiceRepo = invoiceRepo;
        this.electronicInvoiceService = electronicInvoiceService;
    }
    async get(tenantId, month, billingBranchId) {
        const period = this.periodOrFail(month);
        const branches = await this.listBranches(tenantId, billingBranchId);
        const options = this.branchOptions(branches);
        const branch = branches.find((item) => item.id === billingBranchId) ??
            (branches.length === 1 ? branches[0] : null);
        if (!branch?.fiscal_configuration || branch.fiscal_configuration.tenant_id !== tenantId) {
            return this.emptyPage(period, options, options.length ? 'Selecciona la sucursal.' : 'No hay sucursales para facturar.');
        }
        const fiscal = branch.fiscal_configuration;
        await this.releaseStalePending(tenantId, branch, period);
        const open = (await this.findOpen(tenantId, branch.id, period)) ??
            (await this.findLegacyOpen(tenantId, branch, period));
        const cancelled = await this.globalRepo.findOne({
            where: {
                tenant_id: tenantId,
                billing_branch_id: branch.id,
                period_year: period.year,
                period_month: period.month,
                status: 'cancelled',
            },
            order: { created_at: 'DESC' },
        });
        const orders = open
            ? await this.loadLinkedOrders(tenantId, open.id)
            : await this.loadUninvoicedOrders(tenantId, branch, period);
        const invoice = await this.toCard(tenantId, open);
        const cancelledInvoice = open?.status === 'active' ? null : await this.toCard(tenantId, cancelled);
        const currencies = [
            ...new Set(orders.map((order) => order.currency || 'MXN')),
        ];
        const currency = currencies.length === 1 ? currencies[0] : null;
        let blocked = null;
        if (fiscal.finkok_registration_status !== 'registered' || !fiscal.fiscal_regime) {
            blocked = 'La razón social de esta sucursal aún no puede timbrar.';
        }
        else if (open?.status === 'pending') {
            blocked = 'Hay una factura a público en general en proceso para esta sucursal.';
        }
        else if (!open && currencies.length > 1) {
            blocked =
                'Esta sucursal tiene órdenes en pesos y en dólares. La factura a público en general es un solo comprobante y solo puede llevar una moneda.';
        }
        const total = currency
            ? round2(orders.reduce((sum, order) => sum + order.total, 0))
            : null;
        return {
            month: `${period.year}-${String(period.month).padStart(2, '0')}`,
            period_label: period.label,
            branches: options,
            billing_branch_id: branch.id,
            fiscal_configuration_id: fiscal.id,
            invoice,
            cancelled_invoice: cancelledInvoice,
            orders,
            orders_count: orders.length,
            orders_total: total,
            currency,
            can_generate: !open && orders.length > 0 && !blocked,
            blocked_reason: blocked,
            policy: (0, public_invoice_policy_util_1.toPublicInvoicePolicyView)(fiscal),
        };
    }
    async generate(tenantId, userId, dto, options) {
        const period = this.periodOrFail(dto.month);
        const branch = await this.branchRepo.findOne({
            where: { id: dto.billing_branch_id },
            relations: { fiscal_configuration: true },
        });
        const fiscal = branch?.fiscal_configuration;
        if (!branch || !fiscal || fiscal.tenant_id !== tenantId) {
            throw new common_1.NotFoundException('Sucursal no encontrada');
        }
        if (fiscal.finkok_registration_status !== 'registered' || !fiscal.fiscal_regime) {
            throw new common_1.BadRequestException('La razón social de esta sucursal aún no puede timbrar.');
        }
        await this.releaseStalePending(tenantId, branch, period);
        const open = (await this.findOpen(tenantId, branch.id, period)) ??
            (await this.findLegacyOpen(tenantId, branch, period));
        if (open?.status === 'active') {
            throw new common_1.BadRequestException('Esta sucursal ya tiene una factura a público en general en este mes.');
        }
        if (open?.status === 'pending') {
            throw new common_1.BadRequestException('Hay una factura a público en general en proceso para esta sucursal.');
        }
        const orders = await this.loadOrderEntities(tenantId, branch, period, true);
        this.assertSelection(orders, dto.order_ids);
        const currency = this.singleCurrency(orders);
        const exchangeRate = this.exchangeRate(orders, currency);
        const lugarExpedicion = this.lugarExpedicion(branch);
        const mm = String(period.month).padStart(2, '0');
        const folio = await this.nextFolio(tenantId, fiscal.id, period);
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
                billing_branch_id: branch.id,
                period_year: period.year,
                period_month: period.month,
                status: 'pending',
                active_key: (0, global_invoice_util_1.globalInvoiceActiveKey)(branch.id, period.year, period.month),
                created_by: userId,
            });
        }
        catch (error) {
            if (this.isDuplicate(error)) {
                throw new common_1.BadRequestException('Esta sucursal ya tiene una factura a público en general en este mes.');
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
                    billing_branch_id: branch.id,
                    order_ids: orders.map((order) => order.id),
                },
            });
            stamped = true;
            await this.globalRepo.update(id, {
                status: 'active',
                electronic_invoice_id: invoice.id,
                ...(options?.processFolio ? { process_folio: options.processFolio } : {}),
            });
            if (options?.processFolio) {
                await this.appendProcessNote(tenantId, orders.map((order) => order.id), options.processFolio);
            }
        }
        catch (error) {
            if (!stamped) {
                await this.linkRepo.delete({ global_invoice_id: id }).catch(() => undefined);
                await this.globalRepo.delete({ id }).catch(() => undefined);
            }
            throw error;
        }
        return this.get(tenantId, dto.month, branch.id);
    }
    async stampAutomaticBranch(tenantId, billingBranchId, month, processFolio, environment) {
        const period = this.periodOrFail(month);
        const branch = await this.branchRepo.findOne({
            where: { id: billingBranchId },
            relations: { fiscal_configuration: true },
        });
        const fiscal = branch?.fiscal_configuration;
        if (!branch || !fiscal || fiscal.tenant_id !== tenantId) {
            throw new common_1.NotFoundException('Sucursal no encontrada');
        }
        await this.releaseStalePending(tenantId, branch, period);
        const open = (await this.findOpen(tenantId, branch.id, period)) ??
            (await this.findLegacyOpen(tenantId, branch, period));
        if (open)
            return 'already_open';
        const orders = await this.loadOrderEntities(tenantId, branch, period, true);
        if (!orders.length)
            return 'empty';
        await this.generate(tenantId, null, {
            month,
            billing_branch_id: branch.id,
            order_ids: orders.map((order) => order.id),
            environment,
        }, { processFolio });
        return 'stamped';
    }
    async cancel(id, tenantId, userId) {
        const row = await this.globalRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!row) {
            throw new common_1.NotFoundException('Factura a público en general no encontrada');
        }
        if (row.status === 'cancelled') {
            throw new common_1.BadRequestException('Esta factura a público en general ya está cancelada');
        }
        if (row.status !== 'active' || !row.electronic_invoice_id) {
            throw new common_1.BadRequestException('Esta factura a público en general todavía no se puede cancelar');
        }
        const invoice = await this.electronicInvoiceService.cancel(row.electronic_invoice_id, tenantId, userId, { motivo: '02' });
        if (invoice.stamp_status === 'cancelled' || invoice.sat_status === 'Cancelado') {
            await this.globalRepo.query(`UPDATE global_invoices
         SET status = 'cancelled', active_key = NULL
         WHERE id = ? AND tenant_id = ?`, [row.id, tenantId]);
        }
        const month = `${row.period_year}-${String(row.period_month).padStart(2, '0')}`;
        const branchId = row.billing_branch_id ?? (await this.branchIdOfInvoice(row.id));
        return this.get(tenantId, month, branchId);
    }
    periodOrFail(month) {
        const period = (0, global_invoice_util_1.parseGlobalInvoiceMonth)(month);
        if (!period) {
            throw new common_1.BadRequestException('Indica el mes con formato AAAA-MM');
        }
        return period;
    }
    async findOpen(tenantId, billingBranchId, period) {
        const active = await this.globalRepo.findOne({
            where: {
                tenant_id: tenantId,
                billing_branch_id: billingBranchId,
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
                billing_branch_id: billingBranchId,
                period_year: period.year,
                period_month: period.month,
                status: 'pending',
            },
        });
    }
    findLegacyOpen(tenantId, branch, period) {
        return this.globalRepo
            .createQueryBuilder('gi')
            .where('gi.tenant_id = :tenantId', { tenantId })
            .andWhere('gi.fiscal_configuration_id = :fiscalId', {
            fiscalId: branch.fiscal_configuration_id,
        })
            .andWhere('gi.billing_branch_id IS NULL')
            .andWhere('gi.period_year = :year', { year: period.year })
            .andWhere('gi.period_month = :month', { month: period.month })
            .andWhere("gi.status IN ('pending', 'active')")
            .andWhere(`EXISTS (
          SELECT 1 FROM global_invoice_orders gio
          INNER JOIN inv_s_sales_orders so ON so.id = gio.sales_order_id
          WHERE gio.global_invoice_id = gi.id
            AND so.billing_branch_id = :branchId
        )`, { branchId: branch.id })
            .orderBy('gi.created_at', 'DESC')
            .getOne();
    }
    async releaseStalePending(tenantId, branch, period) {
        const pending = await this.globalRepo.findOne({
            where: {
                tenant_id: tenantId,
                billing_branch_id: branch.id,
                period_year: period.year,
                period_month: period.month,
                status: 'pending',
            },
        });
        await this.settlePending(tenantId, pending);
        const legacy = await this.globalRepo
            .createQueryBuilder('gi')
            .where('gi.tenant_id = :tenantId', { tenantId })
            .andWhere('gi.fiscal_configuration_id = :fiscalId', {
            fiscalId: branch.fiscal_configuration_id,
        })
            .andWhere('gi.billing_branch_id IS NULL')
            .andWhere('gi.period_year = :year', { year: period.year })
            .andWhere('gi.period_month = :month', { month: period.month })
            .andWhere('gi.status = :status', { status: 'pending' })
            .andWhere(`EXISTS (
          SELECT 1 FROM global_invoice_orders gio
          INNER JOIN inv_s_sales_orders so ON so.id = gio.sales_order_id
          WHERE gio.global_invoice_id = gi.id
            AND so.billing_branch_id = :branchId
        )`, { branchId: branch.id })
            .getOne();
        if (legacy && legacy.id !== pending?.id) {
            await this.settlePending(tenantId, legacy);
        }
    }
    async settlePending(tenantId, pending) {
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
    async loadUninvoicedOrders(tenantId, branch, period) {
        const orders = await this.loadOrderEntities(tenantId, branch, period, true);
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
    loadOrderEntities(tenantId, branch, period, onlyUninvoiced) {
        const qb = this.salesOrderRepo
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.customer', 'customer')
            .leftJoinAndSelect('so.billing_branch', 'branch')
            .leftJoinAndSelect('so.line_items', 'line')
            .leftJoinAndSelect('line.product', 'product')
            .leftJoinAndSelect('line.product_uom', 'product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.billing_branch_id = :branchId', { branchId: branch.id })
            .andWhere('so.fiscal_configuration_id = :fiscalId', {
            fiscalId: branch.fiscal_configuration_id,
        })
            .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
            .andWhere(`DATE(CONVERT_TZ(so.created_at, '+00:00', :timeZone)) BETWEEN :from AND :to`, {
            timeZone: (0, public_invoice_policy_util_1.readPublicInvoicePolicy)(branch.fiscal_configuration).timeZone,
            from: period.from,
            to: period.to,
        })
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
            throw new common_1.BadRequestException('Selecciona todas las órdenes sin facturar de esta sucursal. La lista cambió: vuelve a cargarla.');
        }
    }
    singleCurrency(orders) {
        const currencies = [...new Set(orders.map((order) => (order.currency || 'MXN').toUpperCase()))];
        if (currencies.length !== 1) {
            throw new common_1.BadRequestException('Esta sucursal tiene órdenes en pesos y en dólares. La factura a público en general es un solo comprobante y solo puede llevar una moneda.');
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
    lugarExpedicion(branch) {
        const postal = (0, global_invoice_util_1.fiveDigitPostalCode)(branch.postal_code);
        if (postal)
            return postal;
        throw new common_1.BadRequestException('La sucursal no tiene código postal de 5 dígitos para expedir la factura.');
    }
    async nextFolio(tenantId, fiscalConfigurationId, period) {
        const taken = await this.globalRepo.count({
            where: {
                tenant_id: tenantId,
                fiscal_configuration_id: fiscalConfigurationId,
                period_year: period.year,
                period_month: period.month,
            },
        });
        const mm = String(period.month).padStart(2, '0');
        return taken === 0 ? `${period.year}${mm}` : `${period.year}${mm}-${taken + 1}`;
    }
    async listBranches(tenantId, includeId) {
        const branches = await this.branchRepo
            .createQueryBuilder('branch')
            .innerJoinAndSelect('branch.fiscal_configuration', 'fiscal')
            .where('fiscal.tenant_id = :tenantId', { tenantId })
            .andWhere('branch.status = :status', { status: 1 })
            .orderBy('branch.city', 'ASC')
            .addOrderBy('branch.code', 'ASC')
            .getMany();
        if (includeId && !branches.some((branch) => branch.id === includeId)) {
            const extra = await this.branchRepo.findOne({
                where: { id: includeId },
                relations: { fiscal_configuration: true },
            });
            if (extra?.fiscal_configuration?.tenant_id === tenantId) {
                branches.unshift(extra);
            }
        }
        return branches;
    }
    branchOptions(branches) {
        const fiscals = new Set(branches.map((branch) => branch.fiscal_configuration_id));
        const showRfc = fiscals.size > 1;
        return branches.map((branch) => ({
            id: branch.id,
            label: this.branchLabel(branch, showRfc),
            fiscal_configuration_id: branch.fiscal_configuration_id,
        }));
    }
    branchLabel(branch, showRfc) {
        const place = `${branch.city} (${branch.code})`;
        const rfc = branch.fiscal_configuration?.rfc?.trim();
        return showRfc && rfc ? `${place} · ${rfc}` : place;
    }
    emptyPage(period, branches, blocked) {
        return {
            month: `${period.year}-${String(period.month).padStart(2, '0')}`,
            period_label: period.label,
            branches,
            billing_branch_id: null,
            fiscal_configuration_id: null,
            invoice: null,
            cancelled_invoice: null,
            orders: [],
            orders_count: 0,
            orders_total: null,
            currency: null,
            can_generate: false,
            blocked_reason: blocked,
            policy: null,
        };
    }
    async branchIdOfInvoice(globalInvoiceId) {
        const rows = await this.globalRepo.query(`SELECT so.billing_branch_id
       FROM global_invoice_orders gio
       INNER JOIN inv_s_sales_orders so ON so.id = gio.sales_order_id
       WHERE gio.global_invoice_id = ?
         AND so.billing_branch_id IS NOT NULL
       LIMIT 1`, [globalInvoiceId]);
        return rows[0]?.billing_branch_id ?? undefined;
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
            process_folio: row.process_folio ?? null,
        };
    }
    async appendProcessNote(tenantId, orderIds, folio) {
        if (!orderIds.length)
            return;
        const line = `Factura a público en general automática. Folio del proceso: ${folio}.`;
        const marks = orderIds.map(() => '?').join(', ');
        try {
            await this.salesOrderRepo.query(`UPDATE inv_s_sales_orders
         SET notes = CASE
           WHEN notes IS NULL OR TRIM(notes) = '' THEN ?
           WHEN notes LIKE ? THEN notes
           ELSE CONCAT(notes, CHAR(10), ?)
         END
         WHERE tenant_id = ? AND id IN (${marks})`, [line, `%${folio}%`, line, tenantId, ...orderIds]);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo anotar el folio';
            this.logger.warn(`Folio ${folio} no quedó en las notas: ${message}`);
        }
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
exports.GlobalInvoiceService = GlobalInvoiceService = GlobalInvoiceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(global_invoice_entity_1.GlobalInvoice)),
    __param(1, (0, typeorm_1.InjectRepository)(global_invoice_order_entity_1.GlobalInvoiceOrder)),
    __param(2, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(3, (0, typeorm_1.InjectRepository)(sales_order_payment_entity_1.SalesOrderPayment)),
    __param(4, (0, typeorm_1.InjectRepository)(pos_sale_collection_entity_1.PosSaleCollection)),
    __param(5, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(6, (0, typeorm_1.InjectRepository)(electronic_invoice_entity_1.ElectronicInvoice)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
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