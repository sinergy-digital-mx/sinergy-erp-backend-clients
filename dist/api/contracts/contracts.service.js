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
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const contract_entity_1 = require("../../entities/contracts/contract.entity");
const contract_financial_util_1 = require("./contract-financial.util");
const contract_list_filters_util_1 = require("./contract-list-filters.util");
const contract_currency_util_1 = require("./contract-currency.util");
let ContractsService = class ContractsService {
    contractRepo;
    constructor(contractRepo) {
        this.contractRepo = contractRepo;
    }
    async create(tenantId, dto) {
        let contractNumber = dto.contract_number;
        if (!contractNumber) {
            contractNumber = await this.generateContractNumber(tenantId, dto.property_id);
        }
        const financed = !!dto.down_payment_financed;
        const downPaymentConfig = this.buildDownPaymentConfig(dto);
        const downPaymentApplied = financed ? 0 : Number(dto.down_payment);
        const downPaymentTarget = financed && Number(dto.down_payment) > 0 ? Number(dto.down_payment) : null;
        const engancheForFinancing = financed
            ? Number(downPaymentTarget ?? 0)
            : downPaymentApplied;
        const { remaining_balance, payment_months, monthly_payment } = this.computeFinancing(Number(dto.total_price), engancheForFinancing, Number(dto.payment_months), financed);
        const propertyRows = await this.contractRepo.manager.query(`SELECT total_price, list_price, currency FROM properties WHERE id = ? AND tenant_id = ? LIMIT 1`, [dto.property_id, tenantId]);
        const propertyListPrice = propertyRows[0]
            ? Number(propertyRows[0].list_price ?? propertyRows[0].total_price)
            : Number(dto.total_price);
        const contractListPrice = dto.list_price != null ? Number(dto.list_price) : propertyListPrice;
        const currency = (0, contract_currency_util_1.normalizeContractCurrency)(dto.currency, propertyRows[0]?.currency || contract_currency_util_1.DEFAULT_CONTRACT_CURRENCY);
        const contract = this.contractRepo.create({
            ...dto,
            ...downPaymentConfig,
            down_payment_target: financed ? downPaymentTarget : null,
            down_payment: downPaymentApplied,
            list_price: contractListPrice,
            currency,
            contract_number: contractNumber,
            tenant_id: tenantId,
            payment_months,
            remaining_balance,
            monthly_payment,
        });
        return this.contractRepo.save(contract);
    }
    computeFinancing(totalPrice, downPayment, paymentMonthsRequested, financed = false) {
        if (financed) {
            if (!Number.isFinite(paymentMonthsRequested) || paymentMonthsRequested < 1) {
                throw new common_1.BadRequestException('payment_months debe ser al menos 1 cuando el enganche se financia en pagos');
            }
            if (!Number.isFinite(downPayment) || downPayment <= 0) {
                return {
                    remaining_balance: Math.round(totalPrice * 100) / 100,
                    payment_months: paymentMonthsRequested,
                    monthly_payment: 0,
                };
            }
            return {
                remaining_balance: Math.round(totalPrice * 100) / 100,
                payment_months: paymentMonthsRequested,
                monthly_payment: Math.round((downPayment / paymentMonthsRequested) * 100) / 100,
            };
        }
        const rawRemaining = Math.round((totalPrice - downPayment) * 100) / 100;
        if (rawRemaining <= 0) {
            return {
                remaining_balance: 0,
                payment_months: 0,
                monthly_payment: 0,
            };
        }
        const remaining_balance = rawRemaining;
        if (!Number.isFinite(paymentMonthsRequested) || paymentMonthsRequested < 1) {
            throw new common_1.BadRequestException('payment_months debe ser al menos 1 cuando el enganche no cubre el precio total');
        }
        const monthly_payment = Math.round((remaining_balance / paymentMonthsRequested) * 100) / 100;
        return { remaining_balance, payment_months: paymentMonthsRequested, monthly_payment };
    }
    async generateContractNumber(tenantId, propertyId) {
        const property = await this.contractRepo.manager.query(`SELECT p.block, p.lot_number, p.code 
       FROM properties p 
       WHERE p.id = ? AND p.tenant_id = ?`, [propertyId, tenantId]);
        if (!property || property.length === 0) {
            throw new Error('Property not found');
        }
        const prop = property[0];
        let baseNumber;
        if (prop.block && prop.lot_number) {
            baseNumber = `CONT-${prop.block}-${prop.lot_number}`;
        }
        else {
            const codeMatch = prop.code.match(/LOT-(\d+)-(\d+)/);
            if (codeMatch) {
                baseNumber = `CONT-${codeMatch[1]}-${codeMatch[2]}`;
            }
            else {
                baseNumber = `CONT-${prop.code}`;
            }
        }
        const existingContract = await this.contractRepo.findOne({
            where: {
                contract_number: baseNumber,
                tenant_id: tenantId
            }
        });
        if (!existingContract) {
            return baseNumber;
        }
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < letters.length; i++) {
            const numberWithLetter = `${baseNumber}${letters[i]}`;
            const existingWithLetter = await this.contractRepo.findOne({
                where: {
                    contract_number: numberWithLetter,
                    tenant_id: tenantId
                }
            });
            if (!existingWithLetter) {
                return numberWithLetter;
            }
        }
        return `${baseNumber}-${Date.now()}`;
    }
    async findAll(tenantId, filters = {}, page = 1, limit = 20) {
        const query = this.contractRepo
            .createQueryBuilder('c')
            .where('c.tenant_id = :tenantId', { tenantId });
        (0, contract_list_filters_util_1.joinContractFilterRelations)(query, { select: true });
        (0, contract_list_filters_util_1.applyContractListFilters)(query, filters);
        const contracts = await query
            .orderBy('c.contract_date', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        if (contracts.length === 0) {
            return {
                data: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    pages: 0,
                },
            };
        }
        const countQuery = this.contractRepo
            .createQueryBuilder('c')
            .where('c.tenant_id = :tenantId', { tenantId });
        (0, contract_list_filters_util_1.joinContractFilterRelations)(countQuery);
        (0, contract_list_filters_util_1.applyContractListFilters)(countQuery, filters);
        const total = await countQuery.getCount();
        const pages = Math.ceil(total / limit);
        const contractIds = contracts.map(c => c.id);
        const nextPaymentsQuery = `
      SELECT p.*
      FROM contract_payments p
      INNER JOIN (
        SELECT contract_id, MIN(due_date) as next_due_date
        FROM contract_payments
        WHERE contract_id IN (${contractIds.map(() => '?').join(',')})
          AND tenant_id = ?
          AND status IN ('pendiente', 'parcial', 'vencido')
        GROUP BY contract_id
      ) next_p ON p.contract_id = next_p.contract_id AND p.due_date = next_p.next_due_date
      WHERE p.tenant_id = ?
        AND p.status IN ('pendiente', 'parcial', 'vencido')
      ORDER BY p.is_overdue DESC, p.due_date ASC
    `;
        const nextPayments = await this.contractRepo.manager.query(nextPaymentsQuery, [...contractIds, tenantId, tenantId]);
        const nextPaymentMap = new Map();
        nextPayments.forEach(payment => {
            nextPaymentMap.set(payment.contract_id, {
                next_payment_date: payment.due_date,
                next_payment_status: payment.status,
                next_payment_number: payment.payment_number,
                next_payment_amount: payment.status === 'parcial'
                    ? Number(payment.amount_pending)
                    : Number(payment.amount),
            });
        });
        const paidByContract = await this.fetchMonthlyPaidTotalsByContract(tenantId, contractIds);
        const data = contracts.map(contract => {
            const totalPrice = Number(contract.total_price) || 0;
            const monthlyPaid = paidByContract.get(contract.id) ?? 0;
            const financials = (0, contract_financial_util_1.resolveContractFinancials)(contract, monthlyPaid);
            const financedAmount = (0, contract_financial_util_1.computeFinancedAmount)(totalPrice, contract);
            const monthlyPayment = (0, contract_financial_util_1.computeMonthlyPayment)(totalPrice, contract, Number(contract.payment_months) || 0);
            return {
                ...contract,
                currency: (0, contract_currency_util_1.resolveStoredContractCurrency)(contract.currency),
                down_payment_applied: financials.down_payment_applied,
                down_payment_target: contract.down_payment_target,
                down_payment_target_defined: contract.down_payment_financed && contract.down_payment_target != null,
                financed_amount: financedAmount,
                total_paid: financials.total_paid,
                total_paid_from_payments: financials.total_paid_from_payments,
                remaining_balance: financials.remaining_balance,
                monthly_payment: monthlyPayment,
                next_payment_date: nextPaymentMap.get(contract.id)?.next_payment_date || null,
                next_payment_status: nextPaymentMap.get(contract.id)?.next_payment_status || null,
                next_payment_number: nextPaymentMap.get(contract.id)?.next_payment_number || null,
                next_payment_amount: nextPaymentMap.get(contract.id)?.next_payment_amount || null,
            };
        });
        const overdueCountsQuery = `
      SELECT contract_id, COUNT(*) as overdue_count
      FROM contract_payments
      WHERE contract_id IN (${contractIds.map(() => '?').join(',')})
        AND tenant_id = ?
        AND payment_date < CURDATE()
        AND status IN ('pendiente', 'parcial')
      GROUP BY contract_id
    `;
        const overdueCounts = await this.contractRepo.manager.query(overdueCountsQuery, [...contractIds, tenantId]);
        const overdueCountMap = new Map();
        overdueCounts.forEach(row => {
            overdueCountMap.set(row.contract_id, row.overdue_count);
        });
        const dataWithOverdue = data.map(contract => ({
            ...contract,
            overdue_payments_count: overdueCountMap.get(contract.id) || 0,
            has_overdue: (overdueCountMap.get(contract.id) || 0) > 0,
        }));
        return {
            data: dataWithOverdue,
            pagination: {
                page,
                limit,
                total,
                pages,
            },
        };
    }
    async findOne(tenantId, id) {
        const contract = await this.contractRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['customer', 'property', 'seller'],
        });
        if (!contract) {
            return null;
        }
        const nextPaymentQuery = `
      SELECT p.*
      FROM contract_payments p
      WHERE p.contract_id = ?
        AND p.tenant_id = ?
        AND p.status IN ('pendiente', 'parcial', 'vencido')
      ORDER BY p.is_overdue DESC, p.due_date ASC
      LIMIT 1
    `;
        const nextPayments = await this.contractRepo.manager.query(nextPaymentQuery, [contract.id, tenantId]);
        const nextPaymentData = nextPayments.length > 0 ? {
            next_payment_date: nextPayments[0].due_date,
            next_payment_status: nextPayments[0].status,
            next_payment_number: nextPayments[0].payment_number,
            next_payment_amount: nextPayments[0].status === 'parcial'
                ? Number(nextPayments[0].amount_pending)
                : Number(nextPayments[0].amount),
        } : {
            next_payment_date: null,
            next_payment_status: null,
            next_payment_number: null,
            next_payment_amount: null,
        };
        const overdueCountQuery = `
      SELECT COUNT(*) as overdue_count
      FROM contract_payments
      WHERE contract_id = ?
        AND tenant_id = ?
        AND payment_date < CURDATE()
        AND status IN ('pendiente', 'parcial')
    `;
        const overdueCountResult = await this.contractRepo.manager.query(overdueCountQuery, [contract.id, tenantId]);
        const overdueCount = overdueCountResult[0]?.overdue_count || 0;
        const enriched = await this.enrichContractWithPaymentData(contract, tenantId);
        const sellerInfo = contract.seller ? {
            id: contract.seller.id,
            email: contract.seller.email,
            first_name: contract.seller.first_name,
            last_name: contract.seller.last_name,
            phone: contract.seller.phone,
            full_name: `${contract.seller.first_name || ''} ${contract.seller.last_name || ''}`.trim(),
        } : null;
        return {
            id: contract.id,
            tenant_id: contract.tenant_id,
            customer_id: contract.customer_id,
            customer: contract.customer,
            property_id: contract.property_id,
            property: contract.property,
            seller_id: contract.seller_id,
            seller: sellerInfo,
            contract_number: contract.contract_number,
            contract_date: contract.contract_date,
            total_price: contract.total_price,
            down_payment: contract.down_payment,
            down_payment_target: contract.down_payment_target,
            down_payment_applied: enriched.down_payment_applied,
            down_payment_pending: enriched.down_payment_pending,
            down_payment_target_defined: enriched.down_payment_target_defined,
            list_price: contract.list_price,
            lead_id: contract.lead_id,
            lead_group_id: contract.lead_group_id,
            down_payment_financed: contract.down_payment_financed,
            down_payment_months: contract.down_payment_months,
            down_payment_monthly_amount: contract.down_payment_monthly_amount,
            down_payment_first_payment_date: contract.down_payment_first_payment_date,
            down_payment_payment_day: contract.down_payment_payment_day,
            remaining_balance: enriched.remaining_balance,
            payment_months: contract.payment_months,
            monthly_payment: enriched.monthly_payment,
            total_paid: enriched.total_paid,
            total_paid_from_payments: enriched.total_paid_from_payments,
            total_pending_amount: enriched.total_pending_amount,
            financed_amount: enriched.financed_amount,
            first_payment_date: contract.first_payment_date,
            payment_due_day: contract.payment_due_day,
            interest_rate: contract.interest_rate,
            currency: (0, contract_currency_util_1.resolveStoredContractCurrency)(contract.currency),
            status: contract.status,
            notes: contract.notes,
            metadata: contract.metadata,
            created_at: contract.created_at,
            updated_at: contract.updated_at,
            next_payment_date: nextPaymentData.next_payment_date,
            next_payment_status: nextPaymentData.next_payment_status,
            next_payment_number: nextPaymentData.next_payment_number,
            next_payment_amount: nextPaymentData.next_payment_amount,
            overdue_payments_count: overdueCount,
            has_overdue: overdueCount > 0,
        };
    }
    async findByContractNumber(tenantId, contractNumber) {
        const contract = await this.contractRepo.findOne({
            where: { contract_number: contractNumber, tenant_id: tenantId },
            relations: ['customer', 'property'],
        });
        if (!contract) {
            return null;
        }
        return this.enrichContractWithPaymentData(contract, tenantId);
    }
    async enrichContractWithPaymentData(contract, tenantId) {
        const allPayments = await this.contractRepo.manager.query('SELECT status, amount, amount_paid, amount_pending, payment_number, is_overdue FROM contract_payments WHERE contract_id = ? AND tenant_id = ?', [contract.id, tenantId]);
        let pendingFullPayments = 0;
        let overdueCount = 0;
        let partialPayment = null;
        for (const payment of allPayments) {
            const status = payment.status;
            const amountPaid = Number(payment.amount_paid);
            const amount = Number(payment.amount);
            const amountPending = Number(payment.amount_pending);
            const isOverdue = payment.is_overdue;
            if (status === 'parcial') {
                partialPayment = {
                    installment_number: parseInt(payment.payment_number),
                    amount_paid: amountPaid,
                    remaining_amount: amountPending,
                    status: 'pending_completion'
                };
                if (isOverdue) {
                    overdueCount++;
                }
            }
            else if (status === 'pendiente' || status === 'vencido') {
                pendingFullPayments++;
                if (isOverdue) {
                    overdueCount++;
                }
            }
        }
        const totalPaidFromPayments = (0, contract_financial_util_1.sumPaidFromPaymentRows)(allPayments);
        const totalPrice = Number(contract.total_price) || 0;
        const downPaymentTarget = (0, contract_financial_util_1.getDownPaymentTarget)(contract);
        const financials = (0, contract_financial_util_1.resolveContractFinancials)(contract, totalPaidFromPayments);
        const financedAmount = (0, contract_financial_util_1.computeFinancedAmount)(totalPrice, contract);
        const monthlyPayment = (0, contract_financial_util_1.computeMonthlyPayment)(totalPrice, contract, Number(contract.payment_months) || 0);
        const downPaymentPending = contract.status === 'completado'
            ? 0
            : contract.down_payment_financed && contract.down_payment_target != null
                ? Math.max(0, Math.round((downPaymentTarget - financials.down_payment_applied) * 100) / 100)
                : null;
        return {
            ...contract,
            down_payment_applied: financials.down_payment_applied,
            down_payment_target_defined: contract.down_payment_financed && contract.down_payment_target != null,
            down_payment_pending: downPaymentPending,
            financed_amount: financedAmount,
            total_paid: financials.total_paid,
            total_paid_from_payments: financials.total_paid_from_payments,
            total_pending_amount: financials.remaining_balance,
            remaining_balance: financials.remaining_balance,
            monthly_payment: monthlyPayment,
            pending_full_payments: pendingFullPayments,
            partial_payment: partialPayment,
            overdue_payments_count: overdueCount,
            has_overdue: overdueCount > 0,
        };
    }
    async fetchMonthlyPaidTotalsByContract(tenantId, contractIds) {
        const map = new Map();
        if (contractIds.length === 0) {
            return map;
        }
        const rows = await this.contractRepo.manager.query(`
        SELECT
          contract_id,
          COALESCE(SUM(
            CASE
              WHEN status = 'pagado' THEN amount
              WHEN status = 'parcial' THEN amount_paid
              ELSE 0
            END
          ), 0) AS total_paid
        FROM contract_payments
        WHERE tenant_id = ?
          AND contract_id IN (${contractIds.map(() => '?').join(',')})
        GROUP BY contract_id
        `, [tenantId, ...contractIds]);
        for (const row of rows) {
            map.set(row.contract_id, Number(row.total_paid) || 0);
        }
        return map;
    }
    async update(tenantId, id, dto) {
        const contract = await this.findOne(tenantId, id);
        if (!contract) {
            throw new Error('Contract not found');
        }
        if (dto.currency != null) {
            dto.currency = (0, contract_currency_util_1.normalizeContractCurrency)(dto.currency);
        }
        const financed = dto.down_payment_financed !== undefined
            ? dto.down_payment_financed
            : contract.down_payment_financed;
        const downPaymentConfig = this.buildDownPaymentConfig({
            down_payment_financed: financed,
            down_payment_months: dto.down_payment_months !== undefined
                ? dto.down_payment_months
                : contract.down_payment_months,
            down_payment_first_payment_date: dto.down_payment_first_payment_date !== undefined
                ? dto.down_payment_first_payment_date
                : contract.down_payment_first_payment_date,
            down_payment_payment_day: dto.down_payment_payment_day !== undefined
                ? dto.down_payment_payment_day
                : contract.down_payment_payment_day,
        });
        if (financed) {
            if (dto.down_payment_financed === true && !contract.down_payment_financed) {
                if (contract.down_payment_target == null &&
                    Number(contract.down_payment) > 0) {
                    contract.down_payment_target = Number(contract.down_payment);
                }
                contract.down_payment = 0;
            }
            if (dto.down_payment !== undefined && Number(dto.down_payment) > 0) {
                contract.down_payment_target = Number(dto.down_payment);
            }
        }
        else if (dto.down_payment !== undefined) {
            contract.down_payment = Number(dto.down_payment);
            contract.down_payment_target = null;
        }
        const shouldRecalculateFinancing = dto.total_price !== undefined ||
            dto.down_payment !== undefined ||
            dto.payment_months !== undefined ||
            dto.down_payment_financed !== undefined;
        if (shouldRecalculateFinancing) {
            const total = dto.total_price !== undefined ? Number(dto.total_price) : Number(contract.total_price);
            const engancheForFinancing = financed
                ? Number(contract.down_payment_target ?? 0)
                : Number(dto.down_payment !== undefined
                    ? dto.down_payment
                    : contract.down_payment);
            const monthsRequested = dto.payment_months !== undefined
                ? Number(dto.payment_months)
                : Number(contract.payment_months);
            const { remaining_balance, payment_months, monthly_payment } = this.computeFinancing(total, engancheForFinancing, monthsRequested, financed);
            const updatePayload = {
                ...dto,
                ...downPaymentConfig,
                remaining_balance,
                payment_months,
                monthly_payment,
            };
            if (financed) {
                delete updatePayload.down_payment;
            }
            Object.assign(contract, updatePayload);
        }
        else {
            const updatePayload = { ...dto, ...downPaymentConfig };
            if (financed) {
                delete updatePayload.down_payment;
            }
            Object.assign(contract, updatePayload);
        }
        return this.contractRepo.save(contract);
    }
    async remove(tenantId, id) {
        const queryRunner = this.contractRepo.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const contract = await queryRunner.manager.findOne(contract_entity_1.Contract, {
                where: { id, tenant_id: tenantId },
            });
            if (!contract) {
                throw new Error('Contract not found or access denied');
            }
            console.log(`🗑️  Deleting contract ${contract.contract_number} and all related data...`);
            const paymentsResult = await queryRunner.query(`DELETE FROM contract_payments WHERE contract_id = ? AND tenant_id = ?`, [id, tenantId]);
            console.log(`✅ Deleted ${paymentsResult.affectedRows || 0} payments`);
            const hasHoaPaymentsTable = await queryRunner.hasTable('contract_hoa_payments');
            if (hasHoaPaymentsTable) {
                const hoaPaymentsResult = await queryRunner.query(`DELETE FROM contract_hoa_payments WHERE contract_id = ? AND tenant_id = ?`, [id, tenantId]);
                console.log(`✅ Deleted ${hoaPaymentsResult.affectedRows || 0} HOA payments`);
            }
            const hasDownpaymentPaymentsTable = await queryRunner.hasTable('contract_downpayment_payments');
            if (hasDownpaymentPaymentsTable) {
                const downpaymentResult = await queryRunner.query(`DELETE FROM contract_downpayment_payments WHERE contract_id = ? AND tenant_id = ?`, [id, tenantId]);
                console.log(`✅ Deleted ${downpaymentResult.affectedRows || 0} down payment payments`);
            }
            const documentsResult = await queryRunner.query(`DELETE FROM contract_documents WHERE contract_id = ? AND tenant_id = ?`, [id, tenantId]);
            console.log(`✅ Deleted ${documentsResult.affectedRows || 0} contract documents`);
            await queryRunner.manager.delete(contract_entity_1.Contract, { id, tenant_id: tenantId });
            console.log(`✅ Deleted contract ${contract.contract_number}`);
            await queryRunner.commitTransaction();
            console.log(`🎉 Contract ${contract.contract_number} completely deleted`);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('❌ Error deleting contract:', error);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getContractStats(tenantId, filters = {}) {
        const baseQuery = () => {
            const query = this.contractRepo
                .createQueryBuilder('c')
                .where('c.tenant_id = :tenantId', { tenantId });
            (0, contract_list_filters_util_1.joinContractFilterRelations)(query);
            (0, contract_list_filters_util_1.applyContractListFilters)(query, filters);
            return query;
        };
        const totalQuery = baseQuery();
        if (!filters.status) {
            totalQuery.andWhere('c.status IN (:...totalStatuses)', {
                totalStatuses: ['activo', 'completado'],
            });
        }
        const totalStats = await totalQuery
            .select('COUNT(DISTINCT c.id)', 'count')
            .addSelect('SUM(c.total_price)', 'value')
            .getRawOne();
        const completedStats = await baseQuery()
            .andWhere('c.status = :completedStatus', { completedStatus: 'completado' })
            .select('COUNT(DISTINCT c.id)', 'count')
            .addSelect('SUM(c.total_price)', 'value')
            .getRawOne();
        const activeStats = await baseQuery()
            .andWhere('c.status = :activeStatus', { activeStatus: 'activo' })
            .select('COUNT(DISTINCT c.id)', 'count')
            .addSelect('SUM(c.total_price)', 'total_value')
            .addSelect('SUM(c.remaining_balance)', 'pending_value')
            .addSelect('SUM(c.total_price - c.remaining_balance)', 'paid_value')
            .getRawOne();
        const overdueQuery = baseQuery()
            .leftJoin('contract_payments', 'p', 'p.contract_id = c.id AND p.payment_date < CURDATE() AND p.status IN (:...overduePaymentStatuses)', { overduePaymentStatuses: ['pendiente', 'parcial'] })
            .andWhere('c.status = :overdueContractStatus', { overdueContractStatus: 'activo' })
            .andWhere('p.id IS NOT NULL')
            .select('COUNT(DISTINCT c.id)', 'contracts_count')
            .addSelect('COUNT(p.id)', 'payments_count')
            .addSelect('SUM(CASE WHEN p.status = "parcial" THEN p.amount_pending ELSE p.amount END)', 'value');
        const overdueStats = await overdueQuery.getRawOne();
        const currencyRows = await baseQuery()
            .select('UPPER(TRIM(c.currency))', 'currency')
            .distinct(true)
            .getRawMany();
        const currencies = Array.from(new Set(currencyRows
            .map((row) => (0, contract_currency_util_1.resolveStoredContractCurrency)(row.currency))
            .filter(Boolean)));
        const displayCurrencies = currencies.length > 0 ? currencies : [contract_currency_util_1.DEFAULT_CONTRACT_CURRENCY];
        return {
            currency: displayCurrencies.length === 1 ? displayCurrencies[0] : null,
            currencies: displayCurrencies,
            total: {
                count: parseInt(totalStats.count) || 0,
                value: parseFloat(totalStats.value) || 0,
            },
            completed: {
                count: parseInt(completedStats.count) || 0,
                value: parseFloat(completedStats.value) || 0,
            },
            pending: {
                count: parseInt(activeStats.count) || 0,
                value: parseFloat(activeStats.total_value) || 0,
                paid: parseFloat(activeStats.paid_value) || 0,
                remaining: parseFloat(activeStats.pending_value) || 0,
            },
            overdue: {
                contracts_count: parseInt(overdueStats.contracts_count) || 0,
                payments_count: parseInt(overdueStats.payments_count) || 0,
                value: parseFloat(overdueStats.value) || 0,
            },
        };
    }
    buildDownPaymentConfig(dto) {
        const financed = !!dto.down_payment_financed;
        if (!financed) {
            return {
                down_payment_financed: false,
                down_payment_months: null,
                down_payment_monthly_amount: null,
                down_payment_first_payment_date: null,
                down_payment_payment_day: null,
            };
        }
        const months = dto.down_payment_months ? Number(dto.down_payment_months) : null;
        const paymentDay = dto.down_payment_payment_day
            ? Number(dto.down_payment_payment_day)
            : null;
        const firstPaymentDate = dto.down_payment_first_payment_date
            ? new Date(dto.down_payment_first_payment_date)
            : null;
        if (paymentDay != null && (paymentDay < 1 || paymentDay > 31)) {
            throw new common_1.BadRequestException('down_payment_payment_day debe estar entre 1 y 31');
        }
        if (firstPaymentDate && Number.isNaN(firstPaymentDate.getTime())) {
            throw new common_1.BadRequestException('down_payment_first_payment_date inválida');
        }
        return {
            down_payment_financed: true,
            down_payment_months: months,
            down_payment_monthly_amount: null,
            down_payment_first_payment_date: firstPaymentDate,
            down_payment_payment_day: paymentDay,
        };
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map