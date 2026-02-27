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

  async findAll(tenantId: string, customerId?: number, propertyId?: string, status?: string, hasOverdue?: boolean, search?: string): Promise<any[]> {
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

    // Filter by contracts with overdue payments
    if (hasOverdue === true) {
      query
        .innerJoin('payments', 'p', 'p.contract_id = c.id')
        .andWhere('p.status = :paymentStatus', { paymentStatus: 'vencido' });
    }

    // Search by customer name, contract number, or property code
    if (search) {
      query.andWhere(
        '(customer.name LIKE :search OR customer.lastname LIKE :search OR c.contract_number LIKE :search OR property.code LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const contracts = await query.orderBy('c.contract_date', 'DESC').getMany();

    if (contracts.length === 0) {
      return [];
    }

    // Get next payment for each contract (first payment that is not 'pagado')
    const contractIds = contracts.map(c => c.id);
    
    const nextPaymentsQuery = `
      SELECT p.*
      FROM payments p
      INNER JOIN (
        SELECT contract_id, MIN(payment_number) as next_payment_number
        FROM payments
        WHERE contract_id IN (${contractIds.map(() => '?').join(',')})
          AND tenant_id = ?
          AND status != 'pagado'
        GROUP BY contract_id
      ) next_p ON p.contract_id = next_p.contract_id AND p.payment_number = next_p.next_payment_number
      WHERE p.tenant_id = ?
    `;

    const nextPayments = await this.contractRepo.manager.query(
      nextPaymentsQuery,
      [...contractIds, tenantId, tenantId]
    );

    // Map next payments by contract_id
    const nextPaymentMap = new Map();
    nextPayments.forEach(payment => {
      nextPaymentMap.set(payment.contract_id, {
        next_payment_date: payment.due_date,
        next_payment_status: payment.status,
        next_payment_number: payment.payment_number,
        next_payment_amount: payment.status === 'parcial' 
          ? Number(payment.amount_pending) 
          : Number(payment.amount),
      });
    });

    // Add next payment info to each contract
    return contracts.map(contract => ({
      ...contract,
      next_payment_date: nextPaymentMap.get(contract.id)?.next_payment_date || null,
      next_payment_status: nextPaymentMap.get(contract.id)?.next_payment_status || null,
      next_payment_number: nextPaymentMap.get(contract.id)?.next_payment_number || null,
      next_payment_amount: nextPaymentMap.get(contract.id)?.next_payment_amount || null,
    }));
  }

  async findOne(tenantId: string, id: string): Promise<any> {
    const contract = await this.contractRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['customer', 'property'],
    });

    if (!contract) {
      return null;
    }

    return this.enrichContractWithPaymentData(contract, tenantId);
  }

  async findByContractNumber(tenantId: string, contractNumber: string): Promise<any> {
    const contract = await this.contractRepo.findOne({
      where: { contract_number: contractNumber, tenant_id: tenantId },
      relations: ['customer', 'property'],
    });

    if (!contract) {
      return null;
    }

    return this.enrichContractWithPaymentData(contract, tenantId);
  }

  private async enrichContractWithPaymentData(contract: Contract, tenantId: string): Promise<any> {
    // Get all payments for this contract
    const allPayments = await this.contractRepo.manager.query(
      'SELECT status, amount, amount_paid, amount_pending, payment_number FROM payments WHERE contract_id = ? AND tenant_id = ?',
      [contract.id, tenantId]
    );

    // Calculate totals
    let totalPaidFromPayments = 0;
    let pendingFullPayments = 0;
    let partialPayment: {
      installment_number: number;
      amount_paid: number;
      remaining_amount: number;
      status: string;
    } | null = null;

    for (const payment of allPayments) {
      const status = payment.status;
      const amountPaid = Number(payment.amount_paid);
      const amount = Number(payment.amount);
      const amountPending = Number(payment.amount_pending);

      if (status === 'pagado') {
        totalPaidFromPayments += amountPaid;
      } else if (status === 'parcial') {
        totalPaidFromPayments += amountPaid;
        partialPayment = {
          installment_number: payment.payment_number,
          amount_paid: amountPaid,
          remaining_amount: amountPending,
          status: 'pending_completion'
        };
      } else if (status === 'pendiente' || status === 'vencido') {
        pendingFullPayments++;
      }
    }

    // Calculate total pending amount DYNAMICALLY (not from DB)
    const totalAfterDownPayment = Number(contract.total_price) - Number(contract.down_payment);
    const totalPaid = Number(contract.down_payment) + totalPaidFromPayments;
    const totalPendingAmount = Number(contract.total_price) - totalPaid;

    return {
      ...contract,
      total_paid: totalPaid, // Enganche + pagos mensuales
      total_paid_from_payments: totalPaidFromPayments, // Solo pagos mensuales, sin enganche
      total_pending_amount: Math.round(totalPendingAmount * 100) / 100, // Calculado dinámicamente
      remaining_balance: Math.round(totalPendingAmount * 100) / 100, // Override con valor calculado
      pending_full_payments: pendingFullPayments,
      partial_payment: partialPayment,
    };
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
    // Total contracts (active + completed) - sum of total_price
    const totalStats = await this.contractRepo
      .createQueryBuilder('c')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(c.total_price)', 'value')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.status IN (:...statuses)', { statuses: ['activo', 'completado'] })
      .getRawOne();

    // Completed contracts - sum of total_price
    const completedStats = await this.contractRepo
      .createQueryBuilder('c')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(c.total_price)', 'value')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.status = :status', { status: 'completado' })
      .getRawOne();

    // Active contracts (pending) - sum of total_price and remaining_balance
    const activeStats = await this.contractRepo
      .createQueryBuilder('c')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(c.total_price)', 'total_value')
      .addSelect('SUM(c.remaining_balance)', 'pending_value')
      .addSelect('SUM(c.total_price - c.remaining_balance)', 'paid_value')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.status = :status', { status: 'activo' })
      .getRawOne();

    // Contracts with overdue payments - sum of total_price
    const overdueStats = await this.contractRepo
      .createQueryBuilder('c')
      .leftJoin('payments', 'p', 'p.contract_id = c.id AND p.status = :vencido', { vencido: 'vencido' })
      .select('COUNT(DISTINCT c.id)', 'count')
      .addSelect('SUM(DISTINCT c.total_price)', 'value')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.status = :status', { status: 'activo' })
      .andWhere('p.id IS NOT NULL')
      .getRawOne();

    return {
      total: {
        count: parseInt(totalStats.count) || 0,
        value: parseFloat(totalStats.value) || 0,
      },
      completed: {
        count: parseInt(completedStats.count) || 0,
        value: parseFloat(completedStats.value) || 0,
      },
      pending: {
        count: parseInt(activeStats.count) || 0,
        value: parseFloat(activeStats.total_value) || 0,
        paid: parseFloat(activeStats.paid_value) || 0,
        remaining: parseFloat(activeStats.pending_value) || 0,
      },
      overdue: {
        count: parseInt(overdueStats.count) || 0,
        value: parseFloat(overdueStats.value) || 0,
      },
    };
  }
}
