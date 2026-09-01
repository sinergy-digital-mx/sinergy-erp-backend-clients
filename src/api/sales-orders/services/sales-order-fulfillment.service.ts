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
   * Asigna lotes FIFO a una línea de OV.
   * POS: un almacén. MANUAL: todos los almacenes de la sucursal.
   */
  async allocateFifo(
    detail: SalesOrderDetail,
    userId: string,
    manager: EntityManager,
    scope: { warehouseId?: string | null; billingBranchId?: string | null },
    quantityBase?: number,
  ): Promise<SalesOrderBatchAllocation[]> {
    const needed = parseFloat(
      (quantityBase ?? detail.quantity_base_uom).toString(),
    );
    if (needed <= 0) {
      return [];
    }
    const warehouseId = scope.warehouseId || undefined;
    const billingBranchId = scope.billingBranchId || undefined;

    if (!warehouseId && !billingBranchId) {
      throw new BadRequestException(
        'No se puede surtir: la orden no tiene sucursal ni almacén',
      );
    }

    const qb = manager
      .createQueryBuilder(InventoryBatch, 'batch')
      .where('batch.product_id = :productId', { productId: detail.product_id })
      .andWhere('batch.available_quantity > 0')
      .orderBy('batch.created_at', 'ASC')
      .setLock('pessimistic_write');

    if (warehouseId) {
      qb.andWhere('batch.warehouse_id = :warehouseId', { warehouseId });
    } else {
      qb.innerJoin('batch.warehouse', 'warehouse').andWhere(
        'warehouse.billing_branch_id = :billingBranchId',
        { billingBranchId },
      );
    }

    const batches = await qb.getMany();

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
