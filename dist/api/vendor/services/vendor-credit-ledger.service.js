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
exports.VendorCreditLedgerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vendor_entity_1 = require("../../../entities/vendor/vendor.entity");
const vendor_credit_ledger_entity_1 = require("../../../entities/vendor/vendor-credit-ledger.entity");
const vendor_credit_ledger_entry_type_enum_1 = require("../../../entities/vendor/vendor-credit-ledger-entry-type.enum");
const purchase_order_batch_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch.entity");
const purchase_order_payable_total_util_1 = require("../../purchase-orders/utils/purchase-order-payable-total.util");
const vendor_credit_ledger_util_1 = require("../utils/vendor-credit-ledger.util");
let VendorCreditLedgerService = class VendorCreditLedgerService {
    ledgerRepo;
    vendorRepo;
    purchaseOrderRepo;
    constructor(ledgerRepo, vendorRepo, purchaseOrderRepo) {
        this.ledgerRepo = ledgerRepo;
        this.vendorRepo = vendorRepo;
        this.purchaseOrderRepo = purchaseOrderRepo;
    }
    async recordCredit(input) {
        const amount = (0, vendor_credit_ledger_util_1.roundVendorCreditMoney)(input.amount);
        if (amount <= 0)
            return null;
        const entry = this.ledgerRepo.create({
            tenant_id: input.tenantId,
            vendor_id: input.vendorId,
            currency: input.currency,
            entry_type: vendor_credit_ledger_entry_type_enum_1.VendorCreditLedgerEntryType.CREDIT,
            amount,
            purchase_order_id: input.purchaseOrderId ?? null,
            purchase_order_payment_id: input.purchaseOrderPaymentId ?? null,
            notes: input.notes ?? 'Excedente de pago',
            created_by: input.userId,
        });
        await this.ledgerRepo.save(entry);
        const balances = await this.balancesForVendor(input.tenantId, input.vendorId);
        return {
            amount,
            currency: input.currency,
            balance_after: input.currency === 'USD' ? balances.usd : balances.mxn,
        };
    }
    async assertPaymentVoidable(tenantId, paymentId) {
        const credits = await this.ledgerRepo.find({
            where: {
                tenant_id: tenantId,
                purchase_order_payment_id: paymentId,
                entry_type: vendor_credit_ledger_entry_type_enum_1.VendorCreditLedgerEntryType.CREDIT,
            },
        });
        if (!credits.length)
            return;
        const creditIds = credits.map((row) => row.id);
        const applied = await this.ledgerRepo
            .createQueryBuilder('entry')
            .where('entry.tenant_id = :tenantId', { tenantId })
            .andWhere('entry.entry_type = :type', { type: vendor_credit_ledger_entry_type_enum_1.VendorCreditLedgerEntryType.DEBIT })
            .andWhere('entry.source_entry_id IN (:...creditIds)', { creditIds })
            .getCount();
        if (applied > 0) {
            throw new common_1.BadRequestException('Ese pago ya generó un saldo a favor que se aplicó a otra orden. Desaplicalo antes de borrar el pago.');
        }
    }
    async voidByPayment(tenantId, userId, paymentId) {
        const credits = await this.ledgerRepo.find({
            where: {
                tenant_id: tenantId,
                purchase_order_payment_id: paymentId,
                entry_type: vendor_credit_ledger_entry_type_enum_1.VendorCreditLedgerEntryType.CREDIT,
            },
        });
        if (!credits.length)
            return;
        await this.assertPaymentVoidable(tenantId, paymentId);
        for (const credit of credits) {
            const alreadyVoided = await this.ledgerRepo.exists({
                where: {
                    tenant_id: tenantId,
                    source_entry_id: credit.id,
                    entry_type: vendor_credit_ledger_entry_type_enum_1.VendorCreditLedgerEntryType.VOID,
                },
            });
            if (alreadyVoided)
                continue;
            await this.ledgerRepo.save(this.ledgerRepo.create({
                tenant_id: tenantId,
                vendor_id: credit.vendor_id,
                currency: credit.currency,
                entry_type: vendor_credit_ledger_entry_type_enum_1.VendorCreditLedgerEntryType.VOID,
                amount: credit.amount,
                purchase_order_id: credit.purchase_order_id,
                purchase_order_payment_id: paymentId,
                source_entry_id: credit.id,
                notes: 'Reverso por pago eliminado',
                created_by: userId,
            }));
        }
    }
    async balancesForVendor(tenantId, vendorId) {
        const entries = await this.ledgerRepo.find({
            where: { tenant_id: tenantId, vendor_id: vendorId },
        });
        return (0, vendor_credit_ledger_util_1.vendorCreditBalances)(entries);
    }
    async balancesByVendor(tenantId) {
        const rows = await this.ledgerRepo
            .createQueryBuilder('entry')
            .select('entry.vendor_id', 'vendor_id')
            .addSelect('entry.currency', 'currency')
            .addSelect(`SUM(CASE
          WHEN entry.entry_type = 'credit' THEN entry.amount
          ELSE -entry.amount
        END)`, 'balance')
            .where('entry.tenant_id = :tenantId', { tenantId })
            .groupBy('entry.vendor_id')
            .addGroupBy('entry.currency')
            .getRawMany();
        const map = new Map();
        for (const row of rows) {
            const current = map.get(row.vendor_id) ?? { vendor_id: row.vendor_id, mxn: 0, usd: 0 };
            const amount = (0, vendor_credit_ledger_util_1.roundVendorCreditMoney)(Number(row.balance || 0));
            if ((0, vendor_credit_ledger_util_1.normalizeVendorCreditCurrency)(row.currency) === 'USD') {
                current.usd = amount;
            }
            else {
                current.mxn = amount;
            }
            map.set(row.vendor_id, current);
        }
        return Array.from(map.values()).filter((row) => row.mxn > 0 || row.usd > 0);
    }
    async describeAccounts(tenantId, vendorId) {
        const vendor = await this.vendorRepo.findOne({ where: { id: vendorId, tenant_id: tenantId } });
        if (!vendor) {
            throw new common_1.NotFoundException(`Proveedor no encontrado: ${vendorId}`);
        }
        const [credit, pending] = await Promise.all([
            this.balancesForVendor(tenantId, vendorId),
            this.pendingByCurrency(tenantId, vendorId),
        ]);
        const entries = await this.ledgerRepo.find({
            where: { tenant_id: tenantId, vendor_id: vendorId },
            relations: ['purchase_order'],
            order: { created_at: 'ASC' },
        });
        const ledger = (0, vendor_credit_ledger_util_1.withRunningVendorCreditBalance)(entries).reverse().slice(0, 40);
        return {
            vendor: {
                id: vendor.id,
                name: vendor.name,
                razon_social: vendor.razon_social,
                company_name: vendor.company_name,
            },
            mxn: this.currencyBucket(pending.mxn, credit.mxn),
            usd: this.currencyBucket(pending.usd, credit.usd),
            ledger: ledger.map((entry) => ({
                id: entry.id,
                created_at: entry.created_at,
                entry_type: entry.entry_type,
                amount: Number(entry.amount),
                currency: entry.currency,
                folio: entry.purchase_order?.folio ?? null,
                notes: entry.notes,
                balance_after: entry.balance_after,
            })),
        };
    }
    currencyBucket(pending, credit) {
        return {
            pending_order_count: pending.count,
            amount_pending: pending.amount,
            credit_balance: credit,
            net: (0, vendor_credit_ledger_util_1.vendorCreditNet)(pending.amount, credit),
        };
    }
    async pendingByCurrency(tenantId, vendorId) {
        const orders = await this.purchaseOrderRepo.find({
            where: {
                tenant_id: tenantId,
                vendor_id: vendorId,
                payment_status: 'Pendiente',
            },
            relations: ['payments'],
        });
        const buckets = {
            mxn: { count: 0, amount: 0 },
            usd: { count: 0, amount: 0 },
        };
        for (const order of orders) {
            if (order.general_status === 'Cancelada')
                continue;
            const total = (0, purchase_order_payable_total_util_1.resolvePurchaseOrderPayableTotal)(order);
            const paid = (order.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
            const pending = (0, vendor_credit_ledger_util_1.roundVendorCreditMoney)(Math.max(0, total - paid));
            if (pending <= 0)
                continue;
            const bucket = (0, vendor_credit_ledger_util_1.normalizeVendorCreditCurrency)(order.payment_currency) === 'USD' ? buckets.usd : buckets.mxn;
            bucket.count += 1;
            bucket.amount = (0, vendor_credit_ledger_util_1.roundVendorCreditMoney)(bucket.amount + pending);
        }
        return buckets;
    }
};
exports.VendorCreditLedgerService = VendorCreditLedgerService;
exports.VendorCreditLedgerService = VendorCreditLedgerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vendor_credit_ledger_entity_1.VendorCreditLedger)),
    __param(1, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __param(2, (0, typeorm_1.InjectRepository)(purchase_order_batch_entity_1.PurchaseOrderBatch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], VendorCreditLedgerService);
//# sourceMappingURL=vendor-credit-ledger.service.js.map