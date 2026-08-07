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
   * Prefijo de lotes = código del almacén.
   * Formato resultante: {codigo}-LOTE-000001
   */
  async getWarehousePrefix(warehouseId: string): Promise<string> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Almacén no encontrado: ${warehouseId}`);
    }

    const code = (warehouse.code || '').trim();
    if (!code) {
      throw new BadRequestException(
        `El almacén "${warehouse.name}" no tiene código. Asigna un código (ej. FFF) para poder generar lotes.`,
      );
    }

    return code.substring(0, 10);
  }

  /**
   * Get the next sequential number for a warehouse prefix within a tenant.
   * Uniqueness is enforced per tenant + batch_number, so we scan by prefix at tenant scope.
   */
  async getNextSequentialNumber(
    warehouseId: string,
    tenantId: string,
  ): Promise<number> {
    const prefix = await this.getWarehousePrefix(warehouseId);
    const pattern = `${prefix}-LOTE-%`;

    const result = await this.inventoryBatchRepository
      .createQueryBuilder('batch')
      .select(
        "MAX(CAST(SUBSTRING_INDEX(batch.batch_number, '-LOTE-', -1) AS UNSIGNED))",
        'maxSeq',
      )
      .where('batch.tenant_id = :tenantId', { tenantId })
      .andWhere('batch.batch_number LIKE :pattern', { pattern })
      .getRawOne<{ maxSeq: string | null }>();

    const maxSeq = result?.maxSeq ? Number(result.maxSeq) : 0;
    return maxSeq > 0 ? maxSeq + 1 : 1;
  }

  /**
   * Generate a unique batch number for a warehouse
   * Format: {prefix}-LOTE-{6_digit_sequential}
   */
  async generateBatchNumber(warehouseId: string, tenantId: string): Promise<string> {
    const prefix = await this.getWarehousePrefix(warehouseId);
    let sequenceNumber = await this.getNextSequentialNumber(warehouseId, tenantId);

    for (let attempt = 0; attempt < 20; attempt++) {
      const paddedNumber = String(sequenceNumber).padStart(6, '0');
      const batchNumber = `${prefix}-LOTE-${paddedNumber}`;

      const existingBatch = await this.inventoryBatchRepository.findOne({
        where: {
          tenant_id: tenantId,
          batch_number: batchNumber,
        },
      });

      if (!existingBatch) {
        return batchNumber;
      }

      sequenceNumber++;
    }

    throw new BadRequestException(
      `No se pudo generar un número de lote único para el almacén ${warehouseId}`,
    );
  }
}
