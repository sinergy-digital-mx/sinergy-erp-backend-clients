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
const customer_credit_entity_1 = require("../../../entities/customers/customer-credit.entity");
const fiscal_configuration_entity_1 = require("../../../entities/billing/fiscal-configuration.entity");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const sales_order_payment_entity_1 = require("../../../entities/sales-orders/sales-order-payment.entity");
const pos_sale_collection_mapper_1 = require("../../pos-shifts/mappers/pos-sale-collection.mapper");
const customer_credit_util_1 = require("../utils/customer-credit.util");
let CustomerCreditService = class CustomerCreditService {
    creditRepo;
    fiscalRepo;
    salesOrderRepo;
    paymentRepo;
    constructor(creditRepo, fiscalRepo, salesOrderRepo, paymentRepo) {
        this.creditRepo = creditRepo;
        this.fiscalRepo = fiscalRepo;
        this.salesOrderRepo = salesOrderRepo;
        this.paymentRepo = paymentRepo;
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
            creditDays: row?.credit_days,
            creditAmount: row?.credit_amount,
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
            this.assertCreditItem(item, fiscal.razon_social, used);
            const existing = await this.creditRepo.findOne({
                where: {
                    tenant_id: customer.tenant_id,
                    customer_id: customer.id,
                    fiscal_configuration_id: item.fiscal_configuration_id,
                },
            });
            if (existing) {
                existing.credit_enabled = item.credit_enabled;
                existing.credit_days = item.credit_enabled ? (item.credit_days ?? 0) : null;
                existing.credit_amount = item.credit_enabled
                    ? Number(item.credit_amount)
                    : null;
                await this.creditRepo.save(existing);
                continue;
            }
            await this.creditRepo.save(this.creditRepo.create({
                id: (0, crypto_1.randomUUID)(),
                tenant_id: customer.tenant_id,
                customer_id: customer.id,
                fiscal_configuration_id: item.fiscal_configuration_id,
                credit_enabled: item.credit_enabled,
                credit_days: item.credit_enabled ? (item.credit_days ?? 0) : null,
                credit_amount: item.credit_enabled ? Number(item.credit_amount) : null,
            }));
        }
        return this.listForCustomer(customer);
    }
    assertCreditItem(item, razonSocial, used) {
        if (!item.credit_enabled) {
            if (used > 0) {
                throw new common_1.BadRequestException(`No se puede desactivar el crédito de ${razonSocial}: el cliente tiene ${used.toFixed(2)} MXN utilizados`);
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
                creditDays: row?.credit_days,
                creditAmount: row?.credit_amount,
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
            select: ['id', 'total', 'general_status', 'fiscal_configuration_id'],
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
        for (const order of openOrders) {
            const pending = Math.max(Number(order.total || 0) - (paidByOrder.get(order.id) ?? 0), 0);
            const key = order.fiscal_configuration_id;
            usedByFiscal.set(key, Number(((usedByFiscal.get(key) ?? 0) + pending).toFixed(2)));
        }
        return usedByFiscal;
    }
};
exports.CustomerCreditService = CustomerCreditService;
exports.CustomerCreditService = CustomerCreditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_credit_entity_1.CustomerCredit)),
    __param(1, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __param(2, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(3, (0, typeorm_1.InjectRepository)(sales_order_payment_entity_1.SalesOrderPayment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CustomerCreditService);
//# sourceMappingURL=customer-credit.service.js.map