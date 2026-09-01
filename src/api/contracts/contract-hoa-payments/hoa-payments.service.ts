import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractHoaPayment } from '../../../entities/contracts/contract-hoa-payment.entity';
import {
  normalizeContractCurrency,
  resolveStoredContractCurrency,
} from '../contract-currency.util';
import { GenerateHoaPaymentsDto } from './dto/generate-hoa-payments.dto';
import { RecordHoaPaymentDto } from './dto/record-hoa-payment.dto';
import { UpdateHoaPaymentDto } from './dto/update-hoa-payment.dto';

@Injectable()
export class HoaPaymentsService {
  constructor(
    @InjectRepository(ContractHoaPayment)
    private hoaPaymentRepo: Repository<ContractHoaPayment>,
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
  ) {}

  async generateHoaPayments(
    tenantId: string,
    contractId: string,
    dto: GenerateHoaPaymentsDto,
  ): Promise<ContractHoaPayment[]> {
    const contract = await this.ensureContractAllowsHoaOperations(tenantId, contractId);
    const currency = this.resolveCurrency(dto.currency, contract.currency);

    const { firstPaymentDate, paymentsCount, paymentDay } =
      this.resolveGenerateConfig(dto);

    const existingPayments = await this.hoaPaymentRepo.find({
      where: { tenant_id: tenantId, contract_id: contractId },
      select: ['due_date', 'status', 'payment_number'],
    });

    const occupiedMonths = new Set(
      existingPayments
        .filter((payment) => payment.status !== 'cancelado')
        .map((payment) => this.getMonthKey(new Date(payment.due_date))),
    );

    let nextPaymentNumber =
      existingPayments.reduce(
        (max, payment) => Math.max(max, Number(payment.payment_number) || 0),
        0,
      ) + 1;

    const payments: ContractHoaPayment[] = [];
    const duplicateMonths: string[] = [];
    const baseMonth = new Date(
      firstPaymentDate.getFullYear(),
      firstPaymentDate.getMonth(),
      1,
    );

    for (let i = 0; i < paymentsCount; i++) {
      const monthDate = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + i, 1);
      const monthKey = this.getMonthKey(monthDate);

      if (occupiedMonths.has(monthKey)) {
        duplicateMonths.push(this.formatMonthLabel(monthDate));
        continue;
      }

      const maxDayOfMonth = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
      ).getDate();
      const safePaymentDay = Math.min(paymentDay, maxDayOfMonth);
      const dueDate = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        safePaymentDay,
      );

      payments.push(
        this.hoaPaymentRepo.create({
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
        }),
      );
      occupiedMonths.add(monthKey);
    }

    if (payments.length === 0) {
      const monthList = [...new Set(duplicateMonths)].join(', ');
      throw new BadRequestException(
        duplicateMonths.length === 1
          ? `Ya hay un pago HOA para el mes ${monthList}`
          : `Ya hay pagos HOA para los meses: ${monthList}`,
      );
    }

    return this.hoaPaymentRepo.save(payments);
  }

  async getContractHoaPayments(
    tenantId: string,
    contractId: string,
  ): Promise<ContractHoaPayment[]> {
    await this.ensureContractExists(tenantId, contractId);

    return this.hoaPaymentRepo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.contract_id = :contractId', { contractId })
      .orderBy('CAST(p.payment_number AS UNSIGNED)', 'ASC')
      .getMany();
  }

  async getHoaPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
  ): Promise<ContractHoaPayment> {
    await this.ensureContractExists(tenantId, contractId);
    return this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);
  }

  async getHoaPaymentStats(tenantId: string, contractId: string): Promise<any> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
      select: ['id', 'currency'],
    });
    const payments = await this.getContractHoaPayments(tenantId, contractId);
    const partialPayment = payments.find((p) => p.status === 'parcial') ?? null;
    const currency = resolveStoredContractCurrency(
      payments.find((payment) => payment.currency)?.currency ??
        contract?.currency,
    );

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

    const totalExpected = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );

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

  async recordHoaPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
    dto: RecordHoaPaymentDto,
  ): Promise<ContractHoaPayment> {
    await this.ensureContractAllowsHoaOperations(tenantId, contractId);
    const payment = await this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);

    if (payment.status === 'cancelado') {
      throw new BadRequestException(
        'No se puede registrar un pago en un pago cancelado',
      );
    }

    const currentAmountPaid = Number(payment.amount_paid) || 0;
    const totalAmount = Number(payment.amount) || 0;
    const paymentAmount = Number(dto.amount);
    const newAmountPaid = currentAmountPaid + paymentAmount;
    const newAmountPending = Math.max(0, totalAmount - newAmountPaid);

    let newStatus: string;
    if (newAmountPaid >= totalAmount) {
      newStatus = 'pagado';
    } else if (newAmountPaid > 0) {
      newStatus = 'parcial';
    } else {
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

  async updateHoaPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
    dto: UpdateHoaPaymentDto,
  ): Promise<ContractHoaPayment> {
    const payment = await this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);

    if (payment.status === 'cancelado') {
      throw new BadRequestException('No se puede actualizar un pago cancelado');
    }

    if (dto.amount_paid !== undefined) {
      const newAmountPaid = Number(dto.amount_paid) || 0;
      const totalAmount = Number(payment.amount) || 0;
      const newAmountPending = Math.max(0, totalAmount - newAmountPaid);

      let newStatus: string;
      if (newAmountPaid >= totalAmount) {
        newStatus = 'pagado';
      } else if (newAmountPaid > 0) {
        newStatus = 'parcial';
      } else {
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

  async cancelHoaPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
  ): Promise<ContractHoaPayment> {
    const payment = await this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);
    if (payment.status === 'cancelado') {
      throw new BadRequestException('El pago HOA ya está cancelado');
    }

    payment.status = 'cancelado';
    const cancelNote = `Pago HOA cancelado el ${new Date().toISOString().split('T')[0]}`;
    payment.notes = payment.notes ? `${payment.notes}\n${cancelNote}` : cancelNote;

    return this.hoaPaymentRepo.save(payment);
  }

  async resetHoaPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
  ): Promise<ContractHoaPayment> {
    const payment = await this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);
    if (payment.status === 'cancelado') {
      throw new BadRequestException('No se puede resetear un pago cancelado');
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

  async deleteHoaPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
  ): Promise<void> {
    const payment = await this.getHoaPaymentOrThrow(tenantId, contractId, paymentId);
    await this.hoaPaymentRepo.remove(payment);
  }

  async markOverdueHoaPayments(
    tenantId: string,
    contractId: string,
  ): Promise<number> {
    await this.ensureContractExists(tenantId, contractId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.hoaPaymentRepo
      .createQueryBuilder()
      .update(ContractHoaPayment)
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

  private async ensureContractExists(tenantId: string, contractId: string): Promise<void> {
    await this.ensureContractAllowsHoaOperations(tenantId, contractId);
  }

  /**
   * HOA es independiente del financiamiento del contrato.
   * Se permiten operaciones con contrato activo o completado.
   */
  private async ensureContractAllowsHoaOperations(
    tenantId: string,
    contractId: string,
  ): Promise<Contract> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
      select: ['id', 'status', 'contract_number', 'currency'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status === 'cancelado') {
      throw new BadRequestException(
        `No se pueden gestionar pagos HOA del contrato ${contract.contract_number} porque está cancelado`,
      );
    }

    return contract;
  }

  private resolveGenerateConfig(dto: GenerateHoaPaymentsDto): {
    firstPaymentDate: Date;
    paymentsCount: number;
    paymentDay: number;
  } {
    if (dto.first_payment_date && dto.payments_count) {
      const firstPaymentDate = new Date(dto.first_payment_date);
      if (Number.isNaN(firstPaymentDate.getTime())) {
        throw new BadRequestException('Fecha inicial de pago inválida');
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
        throw new BadRequestException('Rango de fechas inválido');
      }

      if (endDate <= startDate) {
        throw new BadRequestException(
          'La fecha de fin debe ser posterior a la fecha de inicio',
        );
      }

      const paymentsCount =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth()) +
        1;

      if (paymentsCount <= 0) {
        throw new BadRequestException(
          'El rango de fechas debe cubrir al menos un mes',
        );
      }

      return {
        firstPaymentDate: startDate,
        paymentsCount,
        paymentDay: dto.payment_day ?? 5,
      };
    }

    throw new BadRequestException(
      'Envía first_payment_date y payments_count, o start_date y end_date',
    );
  }

  private async getHoaPaymentOrThrow(
    tenantId: string,
    contractId: string,
    paymentId: string,
  ): Promise<ContractHoaPayment> {
    const payment = await this.hoaPaymentRepo.findOne({
      where: {
        id: paymentId,
        tenant_id: tenantId,
        contract_id: contractId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  private async ensureNoOtherPartialPayment(
    tenantId: string,
    contractId: string,
    currentPaymentId: string,
  ): Promise<void> {
    const existingPartial = await this.hoaPaymentRepo.findOne({
      where: {
        tenant_id: tenantId,
        contract_id: contractId,
        status: 'parcial',
      },
      order: { updated_at: 'DESC' },
    });

    if (existingPartial && existingPartial.id !== currentPaymentId) {
      throw new BadRequestException(
        `Ya existe un pago parcial en este contrato (Pago #${existingPartial.payment_number}). Complete ese pago primero antes de crear otro pago parcial.`,
      );
    }
  }

  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private formatMonthLabel(date: Date): string {
    return date.toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric',
    });
  }

  private resolveCurrency(
    requestedCurrency: string | undefined,
    contractCurrency: string | undefined,
  ): string {
    const normalized = (requestedCurrency ?? contractCurrency ?? 'USD')
      .trim()
      .toUpperCase();

    return normalizeContractCurrency(normalized);
  }
}
