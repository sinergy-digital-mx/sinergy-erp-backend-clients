import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../../entities/contracts/payment.entity';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractDownpaymentPayment } from '../../../entities/contracts/contract-downpayment-payment.entity';

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

    if (await this.hasPendingDownpaymentPayments(tenantId, contractId)) {
      throw new BadRequestException(
        'No se pueden generar pagos normales hasta liquidar completamente el enganche financiado',
      );
    }

    // Check if payments already exist
    const existingPayments = await this.paymentRepo.count({
      where: { contract_id: contractId, tenant_id: tenantId },
    });

    if (existingPayments > 0) {
      throw new BadRequestException('Payments already generated for this contract');
    }

    return this.createPaymentsForContract(tenantId, contract);
  }

  /**
   * Regenerate all payments for a contract (deletes existing ones first)
   */
  async regeneratePaymentsForContract(
    tenantId: string,
    contractId: string,
  ): Promise<Payment[]> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (await this.hasPendingDownpaymentPayments(tenantId, contractId)) {
      throw new BadRequestException(
        'No se pueden regenerar pagos normales hasta liquidar completamente el enganche financiado',
      );
    }

    // Delete existing payments
    await this.paymentRepo.delete({
      contract_id: contractId,
      tenant_id: tenantId,
    });

    return this.createPaymentsForContract(tenantId, contract);
  }

  /**
   * Private method to create payments for a contract
   */
  private async createPaymentsForContract(
    tenantId: string,
    contract: any,
  ): Promise<Payment[]> {
    const payments: Payment[] = [];
    const firstPaymentDate = new Date(contract.first_payment_date);

    for (let i = 0; i < contract.payment_months; i++) {
      // Calculate due date: day 5 of each month starting from first payment date
      const dueDate = new Date(firstPaymentDate.getFullYear(), firstPaymentDate.getMonth() + i, 5);

      const paymentData = {
        tenant_id: tenantId,
        contract_id: contract.id,
        payment_number: String(i + 1),
        payment_date: dueDate, // Required field - use due date as default
        due_date: dueDate, // VENCIMIENTO - día 5 de cada mes
        amount: contract.monthly_payment, // MONTO - total mensual a pagar
        amount_paid: 0, // PAGADO - $0 para pendientes
        amount_pending: contract.monthly_payment, // PENDIENTE - monto completo
        payment_method: 'transferencia',
        status: 'pendiente' as const,
        is_overdue: false,
      };

      const payment = this.paymentRepo.create(paymentData);
      payments.push(payment);
    }

    return this.paymentRepo.save(payments);
  }

  /**
   * Get all payments for a contract - FIXED ORDERING
   */
  async getContractPayments(tenantId: string, contractId: string): Promise<Payment[]> {
    return this.paymentRepo
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

    // Calculate financed amount (Total - Down Payment)
    const totalPrice = Number(contract.total_price) || 0;
    const downPayment = Number(contract.down_payment) || 0;
    const financedAmount = totalPrice - downPayment;

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

    // FIXED: total_pending = financed_amount - total_paid_from_payments
    // This matches the manual calculation: Financiado - Pagados
    const totalPendingCorrect = financedAmount - totalPaidCorrect;

    const stats = {
      total_payments: payments.length,
      paid_count: payments.filter(p => p.status === 'pagado').length,
      partial_count: payments.filter(p => p.status === 'parcial' && !p.is_overdue).length,
      partial_overdue_count: payments.filter(p => p.status === 'parcial' && p.is_overdue).length,
      pending_count: payments.filter(p => p.status === 'pendiente' && !p.is_overdue).length,
      pending_overdue_count: payments.filter(p => p.status === 'pendiente' && p.is_overdue).length,
      pending_full_payments: pendingFullPayments, // Frontend expects this
      overdue_count: payments.filter(p => p.is_overdue).length, // Total overdue (partial + pending)
      cancelled_count: payments.filter(p => p.status === 'cancelado').length,
      
      // Fix decimal precision issues and use correct calculation
      // FIXED: total_paid should include down payment to match contract list
      total_paid: Math.round((downPayment + totalPaidCorrect) * 100) / 100, // Enganche + pagos mensuales
      total_paid_from_payments: Math.round(totalPaidCorrect * 100) / 100, // Solo pagos mensuales, sin enganche
      
      // BREAKDOWN for UI
      paid_amount_complete: Math.round(paidAmountComplete * 100) / 100, // Solo pagos completados
      paid_amount_partial: Math.round(paidAmountPartial * 100) / 100, // Solo abonos parciales
      
      total_pending: Math.round(totalPendingCorrect * 100) / 100,
      total_expected: Math.round(payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) * 100) / 100,
      total_pending_amount: Math.round(totalPendingCorrect * 100) / 100, // Frontend expects this
      
      // Contract financial information
      financed_amount: Math.round(financedAmount * 100) / 100, // Monto financiado (Total - Enganche)
      total_price: Math.round(totalPrice * 100) / 100, // Total del contrato
      down_payment: Math.round(downPayment * 100) / 100, // Enganche
      
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

  private async hasPendingDownpaymentPayments(
    tenantId: string,
    contractId: string,
  ): Promise<boolean> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
      select: ['id', 'down_payment_financed', 'down_payment'],
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

    if (totalPaid < Number(contract.down_payment || 0)) {
      return true;
    }
    return false;
  }
}
