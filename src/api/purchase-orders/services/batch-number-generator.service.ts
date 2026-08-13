import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';

const SEQUENCE_PAD = 5;
const SEGMENT_PATTERN = /^[A-Z0-9]{1,10}$/;

type LotSeries = {
  series: string;
  fiscalPrefix: string;
  branchPrefix: string;
  warehousePrefix: string;
};

@Injectable()
export class BatchNumberGeneratorService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(InventoryBatch)
    private readonly inventoryBatchRepository: Repository<InventoryBatch>,
  ) {}

  /**
   * Serie de lote: `{razon}-{sucursal}-{almacen}` → `MZN-SBA-BDGA-00011`
   */
  async resolveLotSeries(
    warehouseId: string,
    organizationId: string,
    manager?: EntityManager,
  ): Promise<LotSeries> {
    const warehouseRepo = manager
      ? manager.getRepository(Warehouse)
      : this.warehouseRepository;

    const warehouse = await warehouseRepo.findOne({
      where: { id: warehouseId, tenant_id: organizationId },
      relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
    });

    if (!warehouse) {
      throw new NotFoundException(`Almacén no encontrado: ${warehouseId}`);
    }

    const branch = warehouse.billing_branch;
    if (!branch) {
      throw new BadRequestException(
        `El almacén "${warehouse.name}" no está vinculado a una sucursal. Asigna sucursal y prefijos para recibir mercancía.`,
      );
    }

    const fiscal = branch.fiscal_configuration;
    const fiscalPrefix = this.asLotSegment(fiscal?.prefix);
    if (!fiscalPrefix) {
      throw new BadRequestException(
        'La razón social no tiene prefijo. Configúralo en Configuración fiscal (ej. MZN).',
      );
    }

    const branchPrefix = this.asLotSegment(branch.prefix);
    if (!branchPrefix) {
      throw new BadRequestException(
        `La sucursal "${branch.code}" no tiene prefijo. Configúralo en la sucursal (ej. SBA).`,
      );
    }

    const warehousePrefix = this.asLotSegment(warehouse.prefix);
    if (!warehousePrefix) {
      throw new BadRequestException(
        `El almacén "${warehouse.name}" no tiene prefijo. Configúralo en el almacén (ej. BDGA).`,
      );
    }

    return {
      fiscalPrefix,
      branchPrefix,
      warehousePrefix,
      series: `${fiscalPrefix}-${branchPrefix}-${warehousePrefix}`,
    };
  }

  async getNextSequentialNumber(
    warehouseId: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const { series } = await this.resolveLotSeries(warehouseId, tenantId, manager);
    const pattern = `${series}-%`;
    const batchRepo = manager
      ? manager.getRepository(InventoryBatch)
      : this.inventoryBatchRepository;

    const result = await batchRepo
      .createQueryBuilder('batch')
      .select(
        "MAX(CAST(SUBSTRING_INDEX(batch.batch_number, '-', -1) AS UNSIGNED))",
        'maxSeq',
      )
      .where('batch.tenant_id = :tenantId', { tenantId })
      .andWhere('batch.batch_number LIKE :pattern', { pattern })
      .getRawOne<{ maxSeq: string | null }>();

    const maxSeq = result?.maxSeq ? Number(result.maxSeq) : 0;
    return maxSeq > 0 ? maxSeq + 1 : 1;
  }

  /**
   * Genera número de lote: `{razon}-{sucursal}-{almacen}-{5 dígitos}`
   * Ejemplo: MZN-SBA-BDGA-00011
   *
   * Si se pasa `manager` (misma transacción que el INSERT), ve lotes aún no committeados.
   */
  async generateBatchNumber(
    warehouseId: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<string> {
    const { series } = await this.resolveLotSeries(warehouseId, tenantId, manager);
    let sequenceNumber = await this.getNextSequentialNumber(
      warehouseId,
      tenantId,
      manager,
    );
    const batchRepo = manager
      ? manager.getRepository(InventoryBatch)
      : this.inventoryBatchRepository;

    for (let attempt = 0; attempt < 20; attempt++) {
      const paddedNumber = String(sequenceNumber).padStart(SEQUENCE_PAD, '0');
      const batchNumber = `${series}-${paddedNumber}`;

      const existingBatch = await batchRepo.findOne({
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

  private asLotSegment(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const normalized = String(value).trim().toUpperCase();
    return SEGMENT_PATTERN.test(normalized) ? normalized : null;
  }
}
