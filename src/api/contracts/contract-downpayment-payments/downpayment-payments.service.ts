import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractDownpaymentPayment } from '../../../entities/contracts/contract-downpayment-payment.entity';

@Injectable()
export class DownpaymentPaymentsService {
  constructor(
    @InjectRepository(ContractDownpaymentPayment)
    private downpaymentRepo: Repository<ContractDownpaymentPayment>,
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
  ) {}

  async generateDownpaymentPayments(
    tenantId: string,
    contractId: string,
  ): Promise<ContractDownpaymentPayment[]> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (!contract.down_payment_financed) {
      throw new BadRequestException(
        'Este contrato no tiene configurado financiamiento de enganche',
      );
    }

    if (
      !contract.down_payment_months ||
      !contract.down_payment_first_payment_date ||
      !contract.down_payment_payment_day ||
      Number(contract.down_payment_monthly_amount || 0) <= 0
    ) {
      throw new BadRequestException(
        'Faltan datos de configuración para generar pagos de enganche',
      );
    }

    const existingPayments = await this.downpaymentRepo.count({
      where: { tenant_id: tenantId, contract_id: contractId },
    });

    if (existingPayments > 0) {
      throw new BadRequestException(
        'Los pagos de enganche ya fueron generados para este contrato',
      );
    }

    const payments: ContractDownpaymentPayment[] = [];
    const firstDate = new Date(contract.down_payment_first_payment_date);
    const baseMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);

    for (let i = 0; i < contract.down_payment_months; i++) {
      const monthDate = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + i, 1);
      const maxDay = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
      ).getDate();
      const dueDay = Math.min(Number(contract.down_payment_payment_day), maxDay);
      const dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), dueDay);

      payments.push(
        this.downpaymentRepo.create({
          tenant_id: tenantId,
          contract_id: contractId,
          payment_number: String(i + 1),
          amount: Number(contract.down_payment_monthly_amount),
          amount_paid: 0,
          amount_pending: Number(contract.down_payment_monthly_amount),
          due_date: dueDate,
          paid_date: null,
          first_partial_payment_date: null,
          payment_method: null,
          status: 'pendiente',
          is_overdue: false,
        }),
      );
    }

    return this.downpaymentRepo.save(payments);
  }

  async getDownpaymentPayments(
    tenantId: string,
    contractId: string,
  ): Promise<ContractDownpaymentPayment[]> {
    await this.ensureContractExists(tenantId, contractId);
    return this.downpaymentRepo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.contract_id = :contractId', { contractId })
      .orderBy('CAST(p.payment_number AS UNSIGNED)', 'ASC')
      .getMany();
  }

  async getDownpaymentPaymentStats(tenantId: string, contractId: string): Promise<any> {
    const payments = await this.getDownpaymentPayments(tenantId, contractId);
    const partialPayment = payments.find((p) => p.status === 'parcial') ?? null;

    const totalPaid = payments.reduce((sum, p) => {
      if (p.status === 'pagado') return sum + Number(p.amount || 0);
      if (p.status === 'parcial') return sum + Number(p.amount_paid || 0);
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

  async recordDownpaymentPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
    amount: number,
    paymentDate: string,
    paymentMethod: string,
    referenceNumber?: string,
    notes?: string,
  ): Promise<ContractDownpaymentPayment> {
    const payment = await this.getPaymentOrThrow(tenantId, contractId, paymentId);
    if (payment.status === 'cancelado') {
      throw new BadRequestException(
        'No se puede registrar un pago en un pago cancelado',
      );
    }

    const paymentAmount = Number(amount);
    if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new BadRequestException('Amount must be a valid number greater than 0');
    }

    const currentAmountPaid = Number(payment.amount_paid) || 0;
    const totalAmount = Number(payment.amount) || 0;
    const newAmountPaid = currentAmountPaid + paymentAmount;
    const newAmountPending = Math.max(0, totalAmount - newAmountPaid);

    let newStatus = 'pendiente';
    if (newAmountPaid >= totalAmount) newStatus = 'pagado';
    else if (newAmountPaid > 0) newStatus = 'parcial';

    if (newStatus === 'parcial') {
      await this.ensureNoOtherPartialPayment(tenantId, contractId, payment.id);
    }

    payment.amount_paid = newAmountPaid;
    payment.amount_pending = newAmountPending;
    payment.status = newStatus;
    payment.paid_date = new Date(paymentDate);
    payment.payment_method = paymentMethod;

    if (!payment.first_partial_payment_date && newAmountPaid > 0) {
      payment.first_partial_payment_date = new Date(paymentDate);
    }

    const history = `Pago de enganche ${paymentAmount} el ${paymentDate} (${paymentMethod}${referenceNumber ? `, Ref: ${referenceNumber}` : ''})`;
    payment.notes = payment.notes ? `${payment.notes}\n${history}` : history;
    if (notes) {
      payment.notes += `\nNotas: ${notes}`;
    }

    return this.downpaymentRepo.save(payment);
  }

  async updateDownpaymentPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
    updates: {
      amount_paid?: number;
      due_date?: Date;
      paid_date?: Date;
      payment_method?: string;
      notes?: string;
    },
  ): Promise<ContractDownpaymentPayment> {
    const payment = await this.getPaymentOrThrow(tenantId, contractId, paymentId);
    if (payment.status === 'cancelado') {
      throw new BadRequestException('Cannot update cancelled payment');
    }

    if (updates.amount_paid !== undefined) {
      const newAmountPaid = Number(updates.amount_paid) || 0;
      const totalAmount = Number(payment.amount) || 0;
      if (newAmountPaid < 0 || Number.isNaN(newAmountPaid)) {
        throw new BadRequestException('Invalid amount_paid provided');
      }

      let newStatus = 'pendiente';
      if (newAmountPaid >= totalAmount) newStatus = 'pagado';
      else if (newAmountPaid > 0) newStatus = 'parcial';

      if (newStatus === 'parcial' && payment.status !== 'parcial') {
        await this.ensureNoOtherPartialPayment(tenantId, contractId, payment.id);
      }

      payment.amount_paid = newAmountPaid;
      payment.amount_pending = Math.max(0, totalAmount - newAmountPaid);
      payment.status = newStatus;
    }

    if (updates.due_date) payment.due_date = updates.due_date;
    if (updates.paid_date) payment.paid_date = updates.paid_date;
    if (updates.payment_method !== undefined) payment.payment_method = updates.payment_method;
    if (updates.notes !== undefined) payment.notes = updates.notes;

    const updateNote = `Actualizado el ${new Date().toISOString().split('T')[0]}`;
    payment.notes = payment.notes ? `${payment.notes}\n${updateNote}` : updateNote;

    return this.downpaymentRepo.save(payment);
  }

  async cancelDownpaymentPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
  ): Promise<ContractDownpaymentPayment> {
    const payment = await this.getPaymentOrThrow(tenantId, contractId, paymentId);
    if (payment.status === 'cancelado') {
      throw new BadRequestException('Payment is already cancelled');
    }
    payment.status = 'cancelado';
    const note = `Pago cancelado el ${new Date().toISOString().split('T')[0]}`;
    payment.notes = payment.notes ? `${payment.notes}\n${note}` : note;
    return this.downpaymentRepo.save(payment);
  }

  async resetDownpaymentPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
  ): Promise<ContractDownpaymentPayment> {
    const payment = await this.getPaymentOrThrow(tenantId, contractId, paymentId);
    if (payment.status === 'cancelado') {
      throw new BadRequestException('Cannot reset cancelled payment');
    }
    const totalAmount = Number(payment.amount) || 0;
    const previousAmountPaid = Number(payment.amount_paid) || 0;
    payment.amount_paid = 0;
    payment.amount_pending = totalAmount;
    payment.status = 'pendiente';
    payment.paid_date = null;
    payment.first_partial_payment_date = null;
    payment.payment_method = null;
    const note = `Pago reseteado el ${new Date().toISOString().split('T')[0]} (se devolvió ${previousAmountPaid})`;
    payment.notes = payment.notes ? `${payment.notes}\n${note}` : note;
    return this.downpaymentRepo.save(payment);
  }

  async deleteDownpaymentPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
  ): Promise<void> {
    const payment = await this.getPaymentOrThrow(tenantId, contractId, paymentId);
    await this.downpaymentRepo.remove(payment);
  }

  async markOverdueDownpaymentPayments(
    tenantId: string,
    contractId: string,
  ): Promise<number> {
    await this.ensureContractExists(tenantId, contractId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.downpaymentRepo
      .createQueryBuilder()
      .update(ContractDownpaymentPayment)
      .set({ is_overdue: true, updated_at: () => 'CURRENT_TIMESTAMP' })
      .where('tenant_id = :tenantId', { tenantId })
      .andWhere('contract_id = :contractId', { contractId })
      .andWhere('status IN (:...statuses)', { statuses: ['pendiente', 'parcial'] })
      .andWhere('due_date < :today', { today })
      .andWhere('is_overdue = :isOverdue', { isOverdue: false })
      .execute();

    return result.affected || 0;
  }

  async hasPendingDownpaymentPayments(
    tenantId: string,
    contractId: string,
  ): Promise<boolean> {
    const count = await this.downpaymentRepo.count({
      where: {
        tenant_id: tenantId,
        contract_id: contractId,
        status: 'pendiente',
      },
    });
    if (count > 0) return true;

    const partialCount = await this.downpaymentRepo.count({
      where: {
        tenant_id: tenantId,
        contract_id: contractId,
        status: 'parcial',
      },
    });
    return partialCount > 0;
  }

  private async ensureContractExists(tenantId: string, contractId: string): Promise<void> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
      select: ['id'],
    });
    if (!contract) throw new NotFoundException('Contract not found');
  }

  private async getPaymentOrThrow(
    tenantId: string,
    contractId: string,
    paymentId: string,
  ): Promise<ContractDownpaymentPayment> {
    const payment = await this.downpaymentRepo.findOne({
      where: { id: paymentId, tenant_id: tenantId, contract_id: contractId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  private async ensureNoOtherPartialPayment(
    tenantId: string,
    contractId: string,
    currentPaymentId: string,
  ): Promise<void> {
    const existingPartial = await this.downpaymentRepo.findOne({
      where: { tenant_id: tenantId, contract_id: contractId, status: 'parcial' },
      order: { updated_at: 'DESC' },
    });

    if (existingPartial && existingPartial.id !== currentPaymentId) {
      throw new BadRequestException(
        `Ya existe un pago parcial en este contrato (Pago #${existingPartial.payment_number}). Complete ese pago primero antes de crear otro pago parcial.`,
      );
    }
  }
}
