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

    return query.orderBy('p.payment_date', 'DESC').getMany();
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
      .addSelect('SUM(p.amount_paid)', 'total_paid')
      .addSelect("SUM(CASE WHEN p.status = 'pagado' THEN p.amount_paid ELSE 0 END)", 'paid_amount')
      .addSelect("SUM(CASE WHEN p.status = 'pendiente' THEN p.amount_paid ELSE 0 END)", 'pending_amount')
      .addSelect("SUM(CASE WHEN p.status = 'atrasado' THEN p.amount_paid ELSE 0 END)", 'overdue_amount')
      .where('p.tenant_id = :tenantId', { tenantId });

    if (contractId) {
      query.andWhere('p.contract_id = :contractId', { contractId });
    }

    const stats = await query.getRawOne();

    return {
      total_payments: parseInt(stats.total) || 0,
      total_paid: parseFloat(stats.total_paid) || 0,
      paid_amount: parseFloat(stats.paid_amount) || 0,
      pending_amount: parseFloat(stats.pending_amount) || 0,
      overdue_amount: parseFloat(stats.overdue_amount) || 0,
    };
  }
}
