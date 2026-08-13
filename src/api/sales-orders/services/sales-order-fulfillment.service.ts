import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';

@Injectable()
export class SalesOrderFulfillmentService {
  private readonly logger = new Logger(SalesOrderFulfillmentService.name);

  constructor(
    @InjectRepository(InventoryBatch)
    private readonly batchRepo: Repository<InventoryBatch>,
  ) {}

  /**
   * Allocates inventory batches to a sales order line item using FIFO.
   * Batches are consumed oldest-first (by created_at ASC).
   *
   * Example: need 15 units, lote A=10, lote B=20
   *   → alloc 1: lote A, qty 10  (lote A available_quantity → 0)
   *   → alloc 2: lote B, qty 5   (lote B available_quantity → 15)
   *
   * Must be called inside an active transaction (EntityManager passed in).
   */
  async allocateFifo(
    detail: SalesOrderDetail,
    warehouseId: string,
    userId: string,
    manager: EntityManager,
  ): Promise<SalesOrderBatchAllocation[]> {
    const needed = parseFloat(detail.quantity_base_uom.toString());

    // Fetch available batches for this product+warehouse, FIFO order
    const batches = await manager
      .createQueryBuilder(InventoryBatch, 'batch')
      .where('batch.product_id = :productId', { productId: detail.product_id })
      .andWhere('batch.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('batch.available_quantity > 0')
      .orderBy('batch.created_at', 'ASC')
      .setLock('pessimistic_write')
      .getMany();

    const totalAvailable = batches.reduce(
      (sum, b) => sum + parseFloat(b.available_quantity.toString()),
      0,
    );

    if (totalAvailable < needed) {
      throw new BadRequestException(
        `Stock insuficiente para el producto ${detail.product_id}. ` +
        `Requerido: ${needed}, disponible: ${totalAvailable}`,
      );
    }

    const allocations: SalesOrderBatchAllocation[] = [];
    let remaining = needed;

    for (const batch of batches) {
      if (remaining <= 0) break;

      const available = parseFloat(batch.available_quantity.toString());
      const take = Math.min(available, remaining);

      // Deduct from batch
      batch.available_quantity = parseFloat((available - take).toFixed(3)) as any;
      await manager.save(InventoryBatch, batch);

      // Record allocation
      const allocation = manager.create(SalesOrderBatchAllocation, {
        sales_order_detail_id: detail.id,
        inventory_batch_id: batch.id,
        quantity_allocated: take,
        created_by: userId,
      });
      await manager.save(SalesOrderBatchAllocation, allocation);
      allocations.push(allocation);

      this.logger.log(
        `FIFO alloc: batch ${batch.batch_number} → ${take} units (remaining: ${remaining - take})`,
      );

      remaining = parseFloat((remaining - take).toFixed(3));
    }

    return allocations;
  }

  /**
   * Devuelve las cantidades de los lotes y elimina las asignaciones.
   */
  async releaseAllocations(
    allocations: SalesOrderBatchAllocation[],
    manager: EntityManager,
  ): Promise<void> {
    if (!allocations.length) {
      return;
    }

    for (const alloc of allocations) {
      const batch = await manager.findOne(InventoryBatch, {
        where: { id: alloc.inventory_batch_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!batch) continue;

      const current = parseFloat(batch.available_quantity.toString());
      const qty = parseFloat(alloc.quantity_allocated.toString());
      batch.available_quantity = parseFloat((current + qty).toFixed(3)) as any;
      await manager.save(InventoryBatch, batch);
    }

    await manager.remove(SalesOrderBatchAllocation, allocations);
  }
}
