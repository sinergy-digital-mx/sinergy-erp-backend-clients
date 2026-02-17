import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
  ) {}

  async create(tenantId: string, dto: CreateContractDto): Promise<Contract> {
    // Calculate remaining balance and monthly payment
    const remaining_balance = dto.total_price - dto.down_payment;
    const monthly_payment = remaining_balance / dto.payment_months;

    const contract = this.contractRepo.create({
      ...dto,
      tenant_id: tenantId,
      remaining_balance,
      monthly_payment: Math.round(monthly_payment * 100) / 100, // Round to 2 decimals
    });

    return this.contractRepo.save(contract);
  }

  async findAll(tenantId: string, customerId?: number, propertyId?: string, status?: string): Promise<Contract[]> {
    const query = this.contractRepo
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId })
      .leftJoinAndSelect('c.customer', 'customer')
      .leftJoinAndSelect('c.property', 'property');

    if (customerId) {
      query.andWhere('c.customer_id = :customerId', { customerId });
    }

    if (propertyId) {
      query.andWhere('c.property_id = :propertyId', { propertyId });
    }

    if (status) {
      query.andWhere('c.status = :status', { status });
    }

    return query.orderBy('c.contract_date', 'DESC').getMany();
  }

  async findOne(tenantId: string, id: string): Promise<Contract | null> {
    return this.contractRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['customer', 'property'],
    });
  }

  async findByContractNumber(tenantId: string, contractNumber: string): Promise<Contract | null> {
    return this.contractRepo.findOne({
      where: { contract_number: contractNumber, tenant_id: tenantId },
      relations: ['customer', 'property'],
    });
  }

  async update(tenantId: string, id: string, dto: UpdateContractDto): Promise<Contract> {
    const contract = await this.findOne(tenantId, id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    // Recalculate if total_price or down_payment changed
    if (dto.total_price || dto.down_payment || dto.payment_months) {
      const total = dto.total_price || contract.total_price;
      const down = dto.down_payment || contract.down_payment;
      const months = dto.payment_months || contract.payment_months;

      const remaining_balance = total - down;
      const monthly_payment = remaining_balance / months;

      Object.assign(contract, {
        ...dto,
        remaining_balance,
        monthly_payment: Math.round(monthly_payment * 100) / 100,
      });
    } else {
      Object.assign(contract, dto);
    }

    return this.contractRepo.save(contract);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const contract = await this.findOne(tenantId, id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    await this.contractRepo.remove(contract);
  }

  async getContractStats(tenantId: string): Promise<any> {
    const stats = await this.contractRepo
      .createQueryBuilder('c')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN c.status = 'activo' THEN 1 ELSE 0 END)", 'active')
      .addSelect("SUM(CASE WHEN c.status = 'completado' THEN 1 ELSE 0 END)", 'completed')
      .addSelect("SUM(CASE WHEN c.status = 'cancelado' THEN 1 ELSE 0 END)", 'cancelled')
      .addSelect('SUM(c.total_price)', 'total_value')
      .addSelect('SUM(c.remaining_balance)', 'pending_balance')
      .where('c.tenant_id = :tenantId', { tenantId })
      .getRawOne();

    return {
      total: parseInt(stats.total) || 0,
      active: parseInt(stats.active) || 0,
      completed: parseInt(stats.completed) || 0,
      cancelled: parseInt(stats.cancelled) || 0,
      total_value: parseFloat(stats.total_value) || 0,
      pending_balance: parseFloat(stats.pending_balance) || 0,
    };
  }
}
