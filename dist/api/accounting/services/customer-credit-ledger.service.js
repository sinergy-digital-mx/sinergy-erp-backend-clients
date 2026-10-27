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
exports.CustomerCreditLedgerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const customer_credit_ledger_entity_1 = require("../../../entities/accounting/customer-credit-ledger.entity");
const customer_debt_ledger_util_1 = require("../utils/customer-debt-ledger.util");
let CustomerCreditLedgerService = class CustomerCreditLedgerService {
    ledgerRepo;
    constructor(ledgerRepo) {
        this.ledgerRepo = ledgerRepo;
    }
    async recordCredit(input) {
        const amount = (0, customer_debt_ledger_util_1.roundDebtMoney)(input.amount);
        if (amount <= 0 || !input.fiscalConfigurationId || !input.customerId)
            return;
        const existing = await this.ledgerRepo.findOne({
            where: {
                tenant_id: input.tenantId,
                electronic_invoice_id: input.electronicInvoiceId,
                entry_type: 'credit',
            },
        });
        if (existing)
            return;
        await this.ledgerRepo.insert({
            id: (0, crypto_1.randomUUID)(),
            tenant_id: input.tenantId,
            customer_id: input.customerId,
            fiscal_configuration_id: input.fiscalConfigurationId,
            currency: this.currency(input.currency),
            entry_type: 'credit',
            amount,
            sales_order_id: input.salesOrderId,
            electronic_invoice_id: input.electronicInvoiceId,
            notes: input.notes?.trim().slice(0, 255) || null,
            created_by: input.userId,
        });
    }
    async reverseCredit(input) {
        const credit = await this.ledgerRepo.findOne({
            where: {
                tenant_id: input.tenantId,
                electronic_invoice_id: input.electronicInvoiceId,
                entry_type: 'credit',
            },
        });
        if (!credit)
            return;
        const existing = await this.ledgerRepo.findOne({
            where: {
                tenant_id: input.tenantId,
                electronic_invoice_id: input.electronicInvoiceId,
                entry_type: 'reversal',
            },
        });
        if (existing)
            return;
        await this.ledgerRepo.insert({
            id: (0, crypto_1.randomUUID)(),
            tenant_id: credit.tenant_id,
            customer_id: credit.customer_id,
            fiscal_configuration_id: credit.fiscal_configuration_id,
            currency: credit.currency,
            entry_type: 'reversal',
            amount: (0, customer_debt_ledger_util_1.roundDebtMoney)(Number(credit.amount)),
            sales_order_id: credit.sales_order_id,
            electronic_invoice_id: credit.electronic_invoice_id,
            notes: 'Nota de crédito cancelada',
            created_by: input.userId,
        });
    }
    currency(value) {
        return value?.toUpperCase() === 'USD' ? 'USD' : 'MXN';
    }
};
exports.CustomerCreditLedgerService = CustomerCreditLedgerService;
exports.CustomerCreditLedgerService = CustomerCreditLedgerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_credit_ledger_entity_1.CustomerCreditLedger)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CustomerCreditLedgerService);
//# sourceMappingURL=customer-credit-ledger.service.js.map