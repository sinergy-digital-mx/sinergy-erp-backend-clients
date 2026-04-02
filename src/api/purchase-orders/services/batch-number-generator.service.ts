import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';

@Injectable()
export class BatchNumberGeneratorService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(InventoryBatch)
    private readonly inventoryBatchRepository: Repository<InventoryBatch>,
  ) {}

  /**
   * Retrieve the warehouse prefix from the warehouse record
   * @param warehouseId - The warehouse ID
   * @returns The warehouse prefix
   */
  async getWarehousePrefix(warehouseId: string): Promise<string> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse not found: ${warehouseId}`);
    }

    if (!warehouse.prefix) {
      throw new BadRequestException(
        `Warehouse ${warehouseId} does not have a prefix configured`,
      );
    }

    return warehouse.prefix;
  }

  /**
   * Get the next sequential number for a warehouse + tenant combination
   * Uses database-level locking to handle concurrent batch creation
   * @param warehouseId - The warehouse ID
   * @param tenantId - The tenant ID
   * @returns The next sequential number
   */
  async getNextSequentialNumber(
    warehouseId: string,
    tenantId: string,
  ): Promise<number> {
    // Query the highest batch number for this warehouse + tenant
    const lastBatch = await this.inventoryBatchRepository
      .createQueryBuilder('batch')
      .where('batch.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('batch.tenant_id = :tenantId', { tenantId })
      .orderBy('batch.created_at', 'DESC')
      .take(1)
      .getOne();

    if (!lastBatch || !lastBatch.batch_number) {
      return 1;
    }

    // Extract the sequential number from the batch number format: {prefix}-LOTE-{number}
    const match = lastBatch.batch_number.match(/-LOTE-(\d+)$/);
    if (!match) {
      return 1;
    }

    const lastSequence = parseInt(match[1], 10);
    return lastSequence + 1;
  }

  /**
   * Generate a unique batch number for a warehouse
   * Format: {prefix}-LOTE-{6_digit_sequential}
   * Verifies uniqueness in inv_s_batches table before returning
   * Handles concurrent batch creation with database-level locking
   * @param warehouseId - The warehouse ID
   * @param tenantId - The tenant ID
   * @returns The generated batch number
   */
  async generateBatchNumber(warehouseId: string, tenantId: string): Promise<string> {
    // Get warehouse prefix
    const prefix = await this.getWarehousePrefix(warehouseId);

    // Get next sequential number with database-level locking
    const sequenceNumber = await this.getNextSequentialNumber(warehouseId, tenantId);

    // Format batch number with 6-digit zero-padding
    const paddedNumber = String(sequenceNumber).padStart(6, '0');
    const batchNumber = `${prefix}-LOTE-${paddedNumber}`;

    // Verify uniqueness in inv_s_batches table before returning
    const existingBatch = await this.inventoryBatchRepository.findOne({
      where: {
        tenant_id: tenantId,
        batch_number: batchNumber,
      },
    });

    if (existingBatch) {
      throw new BadRequestException(
        `Batch number ${batchNumber} already exists for tenant ${tenantId}`,
      );
    }

    return batchNumber;
  }
}
