import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../entities/payments/payment.entity';
import { Contract } from '../../entities/contracts/contract.entity';
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
    const query = this.paymentRepo
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total')
      // CORRECT CALCULATION: PAID payments = full amount, PARTIAL payments = amount_paid only, PENDING = 0
      .addSelect("SUM(CASE WHEN p.status = 'pagado' THEN p.amount WHEN p.status = 'parcial' THEN p.amount_paid ELSE 0 END)", 'total_paid')
      // CORRECT PENDING: PENDING payments = full amount, PARTIAL payments = amount_pending, PAID = 0
      .addSelect("SUM(CASE WHEN p.status = 'pendiente' THEN p.amount WHEN p.status = 'parcial' THEN p.amount_pending ELSE 0 END)", 'total_pending')
      .addSelect('SUM(p.amount)', 'total_expected')
      .addSelect("SUM(CASE WHEN p.status = 'pagado' THEN 1 ELSE 0 END)", 'paid_count')
      .addSelect("SUM(CASE WHEN p.status = 'parcial' THEN 1 ELSE 0 END)", 'partial_count')
      .addSelect("SUM(CASE WHEN p.status = 'pendiente' THEN 1 ELSE 0 END)", 'pending_count')
      .addSelect("SUM(CASE WHEN p.status = 'atrasado' THEN 1 ELSE 0 END)", 'overdue_count')
      .addSelect("SUM(CASE WHEN p.status = 'cancelado' THEN 1 ELSE 0 END)", 'cancelled_count')
      .addSelect("SUM(CASE WHEN p.status = 'pagado' THEN p.amount ELSE 0 END)", 'paid_amount')
      .addSelect("SUM(CASE WHEN p.status = 'parcial' THEN p.amount_paid ELSE 0 END)", 'partial_amount')
      .addSelect("SUM(CASE WHEN p.status = 'pendiente' THEN p.amount ELSE 0 END)", 'pending_amount')
      .addSelect("SUM(CASE WHEN p.status = 'atrasado' THEN p.amount ELSE 0 END)", 'overdue_amount')
      .where('p.tenant_id = :tenantId', { tenantId });

    if (contractId) {
      query.andWhere('p.contract_id = :contractId', { contractId });
    }

    const stats = await query.getRawOne();

    return {
      total_payments: parseInt(stats.total) || 0,
      paid_count: parseInt(stats.paid_count) || 0,
      partial_count: parseInt(stats.partial_count) || 0,
      pending_count: parseInt(stats.pending_count) || 0,
      pending_full_payments: parseInt(stats.pending_count) || 0, // Frontend compatibility
      overdue_count: parseInt(stats.overdue_count) || 0,
      cancelled_count: parseInt(stats.cancelled_count) || 0,
      
      // Fix decimal precision
      total_expected: Math.round((parseFloat(stats.total_expected) || 0) * 100) / 100,
      total_paid: Math.round((parseFloat(stats.total_paid) || 0) * 100) / 100,
      total_pending: Math.round((parseFloat(stats.total_pending) || 0) * 100) / 100,
      total_pending_amount: Math.round((parseFloat(stats.total_pending) || 0) * 100) / 100, // Frontend compatibility
      paid_amount: Math.round((parseFloat(stats.paid_amount) || 0) * 100) / 100,
      partial_amount: Math.round((parseFloat(stats.partial_amount) || 0) * 100) / 100,
      pending_amount: Math.round((parseFloat(stats.pending_amount) || 0) * 100) / 100,
      overdue_amount: Math.round((parseFloat(stats.overdue_amount) || 0) * 100) / 100,
    };
  }
}