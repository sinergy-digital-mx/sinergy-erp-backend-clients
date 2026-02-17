import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../entities/transactions/transaction.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(EntityRegistry)
    private entityRegistryRepo: Repository<EntityRegistry>,
  ) {}

  /**
   * Resolve entity type code to entity_type_id
   */
  async resolveEntityTypeId(entityTypeCode: string): Promise<number> {
    const entityType = await this.entityRegistryRepo.findOne({
      where: { code: entityTypeCode },
    });

    if (!entityType) {
      throw new BadRequestException(`Invalid entity type: ${entityTypeCode}`);
    }

    return entityType.id;
  }

  /**
   * Create a new transaction
   */
  async create(tenantId: string, dto: CreateTransactionDto): Promise<Transaction> {
    if (!tenantId) {
      throw new BadRequestException('tenant_id is required');
    }

    // Resolve entity_type_id if entity_type_code is provided
    let entityTypeId = dto.entity_type_id;
    if (dto.entity_type_code) {
      entityTypeId = await this.resolveEntityTypeId(dto.entity_type_code);
    }

    if (!entityTypeId) {
      throw new BadRequestException('entity_type_id or entity_type_code is required');
    }

    // Verify entity_type_id exists
    const entityType = await this.entityRegistryRepo.findOne({
      where: { id: entityTypeId },
    });

    if (!entityType) {
      throw new BadRequestException(`Invalid entity_type_id: ${entityTypeId}`);
    }

    const transaction = this.transactionRepo.create({
      ...dto,
      entity_type_id: entityTypeId,
      tenant_id: tenantId,
    });

    return this.transactionRepo.save(transaction);
  }

  /**
   * Get all transactions for a tenant
   */
  async findAll(
    tenantId: string,
    filters?: {
      entityTypeId?: number;
      entityId?: string;
      status?: string;
    },
  ): Promise<Transaction[]> {
    const query = this.transactionRepo
      .createQueryBuilder('t')
      .where('t.tenant_id = :tenantId', { tenantId })
      .leftJoinAndSelect('t.entityType', 'entityType');

    if (filters?.entityTypeId) {
      query.andWhere('t.entity_type_id = :entityTypeId', { entityTypeId: filters.entityTypeId });
    }

    if (filters?.entityId) {
      query.andWhere('t.entity_id = :entityId', { entityId: filters.entityId });
    }

    if (filters?.status) {
      query.andWhere('t.status = :status', { status: filters.status });
    }

    return query.orderBy('t.transaction_date', 'DESC').getMany();
  }

  /**
   * Get transactions by entity
   */
  async getTransactionsByEntity(
    tenantId: string,
    entityTypeId: number,
    entityId: string,
  ): Promise<Transaction[]> {
    return this.transactionRepo.find({
      where: {
        tenant_id: tenantId,
        entity_type_id: entityTypeId,
        entity_id: entityId,
      },
      relations: ['entityType'],
      order: { transaction_date: 'DESC' },
    });
  }

  /**
   * Get transaction by ID
   */
  async findOne(tenantId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['entityType'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Update transaction
   */
  async update(tenantId: string, id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(tenantId, id);

    // If entity_type_code is provided, resolve to entity_type_id
    if (dto.entity_type_code) {
      dto.entity_type_id = await this.resolveEntityTypeId(dto.entity_type_code);
      delete dto.entity_type_code;
    }

    Object.assign(transaction, dto);
    return this.transactionRepo.save(transaction);
  }

  /**
   * Delete transaction
   */
  async remove(tenantId: string, id: string): Promise<void> {
    const transaction = await this.findOne(tenantId, id);
    await this.transactionRepo.remove(transaction);
  }

  /**
   * Get transaction statistics
   */
  async getStats(
    tenantId: string,
    filters?: {
      entityTypeId?: number;
      entityId?: string;
    },
  ): Promise<any> {
    const query = this.transactionRepo
      .createQueryBuilder('t')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(t.amount)', 'total_amount')
      .addSelect("SUM(CASE WHEN t.status = 'pagado' THEN t.amount ELSE 0 END)", 'paid_amount')
      .addSelect("SUM(CASE WHEN t.status = 'pendiente' THEN t.amount ELSE 0 END)", 'pending_amount')
      .addSelect("SUM(CASE WHEN t.status = 'atrasado' THEN t.amount ELSE 0 END)", 'overdue_amount')
      .where('t.tenant_id = :tenantId', { tenantId });

    if (filters?.entityTypeId) {
      query.andWhere('t.entity_type_id = :entityTypeId', { entityTypeId: filters.entityTypeId });
    }

    if (filters?.entityId) {
      query.andWhere('t.entity_id = :entityId', { entityId: filters.entityId });
    }

    const stats = await query.getRawOne();

    return {
      total_transactions: parseInt(stats.total) || 0,
      total_amount: parseFloat(stats.total_amount) || 0,
      paid_amount: parseFloat(stats.paid_amount) || 0,
      pending_amount: parseFloat(stats.pending_amount) || 0,
      overdue_amount: parseFloat(stats.overdue_amount) || 0,
    };
  }
}
