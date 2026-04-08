import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../../entities/contracts/payment.entity';
import { Contract } from '../../../entities/contracts/contract.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
  ) {}

  async create(tenantId: string, dto: CreatePaymentDto): Promise<Payment> {
    // Get contract to validate and update balance
    const contract = await this.contractRepo.findOne({
      where: { id: dto.contract_id, tenant_id: tenantId },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Create payment
    const payment = this.paymentRepo.create({
      ...dto,
      tenant_id: tenantId,
    });

    const savedPayment = await this.paymentRepo.save(payment);

    // Update contract remaining balance
    const newBalance = contract.remaining_balance - dto.amount_paid;
    await this.contractRepo.update(
      { id: contract.id },
      { remaining_balance: Math.max(0, newBalance) }
    );

    return savedPayment;
  }

  async findAll(tenantId: string, contractId?: string, status?: string): Promise<Payment[]> {
    const query = this.paymentRepo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .leftJoinAndSelect('p.contract', 'contract');

    if (contractId) {
      query.andWhere('p.contract_id = :contractId', { contractId });
    }

    if (status) {
      query.andWhere('p.status = :status', { status });
    }

    // Fix: Order by payment_number as integer when contractId is provided, otherwise by date
    if (contractId) {
      return query.orderBy('CAST(p.payment_number AS UNSIGNED)', 'ASC').getMany();
    } else {
      return query.orderBy('p.payment_date', 'DESC').getMany();
    }
  }

  async findOne(tenantId: string, id: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['contract'],
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(tenantId, id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // If amount changed, recalculate contract balance
    if (dto.amount_paid && dto.amount_paid !== payment.amount_paid) {
      const contract = await this.contractRepo.findOne({
        where: { id: payment.contract_id },
      });

      if (contract) {
        const difference = dto.amount_paid - payment.amount_paid;
        const newBalance = contract.remaining_balance - difference;
        await this.contractRepo.update(
          { id: contract.id },
          { remaining_balance: Math.max(0, newBalance) }
        );
      }
    }

    Object.assign(payment, dto);
    return this.paymentRepo.save(payment);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const payment = await this.findOne(tenantId, id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Restore contract balance
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

    await this.paymentRepo.remove(payment);
  }

  async getPaymentStats(tenantId: string, contractId?: string): Promise<any> {
    // Get contract info for financed_amount
    let contract: Contract | null = null;
    if (contractId) {
      contract = await this.contractRepo.findOne({
        where: { id: contractId, tenant_id: tenantId },
      });
    }

    const query = this.paymentRepo
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN p.status = 'pagado' THEN p.amount WHEN p.status = 'parcial' THEN p.amount_paid ELSE 0 END)", 'total_paid')
      .addSelect("SUM(CASE WHEN p.status = 'pendiente' THEN p.amount WHEN p.status = 'parcial' THEN p.amount_pending ELSE 0 END)", 'total_pending')
      .addSelect('SUM(p.amount)', 'total_expected')
      .addSelect("SUM(CASE WHEN p.status = 'pagado' THEN 1 ELSE 0 END)", 'paid_count')
      .addSelect("SUM(CASE WHEN p.status = 'pagado' THEN p.amount ELSE 0 END)", 'paid_amount_complete')
      .addSelect("SUM(CASE WHEN p.status = 'parcial' THEN p.amount_paid ELSE 0 END)", 'paid_amount_partial')
      .addSelect("SUM(CASE WHEN p.status = 'parcial' THEN 1 ELSE 0 END)", 'partial_count')
      .addSelect("SUM(CASE WHEN p.status = 'parcial' AND p.is_overdue = 1 THEN 1 ELSE 0 END)", 'partial_overdue_count')
      .addSelect("SUM(CASE WHEN p.status = 'pendiente' AND p.is_overdue = 0 THEN 1 ELSE 0 END)", 'pending_count')
      .addSelect("SUM(CASE WHEN p.status = 'pendiente' AND p.is_overdue = 1 THEN 1 ELSE 0 END)", 'pending_overdue_count')
      .addSelect("SUM(CASE WHEN (p.status = 'pendiente' OR p.status = 'parcial') AND p.is_overdue = 1 THEN 1 ELSE 0 END)", 'overdue_count')
      .addSelect("SUM(CASE WHEN (p.status = 'pendiente' OR p.status = 'parcial') AND p.is_overdue = 1 THEN CASE WHEN p.status = 'parcial' THEN p.amount_pending ELSE p.amount END ELSE 0 END)", 'overdue_amount')
      .addSelect("SUM(CASE WHEN p.status = 'cancelado' THEN 1 ELSE 0 END)", 'cancelled_count')
      .where('p.tenant_id = :tenantId', { tenantId });

    if (contractId) {
      query.andWhere('p.contract_id = :contractId', { contractId });
    }

    const stats = await query.getRawOne();

    // Get partial payments details
    let partialPayments: Payment[] = [];
    if (contractId) {
      partialPayments = await this.paymentRepo.find({
        where: { contract_id: contractId, tenant_id: tenantId, status: 'parcial' },
        order: { payment_number: 'ASC' },
      });
    }

    const financedAmount = contract 
      ? Math.round(((contract.total_price || 0) - (contract.down_payment || 0)) * 100) / 100
      : 0;

    return {
      total_payments: parseInt(stats.total) || 0,
      financed_amount: financedAmount,
      paid_count: parseInt(stats.paid_count) || 0,
      paid_amount_complete: Math.round((parseFloat(stats.paid_amount_complete) || 0) * 100) / 100,
      paid_amount_partial: Math.round((parseFloat(stats.paid_amount_partial) || 0) * 100) / 100,
      total_paid_from_payments: Math.round((parseFloat(stats.total_paid) || 0) * 100) / 100,
      partial_count: parseInt(stats.partial_count) || 0,
      partial_overdue_count: parseInt(stats.partial_overdue_count) || 0,
      partial_payment: partialPayments.length > 0 ? partialPayments.map(p => ({
        installment_number: p.payment_number,
        amount_paid: Math.round((parseFloat(p.amount_paid as any) || 0) * 100) / 100,
        remaining_amount: Math.round((parseFloat(p.amount_pending as any) || 0) * 100) / 100,
        is_overdue: p.is_overdue,
      })) : null,
      pending_count: parseInt(stats.pending_count) || 0,
      pending_overdue_count: parseInt(stats.pending_overdue_count) || 0,
      total_pending: Math.round((parseFloat(stats.total_pending) || 0) * 100) / 100,
      overdue_count: parseInt(stats.overdue_count) || 0,
      overdue_amount: Math.round((parseFloat(stats.overdue_amount) || 0) * 100) / 100,
    };
  }
}