import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../../entities/contracts/payment.entity';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractDownpaymentPayment } from '../../../entities/contracts/contract-downpayment-payment.entity';
import {
  computeFinancedAmount,
  getDownPaymentTarget,
  resolveContractFinancials,
} from '../contract-financial.util';
import { GenerateContractPaymentsDto } from './dto/generate-contract-payments.dto';
import { resolveStoredContractCurrency } from '../contract-currency.util';

export interface PaymentSchedulePreview {
  start_date: string;
  end_date: string;
  payment_months: number;
  payment_day: number;
  payments_count: number;
  monthly_payment: number;
  currency: string;
}

export interface GeneratedPaymentsResult extends PaymentSchedulePreview {
  payments: Payment[];
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    @InjectRepository(ContractDownpaymentPayment)
    private downpaymentPaymentRepo: Repository<ContractDownpaymentPayment>,
  ) {}

  /**
   * Preview del calendario: inicio indicado, fin = inicio + (payment_months - 1) meses.
   */
  async previewPaymentSchedule(
    tenantId: string,
    contractId: string,
    startDateRaw?: string,
  ): Promise<PaymentSchedulePreview> {
    const contract = await this.getContractOrThrow(tenantId, contractId);
    const startDate = this.resolveStartDate(startDateRaw, contract);
    return this.buildSchedulePreview(contract, startDate);
  }

  /**
   * Auto-generate all payments for a contract
   */
  async generatePaymentsForContract(
    tenantId: string,
    contractId: string,
    dto: GenerateContractPaymentsDto = {},
  ): Promise<GeneratedPaymentsResult> {
    const contract = await this.getContractOrThrow(tenantId, contractId);

    if (await this.hasPendingDownpaymentPayments(tenantId, contractId)) {
      throw new BadRequestException(
        'No se pueden generar pagos normales hasta liquidar completamente el enganche financiado',
      );
    }

    const existingPayments = await this.paymentRepo.count({
      where: { contract_id: contractId, tenant_id: tenantId },
    });

    if (existingPayments > 0) {
      throw new BadRequestException(
        'Los pagos de este contrato ya fueron generados. Si te equivocaste, regenera siempre que no haya pagos pagados o parciales.',
      );
    }

    const startDate = this.resolveStartDate(dto.start_date, contract);
    return this.createPaymentsForContract(tenantId, contract, startDate);
  }

  /**
   * Regenera el calendario desde 0. Bloqueado si hay pagos pagados o parciales.
   */
  async regeneratePaymentsForContract(
    tenantId: string,
    contractId: string,
    dto: GenerateContractPaymentsDto = {},
  ): Promise<GeneratedPaymentsResult> {
    const contract = await this.getContractOrThrow(tenantId, contractId);

    if (await this.hasPendingDownpaymentPayments(tenantId, contractId)) {
      throw new BadRequestException(
        'No se pueden regenerar pagos normales hasta liquidar completamente el enganche financiado',
      );
    }

    const paidOrPartialCount = await this.countPaidOrPartialPayments(tenantId, contractId);
    if (paidOrPartialCount > 0) {
      throw new BadRequestException(
        `No se pueden regenerar los pagos porque hay ${paidOrPartialCount} pago(s) pagado(s) o parcial(es). Debes revertir esos pagos antes de regenerar.`,
      );
    }

    await this.paymentRepo.delete({
      contract_id: contractId,
      tenant_id: tenantId,
    });

    const startDate = this.resolveStartDate(dto.start_date, contract);
    return this.createPaymentsForContract(tenantId, contract, startDate);
  }

  private async createPaymentsForContract(
    tenantId: string,
    contract: Contract,
    startDate: Date,
  ): Promise<GeneratedPaymentsResult> {
    const paymentMonths = Number(contract.payment_months);
    if (!paymentMonths || paymentMonths < 1) {
      throw new BadRequestException(
        'El contrato no tiene meses de pago definidos para generar el calendario',
      );
    }

    const payments: Payment[] = [];

    for (let i = 0; i < paymentMonths; i++) {
      const dueDate = this.addMonthsClamped(startDate, i);

      payments.push(
        this.paymentRepo.create({
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
        }),
      );
    }

    const saved = await this.paymentRepo.save(payments);
    const schedule = this.buildSchedulePreview(contract, startDate);

    await this.contractRepo.update(
      { id: contract.id, tenant_id: tenantId },
      { first_payment_date: schedule.start_date as unknown as Date },
    );

    return {
      ...schedule,
      payments: saved.map((payment) => ({
        ...payment,
        currency: schedule.currency,
      })),
    };
  }

  /**
   * Get all payments for a contract - FIXED ORDERING
   */
  async getContractPayments(tenantId: string, contractId: string): Promise<any[]> {
    const contract = await this.getContractOrThrow(tenantId, contractId);
    const currency = resolveStoredContractCurrency(contract.currency);
    const payments = await this.paymentRepo
      .createQueryBuilder('p')
      .select([
        'p.id', 'p.payment_number', 'p.status', 'p.is_overdue', 
        'p.amount', 'p.amount_paid', 'p.amount_pending', 
        'p.due_date', 'p.paid_date', 'p.payment_method', 'p.notes'
      ])
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.contract_id = :contractId', { contractId })
      .orderBy('CAST(p.payment_number AS UNSIGNED)', 'ASC') // Fix: Order by number as integer
      .getMany();

    return payments.map((payment) => ({
      ...payment,
      currency,
    }));
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
   * Basic payment stats - FIXED TOTAL PAID CALCULATION
   */
  async getContractPaymentStats(tenantId: string, contractId: string): Promise<any> {
    const payments = await this.getContractPayments(tenantId, contractId);

    // Get contract information to calculate financed amount
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Find the current partial payment if any (including overdue partial)
    const partialPayment = payments.find(p => p.status === 'parcial');
    
    // Calculate pending full payments (excluding partial)
    const pendingFullPayments = payments.filter(p => p.status === 'pendiente').length;

    // CORRECT CALCULATION: 
    // - For PAID payments: count the full amount (not amount_paid)
    // - For PARTIAL payments: count only amount_paid
    // - For PENDING/OVERDUE payments: count 0
    const totalPaidCorrect = payments.reduce((sum, p) => {
      if (p.status === 'pagado') {
        return sum + Number(p.amount || 0); // Full amount for completed payments
      } else if (p.status === 'parcial') {
        return sum + Number(p.amount_paid || 0); // Only paid amount for partial payments
      }
      return sum; // 0 for pending/overdue payments
    }, 0);

    const totalPrice = Number(contract.total_price) || 0;
    const downPaymentTarget = getDownPaymentTarget(contract);
    const financedAmount = computeFinancedAmount(totalPrice, contract);
    const financials = resolveContractFinancials(contract, totalPaidCorrect);
    const downPaymentApplied = financials.down_payment_applied;
    const totalPendingCorrect = financials.remaining_balance;
    const totalPendingFromFinanced =
      contract.status === 'completado'
        ? 0
        : Math.max(
            0,
            Math.round((financedAmount - totalPaidCorrect) * 100) / 100,
          );

    // SEPARATE CALCULATIONS for UI breakdown
    const paidAmountComplete = payments.reduce((sum, p) => {
      if (p.status === 'pagado') {
        return sum + Number(p.amount || 0); // Full amount for completed payments only
      }
      return sum;
    }, 0);

    const paidAmountPartial = payments.reduce((sum, p) => {
      if (p.status === 'parcial') {
        return sum + Number(p.amount_paid || 0); // Only paid amount for partial payments
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

    const paidOrPartialCount = payments.filter(
      (p) => p.status === 'pagado' || p.status === 'parcial',
    ).length;

    const stats = {
      currency: resolveStoredContractCurrency(contract.currency),
      total_payments: payments.length,
      paid_count: payments.filter(p => p.status === 'pagado').length,
      partial_count: payments.filter(p => p.status === 'parcial' && !p.is_overdue).length,
      partial_overdue_count: payments.filter(p => p.status === 'parcial' && p.is_overdue).length,
      pending_count: payments.filter(p => p.status === 'pendiente' && !p.is_overdue).length,
      pending_overdue_count: payments.filter(p => p.status === 'pendiente' && p.is_overdue).length,
      pending_full_payments: pendingFullPayments, // Frontend expects this
      overdue_count: payments.filter(p => p.is_overdue).length, // Total overdue (partial + pending)
      overdue_amount: Math.round(overdueAmount * 100) / 100,
      cancelled_count: payments.filter(p => p.status === 'cancelado').length,
      
      // Fix decimal precision issues and use correct calculation
      total_paid: financials.total_paid,
      total_paid_from_payments: financials.total_paid_from_payments,
      
      // BREAKDOWN for UI
      paid_amount_complete: Math.round(paidAmountComplete * 100) / 100, // Solo pagos completados
      paid_amount_partial: Math.round(paidAmountPartial * 100) / 100, // Solo abonos parciales
      
      total_pending: Math.round(totalPendingFromFinanced * 100) / 100,
      total_expected: Math.round(payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) * 100) / 100,
      total_pending_amount: Math.round(totalPendingCorrect * 100) / 100,

      // Contract financial information
      financed_amount: Math.round(financedAmount * 100) / 100,
      total_price: Math.round(totalPrice * 100) / 100,
      down_payment: Math.round(downPaymentApplied * 100) / 100,
      down_payment_applied: Math.round(downPaymentApplied * 100) / 100,
      down_payment_target:
        contract.down_payment_financed && contract.down_payment_target != null
          ? Math.round(downPaymentTarget * 100) / 100
          : null,
      down_payment_target_defined:
        contract.down_payment_financed && contract.down_payment_target != null,
      
      can_generate: payments.length === 0,
      can_regenerate: payments.length > 0 && paidOrPartialCount === 0,
      paid_or_partial_count: paidOrPartialCount,
      cannot_regenerate_reason:
        payments.length === 0
          ? null
          : paidOrPartialCount > 0
            ? `Hay ${paidOrPartialCount} pago(s) pagado(s) o parcial(es). Debes revertirlos antes de regenerar.`
            : null,
      schedule: this.resolveScheduleFromPayments(contract, payments),

      // Partial payment details for frontend
      partial_payment: partialPayment ? {
        id: partialPayment.id,
        installment_number: parseInt(partialPayment.payment_number), // Frontend expects this field
        payment_number: partialPayment.payment_number, // Keep original for compatibility
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

  /**
   * Record a payment (full or partial) - FIXED NaN ISSUES + SINGLE PARTIAL VALIDATION
   */
  async recordPayment(
    tenantId: string,
    paymentId: string,
    amount: number,
    paymentDate: string,
    paymentMethod: string,
    referenceNumber?: string,
    notes?: string,
  ): Promise<Payment> {
    const payment = await this.getPayment(tenantId, paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'cancelado') {
      throw new BadRequestException('Cannot record payment for cancelled payment');
    }

    // Validate and sanitize amount
    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new BadRequestException('Amount must be a valid number greater than 0');
    }

    // Check if there's already a partial payment in this contract
    const existingPartialPayments = await this.paymentRepo.find({
      where: { 
        contract_id: payment.contract_id, 
        tenant_id: tenantId,
        status: 'parcial'
      }
    });

    // Calculate new amounts with proper number handling
    const currentAmountPaid = Number(payment.amount_paid) || 0;
    const totalAmount = Number(payment.amount) || 0;
    const newAmountPaid = currentAmountPaid + paymentAmount;
    const newAmountPending = Math.max(0, totalAmount - newAmountPaid);

    // Determine new status based on amounts
    let newStatus: string;
    if (newAmountPaid >= totalAmount) {
      newStatus = 'pagado'; // Fully paid (or overpaid)
    } else if (newAmountPaid > 0) {
      newStatus = 'parcial'; // Partially paid
    } else {
      newStatus = 'pendiente'; // Still pending
    }

    // VALIDATION: Only allow one partial payment per contract
    if (newStatus === 'parcial' && existingPartialPayments.length > 0) {
      // Check if the existing partial is the same payment we're updating
      const isUpdatingSamePayment = existingPartialPayments.some(p => p.id === payment.id);
      
      if (!isUpdatingSamePayment) {
        const existingPartial = existingPartialPayments[0];
        throw new BadRequestException(
          `Ya existe un pago parcial en este contrato (Pago #${existingPartial.payment_number}). ` +
          `Complete ese pago primero antes de crear otro pago parcial.`
        );
      }
    }

    // Update payment
    payment.amount_paid = newAmountPaid;
    payment.amount_pending = newAmountPending;
    payment.status = newStatus;
    payment.paid_date = new Date(paymentDate);
    payment.payment_method = paymentMethod;

    // Set first partial payment date if this is the first payment
    if (!payment.first_partial_payment_date && newAmountPaid > 0) {
      payment.first_partial_payment_date = new Date(paymentDate);
    }

    // Update notes with payment history
    const paymentRecord = `Pago de ${paymentAmount} el ${paymentDate} (${paymentMethod}${referenceNumber ? `, Ref: ${referenceNumber}` : ''})`;
    payment.notes = payment.notes ? `${payment.notes}\n${paymentRecord}` : paymentRecord;
    
    if (notes) {
      payment.notes += `\nNotas: ${notes}`;
    }

    // Handle overpayment case
    if (newAmountPaid > totalAmount) {
      const overpayment = newAmountPaid - totalAmount;
      payment.notes += `\n⚠️ Sobrepago de ${overpayment.toFixed(2)}`;
    }

    const savedPayment = await this.paymentRepo.save(payment);

    // Update contract remaining balance with proper validation
    const contract = await this.contractRepo.findOne({
      where: { id: payment.contract_id },
    });

    if (contract) {
      const currentBalance = Number(contract.remaining_balance) || 0;
      const newBalance = Math.max(0, currentBalance - paymentAmount);
      
      // Only update if the new balance is a valid number
      if (!isNaN(newBalance)) {
        await this.contractRepo.update(
          { id: contract.id },
          { remaining_balance: newBalance }
        );
      }
    }

    return savedPayment;
  }

  /**
   * Update payment details - UPDATES PAID AMOUNT, NOT EXPECTED AMOUNT
   */
  async updatePayment(
    tenantId: string,
    paymentId: string,
    updates: { 
      amount_paid?: number;  // How much was actually paid
      due_date?: Date; 
      paid_date?: Date;
      payment_method?: string;
      reference_number?: string;
      notes?: string;
    },
  ): Promise<Payment> {
    const payment = await this.getPayment(tenantId, paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'cancelado') {
      throw new BadRequestException('Cannot update cancelled payment');
    }

    // Update amount_paid if provided (this is what was actually paid)
    if (updates.amount_paid !== undefined) {
      const newAmountPaid = Number(updates.amount_paid) || 0;
      const expectedAmount = Number(payment.amount) || 0;
      
      // Validate new amount paid
      if (isNaN(newAmountPaid) || newAmountPaid < 0) {
        throw new BadRequestException(`Invalid amount_paid provided: ${updates.amount_paid}`);
      }
      
      const oldAmountPaid = Number(payment.amount_paid) || 0;
      const difference = newAmountPaid - oldAmountPaid;
      
      // Calculate new status
      let newStatus: string;
      if (newAmountPaid >= expectedAmount) {
        newStatus = 'pagado';
      } else if (newAmountPaid > 0) {
        newStatus = 'parcial';
      } else {
        newStatus = 'pendiente';
      }

      // VALIDATION: Only allow one partial payment per contract
      if (newStatus === 'parcial' && payment.status !== 'parcial') {
        // Check if there's already another partial payment in this contract
        const existingPartialPayments = await this.paymentRepo.find({
          where: { 
            contract_id: payment.contract_id, 
            tenant_id: tenantId,
            status: 'parcial'
          }
        });

        if (existingPartialPayments.length > 0) {
          const existingPartial = existingPartialPayments[0];
          throw new BadRequestException(
            `Ya existe un pago parcial en este contrato (Pago #${existingPartial.payment_number}). ` +
            `Complete ese pago primero antes de crear otro pago parcial.`
          );
        }
      }
      
      // Update payment amounts
      payment.amount_paid = newAmountPaid;
      payment.amount_pending = Math.max(0, expectedAmount - newAmountPaid);
      payment.status = newStatus;

      // Update contract balance based on the difference in amount_paid
      if (!isNaN(difference) && difference !== 0) {
        const contract = await this.contractRepo.findOne({
          where: { id: payment.contract_id },
        });

        if (contract) {
          const currentBalance = Number(contract.remaining_balance) || 0;
          const newBalance = Math.max(0, currentBalance - difference); // Subtract difference because more paid = less balance
          
          if (!isNaN(newBalance) && isFinite(newBalance)) {
            await this.contractRepo.update(
              { id: contract.id },
              { remaining_balance: newBalance }
            );
          }
        }
      }
    }

    // Update other fields if provided
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

    // Add update note
    const updateNote = `Actualizado el ${new Date().toISOString().split('T')[0]}`;
    payment.notes = payment.notes ? `${payment.notes}\n${updateNote}` : updateNote;

    return this.paymentRepo.save(payment);
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(tenantId: string, paymentId: string): Promise<Payment> {
    const payment = await this.getPayment(tenantId, paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'cancelado') {
      throw new BadRequestException('Payment is already cancelled');
    }

    // Restore contract balance if payment was paid
    if (payment.amount_paid > 0) {
      const contract = await this.contractRepo.findOne({
        where: { id: payment.contract_id },
      });

      if (contract) {
        const restoredBalance = contract.remaining_balance + payment.amount_paid;
        await this.contractRepo.update(
          { id: contract.id },
          { remaining_balance: restoredBalance }
        );
      }
    }

    // Update payment status
    payment.status = 'cancelado';
    payment.notes = payment.notes ? `${payment.notes}\nPago cancelado el ${new Date().toISOString().split('T')[0]}` : `Pago cancelado el ${new Date().toISOString().split('T')[0]}`;

    return this.paymentRepo.save(payment);
  }

  /**
   * Delete a payment
   */
  async deletePayment(tenantId: string, paymentId: string): Promise<void> {
    const payment = await this.getPayment(tenantId, paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Restore contract balance if payment was paid
    if (payment.amount_paid > 0) {
      const contract = await this.contractRepo.findOne({
        where: { id: payment.contract_id },
      });

      if (contract) {
        const restoredBalance = contract.remaining_balance + payment.amount_paid;
        await this.contractRepo.update(
          { id: contract.id },
          { remaining_balance: restoredBalance }
        );
      }
    }

    await this.paymentRepo.remove(payment);
  }

  /**
   * Reset/Undo a payment - Mark as unpaid and reset to pending
   */
  async resetPayment(tenantId: string, paymentId: string): Promise<Payment> {
    const payment = await this.getPayment(tenantId, paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'cancelado') {
      throw new BadRequestException('Cannot reset cancelled payment');
    }

    // Store the amount that was paid to restore contract balance
    const previousAmountPaid = Number(payment.amount_paid) || 0;
    const expectedAmount = Number(payment.amount) || 0;

    // Reset payment to unpaid state
    payment.amount_paid = 0;
    payment.amount_pending = expectedAmount;
    payment.status = 'pendiente';
    payment.paid_date = null as any; // TypeScript fix
    payment.first_partial_payment_date = null as any; // TypeScript fix

    // Add reset note
    const resetNote = `Pago reseteado el ${new Date().toISOString().split('T')[0]} (se devolvió ${previousAmountPaid} al balance)`;
    payment.notes = payment.notes ? `${payment.notes}\n${resetNote}` : resetNote;

    const savedPayment = await this.paymentRepo.save(payment);

    // Restore contract balance (add back the amount that was previously paid)
    if (previousAmountPaid > 0) {
      const contract = await this.contractRepo.findOne({
        where: { id: payment.contract_id },
      });

      if (contract) {
        const currentBalance = Number(contract.remaining_balance) || 0;
        const newBalance = currentBalance + previousAmountPaid;
        
        if (!isNaN(newBalance) && isFinite(newBalance)) {
          await this.contractRepo.update(
            { id: contract.id },
            { remaining_balance: newBalance }
          );
        }
      }
    }

    return savedPayment;
  }

  /**
   * Mark overdue payments
   */
  async markOverduePayments(tenantId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.paymentRepo
      .createQueryBuilder()
      .update(Payment)
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

  private async getContractOrThrow(tenantId: string, contractId: string): Promise<Contract> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    return contract;
  }

  private async countPaidOrPartialPayments(
    tenantId: string,
    contractId: string,
  ): Promise<number> {
    return this.paymentRepo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.contract_id = :contractId', { contractId })
      .andWhere('p.status IN (:...statuses)', { statuses: ['pagado', 'parcial'] })
      .getCount();
  }

  private resolveStartDate(
    startDateRaw: string | Date | undefined,
    contract: Contract,
  ): Date {
    const raw = startDateRaw ?? contract.first_payment_date;
    if (!raw) {
      throw new BadRequestException(
        'Indica la fecha de inicio de los pagos (día, mes y año)',
      );
    }

    return this.parseDateOnly(raw);
  }

  private buildSchedulePreview(
    contract: Contract,
    startDate: Date,
  ): PaymentSchedulePreview {
    const paymentMonths = Number(contract.payment_months) || 0;
    if (paymentMonths < 1) {
      throw new BadRequestException(
        'El contrato no tiene meses de pago definidos para calcular el calendario',
      );
    }

    const endDate = this.addMonthsClamped(startDate, paymentMonths - 1);

    return {
      start_date: this.formatDateOnly(startDate),
      end_date: this.formatDateOnly(endDate),
      payment_months: paymentMonths,
      payment_day: startDate.getDate(),
      payments_count: paymentMonths,
      monthly_payment: Math.round(Number(contract.monthly_payment || 0) * 100) / 100,
      currency: resolveStoredContractCurrency(contract.currency),
    };
  }

  private resolveScheduleFromPayments(
    contract: Contract,
    payments: Payment[],
  ): PaymentSchedulePreview | null {
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
        currency: resolveStoredContractCurrency(contract.currency),
      };
    }

    if (!contract.first_payment_date) {
      return null;
    }

    return this.buildSchedulePreview(
      contract,
      this.parseDateOnly(contract.first_payment_date),
    );
  }

  private parseDateOnly(value: string | Date): Date {
    const raw =
      typeof value === 'string'
        ? value.slice(0, 10)
        : this.formatDateOnlyFromUnknown(value);

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) {
      throw new BadRequestException(
        'Fecha de inicio inválida. Usa formato YYYY-MM-DD',
      );
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new BadRequestException('Fecha de inicio inválida');
    }

    return date;
  }

  private formatDateOnlyFromUnknown(value: Date): string {
    const isUtcMidnight =
      value.getUTCHours() === 0 &&
      value.getUTCMinutes() === 0 &&
      value.getUTCSeconds() === 0;

    const year = isUtcMidnight ? value.getUTCFullYear() : value.getFullYear();
    const month = (isUtcMidnight ? value.getUTCMonth() : value.getMonth()) + 1;
    const day = isUtcMidnight ? value.getUTCDate() : value.getDate();

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private addMonthsClamped(startDate: Date, monthsToAdd: number): Date {
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + monthsToAdd;
    const day = startDate.getDate();
    const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, lastDayOfTargetMonth));
  }

  private async hasPendingDownpaymentPayments(
    tenantId: string,
    contractId: string,
  ): Promise<boolean> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
      select: ['id', 'down_payment_financed', 'down_payment', 'down_payment_target'],
    });

    if (!contract || !contract.down_payment_financed) {
      return false;
    }

    const databaseResult = await this.contractRepo.manager.query(
      'SELECT DATABASE() as db',
    );
    const dbName = databaseResult?.[0]?.db;
    if (!dbName) {
      return false;
    }

    const tableResult = await this.contractRepo.manager.query(
      `
        SELECT COUNT(*) as total
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'contract_downpayment_payments'
      `,
      [dbName],
    );

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

    const downPaymentTarget =
      contract.down_payment_target != null
        ? Number(contract.down_payment_target)
        : null;

    if (downPaymentTarget == null || downPaymentTarget <= 0) {
      return true;
    }

    if (totalPaid < downPaymentTarget) {
      return true;
    }

    const pendingOrPartial = paymentRows.filter(
      (row) => row.status === 'pendiente' || row.status === 'parcial',
    ).length;

    return pendingOrPartial > 0;
  }
}
