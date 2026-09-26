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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerDebtLedgerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const crypto_1 = require("crypto");
const customer_debt_ledger_entity_1 = require("../../../entities/accounting/customer-debt-ledger.entity");
const customer_debt_ledger_movement_type_enum_1 = require("../../../entities/accounting/customer-debt-ledger-movement-type.enum");
const customer_debt_ledger_util_1 = require("../utils/customer-debt-ledger.util");
let CustomerDebtLedgerService = class CustomerDebtLedgerService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async captureCharge(input) {
        const snapshot = await this.loadOrder(input.tenantId, input.salesOrderId);
        if (!snapshot || !this.canCapture(snapshot))
            return;
        const amount = input.amount != null
            ? (0, customer_debt_ledger_util_1.roundDebtMoney)(input.amount)
            : await this.openAmount(input.tenantId, snapshot);
        if (amount <= 0)
            return;
        const occurredAt = input.occurredAt ?? new Date();
        await this.append(snapshot, {
            sourceKey: (0, customer_debt_ledger_util_1.chargeSourceKey)(snapshot.id),
            movementType: customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CHARGE,
            amountDelta: amount,
            occurredAt,
            dueDate: (0, customer_debt_ledger_util_1.debtDueDate)(occurredAt, snapshot.credit_days),
            source: 'system',
            userId: input.userId,
        });
    }
    async capturePayment(input) {
        const payment = await this.loadPayment(input.tenantId, input.paymentId);
        if (!payment || payment.payment_method === 'credit')
            return;
        const hasCharge = await this.hasSourceKey(input.tenantId, (0, customer_debt_ledger_util_1.chargeSourceKey)(input.salesOrderId));
        if (!hasCharge && input.source === 'pos_cobranza')
            return;
        if (!hasCharge) {
            const snapshot = await this.loadOrder(input.tenantId, input.salesOrderId);
            if (!snapshot || !this.canCapture(snapshot))
                return;
            const paid = await this.sumPayments(input.tenantId, input.salesOrderId);
            const beforeThis = (0, customer_debt_ledger_util_1.roundDebtMoney)(Number(snapshot.total || 0) - paid + Number(payment.amount || 0));
            await this.captureCharge({
                tenantId: input.tenantId,
                salesOrderId: input.salesOrderId,
                userId: input.userId,
                amount: beforeThis,
                occurredAt: new Date(),
            });
        }
        await this.append(await this.loadOrder(input.tenantId, input.salesOrderId), {
            sourceKey: (0, customer_debt_ledger_util_1.paymentSourceKey)(payment.id),
            movementType: customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.PAYMENT,
            amountDelta: -(0, customer_debt_ledger_util_1.roundDebtMoney)(Number(payment.amount || 0)),
            occurredAt: this.parseDate(payment.created_at) ?? new Date(),
            paymentMethod: payment.payment_method,
            referenceNumber: payment.reference_number,
            source: input.source,
            salesOrderPaymentId: payment.id,
            userId: input.userId ?? payment.created_by,
        });
    }
    async capturePaymentReversal(input) {
        const original = await this.dataSource.getRepository(customer_debt_ledger_entity_1.CustomerDebtLedger).findOne({
            where: {
                tenant_id: input.tenantId,
                source_key: (0, customer_debt_ledger_util_1.paymentSourceKey)(input.paymentId),
            },
        });
        if (!original)
            return;
        const snapshot = await this.loadOrder(input.tenantId, original.sales_order_id);
        if (!snapshot)
            return;
        await this.append(snapshot, {
            sourceKey: (0, customer_debt_ledger_util_1.paymentReversalSourceKey)(input.paymentId),
            movementType: customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.PAYMENT_REVERSAL,
            amountDelta: (0, customer_debt_ledger_util_1.roundDebtMoney)(Math.abs(Number(original.amount_delta || 0))),
            occurredAt: new Date(),
            paymentMethod: original.payment_method,
            referenceNumber: original.reference_number,
            source: original.source,
            salesOrderPaymentId: input.paymentId,
            userId: input.userId,
        });
    }
    async captureChargeReversal(input) {
        const hasCharge = await this.hasSourceKey(input.tenantId, (0, customer_debt_ledger_util_1.chargeSourceKey)(input.salesOrderId));
        if (!hasCharge)
            return;
        const snapshot = await this.loadOrder(input.tenantId, input.salesOrderId);
        if (!snapshot)
            return;
        await this.dataSource.transaction(async (manager) => {
            await this.lockCustomer(manager, snapshot.tenant_id, snapshot.customer_id);
            if (await this.sourceExists(manager, snapshot.tenant_id, (0, customer_debt_ledger_util_1.chargeReversalSourceKey)(snapshot.id))) {
                return;
            }
            const orderBalance = await this.latestOrderBalance(manager, snapshot.tenant_id, snapshot.id);
            if (orderBalance <= 0)
                return;
            await this.insertMovement(manager, snapshot, {
                sourceKey: (0, customer_debt_ledger_util_1.chargeReversalSourceKey)(snapshot.id),
                movementType: customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CHARGE_REVERSAL,
                amountDelta: -orderBalance,
                occurredAt: new Date(),
                source: 'system',
                userId: input.userId,
            });
        });
    }
    canCapture(snapshot) {
        if ((0, customer_debt_ledger_util_1.isWalkInDebtCustomer)(snapshot))
            return false;
        if (snapshot.general_status === 'Cancelada')
            return false;
        return Number(snapshot.total || 0) > 0;
    }
    async append(snapshot, input) {
        if (!snapshot || input.amountDelta === 0)
            return;
        try {
            await this.dataSource.transaction(async (manager) => {
                await this.lockCustomer(manager, snapshot.tenant_id, snapshot.customer_id);
                if (await this.sourceExists(manager, snapshot.tenant_id, input.sourceKey))
                    return;
                await this.insertMovement(manager, snapshot, input);
            });
        }
        catch (error) {
            if (this.isDuplicate(error))
                return;
            throw error;
        }
    }
    async insertMovement(manager, snapshot, input) {
        const prevCustomer = await this.latestCustomerBalance(manager, snapshot.tenant_id, snapshot.customer_id, snapshot.fiscal_configuration_id);
        const prevOrder = await this.latestOrderBalance(manager, snapshot.tenant_id, snapshot.id);
        const balanceAfter = (0, customer_debt_ledger_util_1.clampDebtMoney)(prevCustomer + input.amountDelta);
        const orderBalanceAfter = (0, customer_debt_ledger_util_1.clampDebtMoney)(prevOrder + input.amountDelta);
        const dueDate = input.dueDate ??
            (await this.latestDueDate(manager, snapshot.tenant_id, snapshot.id));
        await manager.getRepository(customer_debt_ledger_entity_1.CustomerDebtLedger).insert({
            id: (0, crypto_1.randomUUID)(),
            tenant_id: snapshot.tenant_id,
            source_key: input.sourceKey,
            customer_id: snapshot.customer_id,
            fiscal_configuration_id: snapshot.fiscal_configuration_id,
            fiscal_razon_social: snapshot.company_razon_social.slice(0, 255),
            billing_branch_id: snapshot.billing_branch_id,
            billing_branch_name: (0, customer_debt_ledger_util_1.billingBranchLabel)(snapshot.branch_city, snapshot.branch_code),
            sales_order_id: snapshot.id,
            sales_order_payment_id: input.salesOrderPaymentId ?? null,
            movement_type: input.movementType,
            amount_delta: (0, customer_debt_ledger_util_1.roundDebtMoney)(input.amountDelta),
            balance_after: balanceAfter,
            order_balance_after: orderBalanceAfter,
            occurred_at: input.occurredAt,
            due_date: dueDate,
            payment_method: input.paymentMethod ?? null,
            reference_number: input.referenceNumber ?? null,
            source: input.source ?? null,
            folio: snapshot.folio.slice(0, 20),
            customer_name: (0, customer_debt_ledger_util_1.customerDebtDisplayName)(snapshot).slice(0, 255),
            customer_rfc: snapshot.fiscal_rfc?.trim().slice(0, 20) || null,
            created_by: input.userId ?? null,
        });
    }
    async loadOrder(tenantId, salesOrderId) {
        const rows = await this.dataSource.query(`
      SELECT
        so.id,
        so.tenant_id,
        so.customer_id,
        so.fiscal_configuration_id,
        so.billing_branch_id,
        so.folio,
        so.total,
        so.created_at,
        so.created_by,
        so.general_status,
        c.name,
        c.lastname,
        c.company_name,
        c.fiscal_razon_social,
        c.fiscal_rfc,
        fc.razon_social AS company_razon_social,
        bb.city AS branch_city,
        bb.code AS branch_code,
        cc.credit_days
      FROM inv_s_sales_orders so
      INNER JOIN customers c ON c.id = so.customer_id
      INNER JOIN fiscal_configurations fc ON fc.id = so.fiscal_configuration_id
      LEFT JOIN billing_branches bb ON bb.id = so.billing_branch_id
      LEFT JOIN customer_credits cc
        ON cc.tenant_id = so.tenant_id
       AND cc.customer_id = so.customer_id
       AND cc.fiscal_configuration_id = so.fiscal_configuration_id
      WHERE so.id = ? AND so.tenant_id = ?
      LIMIT 1
      `, [salesOrderId, tenantId]);
        return rows?.[0] ?? null;
    }
    async loadPayment(tenantId, paymentId) {
        const rows = await this.dataSource.query(`
      SELECT id, sales_order_id, tenant_id, amount, payment_method,
             reference_number, source, created_by, created_at
      FROM inv_s_sales_order_payments
      WHERE id = ? AND tenant_id = ?
      LIMIT 1
      `, [paymentId, tenantId]);
        return rows?.[0] ?? null;
    }
    async openAmount(tenantId, snapshot) {
        const paid = await this.sumPayments(tenantId, snapshot.id);
        return (0, customer_debt_ledger_util_1.roundDebtMoney)(Math.max(0, Number(snapshot.total || 0) - paid));
    }
    async sumPayments(tenantId, salesOrderId) {
        const rows = await this.dataSource.query(`
      SELECT COALESCE(SUM(amount), 0) AS paid
      FROM inv_s_sales_order_payments
      WHERE tenant_id = ? AND sales_order_id = ?
      `, [tenantId, salesOrderId]);
        return Number(rows?.[0]?.paid || 0);
    }
    async hasSourceKey(tenantId, sourceKey) {
        const rows = await this.dataSource.query(`
      SELECT id FROM acc_customer_debt_ledger
      WHERE tenant_id = ? AND source_key = ?
      LIMIT 1
      `, [tenantId, sourceKey]);
        return rows.length > 0;
    }
    async lockCustomer(manager, tenantId, customerId) {
        await manager.query(`SELECT id FROM customers WHERE id = ? AND tenant_id = ? FOR UPDATE`, [customerId, tenantId]);
    }
    async sourceExists(manager, tenantId, sourceKey) {
        const rows = await manager.query(`
      SELECT id FROM acc_customer_debt_ledger
      WHERE tenant_id = ? AND source_key = ?
      LIMIT 1
      `, [tenantId, sourceKey]);
        return rows.length > 0;
    }
    async latestCustomerBalance(manager, tenantId, customerId, fiscalConfigurationId) {
        const rows = await manager.query(`
      SELECT balance_after
      FROM acc_customer_debt_ledger
      WHERE tenant_id = ?
        AND customer_id = ?
        AND fiscal_configuration_id = ?
      ORDER BY occurred_at DESC, created_at DESC, id DESC
      LIMIT 1
      `, [tenantId, customerId, fiscalConfigurationId]);
        return Number(rows?.[0]?.balance_after || 0);
    }
    async latestOrderBalance(manager, tenantId, salesOrderId) {
        const rows = await manager.query(`
      SELECT order_balance_after
      FROM acc_customer_debt_ledger
      WHERE tenant_id = ? AND sales_order_id = ?
      ORDER BY occurred_at DESC, created_at DESC, id DESC
      LIMIT 1
      `, [tenantId, salesOrderId]);
        return Number(rows?.[0]?.order_balance_after || 0);
    }
    async latestDueDate(manager, tenantId, salesOrderId) {
        const rows = await manager.query(`
      SELECT due_date
      FROM acc_customer_debt_ledger
      WHERE tenant_id = ?
        AND sales_order_id = ?
        AND due_date IS NOT NULL
      ORDER BY occurred_at DESC, created_at DESC, id DESC
      LIMIT 1
      `, [tenantId, salesOrderId]);
        const value = rows?.[0]?.due_date;
        if (!value)
            return null;
        return String(value).slice(0, 10);
    }
    parseDate(value) {
        if (!value)
            return null;
        if (value instanceof Date)
            return Number.isNaN(value.getTime()) ? null : value;
        const normalized = value.includes('T') ? value : value.replace(' ', 'T');
        const parsed = new Date(normalized);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    isDuplicate(error) {
        const code = error?.code;
        const errno = error?.errno;
        return code === 'ER_DUP_ENTRY' || errno === 1062;
    }
};
exports.CustomerDebtLedgerService = CustomerDebtLedgerService;
exports.CustomerDebtLedgerService = CustomerDebtLedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], CustomerDebtLedgerService);
//# sourceMappingURL=customer-debt-ledger.service.js.map