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
exports.HoaPaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const contract_entity_1 = require("../../../entities/contracts/contract.entity");
const contract_hoa_payment_entity_1 = require("../../../entities/contracts/contract-hoa-payment.entity");
const contract_currency_util_1 = require("../contract-currency.util");
let HoaPaymentsService = class HoaPaymentsService {
    hoaPaymentRepo;
    contractRepo;
    constructor(hoaPaymentRepo, contractRepo) {
        this.hoaPaymentRepo = hoaPaymentRepo;
        this.contractRepo = contractRepo;
    }
    async generateHoaPayments(tenantId, contractId, dto) {
        const contract = await this.ensureContractAllowsHoaOperations(tenantId, contractId);
        const currency = this.resolveCurrency(dto.currency, contract.currency);
        const { firstPaymentDate, paymentsCount, paymentDay } = this.resolveGenerateConfig(dto);
        const existingPayments = await this.hoaPaymentRepo.find({
            where: { tenant_id: tenantId, contract_id: contractId },
            select: ['due_date', 'status', 'payment_number'],
        });
        const occupiedMonths = new Set(existingPayments
            .filter((payment) => payment.status !== 'cancelado')
            .map((payment) => this.getMonthKey(new Date(payment.due_date))));
        let nextPaymentNumber = existingPayments.reduce((max, payment) => Math.max(max, Number(payment.payment_number) || 0), 0) + 1;
        const payments = [];
        const duplicateMonths = [];
        const baseMonth = new Date(firstPaymentDate.getFullYear(), firstPaymentDate.getMonth(), 1);
        for (let i = 0; i < paymentsCount; i++) {
            const monthDate = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + i, 1);
            const monthKey = this.getMonthKey(monthDate);
            if (occupiedMonths.has(monthKey)) {
                duplicateMonths.push(this.formatMonthLabel(monthDate));
                continue;
            }
            const maxDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
            const safePaymentDay = Math.min(paymentDay, maxDayOfMonth);
            const dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), safePaymentDay);
            payments.push(this.hoaPaymentRepo.create({
                tenant_id: tenantId,
                contract_id: contractId,
                payment_number: String(nextPaymentNumber++),
                amount: dto.monthly_amount,
                amount_paid: 0,
                amount_pending: dto.monthly_amount,
                currency,
                due_date: dueDate,
                paid_date: null,
                first_partial_payment_date: null,
                payment_method: null,
                status: 'pendiente',
                is_overdue: false,
            }));
            occupiedMonths.add(monthKey);
        }
        if (payments.length === 0) {
            const monthList = [...new Set(duplicateMonths)].join(', ');
            throw new common_1.BadRequestException(duplicateMonths.length === 1
                ? `Ya hay un pago HOA para el mes ${monthList}`
                : `Ya hay pagos HOA para los meses: ${monthList}`);
        }
        return this.hoaPaymentRepo.save(payments);
    }
    async getContractHoaPayments(tenantId, contractId) {
        await this.ensureContractExists(tenantId, contractId);
        return this.hoaPaymentRepo
            .createQueryBuilder('p')
            .where('p.tenant_id = :tenantId', { tenantId })
            .andWhere('p.contract_id = :contractId', { contractId })
            .orderBy('CAST(p.payment_number AS UNSIGNED)', 'ASC')
            .getMany();
    }
    async getHoaPayment(tenantId, contractId, paymentId) {
        await this.ensureContractExists(tenantId, contractId);
        return this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);
    }
    async getHoaPaymentStats(tenantId, contractId) {
        const contract = await this.contractRepo.findOne({
            where: { id: contractId, tenant_id: tenantId },
            select: ['id', 'currency'],
        });
        const payments = await this.getContractHoaPayments(tenantId, contractId);
        const partialPayment = payments.find((p) => p.status === 'parcial') ?? null;
        const currency = (0, contract_currency_util_1.resolveStoredContractCurrency)(payments.find((payment) => payment.currency)?.currency ??
            contract?.currency);
        const totalPaid = payments.reduce((sum, p) => {
            if (p.status === 'pagado') {
                return sum + Number(p.amount || 0);
            }
            if (p.status === 'parcial') {
                return sum + Number(p.amount_paid || 0);
            }
            return sum;
        }, 0);
        const totalPending = payments.reduce((sum, p) => {
            if (p.status === 'pendiente' || p.status === 'parcial') {
                return sum + Number(p.amount_pending || 0);
            }
            return sum;
        }, 0);
        const totalExpected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        return {
            currency,
            total_payments: payments.length,
            paid_count: payments.filter((p) => p.status === 'pagado').length,
            pending_count: payments.filter((p) => p.status === 'pendiente').length,
            partial_count: payments.filter((p) => p.status === 'parcial').length,
            overdue_count: payments.filter((p) => p.is_overdue).length,
            cancelled_count: payments.filter((p) => p.status === 'cancelado').length,
            total_paid: Math.round(totalPaid * 100) / 100,
            total_pending: Math.round(totalPending * 100) / 100,
            total_expected: Math.round(totalExpected * 100) / 100,
            partial_payment: partialPayment
                ? {
                    id: partialPayment.id,
                    payment_number: partialPayment.payment_number,
                    amount_paid: Number(partialPayment.amount_paid),
                    amount_pending: Number(partialPayment.amount_pending),
                    due_date: partialPayment.due_date,
                }
                : null,
        };
    }
    async recordHoaPayment(tenantId, contractId, paymentId, dto) {
        await this.ensureContractAllowsHoaOperations(tenantId, contractId);
        const payment = await this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);
        if (payment.status === 'cancelado') {
            throw new common_1.BadRequestException('No se puede registrar un pago en un pago cancelado');
        }
        const currentAmountPaid = Number(payment.amount_paid) || 0;
        const totalAmount = Number(payment.amount) || 0;
        const paymentAmount = Number(dto.amount);
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
        if (newStatus === 'parcial') {
            await this.ensureNoOtherPartialPayment(tenantId, contractId, payment.id);
        }
        payment.amount_paid = newAmountPaid;
        payment.amount_pending = newAmountPending;
        payment.status = newStatus;
        payment.paid_date = new Date(dto.payment_date);
        payment.payment_method = dto.payment_method;
        if (!payment.first_partial_payment_date && newAmountPaid > 0) {
            payment.first_partial_payment_date = new Date(dto.payment_date);
        }
        const historyNote = `Pago HOA de ${paymentAmount} el ${dto.payment_date} (${dto.payment_method}${dto.reference_number ? `, Ref: ${dto.reference_number}` : ''})`;
        payment.notes = payment.notes ? `${payment.notes}\n${historyNote}` : historyNote;
        if (dto.notes) {
            payment.notes += `\nNotas: ${dto.notes}`;
        }
        return this.hoaPaymentRepo.save(payment);
    }
    async updateHoaPayment(tenantId, contractId, paymentId, dto) {
        const payment = await this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);
        if (payment.status === 'cancelado') {
            throw new common_1.BadRequestException('No se puede actualizar un pago cancelado');
        }
        if (dto.amount_paid !== undefined) {
            const newAmountPaid = Number(dto.amount_paid) || 0;
            const totalAmount = Number(payment.amount) || 0;
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
            if (newStatus === 'parcial' && payment.status !== 'parcial') {
                await this.ensureNoOtherPartialPayment(tenantId, contractId, payment.id);
            }
            payment.amount_paid = newAmountPaid;
            payment.amount_pending = newAmountPending;
            payment.status = newStatus;
        }
        if (dto.due_date) {
            payment.due_date = new Date(dto.due_date);
        }
        if (dto.paid_date) {
            payment.paid_date = new Date(dto.paid_date);
        }
        if (dto.payment_method !== undefined) {
            payment.payment_method = dto.payment_method;
        }
        if (dto.notes !== undefined) {
            payment.notes = dto.notes;
        }
        const updateNote = `Actualizado el ${new Date().toISOString().split('T')[0]}`;
        payment.notes = payment.notes ? `${payment.notes}\n${updateNote}` : updateNote;
        return this.hoaPaymentRepo.save(payment);
    }
    async cancelHoaPayment(tenantId, contractId, paymentId) {
        const payment = await this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);
        if (payment.status === 'cancelado') {
            throw new common_1.BadRequestException('El pago HOA ya está cancelado');
        }
        payment.status = 'cancelado';
        const cancelNote = `Pago HOA cancelado el ${new Date().toISOString().split('T')[0]}`;
        payment.notes = payment.notes ? `${payment.notes}\n${cancelNote}` : cancelNote;
        return this.hoaPaymentRepo.save(payment);
    }
    async resetHoaPayment(tenantId, contractId, paymentId) {
        const payment = await this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);
        if (payment.status === 'cancelado') {
            throw new common_1.BadRequestException('No se puede resetear un pago cancelado');
        }
        const previousAmountPaid = Number(payment.amount_paid) || 0;
        const totalAmount = Number(payment.amount) || 0;
        payment.amount_paid = 0;
        payment.amount_pending = totalAmount;
        payment.status = 'pendiente';
        payment.paid_date = null;
        payment.first_partial_payment_date = null;
        payment.payment_method = null;
        const resetNote = `Pago HOA reseteado el ${new Date().toISOString().split('T')[0]} (monto reiniciado: ${previousAmountPaid})`;
        payment.notes = payment.notes ? `${payment.notes}\n${resetNote}` : resetNote;
        return this.hoaPaymentRepo.save(payment);
    }
    async deleteHoaPayment(tenantId, contractId, paymentId) {
        const payment = await this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);
        await this.hoaPaymentRepo.remove(payment);
    }
    async markOverdueHoaPayments(tenantId, contractId) {
        await this.ensureContractExists(tenantId, contractId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await this.hoaPaymentRepo
            .createQueryBuilder()
            .update(contract_hoa_payment_entity_1.ContractHoaPayment)
            .set({
            is_overdue: true,
            updated_at: () => 'CURRENT_TIMESTAMP',
        })
            .where('tenant_id = :tenantId', { tenantId })
            .andWhere('contract_id = :contractId', { contractId })
            .andWhere('status IN (:...statuses)', { statuses: ['pendiente', 'parcial'] })
            .andWhere('due_date < :today', { today })
            .andWhere('is_overdue = :isOverdue', { isOverdue: false })
            .execute();
        return result.affected || 0;
    }
    async ensureContractExists(tenantId, contractId) {
        await this.ensureContractAllowsHoaOperations(tenantId, contractId);
    }
    async ensureContractAllowsHoaOperations(tenantId, contractId) {
        const contract = await this.contractRepo.findOne({
            where: { id: contractId, tenant_id: tenantId },
            select: ['id', 'status', 'contract_number', 'currency'],
        });
        if (!contract) {
            throw new common_1.NotFoundException('Contract not found');
        }
        if (contract.status === 'cancelado') {
            throw new common_1.BadRequestException(`No se pueden gestionar pagos HOA del contrato ${contract.contract_number} porque está cancelado`);
        }
        return contract;
    }
    resolveGenerateConfig(dto) {
        if (dto.first_payment_date && dto.payments_count) {
            const firstPaymentDate = new Date(dto.first_payment_date);
            if (Number.isNaN(firstPaymentDate.getTime())) {
                throw new common_1.BadRequestException('Fecha inicial de pago inválida');
            }
            return {
                firstPaymentDate,
                paymentsCount: dto.payments_count,
                paymentDay: dto.payment_day ?? 5,
            };
        }
        if (dto.start_date && dto.end_date) {
            const startDate = new Date(dto.start_date);
            const endDate = new Date(dto.end_date);
            if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
                throw new common_1.BadRequestException('Rango de fechas inválido');
            }
            if (endDate <= startDate) {
                throw new common_1.BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
            }
            const paymentsCount = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                (endDate.getMonth() - startDate.getMonth()) +
                1;
            if (paymentsCount <= 0) {
                throw new common_1.BadRequestException('El rango de fechas debe cubrir al menos un mes');
            }
            return {
                firstPaymentDate: startDate,
                paymentsCount,
                paymentDay: dto.payment_day ?? 5,
            };
        }
        throw new common_1.BadRequestException('Envía first_payment_date y payments_count, o start_date y end_date');
    }
    async getHoaPaymentOrThrow(tenantId, contractId, paymentId) {
        const payment = await this.hoaPaymentRepo.findOne({
            where: {
                id: paymentId,
                tenant_id: tenantId,
                contract_id: contractId,
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        return payment;
    }
    async ensureNoOtherPartialPayment(tenantId, contractId, currentPaymentId) {
        const existingPartial = await this.hoaPaymentRepo.findOne({
            where: {
                tenant_id: tenantId,
                contract_id: contractId,
                status: 'parcial',
            },
            order: { updated_at: 'DESC' },
        });
        if (existingPartial && existingPartial.id !== currentPaymentId) {
            throw new common_1.BadRequestException(`Ya existe un pago parcial en este contrato (Pago #${existingPartial.payment_number}). Complete ese pago primero antes de crear otro pago parcial.`);
        }
    }
    getMonthKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    formatMonthLabel(date) {
        return date.toLocaleDateString('es-MX', {
            month: 'long',
            year: 'numeric',
        });
    }
    resolveCurrency(requestedCurrency, contractCurrency) {
        const normalized = (requestedCurrency ?? contractCurrency ?? 'USD')
            .trim()
            .toUpperCase();
        return (0, contract_currency_util_1.normalizeContractCurrency)(normalized);
    }
};
exports.HoaPaymentsService = HoaPaymentsService;
exports.HoaPaymentsService = HoaPaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contract_hoa_payment_entity_1.ContractHoaPayment)),
    __param(1, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], HoaPaymentsService);
//# sourceMappingURL=hoa-payments.service.js.map