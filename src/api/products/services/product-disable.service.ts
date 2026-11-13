import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from '../../../entities/products/product.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { InventoryTransfer } from '../../../entities/inventory/inventory-transfer.entity';
import { OPEN_TRANSFER_STATUSES } from '../../../entities/inventory/inventory-transfer-status.enum';
import { InventoryStockLedgerMovementType } from '../../../entities/inventory/inventory-stock-ledger-movement-type.enum';
import {
  InventoryStockLedgerService,
  STOCK_LEDGER_REFERENCE,
} from '../../inventory/services/inventory-stock-ledger.service';
import { InventoryStockLedgerValuationService } from '../../inventory/services/inventory-stock-ledger-valuation.service';
import { ToggleStatusDto } from '../dto/toggle-status.dto';
import { parseQty, StockByUom, summarizeStock } from '../utils/product-disable.util';

const WRITE_OFF_NOTE = 'Baja de inventario al deshabilitar el producto';

export interface ProductDisableImpact {
  is_active: boolean;
  has_inventory: boolean;
  lot_count: number;
  open_transfer_count: number;
  by_uom: StockByUom[];
}

@Injectable()
export class ProductDisableService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly stockLedger: InventoryStockLedgerService,
    private readonly stockLedgerValuation: InventoryStockLedgerValuationService,
  ) {}

  async getImpact(id: string, tenantId: string): Promise<ProductDisableImpact> {
    const product = await this.requireProduct(id, tenantId);

    const batches = await this.dataSource
      .createQueryBuilder(InventoryBatch, 'batch')
      .leftJoinAndSelect('batch.uom', 'uom')
      .where('batch.tenant_id = :tenantId', { tenantId })
      .andWhere('batch.product_id = :productId', { productId: product.id })
      .andWhere('batch.available_quantity > 0')
      .getMany();

    const summary = summarizeStock(
      batches.map((batch) => ({
        quantity: parseQty(batch.available_quantity),
        uomName: batch.uom?.name ?? '',
      })),
    );

    const openTransferCount = await this.countOpenTransfers(
      this.dataSource.manager,
      tenantId,
      product.id,
    );

    return {
      is_active: product.is_active,
      has_inventory: summary.lotCount > 0,
      lot_count: summary.lotCount,
      open_transfer_count: openTransferCount,
      by_uom: summary.byUom,
    };
  }

  async apply(
    id: string,
    dto: ToggleStatusDto,
    tenantId: string,
    userId?: string | null,
  ): Promise<Product> {
    const product = await this.requireProduct(id, tenantId);

    if (dto.is_active) {
      if (product.is_active) return product;
      product.is_active = true;
      return this.productRepo.save(product);
    }

    if (!product.is_active) return product;

    return this.disable(product, dto.write_off_inventory === true, tenantId, userId ?? null);
  }

  private async disable(
    product: Product,
    writeOffConfirmed: boolean,
    tenantId: string,
    userId: string | null,
  ): Promise<Product> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const locked = await qr.manager
        .createQueryBuilder(Product, 'product')
        .where('product.id = :id AND product.tenant_id = :tenantId', {
          id: product.id,
          tenantId,
        })
        .setLock('pessimistic_write')
        .getOne();

      if (!locked) {
        throw new NotFoundException(`Producto con ID ${product.id} no encontrado`);
      }

      if (!locked.is_active) {
        await qr.commitTransaction();
        return locked;
      }

      const openTransferCount = await this.countOpenTransfers(qr.manager, tenantId, locked.id);
      if (openTransferCount > 0) {
        throw new BadRequestException(
          'Hay transferencias abiertas de este producto. Recíbelas o cancélalas antes de deshabilitarlo.',
        );
      }

      const batches = await qr.manager
        .createQueryBuilder(InventoryBatch, 'batch')
        .where('batch.tenant_id = :tenantId', { tenantId })
        .andWhere('batch.product_id = :productId', { productId: locked.id })
        .andWhere('batch.available_quantity > 0')
        .orderBy('batch.warehouse_id', 'ASC')
        .addOrderBy('batch.uom_id', 'ASC')
        .addOrderBy('batch.id', 'ASC')
        .setLock('pessimistic_write')
        .getMany();

      if (batches.length > 0 && !writeOffConfirmed) {
        throw new BadRequestException(
          'Este producto tiene inventario. Confirma la baja para deshabilitarlo.',
        );
      }

      const occurredAt = new Date();
      for (const batch of batches) {
        const before = parseQty(batch.available_quantity);
        if (before <= 0) continue;

        batch.available_quantity = 0;
        await qr.manager.save(InventoryBatch, batch);

        const valuation = await this.stockLedgerValuation.resolveFromBatchId(
          tenantId,
          batch.id,
          qr.manager,
        );

        await this.stockLedger.append(
          {
            tenantId,
            productId: locked.id,
            warehouseId: batch.warehouse_id,
            uomId: batch.uom_id,
            inventoryBatchId: batch.id,
            movementType: InventoryStockLedgerMovementType.AUDIT_ADJUSTMENT,
            quantityDelta: -before,
            unitCostMxn: valuation.unitCostMxn,
            unitSalePriceMxn: valuation.unitSalePriceMxn,
            occurredAt,
            referenceType: STOCK_LEDGER_REFERENCE.PRODUCT,
            referenceId: locked.id,
            referenceFolio: locked.sku.slice(0, 50),
            createdBy: userId,
            notes: WRITE_OFF_NOTE,
          },
          qr.manager,
        );
      }

      locked.is_active = false;
      const saved = await qr.manager.save(Product, locked);
      await qr.commitTransaction();
      return saved;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  private async countOpenTransfers(
    manager: EntityManager,
    tenantId: string,
    productId: string,
  ): Promise<number> {
    const rows = await manager
      .createQueryBuilder(InventoryTransfer, 'transfer')
      .innerJoin('transfer.lines', 'line')
      .innerJoin('line.source_inventory_batch', 'batch')
      .where('transfer.tenant_id = :tenantId', { tenantId })
      .andWhere('batch.product_id = :productId', { productId })
      .andWhere('transfer.status IN (:...statuses)', {
        statuses: [...OPEN_TRANSFER_STATUSES],
      })
      .select('transfer.id', 'id')
      .distinct(true)
      .getRawMany();
    return rows.length;
  }

  private async requireProduct(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }
}
