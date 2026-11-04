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
exports.CustomerCreditService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const customer_credit_entity_1 = require("../../../entities/customers/customer-credit.entity");
const fiscal_configuration_entity_1 = require("../../../entities/billing/fiscal-configuration.entity");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const sales_order_payment_entity_1 = require("../../../entities/sales-orders/sales-order-payment.entity");
const electronic_invoice_entity_1 = require("../../../entities/electronic-invoicing/electronic-invoice.entity");
const quotation_entity_1 = require("../../../entities/quotations/quotation.entity");
const credit_note_util_1 = require("../../sales-orders/utils/credit-note.util");
const pos_sale_collection_mapper_1 = require("../../pos-shifts/mappers/pos-sale-collection.mapper");
const exchange_rate_service_1 = require("../../exchange-rate/exchange-rate.service");
const credit_currency_util_1 = require("../utils/credit-currency.util");
const customer_credit_util_1 = require("../utils/customer-credit.util");
const advance_credit_util_1 = require("../utils/advance-credit.util");
let CustomerCreditService = class CustomerCreditService {
    creditRepo;
    fiscalRepo;
    salesOrderRepo;
    paymentRepo;
    invoiceRepo;
    quotationRepo;
    exchangeRateService;
    constructor(creditRepo, fiscalRepo, salesOrderRepo, paymentRepo, invoiceRepo, quotationRepo, exchangeRateService) {
        this.creditRepo = creditRepo;
        this.fiscalRepo = fiscalRepo;
        this.salesOrderRepo = salesOrderRepo;
        this.paymentRepo = paymentRepo;
        this.invoiceRepo = invoiceRepo;
        this.quotationRepo = quotationRepo;
        this.exchangeRateService = exchangeRateService;
    }
    async listForCustomer(customer) {
        const fiscales = await this.fiscalRepo.find({
            where: { tenant_id: customer.tenant_id },
            order: { razon_social: 'ASC' },
        });
        const rows = await this.creditRepo.find({
            where: { tenant_id: customer.tenant_id, customer_id: customer.id },
        });
        const rowByFiscal = new Map(rows.map((row) => [row.fiscal_configuration_id, row]));
        const usedByFiscal = await this.getUsedByFiscal(customer.tenant_id, customer.id);
        return fiscales
            .map((fiscal) => {
            const row = rowByFiscal.get(fiscal.id);
            const used = usedByFiscal.get(fiscal.id) ?? 0;
            const include = fiscal.status === 'active' || Boolean(row) || used > 0;
            if (!include) {
                return null;
            }
            return this.toFiscalSnapshot(fiscal, row, used);
        })
            .filter((item) => item != null);
    }
    async consumeExceedWaiver(tenantId, customerId, fiscalConfigurationId) {
        await this.creditRepo.update({
            tenant_id: tenantId,
            customer_id: customerId,
            fiscal_configuration_id: fiscalConfigurationId,
            allow_credit_exceed: true,
        }, { allow_credit_exceed: false });
    }
    async getSnapshotForFiscal(customer, fiscalConfigurationId) {
        const [row, used] = await Promise.all([
            this.creditRepo.findOne({
                where: {
                    tenant_id: customer.tenant_id,
                    customer_id: customer.id,
                    fiscal_configuration_id: fiscalConfigurationId,
                },
            }),
            this.getUsedCredit(customer.tenant_id, customer.id, fiscalConfigurationId),
        ]);
        return (0, customer_credit_util_1.buildCreditSnapshot)({
            creditEnabled: Boolean(row?.credit_enabled),
            allowCreditExceed: Boolean(row?.allow_credit_exceed),
            creditDays: row?.credit_days,
            creditAmount: row?.credit_amount,
            creditCurrency: row?.credit_currency,
            creditUsed: used,
        });
    }
    async getUsedCredit(tenantId, customerId, fiscalConfigurationId) {
        const usedByFiscal = await this.getUsedByFiscal(tenantId, customerId);
        return usedByFiscal.get(fiscalConfigurationId) ?? 0;
    }
    async getEnabledByFiscalMap(tenantId, pairs) {
        const result = new Map();
        if (pairs.length === 0) {
            return result;
        }
        const customerIds = [...new Set(pairs.map((pair) => pair.customerId))];
        const rows = await this.creditRepo.find({
            where: {
                tenant_id: tenantId,
                customer_id: (0, typeorm_2.In)(customerIds),
                credit_enabled: true,
            },
            select: ['id', 'customer_id', 'fiscal_configuration_id', 'credit_enabled'],
        });
        const enabled = new Set(rows.map((row) => `${row.customer_id}:${row.fiscal_configuration_id}`));
        for (const pair of pairs) {
            const key = `${pair.customerId}:${pair.fiscalConfigurationId}`;
            result.set(key, enabled.has(key));
        }
        return result;
    }
    async upsertForAllActiveFiscales(customer, patch) {
        const fiscales = await this.fiscalRepo.find({
            where: { tenant_id: customer.tenant_id, status: 'active' },
        });
        if (fiscales.length === 0) {
            throw new common_1.BadRequestException('No hay razones sociales activas para asignar crédito');
        }
        return this.upsertMany(customer, fiscales.map((fiscal) => ({
            fiscal_configuration_id: fiscal.id,
            credit_enabled: patch.credit_enabled,
            credit_days: patch.credit_days,
            credit_amount: patch.credit_amount,
        })));
    }
    async upsertMany(customer, items) {
        if ((0, pos_sale_collection_mapper_1.isWalkInCustomer)(customer)) {
            throw new common_1.BadRequestException('El cliente de mostrador no puede tener crédito activo');
        }
        const fiscalIds = [...new Set(items.map((item) => item.fiscal_configuration_id))];
        if (fiscalIds.length !== items.length) {
            throw new common_1.BadRequestException('No se puede repetir la misma razón social en el mismo guardado');
        }
        const fiscales = await this.fiscalRepo.find({
            where: { tenant_id: customer.tenant_id, id: (0, typeorm_2.In)(fiscalIds) },
        });
        if (fiscales.length !== fiscalIds.length) {
            throw new common_1.BadRequestException('Razón social no válida');
        }
        const fiscalById = new Map(fiscales.map((fiscal) => [fiscal.id, fiscal]));
        const usedByFiscal = await this.getUsedByFiscal(customer.tenant_id, customer.id);
        for (const item of items) {
            const fiscal = fiscalById.get(item.fiscal_configuration_id);
            const used = usedByFiscal.get(item.fiscal_configuration_id) ?? 0;
            const existing = await this.creditRepo.findOne({
                where: {
                    tenant_id: customer.tenant_id,
                    customer_id: customer.id,
                    fiscal_configuration_id: item.fiscal_configuration_id,
                },
            });
            this.assertCreditItem(item, fiscal.razon_social, used, (0, credit_currency_util_1.normalizeCreditCurrency)(existing?.credit_currency ?? item.credit_currency));
            const nextCurrency = (0, credit_currency_util_1.normalizeCreditCurrency)(item.credit_currency ?? existing?.credit_currency);
            if (existing &&
                used > 0.009 &&
                (0, credit_currency_util_1.normalizeCreditCurrency)(existing.credit_currency) !== nextCurrency) {
                throw new common_1.BadRequestException(`No se puede cambiar la moneda del crédito de ${fiscal.razon_social}: hay saldo utilizado`);
            }
            if (existing) {
                existing.credit_enabled = item.credit_enabled;
                existing.allow_credit_exceed = item.credit_enabled
                    ? Boolean(item.allow_credit_exceed)
                    : false;
                existing.credit_days = item.credit_enabled ? (item.credit_days ?? 0) : null;
                existing.credit_amount = item.credit_enabled
                    ? Number(item.credit_amount)
                    : null;
                existing.credit_currency = item.credit_enabled
                    ? nextCurrency
                    : (0, credit_currency_util_1.normalizeCreditCurrency)(existing.credit_currency);
                await this.creditRepo.save(existing);
                continue;
            }
            await this.creditRepo.save(this.creditRepo.create({
                id: (0, crypto_1.randomUUID)(),
                tenant_id: customer.tenant_id,
                customer_id: customer.id,
                fiscal_configuration_id: item.fiscal_configuration_id,
                credit_enabled: item.credit_enabled,
                allow_credit_exceed: item.credit_enabled
                    ? Boolean(item.allow_credit_exceed)
                    : false,
                credit_days: item.credit_enabled ? (item.credit_days ?? 0) : null,
                credit_amount: item.credit_enabled ? Number(item.credit_amount) : null,
                credit_currency: item.credit_enabled ? nextCurrency : 'MXN',
            }));
        }
        return this.listForCustomer(customer);
    }
    assertCreditItem(item, razonSocial, used, currency) {
        if (!item.credit_enabled) {
            if (used > 0) {
                throw new common_1.BadRequestException(`No se puede desactivar el crédito de ${razonSocial}: el cliente tiene ${used.toFixed(2)} ${currency} utilizados`);
            }
            return;
        }
        if (item.credit_amount == null || Number(item.credit_amount) <= 0) {
            throw new common_1.BadRequestException(`credit_amount es obligatorio y debe ser mayor a 0 para ${razonSocial}`);
        }
        if (item.credit_days == null || Number(item.credit_days) < 0) {
            throw new common_1.BadRequestException(`credit_days es obligatorio para ${razonSocial}`);
        }
    }
    toFiscalSnapshot(fiscal, row, used) {
        return {
            fiscal_configuration_id: fiscal.id,
            razon_social: fiscal.razon_social,
            rfc: fiscal.rfc,
            fiscal_status: fiscal.status,
            ...(0, customer_credit_util_1.buildCreditSnapshot)({
                creditEnabled: Boolean(row?.credit_enabled),
                allowCreditExceed: Boolean(row?.allow_credit_exceed),
                creditDays: row?.credit_days,
                creditAmount: row?.credit_amount,
                creditCurrency: row?.credit_currency,
                creditUsed: used,
            }),
        };
    }
    async getUsedByFiscal(tenantId, customerId) {
        const usedByFiscal = new Map();
        const orders = await this.salesOrderRepo.find({
            where: {
                tenant_id: tenantId,
                customer_id: customerId,
                is_credit: true,
            },
            select: [
                'id',
                'total',
                'general_status',
                'fiscal_configuration_id',
                'currency',
                'exchange_rate',
                'created_at',
            ],
        });
        const openOrders = orders.filter((order) => order.general_status !== 'Cancelada' && Boolean(order.fiscal_configuration_id));
        if (openOrders.length === 0) {
            return usedByFiscal;
        }
        const paidRows = await this.paymentRepo
            .createQueryBuilder('p')
            .select('p.sales_order_id', 'sales_order_id')
            .addSelect('COALESCE(SUM(p.amount), 0)', 'paid')
            .where('p.tenant_id = :tenantId', { tenantId })
            .andWhere('p.sales_order_id IN (:...ids)', {
            ids: openOrders.map((order) => order.id),
        })
            .groupBy('p.sales_order_id')
            .getRawMany();
        const paidByOrder = new Map(paidRows.map((row) => [row.sales_order_id, Number(row.paid || 0)]));
        const noteRows = await this.invoiceRepo.find({
            where: {
                tenant_id: tenantId,
                source_module: 'sales_orders',
                source_id: (0, typeorm_2.In)(openOrders.map((order) => order.id)),
                invoice_role: 'credit_note',
            },
        });
        const notesByOrder = new Map();
        for (const invoice of noteRows) {
            if (!(0, credit_note_util_1.isInvoiceVigente)(invoice))
                continue;
            notesByOrder.set(invoice.source_id, (0, credit_note_util_1.roundCreditMoney)((notesByOrder.get(invoice.source_id) ?? 0) + Number(invoice.total || 0)));
        }
        const creditRows = await this.creditRepo.find({
            where: { tenant_id: tenantId, customer_id: customerId },
            select: ['fiscal_configuration_id', 'credit_currency'],
        });
        const currencyByFiscal = new Map(creditRows.map((row) => [
            row.fiscal_configuration_id,
            (0, credit_currency_util_1.normalizeCreditCurrency)(row.credit_currency),
        ]));
        const coverage = await this.orderAdvanceCoverageMap(tenantId, openOrders.map((order) => order.id));
        const rateByDate = new Map();
        const rateForOrderDate = async (createdAt) => {
            const date = (0, credit_currency_util_1.creditRateDate)(createdAt);
            if (!date) {
                return null;
            }
            if (rateByDate.has(date)) {
                return rateByDate.get(date) ?? null;
            }
            const daily = await this.exchangeRateService.getDailyRate(tenantId, date);
            const value = Number(daily?.exchange_rate ?? 0);
            const rate = value > 0 ? value : null;
            rateByDate.set(date, rate);
            return rate;
        };
        for (const order of openOrders) {
            const effect = (0, credit_note_util_1.splitCreditNoteEffect)({
                orderTotal: Number(order.total || 0),
                amountPaid: paidByOrder.get(order.id) ?? 0,
                creditNotesTotal: notesByOrder.get(order.id) ?? 0,
            });
            const cover = coverage.get(order.id);
            const creditBase = cover?.hasAdvance
                ? Math.min(effect.pendingAfter, (0, advance_credit_util_1.advanceCreditPending)(Number(order.total || 0), cover.requested, cover.paid))
                : effect.pendingAfter;
            const key = order.fiscal_configuration_id;
            const creditCurrency = currencyByFiscal.get(key) ?? 'MXN';
            const storedRate = Number(order.exchange_rate);
            const momentRate = storedRate > 0 ? storedRate : await rateForOrderDate(order.created_at);
            const rate = (0, credit_currency_util_1.creditConversionRate)({
                orderCurrency: order.currency,
                creditCurrency,
                orderExchangeRate: storedRate,
                dailyExchangeRate: momentRate,
            });
            const converted = (0, credit_currency_util_1.amountInCreditCurrency)({
                amount: creditBase,
                orderCurrency: order.currency,
                creditCurrency,
                exchangeRate: rate,
            });
            const pending = converted.amount ?? creditBase;
            usedByFiscal.set(key, Number(((usedByFiscal.get(key) ?? 0) + pending).toFixed(2)));
        }
        return usedByFiscal;
    }
    async assertAdvanceCreditFits(input) {
        const previous = (0, advance_credit_util_1.roundAdvanceMoney)(input.previousPending);
        const next = (0, advance_credit_util_1.roundAdvanceMoney)(input.nextPending);
        if (next - previous <= 0.009) {
            return;
        }
        if (!input.fiscalConfigurationId) {
            throw new common_1.BadRequestException('El documento no tiene razón social para aplicar crédito');
        }
        const customer = await this.creditRepo.manager.getRepository(customer_entity_1.Customer).findOne({
            where: { id: input.customerId, tenant_id: input.tenantId },
        });
        if (!customer) {
            throw new common_1.BadRequestException('Cliente no encontrado');
        }
        if ((0, pos_sale_collection_mapper_1.isWalkInCustomer)(customer)) {
            throw new common_1.BadRequestException('El cliente de mostrador no puede dejar saldo a crédito');
        }
        const snapshot = await this.getSnapshotForFiscal(customer, input.fiscalConfigurationId);
        if (!snapshot.credit_enabled) {
            throw new common_1.BadRequestException('El cliente no tiene crédito activo con esta razón social');
        }
        const storedRate = Number(input.exchangeRate);
        const momentRate = storedRate > 0 ? storedRate : await this.rateForDate(input.tenantId, input.createdAt);
        const exchangeRate = (0, credit_currency_util_1.creditConversionRate)({
            orderCurrency: input.currency,
            creditCurrency: snapshot.credit_currency,
            orderExchangeRate: storedRate,
            dailyExchangeRate: momentRate,
        });
        const nextConverted = (0, credit_currency_util_1.amountInCreditCurrency)({
            amount: next,
            orderCurrency: input.currency,
            creditCurrency: snapshot.credit_currency,
            exchangeRate,
        });
        const previousConverted = (0, credit_currency_util_1.amountInCreditCurrency)({
            amount: previous,
            orderCurrency: input.currency,
            creditCurrency: snapshot.credit_currency,
            exchangeRate,
        });
        if (nextConverted.error || nextConverted.amount == null || previousConverted.amount == null) {
            throw new common_1.BadRequestException(nextConverted.error || 'No hay tipo de cambio para convertir el crédito');
        }
        const increase = (0, advance_credit_util_1.roundAdvanceMoney)(nextConverted.amount - previousConverted.amount);
        if (increase <= snapshot.credit_available + 0.009) {
            return;
        }
        if ((0, customer_credit_util_1.creditChargeUsesExceedWaiver)(increase, snapshot.credit_available, snapshot.allow_credit_exceed)) {
            await this.consumeExceedWaiver(input.tenantId, input.customerId, input.fiscalConfigurationId);
            return;
        }
        throw new common_1.BadRequestException(`Crédito insuficiente. Disponible: ${snapshot.credit_available.toFixed(2)} ${snapshot.credit_currency}`);
    }
    async rateForDate(tenantId, createdAt) {
        const daily = await this.exchangeRateService.getDailyRate(tenantId, (0, credit_currency_util_1.creditRateDate)(createdAt) ?? undefined);
        const value = Number(daily?.exchange_rate ?? 0);
        return value > 0 ? value : null;
    }
    async advanceCoverageForOrder(tenantId, orderId) {
        const coverage = await this.orderAdvanceCoverageMap(tenantId, [orderId]);
        return coverage.get(orderId) ?? { hasAdvance: false, requested: 0, paid: 0 };
    }
    async orderAdvanceCoverageMap(tenantId, orderIds) {
        const result = new Map();
        if (orderIds.length === 0) {
            return result;
        }
        const [paymentRows, quotations, invoices] = await Promise.all([
            this.paymentRepo
                .createQueryBuilder('payment')
                .select('payment.sales_order_id', 'sales_order_id')
                .addSelect('COALESCE(SUM(payment.amount), 0)', 'paid')
                .addSelect(`COALESCE(SUM(CASE WHEN payment.source = 'advance' THEN payment.amount ELSE 0 END), 0)`, 'advance')
                .where('payment.tenant_id = :tenantId', { tenantId })
                .andWhere('payment.sales_order_id IN (:...ids)', { ids: orderIds })
                .groupBy('payment.sales_order_id')
                .getRawMany(),
            this.quotationRepo.find({
                where: { tenant_id: tenantId, converted_to_sales_order_id: (0, typeorm_2.In)(orderIds) },
                select: ['id', 'converted_to_sales_order_id', 'advance_requested_total'],
            }),
            this.invoiceRepo.find({
                where: {
                    tenant_id: tenantId,
                    source_id: (0, typeorm_2.In)(orderIds),
                    invoice_role: 'advance',
                },
            }),
        ]);
        const paidByOrder = new Map(paymentRows.map((row) => [
            row.sales_order_id,
            { paid: Number(row.paid || 0), advance: Number(row.advance || 0) },
        ]));
        const requestedByOrder = new Map();
        for (const quote of quotations) {
            if (!quote.converted_to_sales_order_id)
                continue;
            const requested = Number(quote.advance_requested_total || 0);
            if (requested > 0.009) {
                requestedByOrder.set(quote.converted_to_sales_order_id, requested);
            }
        }
        const invoiceTotalByOrder = new Map();
        for (const invoice of invoices) {
            if (!(0, credit_note_util_1.isInvoiceVigente)(invoice))
                continue;
            invoiceTotalByOrder.set(invoice.source_id, (0, advance_credit_util_1.roundAdvanceMoney)((invoiceTotalByOrder.get(invoice.source_id) ?? 0) + Number(invoice.total || 0)));
        }
        for (const orderId of orderIds) {
            const paid = paidByOrder.get(orderId)?.paid ?? 0;
            const advancePaid = paidByOrder.get(orderId)?.advance ?? 0;
            const requested = requestedByOrder.get(orderId) ??
                (advancePaid > 0.009 ? advancePaid : invoiceTotalByOrder.get(orderId) ?? 0);
            const hasAdvance = requested > 0.009 || advancePaid > 0.009 || invoiceTotalByOrder.has(orderId);
            result.set(orderId, { hasAdvance, requested, paid });
        }
        return result;
    }
};
exports.CustomerCreditService = CustomerCreditService;
exports.CustomerCreditService = CustomerCreditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_credit_entity_1.CustomerCredit)),
    __param(1, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __param(2, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(3, (0, typeorm_1.InjectRepository)(sales_order_payment_entity_1.SalesOrderPayment)),
    __param(4, (0, typeorm_1.InjectRepository)(electronic_invoice_entity_1.ElectronicInvoice)),
    __param(5, (0, typeorm_1.InjectRepository)(quotation_entity_1.Quotation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        exchange_rate_service_1.ExchangeRateService])
], CustomerCreditService);
//# sourceMappingURL=customer-credit.service.js.map