import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../entities/contracts/payment.entity';
import { Contract } from '../../entities/contracts/contract.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
  ) {}

  /**
   * Auto-generate all payments for a contract
   */
  async generatePaymentsForContract(
    tenantId: string,
    contractId: string,
  ): Promise<Payment[]> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Check if payments already exist
    const existingPayments = await this.paymentRepo.count({
      where: { contract_id: contractId, tenant_id: tenantId },
    });

    if (existingPayments > 0) {
      throw new Error('Payments already generated for this contract');
    }

    const payments: Payment[] = [];
    const firstPaymentDate = new Date(contract.first_payment_date);

    for (let i = 0; i < contract.payment_months; i++) {
      const dueDate = new Date(firstPaymentDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const payment = this.paymentRepo.create({
        tenant_id: tenantId,
        contract_id: contractId,
        payment_number: i + 1,
        amount: contract.monthly_payment,
        due_date: dueDate,
        status: 'pendiente',
      });

      payments.push(payment);
    }

    return this.paymentRepo.save(payments);
  }

  /**
   * Get all payments for a contract
   */
  async getContractPayments(tenantId: string, contractId: string): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { tenant_id: tenantId, contract_id: contractId },
      order: { payment_number: 'ASC' },
    });
  }

  /**
   * Get a single payment
   */
  async getPayment(tenantId: string, paymentId: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({
      where: { id: paymentId, tenant_id: tenantId },
      relations: ['contract'],
    });
  }

  /**
   * Update payment (amount, due_date, notes)
   */
  async updatePayment(
    tenantId: string,
    paymentId: string,
    updates: {
      amount?: number;
      due_date?: Date;
      notes?: string;
    },
  ): Promise<Payment> {
    const payment = await this.getPayment(tenantId, paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'pagado') {
      throw new Error('Cannot update a paid payment');
    }

    if (updates.amount !== undefined) {
      payment.amount = updates.amount;
    }

    if (updates.due_date !== undefined) {
      payment.due_date = updates.due_date;
    }

    if (updates.notes !== undefined) {
      payment.notes = updates.notes;
    }

    return this.paymentRepo.save(payment);
  }

  /**
   * Mark payment as paid
   */
  async markAsPaid(
    tenantId: string,
    paymentId: string,
    paidDate: Date,
    paymentMethod: string,
    referenceNumber?: string,
  ): Promise<Payment> {
    const payment = await this.getPayment(tenantId, paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'pagado') {
      throw new Error('Payment already marked as paid');
    }

    payment.status = 'pagado';
    payment.paid_date = paidDate;
    payment.payment_method = paymentMethod;
    payment.reference_number = referenceNumber || null;

    const updatedPayment = await this.paymentRepo.save(payment);

    // Update contract remaining balance
    await this.updateContractBalance(tenantId, payment.contract_id);

    return updatedPayment;
  }

  /**
   * Cancel payment
   */
  async cancelPayment(tenantId: string, paymentId: string): Promise<Payment> {
    const payment = await this.getPayment(tenantId, paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'pagado') {
      throw new Error('Cannot cancel a paid payment');
    }

    payment.status = 'cancelado';
    return this.paymentRepo.save(payment);
  }

  /**
   * Delete payment (only if not paid)
   */
  async deletePayment(tenantId: string, paymentId: string): Promise<void> {
    const payment = await this.getPayment(tenantId, paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'pagado') {
      throw new Error('Cannot delete a paid payment');
    }

    await this.paymentRepo.remove(payment);
  }

  /**
   * Update contract remaining balance based on paid payments
   */
  private async updateContractBalance(
    tenantId: string,
    contractId: string,
  ): Promise<void> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
    });

    if (!contract) {
      return;
    }

    const paidPayments = await this.paymentRepo.find({
      where: {
        contract_id: contractId,
        tenant_id: tenantId,
        status: 'pagado',
      },
    });

    const totalPaid = paidPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remainingBalance = Number(contract.total_price) - Number(contract.down_payment) - totalPaid;

    contract.remaining_balance = Math.max(0, remainingBalance);

    // Check if contract is completed
    if (contract.remaining_balance === 0) {
      contract.status = 'completado';
    }

    await this.contractRepo.save(contract);
  }

  /**
   * Get payment statistics for a contract
   */
  async getContractPaymentStats(tenantId: string, contractId: string): Promise<any> {
    const payments = await this.getContractPayments(tenantId, contractId);

    const stats = {
      total_payments: payments.length,
      paid_count: payments.filter(p => p.status === 'pagado').length,
      pending_count: payments.filter(p => p.status === 'pendiente').length,
      overdue_count: payments.filter(p => p.status === 'vencido').length,
      cancelled_count: payments.filter(p => p.status === 'cancelado').length,
      total_paid: payments
        .filter(p => p.status === 'pagado')
        .reduce((sum, p) => sum + Number(p.amount), 0),
      total_pending: payments
        .filter(p => p.status === 'pendiente')
        .reduce((sum, p) => sum + Number(p.amount), 0),
      next_payment: payments.find(p => p.status === 'pendiente') || null,
    };

    return stats;
  }

  /**
   * Mark overdue payments
   */
  async markOverduePayments(tenantId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overduePayments = await this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.tenant_id = :tenantId', { tenantId })
      .andWhere('payment.status = :status', { status: 'pendiente' })
      .andWhere('payment.due_date < :today', { today })
      .getMany();

    for (const payment of overduePayments) {
      payment.status = 'vencido';
      await this.paymentRepo.save(payment);
    }

    return overduePayments.length;
  }
}
