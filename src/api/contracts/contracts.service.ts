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
    // Generate contract number if not provided
    let contractNumber = dto.contract_number;
    if (!contractNumber) {
      contractNumber = await this.generateContractNumber(tenantId, dto.property_id);
    }

    // Calculate remaining balance and monthly payment
    const remaining_balance = dto.total_price - dto.down_payment;
    const monthly_payment = remaining_balance / dto.payment_months;

    const contract = this.contractRepo.create({
      ...dto,
      contract_number: contractNumber,
      tenant_id: tenantId,
      remaining_balance,
      monthly_payment: Math.round(monthly_payment * 100) / 100, // Round to 2 decimals
    });

    return this.contractRepo.save(contract);
  }

  private async generateContractNumber(tenantId: string, propertyId: string): Promise<string> {
    // Get property info to extract block and lot_number
    const property = await this.contractRepo.manager.query(
      `SELECT p.block, p.lot_number, p.code 
       FROM properties p 
       WHERE p.id = ? AND p.tenant_id = ?`,
      [propertyId, tenantId]
    );

    if (!property || property.length === 0) {
      throw new Error('Property not found');
    }

    const prop = property[0];
    let baseNumber: string;

    // Use block-lot_number format if both exist, otherwise use property code
    if (prop.block && prop.lot_number) {
      baseNumber = `CONT-${prop.block}-${prop.lot_number}`;
    } else {
      // Extract from property code (e.g., LOT-1-01 -> CONT-1-01)
      const codeMatch = prop.code.match(/LOT-(\d+)-(\d+)/);
      if (codeMatch) {
        baseNumber = `CONT-${codeMatch[1]}-${codeMatch[2]}`;
      } else {
        baseNumber = `CONT-${prop.code}`;
      }
    }

    // Check if contract number already exists
    const existingContract = await this.contractRepo.findOne({
      where: { 
        contract_number: baseNumber,
        tenant_id: tenantId 
      }
    });

    if (!existingContract) {
      return baseNumber;
    }

    // If exists, add letter suffix (A, B, C, etc.)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < letters.length; i++) {
      const numberWithLetter = `${baseNumber}${letters[i]}`;
      const existingWithLetter = await this.contractRepo.findOne({
        where: { 
          contract_number: numberWithLetter,
          tenant_id: tenantId 
        }
      });

      if (!existingWithLetter) {
        return numberWithLetter;
      }
    }

    // If all letters are used, add timestamp
    return `${baseNumber}-${Date.now()}`;
  }

  async findAll(tenantId: string, customerId?: number, propertyId?: string, status?: string, hasOverdue?: boolean, search?: string, page: number = 1, limit: number = 20): Promise<any> {
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
        .innerJoin('contract_payments', 'p', 'p.contract_id = c.id AND p.is_overdue = true')
        .andWhere('p.status IN (:...statuses)', { statuses: ['pendiente', 'parcial'] });
    }

    // Search by customer name, contract number, or property code
    if (search) {
      query.andWhere(
        '(customer.name LIKE :search OR customer.lastname LIKE :search OR c.contract_number LIKE :search OR property.code LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const contracts = await query
      .orderBy('c.contract_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    if (contracts.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      };
    }

    // Get total count for pagination
    const countQuery = this.contractRepo
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId })
      .leftJoin('c.customer', 'customer')
      .leftJoin('c.property', 'property');

    if (customerId) {
      countQuery.andWhere('c.customer_id = :customerId', { customerId });
    }

    if (propertyId) {
      countQuery.andWhere('c.property_id = :propertyId', { propertyId });
    }

    if (status) {
      countQuery.andWhere('c.status = :status', { status });
    }

    if (hasOverdue === true) {
      countQuery
        .innerJoin('contract_payments', 'p', 'p.contract_id = c.id AND p.is_overdue = true')
        .andWhere('p.status IN (:...statuses)', { statuses: ['pendiente', 'parcial'] });
    }

    if (search) {
      countQuery.andWhere(
        '(customer.name LIKE :search OR customer.lastname LIKE :search OR c.contract_number LIKE :search OR property.code LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const total = await countQuery.getCount();
    const pages = Math.ceil(total / limit);

    // Get next payment for each contract (first unpaid payment ordered by due_date)
    const contractIds = contracts.map(c => c.id);
    
    const nextPaymentsQuery = `
      SELECT p.*
      FROM contract_payments p
      INNER JOIN (
        SELECT contract_id, MIN(due_date) as next_due_date
        FROM contract_payments
        WHERE contract_id IN (${contractIds.map(() => '?').join(',')})
          AND tenant_id = ?
          AND status IN ('pendiente', 'parcial', 'vencido')
        GROUP BY contract_id
      ) next_p ON p.contract_id = next_p.contract_id AND p.due_date = next_p.next_due_date
      WHERE p.tenant_id = ?
        AND p.status IN ('pendiente', 'parcial', 'vencido')
      ORDER BY p.is_overdue DESC, p.due_date ASC
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

    // Add next payment info and financed amount to each contract
    const data = contracts.map(contract => {
      const totalPrice = Number(contract.total_price) || 0;
      const downPayment = Number(contract.down_payment) || 0;
      const financedAmount = totalPrice - downPayment;

      return {
        ...contract,
        financed_amount: Math.round(financedAmount * 100) / 100, // Monto financiado (Total - Enganche)
        next_payment_date: nextPaymentMap.get(contract.id)?.next_payment_date || null,
        next_payment_status: nextPaymentMap.get(contract.id)?.next_payment_status || null,
        next_payment_number: nextPaymentMap.get(contract.id)?.next_payment_number || null,
        next_payment_amount: nextPaymentMap.get(contract.id)?.next_payment_amount || null,
      };
    });

    // Get overdue payment counts for each contract (calculate dynamically, not from DB flag)
    const overdueCountsQuery = `
      SELECT contract_id, COUNT(*) as overdue_count
      FROM contract_payments
      WHERE contract_id IN (${contractIds.map(() => '?').join(',')})
        AND tenant_id = ?
        AND payment_date < CURDATE()
        AND status IN ('pendiente', 'parcial')
      GROUP BY contract_id
    `;

    const overdueCounts = await this.contractRepo.manager.query(
      overdueCountsQuery,
      [...contractIds, tenantId]
    );

    const overdueCountMap = new Map();
    overdueCounts.forEach(row => {
      overdueCountMap.set(row.contract_id, row.overdue_count);
    });

    // Add overdue count to each contract
    const dataWithOverdue = data.map(contract => ({
      ...contract,
      overdue_payments_count: overdueCountMap.get(contract.id) || 0,
      has_overdue: (overdueCountMap.get(contract.id) || 0) > 0,
    }));

    return {
      data: dataWithOverdue,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
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
      'SELECT status, amount, amount_paid, amount_pending, payment_number, is_overdue FROM contract_payments WHERE contract_id = ? AND tenant_id = ?',
      [contract.id, tenantId]
    );

    // Calculate totals
    let totalPaidFromPayments = 0;
    let pendingFullPayments = 0;
    let overdueCount = 0;
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
      const isOverdue = payment.is_overdue;

      if (status === 'pagado') {
        // FIXED: For completed payments, count the full amount, not amount_paid
        totalPaidFromPayments += amount;
      } else if (status === 'parcial') {
        // For partial payments, count only what was actually paid
        totalPaidFromPayments += amountPaid;
        partialPayment = {
          installment_number: parseInt(payment.payment_number), // Convert to number for frontend
          amount_paid: amountPaid,
          remaining_amount: amountPending,
          status: 'pending_completion'
        };
        // Count overdue parcial payments
        if (isOverdue) {
          overdueCount++;
        }
      } else if (status === 'pendiente' || status === 'vencido') {
        pendingFullPayments++;
        // Count overdue pendiente payments
        if (isOverdue) {
          overdueCount++;
        }
      }
    }

    // Calculate total pending amount DYNAMICALLY (not from DB)
    const totalAfterDownPayment = Number(contract.total_price) - Number(contract.down_payment);
    const totalPaid = Number(contract.down_payment) + totalPaidFromPayments;
    const totalPendingAmount = Number(contract.total_price) - totalPaid;
    const financedAmount = totalAfterDownPayment; // This is what gets divided by payment_months

    return {
      ...contract,
      financed_amount: Math.round(financedAmount * 100) / 100, // Monto financiado (Total - Enganche)
      total_paid: totalPaid, // Enganche + pagos mensuales
      total_paid_from_payments: totalPaidFromPayments, // Solo pagos mensuales, sin enganche
      total_pending_amount: Math.round(totalPendingAmount * 100) / 100, // Calculado dinámicamente
      remaining_balance: Math.round(totalPendingAmount * 100) / 100, // Override con valor calculado
      pending_full_payments: pendingFullPayments,
      partial_payment: partialPayment,
      overdue_payments_count: overdueCount,
      has_overdue: overdueCount > 0,
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
    const queryRunner = this.contractRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verify contract exists and belongs to tenant
      const contract = await queryRunner.manager.findOne(Contract, {
        where: { id, tenant_id: tenantId },
      });

      if (!contract) {
        throw new Error('Contract not found or access denied');
      }

      console.log(`🗑️  Deleting contract ${contract.contract_number} and all related data...`);

      // 2. Delete all payments (this will also update contract balances if needed)
      const paymentsResult = await queryRunner.query(
        `DELETE FROM contract_payments WHERE contract_id = ? AND tenant_id = ?`,
        [id, tenantId]
      );
      console.log(`✅ Deleted ${paymentsResult.affectedRows || 0} payments`);

      // 3. Delete contract documents (files in S3 should be handled separately if needed)
      const documentsResult = await queryRunner.query(
        `DELETE FROM contract_documents WHERE contract_id = ? AND tenant_id = ?`,
        [id, tenantId]
      );
      console.log(`✅ Deleted ${documentsResult.affectedRows || 0} contract documents`);

      // 4. Finally delete the contract itself
      await queryRunner.manager.delete(Contract, { id, tenant_id: tenantId });
      console.log(`✅ Deleted contract ${contract.contract_number}`);

      await queryRunner.commitTransaction();
      console.log(`🎉 Contract ${contract.contract_number} completely deleted`);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Error deleting contract:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
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

    // Contracts with overdue payments - count contracts AND payments
    const overdueStats = await this.contractRepo
      .createQueryBuilder('c')
      .leftJoin('contract_payments', 'p', 'p.contract_id = c.id AND p.payment_date < CURDATE() AND p.status IN (:...statuses)', { statuses: ['pendiente', 'parcial'] })
      .select('COUNT(DISTINCT c.id)', 'contracts_count')
      .addSelect('COUNT(p.id)', 'payments_count')
      .addSelect('SUM(CASE WHEN p.status = "parcial" THEN p.amount_pending ELSE p.amount END)', 'value')
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
        contracts_count: parseInt(overdueStats.contracts_count) || 0,
        payments_count: parseInt(overdueStats.payments_count) || 0,
        value: parseFloat(overdueStats.value) || 0,
      },
    };
  }
}
