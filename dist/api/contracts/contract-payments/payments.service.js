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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("../../../entities/contracts/payment.entity");
const contract_entity_1 = require("../../../entities/contracts/contract.entity");
const contract_downpayment_payment_entity_1 = require("../../../entities/contracts/contract-downpayment-payment.entity");
const contract_financial_util_1 = require("../contract-financial.util");
const contract_currency_util_1 = require("../contract-currency.util");
let PaymentsService = class PaymentsService {
    paymentRepo;
    contractRepo;
    downpaymentPaymentRepo;
    constructor(paymentRepo, contractRepo, downpaymentPaymentRepo) {
        this.paymentRepo = paymentRepo;
        this.contractRepo = contractRepo;
        this.downpaymentPaymentRepo = downpaymentPaymentRepo;
    }
    async previewPaymentSchedule(tenantId, contractId, startDateRaw) {
        const contract = await this.getContractOrThrow(tenantId, contractId);
        const startDate = this.resolveStartDate(startDateRaw, contract);
        return this.buildSchedulePreview(contract, startDate);
    }
    async generatePaymentsForContract(tenantId, contractId, dto = {}) {
        const contract = await this.getContractOrThrow(tenantId, contractId);
        if (await this.hasPendingDownpaymentPayments(tenantId, contractId)) {
            throw new common_1.BadRequestException('No se pueden generar pagos normales hasta liquidar completamente el enganche financiado');
        }
        const existingPayments = await this.paymentRepo.count({
            where: { contract_id: contractId, tenant_id: tenantId },
        });
        if (existingPayments > 0) {
            throw new common_1.BadRequestException('Los pagos de este contrato ya fueron generados. Si te equivocaste, regenera siempre que no haya pagos pagados o parciales.');
        }
        const startDate = this.resolveStartDate(dto.start_date, contract);
        return this.createPaymentsForContract(tenantId, contract, startDate);
    }
    async regeneratePaymentsForContract(tenantId, contractId, dto = {}) {
        const contract = await this.getContractOrThrow(tenantId, contractId);
        if (await this.hasPendingDownpaymentPayments(tenantId, contractId)) {
            throw new common_1.BadRequestException('No se pueden regenerar pagos normales hasta liquidar completamente el enganche financiado');
        }
        const paidOrPartialCount = await this.countPaidOrPartialPayments(tenantId, contractId);
        if (paidOrPartialCount > 0) {
            throw new common_1.BadRequestException(`No se pueden regenerar los pagos porque hay ${paidOrPartialCount} pago(s) pagado(s) o parcial(es). Debes revertir esos pagos antes de regenerar.`);
        }
        await this.paymentRepo.delete({
            contract_id: contractId,
            tenant_id: tenantId,
        });
        const startDate = this.resolveStartDate(dto.start_date, contract);
        return this.createPaymentsForContract(tenantId, contract, startDate);
    }
    async createPaymentsForContract(tenantId, contract, startDate) {
        const paymentMonths = Number(contract.payment_months);
        if (!paymentMonths || paymentMonths < 1) {
            throw new common_1.BadRequestException('El contrato no tiene meses de pago definidos para generar el calendario');
        }
        const payments = [];
        for (let i = 0; i < paymentMonths; i++) {
            const dueDate = this.addMonthsClamped(startDate, i);
            payments.push(this.paymentRepo.create({
                tenant_id: tenantId,
                contract_id: contract.id,
                payment_number: String(i + 1),
                payment_date: dueDate,
                due_date: dueDate,
                amount: contract.monthly_payment,
                amount_paid: 0,
                amount_pending: contract.monthly_payment,
                payment_method: 'transferencia',
                status: 'pendiente',
                is_overdue: false,
            }));
        }
        const saved = await this.paymentRepo.save(payments);
        const schedule = this.buildSchedulePreview(contract, startDate);
        await this.contractRepo.update({ id: contract.id, tenant_id: tenantId }, { first_payment_date: schedule.start_date });
        return {
            ...schedule,
            payments: saved.map((payment) => ({
                ...payment,
                currency: schedule.currency,
            })),
        };
    }
    async getContractPayments(tenantId, contractId) {
        const contract = await this.getContractOrThrow(tenantId, contractId);
        const currency = (0, contract_currency_util_1.resolveStoredContractCurrency)(contract.currency);
        const payments = await this.paymentRepo
            .createQueryBuilder('p')
            .select([
            'p.id', 'p.payment_number', 'p.status', 'p.is_overdue',
            'p.amount', 'p.amount_paid', 'p.amount_pending',
            'p.due_date', 'p.paid_date', 'p.payment_method', 'p.notes'
        ])
            .where('p.tenant_id = :tenantId', { tenantId })
            .andWhere('p.contract_id = :contractId', { contractId })
            .orderBy('CAST(p.payment_number AS UNSIGNED)', 'ASC')
            .getMany();
        return payments.map((payment) => ({
            ...payment,
            currency,
        }));
    }
    async getPayment(tenantId, paymentId) {
        return this.paymentRepo.findOne({
            where: { id: paymentId, tenant_id: tenantId },
            relations: ['contract'],
        });
    }
    async getContractPaymentStats(tenantId, contractId) {
        const payments = await this.getContractPayments(tenantId, contractId);
        const contract = await this.contractRepo.findOne({
            where: { id: contractId, tenant_id: tenantId }
        });
        if (!contract) {
            throw new Error('Contract not found');
        }
        const partialPayment = payments.find(p => p.status === 'parcial');
        const pendingFullPayments = payments.filter(p => p.status === 'pendiente').length;
        const totalPaidCorrect = payments.reduce((sum, p) => {
            if (p.status === 'pagado') {
                return sum + Number(p.amount || 0);
            }
            else if (p.status === 'parcial') {
                return sum + Number(p.amount_paid || 0);
            }
            return sum;
        }, 0);
        const totalPrice = Number(contract.total_price) || 0;
        const downPaymentTarget = (0, contract_financial_util_1.getDownPaymentTarget)(contract);
        const financedAmount = (0, contract_financial_util_1.computeFinancedAmount)(totalPrice, contract);
        const financials = (0, contract_financial_util_1.resolveContractFinancials)(contract, totalPaidCorrect);
        const downPaymentApplied = financials.down_payment_applied;
        const totalPendingCorrect = financials.remaining_balance;
        const totalPendingFromFinanced = contract.status === 'completado'
            ? 0
            : Math.max(0, Math.round((financedAmount - totalPaidCorrect) * 100) / 100);
        const paidAmountComplete = payments.reduce((sum, p) => {
            if (p.status === 'pagado') {
                return sum + Number(p.amount || 0);
            }
            return sum;
        }, 0);
        const paidAmountPartial = payments.reduce((sum, p) => {
            if (p.status === 'parcial') {
                return sum + Number(p.amount_paid || 0);
            }
            return sum;
        }, 0);
        const overdueAmount = payments.reduce((sum, p) => {
            if (!p.is_overdue || p.status === 'cancelado' || p.status === 'pagado') {
                return sum;
            }
            if (p.status === 'parcial') {
                return sum + Number(p.amount_pending || 0);
            }
            return sum + Number(p.amount_pending ?? p.amount ?? 0);
        }, 0);
        const paidOrPartialCount = payments.filter((p) => p.status === 'pagado' || p.status === 'parcial').length;
        const stats = {
            currency: (0, contract_currency_util_1.resolveStoredContractCurrency)(contract.currency),
            total_payments: payments.length,
            paid_count: payments.filter(p => p.status === 'pagado').length,
            partial_count: payments.filter(p => p.status === 'parcial' && !p.is_overdue).length,
            partial_overdue_count: payments.filter(p => p.status === 'parcial' && p.is_overdue).length,
            pending_count: payments.filter(p => p.status === 'pendiente' && !p.is_overdue).length,
            pending_overdue_count: payments.filter(p => p.status === 'pendiente' && p.is_overdue).length,
            pending_full_payments: pendingFullPayments,
            overdue_count: payments.filter(p => p.is_overdue).length,
            overdue_amount: Math.round(overdueAmount * 100) / 100,
            cancelled_count: payments.filter(p => p.status === 'cancelado').length,
            total_paid: financials.total_paid,
            total_paid_from_payments: financials.total_paid_from_payments,
            paid_amount_complete: Math.round(paidAmountComplete * 100) / 100,
            paid_amount_partial: Math.round(paidAmountPartial * 100) / 100,
            total_pending: Math.round(totalPendingFromFinanced * 100) / 100,
            total_expected: Math.round(payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) * 100) / 100,
            total_pending_amount: Math.round(totalPendingCorrect * 100) / 100,
            financed_amount: Math.round(financedAmount * 100) / 100,
            total_price: Math.round(totalPrice * 100) / 100,
            down_payment: Math.round(downPaymentApplied * 100) / 100,
            down_payment_applied: Math.round(downPaymentApplied * 100) / 100,
            down_payment_target: contract.down_payment_financed && contract.down_payment_target != null
                ? Math.round(downPaymentTarget * 100) / 100
                : null,
            down_payment_target_defined: contract.down_payment_financed && contract.down_payment_target != null,
            can_generate: payments.length === 0,
            can_regenerate: payments.length > 0 && paidOrPartialCount === 0,
            paid_or_partial_count: paidOrPartialCount,
            cannot_regenerate_reason: payments.length === 0
                ? null
                : paidOrPartialCount > 0
                    ? `Hay ${paidOrPartialCount} pago(s) pagado(s) o parcial(es). Debes revertirlos antes de regenerar.`
                    : null,
            schedule: this.resolveScheduleFromPayments(contract, payments),
            partial_payment: partialPayment ? {
                id: partialPayment.id,
                installment_number: parseInt(partialPayment.payment_number),
                payment_number: partialPayment.payment_number,
                amount_paid: Math.round(Number(partialPayment.amount_paid || 0) * 100) / 100,
                remaining_amount: Math.round(Number(partialPayment.amount_pending || 0) * 100) / 100,
                amount: Math.round(Number(partialPayment.amount || 0) * 100) / 100,
                due_date: partialPayment.due_date,
                payment_method: partialPayment.payment_method,
                status: partialPayment.status,
                is_overdue: partialPayment.is_overdue
            } : null,
        };
        return stats;
    }
    async recordPayment(tenantId, paymentId, amount, paymentDate, paymentMethod, referenceNumber, notes) {
        const payment = await this.getPayment(tenantId, paymentId);
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.status === 'cancelado') {
            throw new common_1.BadRequestException('Cannot record payment for cancelled payment');
        }
        const paymentAmount = Number(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            throw new common_1.BadRequestException('Amount must be a valid number greater than 0');
        }
        const existingPartialPayments = await this.paymentRepo.find({
            where: {
                contract_id: payment.contract_id,
                tenant_id: tenantId,
                status: 'parcial'
            }
        });
        const currentAmountPaid = Number(payment.amount_paid) || 0;
        const totalAmount = Number(payment.amount) || 0;
        const newAmountPaid = currentAmountPaid + paymentAmount;
        const newAmountPending = Math.max(0, totalAmount - newAmountPaid);
        let newStatus;
        if (newAmountPaid >= totalAmount) {
            newStatus = 'pagado';
        }
        else if (newAmountPaid > 0) {
            newStatus = 'parcial';
        }
        else {
            newStatus = 'pendiente';
        }
        if (newStatus === 'parcial' && existingPartialPayments.length > 0) {
            const isUpdatingSamePayment = existingPartialPayments.some(p => p.id === payment.id);
            if (!isUpdatingSamePayment) {
                const existingPartial = existingPartialPayments[0];
                throw new common_1.BadRequestException(`Ya existe un pago parcial en este contrato (Pago #${existingPartial.payment_number}). ` +
                    `Complete ese pago primero antes de crear otro pago parcial.`);
            }
        }
        payment.amount_paid = newAmountPaid;
        payment.amount_pending = newAmountPending;
        payment.status = newStatus;
        payment.paid_date = new Date(paymentDate);
        payment.payment_method = paymentMethod;
        if (!payment.first_partial_payment_date && newAmountPaid > 0) {
            payment.first_partial_payment_date = new Date(paymentDate);
        }
        const paymentRecord = `Pago de ${paymentAmount} el ${paymentDate} (${paymentMethod}${referenceNumber ? `, Ref: ${referenceNumber}` : ''})`;
        payment.notes = payment.notes ? `${payment.notes}\n${paymentRecord}` : paymentRecord;
        if (notes) {
            payment.notes += `\nNotas: ${notes}`;
        }
        if (newAmountPaid > totalAmount) {
            const overpayment = newAmountPaid - totalAmount;
            payment.notes += `\n⚠️ Sobrepago de ${overpayment.toFixed(2)}`;
        }
        const savedPayment = await this.paymentRepo.save(payment);
        const contract = await this.contractRepo.findOne({
            where: { id: payment.contract_id },
        });
        if (contract) {
            const currentBalance = Number(contract.remaining_balance) || 0;
            const newBalance = Math.max(0, currentBalance - paymentAmount);
            if (!isNaN(newBalance)) {
                await this.contractRepo.update({ id: contract.id }, { remaining_balance: newBalance });
            }
        }
        return savedPayment;
    }
    async updatePayment(tenantId, paymentId, updates) {
        const payment = await this.getPayment(tenantId, paymentId);
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.status === 'cancelado') {
            throw new common_1.BadRequestException('Cannot update cancelled payment');
        }
        if (updates.amount_paid !== undefined) {
            const newAmountPaid = Number(updates.amount_paid) || 0;
            const expectedAmount = Number(payment.amount) || 0;
            if (isNaN(newAmountPaid) || newAmountPaid < 0) {
                throw new common_1.BadRequestException(`Invalid amount_paid provided: ${updates.amount_paid}`);
            }
            const oldAmountPaid = Number(payment.amount_paid) || 0;
            const difference = newAmountPaid - oldAmountPaid;
            let newStatus;
            if (newAmountPaid >= expectedAmount) {
                newStatus = 'pagado';
            }
            else if (newAmountPaid > 0) {
                newStatus = 'parcial';
            }
            else {
                newStatus = 'pendiente';
            }
            if (newStatus === 'parcial' && payment.status !== 'parcial') {
                const existingPartialPayments = await this.paymentRepo.find({
                    where: {
                        contract_id: payment.contract_id,
                        tenant_id: tenantId,
                        status: 'parcial'
                    }
                });
                if (existingPartialPayments.length > 0) {
                    const existingPartial = existingPartialPayments[0];
                    throw new common_1.BadRequestException(`Ya existe un pago parcial en este contrato (Pago #${existingPartial.payment_number}). ` +
                        `Complete ese pago primero antes de crear otro pago parcial.`);
                }
            }
            payment.amount_paid = newAmountPaid;
            payment.amount_pending = Math.max(0, expectedAmount - newAmountPaid);
            payment.status = newStatus;
            if (!isNaN(difference) && difference !== 0) {
                const contract = await this.contractRepo.findOne({
                    where: { id: payment.contract_id },
                });
                if (contract) {
                    const currentBalance = Number(contract.remaining_balance) || 0;
                    const newBalance = Math.max(0, currentBalance - difference);
                    if (!isNaN(newBalance) && isFinite(newBalance)) {
                        await this.contractRepo.update({ id: contract.id }, { remaining_balance: newBalance });
                    }
                }
            }
        }
        if (updates.due_date) {
            payment.due_date = updates.due_date;
        }
        if (updates.paid_date) {
            payment.paid_date = updates.paid_date;
        }
        if (updates.payment_method) {
            payment.payment_method = updates.payment_method;
        }
        if (updates.notes !== undefined) {
            payment.notes = updates.notes;
        }
        const updateNote = `Actualizado el ${new Date().toISOString().split('T')[0]}`;
        payment.notes = payment.notes ? `${payment.notes}\n${updateNote}` : updateNote;
        return this.paymentRepo.save(payment);
    }
    async cancelPayment(tenantId, paymentId) {
        const payment = await this.getPayment(tenantId, paymentId);
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.status === 'cancelado') {
            throw new common_1.BadRequestException('Payment is already cancelled');
        }
        if (payment.amount_paid > 0) {
            const contract = await this.contractRepo.findOne({
                where: { id: payment.contract_id },
            });
            if (contract) {
                const restoredBalance = contract.remaining_balance + payment.amount_paid;
                await this.contractRepo.update({ id: contract.id }, { remaining_balance: restoredBalance });
            }
        }
        payment.status = 'cancelado';
        payment.notes = payment.notes ? `${payment.notes}\nPago cancelado el ${new Date().toISOString().split('T')[0]}` : `Pago cancelado el ${new Date().toISOString().split('T')[0]}`;
        return this.paymentRepo.save(payment);
    }
    async deletePayment(tenantId, paymentId) {
        const payment = await this.getPayment(tenantId, paymentId);
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.amount_paid > 0) {
            const contract = await this.contractRepo.findOne({
                where: { id: payment.contract_id },
            });
            if (contract) {
                const restoredBalance = contract.remaining_balance + payment.amount_paid;
                await this.contractRepo.update({ id: contract.id }, { remaining_balance: restoredBalance });
            }
        }
        await this.paymentRepo.remove(payment);
    }
    async resetPayment(tenantId, paymentId) {
        const payment = await this.getPayment(tenantId, paymentId);
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.status === 'cancelado') {
            throw new common_1.BadRequestException('Cannot reset cancelled payment');
        }
        const previousAmountPaid = Number(payment.amount_paid) || 0;
        const expectedAmount = Number(payment.amount) || 0;
        payment.amount_paid = 0;
        payment.amount_pending = expectedAmount;
        payment.status = 'pendiente';
        payment.paid_date = null;
        payment.first_partial_payment_date = null;
        const resetNote = `Pago reseteado el ${new Date().toISOString().split('T')[0]} (se devolvió ${previousAmountPaid} al balance)`;
        payment.notes = payment.notes ? `${payment.notes}\n${resetNote}` : resetNote;
        const savedPayment = await this.paymentRepo.save(payment);
        if (previousAmountPaid > 0) {
            const contract = await this.contractRepo.findOne({
                where: { id: payment.contract_id },
            });
            if (contract) {
                const currentBalance = Number(contract.remaining_balance) || 0;
                const newBalance = currentBalance + previousAmountPaid;
                if (!isNaN(newBalance) && isFinite(newBalance)) {
                    await this.contractRepo.update({ id: contract.id }, { remaining_balance: newBalance });
                }
            }
        }
        return savedPayment;
    }
    async markOverduePayments(tenantId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await this.paymentRepo
            .createQueryBuilder()
            .update(payment_entity_1.Payment)
            .set({
            is_overdue: true,
            updated_at: () => 'CURRENT_TIMESTAMP'
        })
            .where('tenant_id = :tenantId', { tenantId })
            .andWhere('status IN (:...statuses)', { statuses: ['pendiente', 'parcial'] })
            .andWhere('due_date < :today', { today })
            .andWhere('is_overdue = :isOverdue', { isOverdue: false })
            .execute();
        return result.affected || 0;
    }
    async getContractOrThrow(tenantId, contractId) {
        const contract = await this.contractRepo.findOne({
            where: { id: contractId, tenant_id: tenantId },
        });
        if (!contract) {
            throw new common_1.NotFoundException('Contrato no encontrado');
        }
        return contract;
    }
    async countPaidOrPartialPayments(tenantId, contractId) {
        return this.paymentRepo
            .createQueryBuilder('p')
            .where('p.tenant_id = :tenantId', { tenantId })
            .andWhere('p.contract_id = :contractId', { contractId })
            .andWhere('p.status IN (:...statuses)', { statuses: ['pagado', 'parcial'] })
            .getCount();
    }
    resolveStartDate(startDateRaw, contract) {
        const raw = startDateRaw ?? contract.first_payment_date;
        if (!raw) {
            throw new common_1.BadRequestException('Indica la fecha de inicio de los pagos (día, mes y año)');
        }
        return this.parseDateOnly(raw);
    }
    buildSchedulePreview(contract, startDate) {
        const paymentMonths = Number(contract.payment_months) || 0;
        if (paymentMonths < 1) {
            throw new common_1.BadRequestException('El contrato no tiene meses de pago definidos para calcular el calendario');
        }
        const endDate = this.addMonthsClamped(startDate, paymentMonths - 1);
        return {
            start_date: this.formatDateOnly(startDate),
            end_date: this.formatDateOnly(endDate),
            payment_months: paymentMonths,
            payment_day: startDate.getDate(),
            payments_count: paymentMonths,
            monthly_payment: Math.round(Number(contract.monthly_payment || 0) * 100) / 100,
            currency: (0, contract_currency_util_1.resolveStoredContractCurrency)(contract.currency),
        };
    }
    resolveScheduleFromPayments(contract, payments) {
        const paymentMonths = Number(contract.payment_months) || 0;
        if (paymentMonths < 1 && payments.length === 0) {
            return null;
        }
        if (payments.length > 0) {
            const firstDue = this.parseDateOnly(payments[0].due_date);
            const lastDue = this.parseDateOnly(payments[payments.length - 1].due_date);
            return {
                start_date: this.formatDateOnly(firstDue),
                end_date: this.formatDateOnly(lastDue),
                payment_months: paymentMonths || payments.length,
                payment_day: firstDue.getDate(),
                payments_count: payments.length,
                monthly_payment: Math.round(Number(contract.monthly_payment || 0) * 100) / 100,
                currency: (0, contract_currency_util_1.resolveStoredContractCurrency)(contract.currency),
            };
        }
        if (!contract.first_payment_date) {
            return null;
        }
        return this.buildSchedulePreview(contract, this.parseDateOnly(contract.first_payment_date));
    }
    parseDateOnly(value) {
        const raw = typeof value === 'string'
            ? value.slice(0, 10)
            : this.formatDateOnlyFromUnknown(value);
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
        if (!match) {
            throw new common_1.BadRequestException('Fecha de inicio inválida. Usa formato YYYY-MM-DD');
        }
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day) {
            throw new common_1.BadRequestException('Fecha de inicio inválida');
        }
        return date;
    }
    formatDateOnlyFromUnknown(value) {
        const isUtcMidnight = value.getUTCHours() === 0 &&
            value.getUTCMinutes() === 0 &&
            value.getUTCSeconds() === 0;
        const year = isUtcMidnight ? value.getUTCFullYear() : value.getFullYear();
        const month = (isUtcMidnight ? value.getUTCMonth() : value.getMonth()) + 1;
        const day = isUtcMidnight ? value.getUTCDate() : value.getDate();
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    formatDateOnly(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    addMonthsClamped(startDate, monthsToAdd) {
        const year = startDate.getFullYear();
        const month = startDate.getMonth() + monthsToAdd;
        const day = startDate.getDate();
        const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();
        return new Date(year, month, Math.min(day, lastDayOfTargetMonth));
    }
    async hasPendingDownpaymentPayments(tenantId, contractId) {
        const contract = await this.contractRepo.findOne({
            where: { id: contractId, tenant_id: tenantId },
            select: ['id', 'down_payment_financed', 'down_payment', 'down_payment_target'],
        });
        if (!contract || !contract.down_payment_financed) {
            return false;
        }
        const databaseResult = await this.contractRepo.manager.query('SELECT DATABASE() as db');
        const dbName = databaseResult?.[0]?.db;
        if (!dbName) {
            return false;
        }
        const tableResult = await this.contractRepo.manager.query(`
        SELECT COUNT(*) as total
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'contract_downpayment_payments'
      `, [dbName]);
        if (!tableResult?.[0] || Number(tableResult[0].total) === 0) {
            return true;
        }
        const totalRows = await this.downpaymentPaymentRepo.count({
            where: {
                tenant_id: tenantId,
                contract_id: contractId,
            },
        });
        if (totalRows === 0) {
            return true;
        }
        const paymentRows = await this.downpaymentPaymentRepo.find({
            where: {
                tenant_id: tenantId,
                contract_id: contractId,
            },
            select: ['status', 'amount', 'amount_paid'],
        });
        const totalPaid = paymentRows.reduce((sum, row) => {
            if (row.status === 'pagado') {
                return sum + Number(row.amount || 0);
            }
            if (row.status === 'parcial') {
                return sum + Number(row.amount_paid || 0);
            }
            return sum;
        }, 0);
        if (!contract.down_payment_financed) {
            return false;
        }
        const downPaymentTarget = contract.down_payment_target != null
            ? Number(contract.down_payment_target)
            : null;
        if (downPaymentTarget == null || downPaymentTarget <= 0) {
            return true;
        }
        if (totalPaid < downPaymentTarget) {
            return true;
        }
        const pendingOrPartial = paymentRows.filter((row) => row.status === 'pendiente' || row.status === 'parcial').length;
        return pendingOrPartial > 0;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __param(2, (0, typeorm_1.InjectRepository)(contract_downpayment_payment_entity_1.ContractDownpaymentPayment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map