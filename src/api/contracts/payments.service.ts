import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      throw new NotFoundException('Contract not found');
    }

    // Check if payments already exist
    const existingPayments = await this.paymentRepo.count({
      where: { contract_id: contractId, tenant_id: tenantId },
    });

    if (existingPayments > 0) {
      throw new BadRequestException('Payments already generated for this contract');
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
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'pagado') {
      throw new BadRequestException('Cannot update a paid payment');
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
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'pagado') {
      throw new BadRequestException('Payment already marked as paid');
    }

    payment.status = 'pagado';
    payment.paid_date = paidDate;
    payment.payment_method = paymentMethod;
    payment.reference_number = referenceNumber || null;
    payment.amount_paid = payment.amount;
    payment.amount_pending = 0;

    const updatedPayment = await this.paymentRepo.save(payment);

    // Update contract remaining balance
    await this.updateContractBalance(tenantId, payment.contract_id);

    return updatedPayment;
  }

  /**
   * Record a partial payment
   */
  async recordPartialPayment(
    tenantId: string,
    paymentId: string,
    amount: number,
    paymentDate: Date,
    paymentMethod: string,
    referenceNumber?: string,
    notes?: string,
  ): Promise<Payment> {
    const payment = await this.getPayment(tenantId, paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'pagado') {
      throw new BadRequestException('Payment already fully paid');
    }

    if (payment.status === 'cancelado') {
      throw new BadRequestException('Cannot record payment on cancelled payment');
    }

    // Validar que no haya otro pago parcial en el contrato
    if (payment.status !== 'parcial') {
      const existingPartial = await this.paymentRepo.findOne({
        where: {
          contract_id: payment.contract_id,
          tenant_id: tenantId,
          status: 'parcial',
        },
      });

      if (existingPartial) {
        throw new BadRequestException(
          `Ya existe un pago parcial (Pago #${existingPartial.payment_number}). Completa ese pago antes de crear otro parcial.`,
        );
      }
    }

    // Calcular el monto pendiente actual
    const currentPending = Number(payment.amount) - Number(payment.amount_paid);

    if (amount > currentPending) {
      throw new BadRequestException(
        `Amount exceeds pending balance. Pending: $${currentPending.toFixed(2)}, Attempted: $${amount.toFixed(2)}`,
      );
    }

    // Actualizar montos
    const newAmountPaid = Number(payment.amount_paid) + amount;
    const newAmountPending = Number(payment.amount) - newAmountPaid;

    payment.amount_paid = newAmountPaid;
    payment.amount_pending = newAmountPending;
    payment.paid_date = paymentDate;
    payment.payment_method = paymentMethod;
    payment.reference_number = referenceNumber || payment.reference_number;

    // Si es el primer pago parcial, guardar la fecha
    if (!payment.first_partial_payment_date) {
      payment.first_partial_payment_date = paymentDate;
    }

    // Actualizar notas si se proporcionan
    if (notes) {
      payment.notes = payment.notes
        ? `${payment.notes}\n[${paymentDate.toISOString().split('T')[0]}] ${notes}`
        : notes;
    }

    // Determinar el estado
    if (newAmountPending === 0) {
      payment.status = 'pagado';
    } else {
      payment.status = 'parcial';
    }

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
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'pagado') {
      throw new BadRequestException('Cannot cancel a paid payment');
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
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'pagado') {
      throw new BadRequestException('Cannot delete a paid payment');
    }

    const contractId = payment.contract_id;
    await this.paymentRepo.remove(payment);
    
    // Update contract balance after deletion
    await this.updateContractBalance(tenantId, contractId);
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

    // Incluir pagos parciales en el cálculo
    const partialPayments = await this.paymentRepo.find({
      where: {
        contract_id: contractId,
        tenant_id: tenantId,
        status: 'parcial',
      },
    });

    const totalPaidFromComplete = paidPayments.reduce(
      (sum, payment) => sum + Number(payment.amount_paid),
      0,
    );
    const totalPaidFromPartial = partialPayments.reduce(
      (sum, payment) => sum + Number(payment.amount_paid),
      0,
    );
    const totalPaid = totalPaidFromComplete + totalPaidFromPartial;

    const remainingBalance =
      Number(contract.total_price) - Number(contract.down_payment) - totalPaid;

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

    // Get contract to calculate total pending dynamically
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Find partial payment if exists
    const partialPayment = payments.find(p => p.status === 'parcial');
    let partialPaymentData: {
      installment_number: number;
      amount_paid: number;
      remaining_amount: number;
      status: string;
    } | null = null;
    
    if (partialPayment) {
      partialPaymentData = {
        installment_number: partialPayment.payment_number,
        amount_paid: Number(partialPayment.amount_paid),
        remaining_amount: Number(partialPayment.amount_pending),
        status: 'pending_completion'
      };
    }

    // Calculate totals
    const totalPaidFromComplete = payments
      .filter(p => p.status === 'pagado')
      .reduce((sum, p) => sum + Number(p.amount_paid), 0);
    
    const totalPaidFromPartial = payments
      .filter(p => p.status === 'parcial')
      .reduce((sum, p) => sum + Number(p.amount_paid), 0);

    const totalPendingFromFull = payments
      .filter(p => p.status === 'pendiente' || p.status === 'vencido')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPendingFromPartial = partialPayment ? Number(partialPayment.amount_pending) : 0;

    // Calculate total pending amount DYNAMICALLY from contract
    const totalAfterDownPayment = Number(contract.total_price) - Number(contract.down_payment);
    const totalPaidFromPayments = totalPaidFromComplete + totalPaidFromPartial;
    const totalPendingAmountCalculated = totalAfterDownPayment - totalPaidFromPayments;

    const stats = {
      total_payments: payments.length,
      paid_count: payments.filter(p => p.status === 'pagado').length,
      partial_count: payments.filter(p => p.status === 'parcial').length,
      pending_count: payments.filter(p => p.status === 'pendiente' || p.status === 'vencido').length,
      overdue_count: payments.filter(p => p.status === 'vencido').length,
      cancelled_count: payments.filter(p => p.status === 'cancelado').length,
      
      // Existing fields (rounded to 2 decimals)
      total_paid: Math.round(totalPaidFromComplete * 100) / 100,
      total_partial: Math.round(totalPaidFromPartial * 100) / 100,
      total_pending: Math.round(totalPendingFromFull * 100) / 100,
      
      // New fields - calculated dynamically
      pending_full_payments: payments.filter(p => p.status === 'pendiente' || p.status === 'vencido').length,
      total_pending_amount: Math.round(totalPendingAmountCalculated * 100) / 100, // Calculado dinámicamente
      partial_payment: partialPaymentData,
      
      next_payment: payments.find(p => p.status === 'pendiente' || p.status === 'parcial' || p.status === 'vencido') || null,
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
