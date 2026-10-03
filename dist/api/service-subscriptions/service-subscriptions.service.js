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
exports.ServiceSubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const service_subscription_entity_1 = require("../../entities/service-subscriptions/service-subscription.entity");
const service_subscription_period_entity_1 = require("../../entities/service-subscriptions/service-subscription-period.entity");
const service_subscription_status_enum_1 = require("../../entities/service-subscriptions/service-subscription-status.enum");
const service_subscription_period_status_enum_1 = require("../../entities/service-subscriptions/service-subscription-period-status.enum");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const product_entity_1 = require("../../entities/products/product.entity");
const product_uom_entity_1 = require("../../entities/products/product-uom.entity");
const product_item_kind_enum_1 = require("../../entities/products/product-item-kind.enum");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const service_subscription_constants_1 = require("./service-subscription.constants");
const service_subscription_billing_service_1 = require("./service-subscription-billing.service");
const service_subscription_months_util_1 = require("./utils/service-subscription-months.util");
let ServiceSubscriptionsService = class ServiceSubscriptionsService {
    subscriptionRepo;
    periodRepo;
    customerRepo;
    productRepo;
    productUomRepo;
    branchRepo;
    salesOrderRepo;
    billing;
    constructor(subscriptionRepo, periodRepo, customerRepo, productRepo, productUomRepo, branchRepo, salesOrderRepo, billing) {
        this.subscriptionRepo = subscriptionRepo;
        this.periodRepo = periodRepo;
        this.customerRepo = customerRepo;
        this.productRepo = productRepo;
        this.productUomRepo = productUomRepo;
        this.branchRepo = branchRepo;
        this.salesOrderRepo = salesOrderRepo;
        this.billing = billing;
    }
    async list(tenantId, query) {
        this.assertVexia(tenantId);
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const qb = this.subscriptionRepo
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.customer', 'customer')
            .where('subscription.tenant_id = :tenantId', { tenantId })
            .orderBy('subscription.start_month', 'DESC')
            .addOrderBy('subscription.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (query.status) {
            qb.andWhere('subscription.status = :status', { status: query.status });
        }
        if (query.search?.trim()) {
            qb.andWhere(`(subscription.title LIKE :search OR customer.name LIKE :search OR customer.lastname LIKE :search OR customer.company_name LIKE :search OR customer.fiscal_razon_social LIKE :search)`, { search: `%${query.search.trim()}%` });
        }
        const [rows, total] = await qb.getManyAndCount();
        const ids = rows.map((row) => row.id);
        const counts = await this.periodCounts(ids);
        return {
            data: rows.map((row) => this.toListItem(row, counts.get(row.id))),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
        };
    }
    async getOne(tenantId, id) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        return this.toDetail(subscription);
    }
    async create(tenantId, userId, dto) {
        this.assertVexia(tenantId);
        await this.assertReferences(tenantId, dto);
        const months = (0, service_subscription_months_util_1.listPeriodMonths)(dto.start_month, dto.end_month);
        const subscription = this.subscriptionRepo.create({
            id: (0, crypto_1.randomUUID)(),
            tenant_id: tenantId,
            customer_id: dto.customer_id,
            title: dto.title.trim(),
            monthly_amount: dto.monthly_amount,
            iva_percentage: dto.iva_percentage ?? 16,
            fiscal_configuration_id: dto.fiscal_configuration_id,
            billing_branch_id: dto.billing_branch_id,
            product_id: dto.product_id,
            product_uom_id: dto.product_uom_id,
            start_month: months[0],
            end_month: months[months.length - 1],
            billing_day: dto.billing_day ?? 1,
            status: service_subscription_status_enum_1.ServiceSubscriptionStatus.Active,
            uso_cfdi: (dto.uso_cfdi || 'G03').toUpperCase(),
            forma_pago: dto.forma_pago || '99',
            metodo_pago: (dto.metodo_pago || 'PPD').toUpperCase(),
            regimen_fiscal_receptor: dto.regimen_fiscal_receptor || '601',
            notes: dto.notes?.trim() || null,
            created_by: userId,
        });
        await this.subscriptionRepo.save(subscription);
        await this.periodRepo.save(months.map((month) => this.periodRepo.create({
            id: (0, crypto_1.randomUUID)(),
            tenant_id: tenantId,
            subscription_id: subscription.id,
            period_month: month,
            amount: dto.monthly_amount,
            status: service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Pending,
            linked_manually: false,
        })));
        return this.getOne(tenantId, subscription.id);
    }
    async update(tenantId, id, dto) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        if (subscription.status === service_subscription_status_enum_1.ServiceSubscriptionStatus.Cancelled) {
            throw new common_1.BadRequestException('La suscripción está cancelada');
        }
        if (dto.title !== undefined)
            subscription.title = dto.title.trim();
        if (dto.iva_percentage !== undefined)
            subscription.iva_percentage = dto.iva_percentage;
        if (dto.billing_day !== undefined)
            subscription.billing_day = dto.billing_day;
        if (dto.uso_cfdi !== undefined)
            subscription.uso_cfdi = dto.uso_cfdi.toUpperCase();
        if (dto.forma_pago !== undefined)
            subscription.forma_pago = dto.forma_pago;
        if (dto.metodo_pago !== undefined)
            subscription.metodo_pago = dto.metodo_pago.toUpperCase();
        if (dto.regimen_fiscal_receptor !== undefined) {
            subscription.regimen_fiscal_receptor = dto.regimen_fiscal_receptor;
        }
        if (dto.notes !== undefined)
            subscription.notes = dto.notes.trim() || null;
        if (dto.monthly_amount !== undefined) {
            subscription.monthly_amount = dto.monthly_amount;
            await this.periodRepo
                .createQueryBuilder()
                .update(service_subscription_period_entity_1.ServiceSubscriptionPeriod)
                .set({ amount: dto.monthly_amount })
                .where('subscription_id = :id', { id })
                .andWhere('status = :status', { status: service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Pending })
                .execute();
        }
        await this.subscriptionRepo.save(subscription);
        return this.getOne(tenantId, id);
    }
    async cancel(tenantId, id) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        subscription.status = service_subscription_status_enum_1.ServiceSubscriptionStatus.Cancelled;
        await this.subscriptionRepo.save(subscription);
        return this.getOne(tenantId, id);
    }
    async renew(tenantId, userId, id, dto) {
        this.assertVexia(tenantId);
        const current = await this.loadSubscription(tenantId, id);
        if (current.status === service_subscription_status_enum_1.ServiceSubscriptionStatus.Cancelled) {
            throw new common_1.BadRequestException('No se puede renovar una suscripción cancelada');
        }
        const start = dto.start_month
            ? (0, service_subscription_months_util_1.normalizeMonthStart)(dto.start_month)
            : (0, service_subscription_months_util_1.addMonths)(String(current.end_month), 1);
        const previousLength = (0, service_subscription_months_util_1.listPeriodMonths)(String(current.start_month), String(current.end_month)).length;
        const end = dto.end_month
            ? (0, service_subscription_months_util_1.normalizeMonthStart)(dto.end_month)
            : (0, service_subscription_months_util_1.addMonths)(start, previousLength - 1);
        const created = await this.create(tenantId, userId, {
            customer_id: current.customer_id,
            title: current.title,
            monthly_amount: dto.monthly_amount ?? Number(current.monthly_amount),
            iva_percentage: Number(current.iva_percentage),
            fiscal_configuration_id: current.fiscal_configuration_id,
            billing_branch_id: current.billing_branch_id,
            product_id: current.product_id,
            product_uom_id: current.product_uom_id,
            start_month: start,
            end_month: end,
            billing_day: current.billing_day,
            uso_cfdi: current.uso_cfdi,
            forma_pago: current.forma_pago,
            metodo_pago: current.metodo_pago,
            regimen_fiscal_receptor: current.regimen_fiscal_receptor,
            notes: current.notes ?? undefined,
        });
        await this.subscriptionRepo.update(created.id, { renewed_from_id: current.id });
        if (current.status === service_subscription_status_enum_1.ServiceSubscriptionStatus.Active) {
            const pending = (current.periods ?? []).some((period) => period.status === service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Pending);
            if (!pending) {
                current.status = service_subscription_status_enum_1.ServiceSubscriptionStatus.Completed;
                await this.subscriptionRepo.save(current);
            }
        }
        return this.getOne(tenantId, created.id);
    }
    async generate(tenantId, userId, id, periodId) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        const period = this.findPeriod(subscription, periodId);
        await this.billing.generatePeriod(subscription, period, userId);
        return this.getOne(tenantId, id);
    }
    async invoice(tenantId, userId, id, periodId) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        const period = this.findPeriod(subscription, periodId);
        await this.billing.stampPeriod(subscription, period, userId);
        return this.getOne(tenantId, id);
    }
    async link(tenantId, id, periodId, dto) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        const period = this.findPeriod(subscription, periodId);
        if (period.status === service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Skipped) {
            throw new common_1.BadRequestException('Ese mes está omitido');
        }
        if (period.sales_order_id && period.sales_order_id !== dto.sales_order_id) {
            throw new common_1.BadRequestException('Ese mes ya tiene una orden. Quítala antes de vincular otra');
        }
        const order = await this.salesOrderRepo.findOne({
            where: { id: dto.sales_order_id, tenant_id: tenantId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden de venta no encontrada');
        }
        if (order.customer_id !== subscription.customer_id) {
            throw new common_1.BadRequestException('La orden es de otro cliente');
        }
        if (order.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede vincular una orden cancelada');
        }
        const taken = await this.periodRepo.findOne({
            where: { sales_order_id: order.id },
        });
        if (taken && taken.id !== period.id) {
            throw new common_1.BadRequestException('Esa orden ya está ligada a otro mes');
        }
        if (dto.align_date !== false) {
            const date = (0, service_subscription_months_util_1.billingDate)(String(period.period_month), subscription.billing_day);
            await this.billing.alignOrderDate(order.id, tenantId, date);
        }
        const invoice = await this.billing.findVigenteInvoice(tenantId, order.id);
        period.sales_order_id = order.id;
        period.linked_manually = true;
        period.generated_at = period.generated_at ?? new Date();
        period.electronic_invoice_id = invoice?.id ?? null;
        period.status = invoice
            ? service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Invoiced
            : service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Linked;
        period.invoice_error = null;
        await this.periodRepo.save(period);
        return this.getOne(tenantId, id);
    }
    async skip(tenantId, id, periodId) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        const period = this.findPeriod(subscription, periodId);
        if (period.sales_order_id) {
            throw new common_1.BadRequestException('Quita la orden antes de omitir el mes');
        }
        period.status = service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Skipped;
        await this.periodRepo.save(period);
        return this.getOne(tenantId, id);
    }
    async unlink(tenantId, id, periodId) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        const period = this.findPeriod(subscription, periodId);
        if (period.status === service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Invoiced) {
            throw new common_1.BadRequestException('Ese mes ya está facturado. No se puede desvincular');
        }
        period.sales_order_id = null;
        period.electronic_invoice_id = null;
        period.linked_manually = false;
        period.invoice_error = null;
        period.generated_at = null;
        period.status = service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Pending;
        await this.periodRepo.save(period);
        return this.getOne(tenantId, id);
    }
    async assertReferences(tenantId, dto) {
        const customer = await this.customerRepo.findOne({
            where: { id: dto.customer_id, tenant_id: tenantId },
        });
        if (!customer) {
            throw new common_1.BadRequestException('Cliente no encontrado');
        }
        const product = await this.productRepo.findOne({
            where: { id: dto.product_id, tenant_id: tenantId },
        });
        if (!product || product.item_kind !== product_item_kind_enum_1.ProductItemKind.Service) {
            throw new common_1.BadRequestException('Elige un producto de tipo servicio');
        }
        const uom = await this.productUomRepo.findOne({
            where: { id: dto.product_uom_id, product_id: product.id },
        });
        if (!uom) {
            throw new common_1.BadRequestException('La unidad no pertenece a ese servicio');
        }
        const branch = await this.branchRepo.findOne({
            where: { id: dto.billing_branch_id },
            relations: ['fiscal_configuration'],
        });
        if (!branch || branch.fiscal_configuration?.tenant_id !== tenantId) {
            throw new common_1.BadRequestException('Sucursal no encontrada');
        }
        if (branch.fiscal_configuration_id !== dto.fiscal_configuration_id) {
            throw new common_1.BadRequestException('La sucursal no pertenece a la razón social seleccionada');
        }
    }
    async loadSubscription(tenantId, id) {
        const subscription = await this.subscriptionRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['customer', 'periods', 'periods.sales_order'],
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Suscripción no encontrada');
        }
        subscription.periods = (subscription.periods ?? []).sort((a, b) => String(a.period_month).localeCompare(String(b.period_month)));
        return subscription;
    }
    findPeriod(subscription, periodId) {
        const period = (subscription.periods ?? []).find((item) => item.id === periodId);
        if (!period) {
            throw new common_1.NotFoundException('Mes no encontrado');
        }
        return period;
    }
    async periodCounts(ids) {
        const map = new Map();
        if (!ids.length)
            return map;
        const rows = await this.periodRepo
            .createQueryBuilder('period')
            .select('period.subscription_id', 'subscription_id')
            .addSelect('COUNT(period.id)', 'total')
            .addSelect(`SUM(CASE WHEN period.status IN ('linked', 'invoiced') THEN 1 ELSE 0 END)`, 'covered')
            .where('period.subscription_id IN (:...ids)', { ids })
            .groupBy('period.subscription_id')
            .getRawMany();
        for (const row of rows) {
            map.set(row.subscription_id, {
                total: Number(row.total) || 0,
                covered: Number(row.covered) || 0,
            });
        }
        return map;
    }
    customerName(customer) {
        if (!customer)
            return '';
        const person = [customer.name, customer.lastname].filter(Boolean).join(' ').trim();
        return customer.fiscal_razon_social || customer.company_name || person;
    }
    toListItem(row, counts) {
        return {
            id: row.id,
            title: row.title,
            customer_id: row.customer_id,
            customer_name: this.customerName(row.customer),
            monthly_amount: Number(row.monthly_amount),
            iva_percentage: Number(row.iva_percentage),
            start_month: String(row.start_month).slice(0, 10),
            end_month: String(row.end_month).slice(0, 10),
            start_label: (0, service_subscription_months_util_1.formatPeriodLabel)(String(row.start_month)),
            end_label: (0, service_subscription_months_util_1.formatPeriodLabel)(String(row.end_month)),
            billing_day: row.billing_day,
            status: row.status,
            months_total: counts?.total ?? 0,
            months_covered: counts?.covered ?? 0,
        };
    }
    toDetail(subscription) {
        const covered = (subscription.periods ?? []).filter((period) => period.status === service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Linked ||
            period.status === service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Invoiced).length;
        return {
            ...this.toListItem(subscription, {
                total: subscription.periods?.length ?? 0,
                covered,
            }),
            fiscal_configuration_id: subscription.fiscal_configuration_id,
            billing_branch_id: subscription.billing_branch_id,
            product_id: subscription.product_id,
            product_uom_id: subscription.product_uom_id,
            uso_cfdi: subscription.uso_cfdi,
            forma_pago: subscription.forma_pago,
            metodo_pago: subscription.metodo_pago,
            regimen_fiscal_receptor: subscription.regimen_fiscal_receptor,
            notes: subscription.notes,
            renewed_from_id: subscription.renewed_from_id,
            periods: (subscription.periods ?? []).map((period) => ({
                id: period.id,
                period_month: String(period.period_month).slice(0, 10),
                label: (0, service_subscription_months_util_1.formatPeriodLabel)(String(period.period_month)),
                amount: Number(period.amount),
                status: period.status,
                sales_order_id: period.sales_order_id,
                sales_order_folio: period.sales_order?.folio ?? null,
                electronic_invoice_id: period.electronic_invoice_id,
                linked_manually: period.linked_manually,
                invoice_error: period.invoice_error,
            })),
        };
    }
    assertVexia(tenantId) {
        if (tenantId !== service_subscription_constants_1.VEXIA_TENANT_ID) {
            throw new common_1.ForbiddenException('Las suscripciones de servicio solo están disponibles para Vexia.');
        }
    }
};
exports.ServiceSubscriptionsService = ServiceSubscriptionsService;
exports.ServiceSubscriptionsService = ServiceSubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_subscription_entity_1.ServiceSubscription)),
    __param(1, (0, typeorm_1.InjectRepository)(service_subscription_period_entity_1.ServiceSubscriptionPeriod)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(3, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(4, (0, typeorm_1.InjectRepository)(product_uom_entity_1.ProductUoM)),
    __param(5, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(6, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        service_subscription_billing_service_1.ServiceSubscriptionBillingService])
], ServiceSubscriptionsService);
//# sourceMappingURL=service-subscriptions.service.js.map