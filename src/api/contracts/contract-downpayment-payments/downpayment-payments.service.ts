import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractDownpaymentPayment } from '../../../entities/contracts/contract-downpayment-payment.entity';
import {
  computeFinancingSnapshot,
  getDownPaymentApplied,
  sumPaidFromPaymentRows,
} from '../contract-financial.util';
import { CreateManualDownpaymentPaymentDto } from './dto/create-manual-downpayment-payment.dto';
import { GenerateDownpaymentPaymentsDto } from './dto/generate-downpayment-payments.dto';
import { resolveStoredContractCurrency } from '../contract-currency.util';

@Injectable()
export class DownpaymentPaymentsService {
  constructor(
    @InjectRepository(ContractDownpaymentPayment)
    private downpaymentRepo: Repository<ContractDownpaymentPayment>,
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
  ) {}

  async createManualDownpaymentPayment(
    tenantId: string,
    contractId: string,
    dto: CreateManualDownpaymentPaymentDto,
  ): Promise<ContractDownpaymentPayment> {
    await this.getFinancedContractOrThrow(tenantId, contractId);

    const amount = Math.round(Number(dto.amount) * 100) / 100;
    const dueDate = new Date(dto.due_date);
    if (Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException('Fecha de vencimiento inválida');
    }

    const paymentNumber = await this.getNextPaymentNumber(tenantId, contractId);
    const payment = this.createDownpaymentRow(
      tenantId,
      contractId,
      paymentNumber,
      amount,
      dueDate,
    );

    if (dto.record_as_paid) {
      const paymentDate = dto.payment_date ?? dto.due_date;
      payment.amount_paid = amount;
      payment.amount_pending = 0;
      payment.status = 'pagado';
      payment.paid_date = new Date(paymentDate);
      payment.payment_method = dto.payment_method ?? 'efectivo';
      payment.first_partial_payment_date = new Date(paymentDate);
      const history = `Abono manual de enganche ${amount} el ${paymentDate}`;
      payment.notes = dto.notes ? `${history}\n${dto.notes}` : history;
    } else if (dto.notes) {
      payment.notes = dto.notes;
    }

    const saved = await this.downpaymentRepo.save(payment);
    await this.syncContractDownPaymentApplied(tenantId, contractId);
    return saved;
  }

  /**
   * Genera cuotas de enganche (y opcionalmente fija la meta total).
   * Resta pagos manuales ya existentes: meta - programado = saldo a dividir en meses.
   */
  async generateDownpaymentPayments(
    tenantId: string,
    contractId: string,
    dto: GenerateDownpaymentPaymentsDto = {},
  ): Promise<ContractDownpaymentPayment[]> {
    const contract = await this.getFinancedContractOrThrow(tenantId, contractId);

    const downPaymentTarget =
      dto.down_payment_target ??
      (contract.down_payment_target != null
        ? Number(contract.down_payment_target)
        : null);

    if (!downPaymentTarget || downPaymentTarget <= 0) {
      throw new BadRequestException(
        'Indica down_payment_target (enganche total pactado) al generar las cuotas',
      );
    }

    const installmentMonths =
      dto.down_payment_months ?? contract.down_payment_months ?? null;
    const paymentDay =
      dto.payment_day ?? contract.down_payment_payment_day ?? null;
    const firstPaymentDateRaw =
      dto.first_payment_date ?? contract.down_payment_first_payment_date ?? null;

    if (!installmentMonths || installmentMonths < 1) {
      throw new BadRequestException(
        'Indica down_payment_months (meses a financiar del saldo restante)',
      );
    }

    const existingRows = await this.downpaymentRepo.find({
      where: { tenant_id: tenantId, contract_id: contractId },
      select: ['amount', 'status'],
    });
    const existingScheduled = existingRows
      .filter((row) => row.status !== 'cancelado')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const newInitialPayments = dto.initial_payments ?? [];
    const newInitialTotal = newInitialPayments.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    const remainder = Math.round(
      (downPaymentTarget - existingScheduled - newInitialTotal) * 100,
    ) / 100;

    if (remainder < 0) {
      throw new BadRequestException(
        'Los pagos ya registrados superan el enganche objetivo indicado',
      );
    }

    const payments: ContractDownpaymentPayment[] = [];
    let paymentNumber = await this.getNextPaymentNumber(tenantId, contractId);

    for (const initial of newInitialPayments) {
      const amount = Math.round(Number(initial.amount) * 100) / 100;
      const dueDate = new Date(initial.due_date);
      if (Number.isNaN(dueDate.getTime())) {
        throw new BadRequestException('Fecha de vencimiento inválida en pagos iniciales');
      }
      payments.push(
        this.createDownpaymentRow(tenantId, contractId, paymentNumber++, amount, dueDate),
      );
    }

    if (remainder > 0) {
      if (!paymentDay || paymentDay < 1 || paymentDay > 31) {
        throw new BadRequestException(
          'Indica payment_day (1-31) para las cuotas mensuales del enganche',
        );
      }
      if (!firstPaymentDateRaw) {
        throw new BadRequestException(
          'Indica first_payment_date para las cuotas mensuales del enganche',
        );
      }

      const firstDate = new Date(firstPaymentDateRaw);
      if (Number.isNaN(firstDate.getTime())) {
        throw new BadRequestException('first_payment_date inválida');
      }

      const monthlyAmount = Math.round((remainder / installmentMonths) * 100) / 100;
      const baseMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
      let distributed = 0;

      for (let i = 0; i < installmentMonths; i++) {
        const monthDate = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + i, 1);
        const maxDay = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0,
        ).getDate();
        const dueDay = Math.min(Number(paymentDay), maxDay);
        const dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), dueDay);

        let amount = monthlyAmount;
        if (i === installmentMonths - 1) {
          amount = Math.round((remainder - distributed) * 100) / 100;
        } else {
          distributed += amount;
        }

        payments.push(
          this.createDownpaymentRow(tenantId, contractId, paymentNumber++, amount, dueDate),
        );
      }
    }

    const firstPaymentDate = firstPaymentDateRaw
      ? new Date(firstPaymentDateRaw)
      : contract.down_payment_first_payment_date;

    await this.contractRepo.update(
      { id: contractId, tenant_id: tenantId },
      {
        down_payment_target: downPaymentTarget,
        down_payment_months: installmentMonths,
        down_payment_payment_day: paymentDay ?? contract.down_payment_payment_day,
        down_payment_first_payment_date: firstPaymentDate,
        down_payment_monthly_amount:
          remainder > 0 && installmentMonths > 0
            ? Math.round((remainder / installmentMonths) * 100) / 100
            : null,
      },
    );

    const saved =
      payments.length > 0 ? await this.downpaymentRepo.save(payments) : [];

    await this.recalculateContractFinancing(tenantId, contractId);
    await this.syncContractDownPaymentApplied(tenantId, contractId);

    return saved;
  }

  async getDownpaymentPayments(
    tenantId: string,
    contractId: string,
  ): Promise<any[]> {
    await this.ensureContractExists(tenantId, contractId);
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
      select: ['currency'],
    });
    const currency = resolveStoredContractCurrency(contract?.currency);
    const payments = await this.downpaymentRepo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.contract_id = :contractId', { contractId })
      .orderBy('CAST(p.payment_number AS UNSIGNED)', 'ASC')
      .getMany();

    return payments.map((payment) => ({
      ...payment,
      currency,
    }));
  }

  async getDownpaymentPaymentStats(tenantId: string, contractId: string): Promise<any> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
      select: ['down_payment', 'down_payment_target', 'down_payment_financed', 'currency'],
    });
    const payments = await this.getDownpaymentPayments(tenantId, contractId);
    const partialPayment = payments.find((p) => p.status === 'parcial') ?? null;
    const downPaymentTarget = contract
      ? this.getDownPaymentTarget(contract)
      : null;
    const downPaymentApplied = contract ? Number(contract.down_payment) || 0 : 0;
    const targetValue = downPaymentTarget ?? 0;

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
      currency: resolveStoredContractCurrency(contract?.currency),
      total_payments: payments.length,
      paid_count: payments.filter((p) => p.status === 'pagado').length,
      pending_count: payments.filter((p) => p.status === 'pendiente').length,
      partial_count: payments.filter((p) => p.status === 'parcial').length,
      overdue_count: payments.filter((p) => p.is_overdue).length,
      cancelled_count: payments.filter((p) => p.status === 'cancelado').length,
      down_payment_target:
        downPaymentTarget != null
          ? Math.round(downPaymentTarget * 100) / 100
          : null,
      down_payment_target_defined: downPaymentTarget != null && downPaymentTarget > 0,
      down_payment_applied: Math.round(downPaymentApplied * 100) / 100,
      down_payment_remaining:
        downPaymentTarget != null
          ? Math.max(
              0,
              Math.round((targetValue - downPaymentApplied) * 100) / 100,
            )
          : null,
      downpayment_financing_complete:
        downPaymentTarget != null &&
        downPaymentTarget > 0 &&
        downPaymentApplied >= downPaymentTarget,
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

    const saved = await this.downpaymentRepo.save(payment);
    await this.syncContractDownPaymentApplied(tenantId, contractId);
    return saved;
  }

  async updateDownpaymentTarget(
    tenantId: string,
    contractId: string,
    downPaymentTarget: number,
  ): Promise<any> {
    const contract = await this.getFinancedContractOrThrow(tenantId, contractId);
    const target = Math.round(Number(downPaymentTarget) * 100) / 100;

    if (!Number.isFinite(target) || target <= 0) {
      throw new BadRequestException('La meta de enganche debe ser mayor a 0');
    }

    const paymentRows = await this.downpaymentRepo.find({
      where: { tenant_id: tenantId, contract_id: contractId },
      select: ['amount', 'status', 'amount_paid'],
    });

    const activeRows = paymentRows.filter((row) => row.status !== 'cancelado');
    const scheduledTotal = activeRows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0,
    );
    const appliedTotal = activeRows.reduce((sum, row) => {
      if (row.status === 'pagado') {
        return sum + Number(row.amount || 0);
      }
      if (row.status === 'parcial') {
        return sum + Number(row.amount_paid || 0);
      }
      return sum;
    }, 0);

    if (target < appliedTotal) {
      throw new BadRequestException(
        `La meta no puede ser menor al enganche ya abonado ($${appliedTotal.toFixed(2)})`,
      );
    }

    if (scheduledTotal > 0 && target < scheduledTotal) {
      throw new BadRequestException(
        `La meta no puede ser menor a la suma de cuotas programadas ($${scheduledTotal.toFixed(2)})`,
      );
    }

    await this.contractRepo.update(
      { id: contractId, tenant_id: tenantId },
      { down_payment_target: target },
    );

    await this.recalculateContractFinancing(tenantId, contractId);

    const updatedContract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
      select: [
        'down_payment',
        'down_payment_target',
        'monthly_payment',
        'remaining_balance',
        'payment_months',
        'total_price',
      ],
    });

    return {
      down_payment_target: target,
      down_payment_applied: Number(updatedContract?.down_payment ?? 0),
      down_payment_pending: Math.max(
        0,
        Math.round((target - Number(updatedContract?.down_payment ?? 0)) * 100) / 100,
      ),
      financed_amount: target,
      monthly_payment: Number(updatedContract?.monthly_payment ?? 0),
      remaining_balance: Number(updatedContract?.remaining_balance ?? 0),
      scheduled_total: Math.round(scheduledTotal * 100) / 100,
    };
  }

  async updateDownpaymentPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
    updates: {
      amount?: number;
      amount_paid?: number;
      due_date?: Date | string;
      paid_date?: Date | string;
      payment_method?: string;
      notes?: string;
    },
  ): Promise<ContractDownpaymentPayment> {
    const payment = await this.getPaymentOrThrow(tenantId, contractId, paymentId);
    if (payment.status === 'cancelado') {
      throw new BadRequestException('Cannot update cancelled payment');
    }

    if (updates.amount !== undefined) {
      const newAmount = Math.round(Number(updates.amount) * 100) / 100;
      const amountPaid = Number(payment.amount_paid) || 0;

      if (!Number.isFinite(newAmount) || newAmount <= 0) {
        throw new BadRequestException('El monto debe ser mayor a 0');
      }

      if (newAmount < amountPaid) {
        throw new BadRequestException(
          `El monto no puede ser menor a lo ya pagado ($${amountPaid.toFixed(2)})`,
        );
      }

      payment.amount = newAmount;
      payment.amount_pending = Math.round((newAmount - amountPaid) * 100) / 100;

      if (amountPaid >= newAmount) {
        payment.status = 'pagado';
      } else if (amountPaid > 0) {
        payment.status = 'parcial';
      } else {
        payment.status = 'pendiente';
      }
    }

    if (updates.amount_paid !== undefined) {
      const newAmountPaid = Number(updates.amount_paid) || 0;
      const totalAmount = Number(payment.amount) || 0;
      if (newAmountPaid < 0 || Number.isNaN(newAmountPaid)) {
        throw new BadRequestException('Invalid amount_paid provided');
      }

      if (newAmountPaid > totalAmount) {
        throw new BadRequestException(
          `El monto pagado no puede superar el monto de la cuota ($${totalAmount.toFixed(2)})`,
        );
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

    if (updates.due_date) payment.due_date = new Date(updates.due_date);
    if (updates.paid_date) payment.paid_date = new Date(updates.paid_date);
    if (updates.payment_method !== undefined) payment.payment_method = updates.payment_method;
    if (updates.notes !== undefined) payment.notes = updates.notes;

    const updateNote = `Actualizado el ${new Date().toISOString().split('T')[0]}`;
    payment.notes = payment.notes ? `${payment.notes}\n${updateNote}` : updateNote;

    const saved = await this.downpaymentRepo.save(payment);
    await this.syncContractDownPaymentApplied(tenantId, contractId);
    return saved;
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
    const saved = await this.downpaymentRepo.save(payment);
    await this.syncContractDownPaymentApplied(tenantId, contractId);
    return saved;
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
    const saved = await this.downpaymentRepo.save(payment);
    await this.syncContractDownPaymentApplied(tenantId, contractId);
    return saved;
  }

  async deleteDownpaymentPayment(
    tenantId: string,
    contractId: string,
    paymentId: string,
  ): Promise<void> {
    const payment = await this.getPaymentOrThrow(tenantId, contractId, paymentId);
    await this.downpaymentRepo.remove(payment);
    await this.syncContractDownPaymentApplied(tenantId, contractId);
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

  getDownPaymentTarget(
    contract: Pick<Contract, 'down_payment_target' | 'down_payment' | 'down_payment_financed'>,
  ): number | null {
    if (contract.down_payment_financed) {
      if (contract.down_payment_target == null) {
        return null;
      }
      return Number(contract.down_payment_target);
    }
    return Number(contract.down_payment ?? 0);
  }

  async recalculateContractFinancing(
    tenantId: string,
    contractId: string,
  ): Promise<void> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
    });

    if (!contract?.down_payment_financed) {
      return;
    }

    const monthlyPaymentRows: Array<{
      status: string;
      amount: number | string;
      amount_paid: number | string;
    }> = await this.contractRepo.manager.query(
      `
      SELECT status, amount, amount_paid
      FROM contract_payments
      WHERE contract_id = ? AND tenant_id = ?
      `,
      [contractId, tenantId],
    );

    const monthlyPaid = sumPaidFromPaymentRows(monthlyPaymentRows);
    const downPaymentApplied = getDownPaymentApplied(contract);
    const snapshot = computeFinancingSnapshot(
      {
        ...contract,
        down_payment: downPaymentApplied,
      },
      monthlyPaid,
    );

    await this.contractRepo.update(
      { id: contractId, tenant_id: tenantId },
      {
        remaining_balance: snapshot.remaining_balance,
        monthly_payment: snapshot.monthly_payment,
      },
    );
  }

  private async getFinancedContractOrThrow(
    tenantId: string,
    contractId: string,
  ): Promise<Contract> {
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

    return contract;
  }

  private async getNextPaymentNumber(
    tenantId: string,
    contractId: string,
  ): Promise<number> {
    const result = await this.downpaymentRepo
      .createQueryBuilder('p')
      .select('MAX(CAST(p.payment_number AS UNSIGNED))', 'maxNum')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.contract_id = :contractId', { contractId })
      .getRawOne<{ maxNum: string | null }>();

    return (Number(result?.maxNum) || 0) + 1;
  }

  async syncContractDownPaymentApplied(
    tenantId: string,
    contractId: string,
  ): Promise<void> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenant_id: tenantId },
      select: ['id', 'down_payment_financed'],
    });

    if (!contract?.down_payment_financed) {
      return;
    }

    const paymentRows = await this.downpaymentRepo.find({
      where: { tenant_id: tenantId, contract_id: contractId },
      select: ['status', 'amount', 'amount_paid'],
    });

    const applied = paymentRows.reduce((sum, row) => {
      if (row.status === 'pagado') {
        return sum + Number(row.amount || 0);
      }
      if (row.status === 'parcial') {
        return sum + Number(row.amount_paid || 0);
      }
      return sum;
    }, 0);

    await this.contractRepo.update(
      { id: contractId, tenant_id: tenantId },
      { down_payment: Math.round(applied * 100) / 100 },
    );

    await this.recalculateContractFinancing(tenantId, contractId);
  }

  private createDownpaymentRow(
    tenantId: string,
    contractId: string,
    paymentNumber: number,
    amount: number,
    dueDate: Date,
  ): ContractDownpaymentPayment {
    return this.downpaymentRepo.create({
      tenant_id: tenantId,
      contract_id: contractId,
      payment_number: String(paymentNumber),
      amount,
      amount_paid: 0,
      amount_pending: amount,
      due_date: dueDate,
      paid_date: null,
      first_partial_payment_date: null,
      payment_method: null,
      status: 'pendiente',
      is_overdue: false,
    });
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
