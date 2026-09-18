import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { Product } from '../../../entities/products/product.entity';
import { ProductItemKind } from '../../../entities/products/product-item-kind.enum';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
import { InventoryStockLedgerMovementType } from '../../../entities/inventory/inventory-stock-ledger-movement-type.enum';
import {
  InventoryStockLedgerService,
  STOCK_LEDGER_REFERENCE,
} from '../../inventory/services/inventory-stock-ledger.service';
import { InventoryStockLedgerValuationService } from '../../inventory/services/inventory-stock-ledger-valuation.service';
import { roundStockMoney } from '../../inventory/utils/stock-ledger-valuation.util';

@Injectable()
export class SalesOrderFulfillmentService {
  private readonly logger = new Logger(SalesOrderFulfillmentService.name);

  constructor(
    @InjectRepository(InventoryBatch)
    private readonly batchRepo: Repository<InventoryBatch>,
    private readonly stockLedger: InventoryStockLedgerService,
    private readonly stockLedgerValuation: InventoryStockLedgerValuationService,
  ) {}

  /**
   * Asigna lotes FIFO a una línea de OV.
   * POS y MANUAL: todos los almacenes de la sucursal (el catálogo POS agrega ese stock).
   * Si solo hay warehouseId, FIFO en ese almacén.
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

    const product = await manager.findOne(Product, {
      where: { id: detail.product_id },
      select: ['id', 'item_kind', 'name', 'sku'],
    });
    if (product?.item_kind === ProductItemKind.Service) {
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
        this.buildInsufficientStockMessage(product, needed, totalAvailable),
      );
    }

    const salesOrder = await this.resolveSalesOrder(detail, manager);
    const allocations: SalesOrderBatchAllocation[] = [];
    let remaining = needed;

    for (const batch of batches) {
      if (remaining <= 0) break;

      const available = parseFloat(batch.available_quantity.toString());
      const take = Math.min(available, remaining);

      batch.available_quantity = parseFloat((available - take).toFixed(3)) as any;
      await manager.save(InventoryBatch, batch);

      const allocation = manager.create(SalesOrderBatchAllocation, {
        sales_order_detail_id: detail.id,
        inventory_batch_id: batch.id,
        quantity_allocated: take,
        created_by: userId,
      });
      await manager.save(SalesOrderBatchAllocation, allocation);
      allocations.push(allocation);

      const valuation = await this.stockLedgerValuation.resolveFromBatchId(
        batch.tenant_id,
        batch.id,
        manager,
      );
      const unitPrice = parseFloat(String(detail.unit_price ?? 0));
      const discountUnit = parseFloat(String(detail.discount_unit ?? 0));
      const saleUnit =
        Number.isFinite(unitPrice)
          ? roundStockMoney(Math.max(0, unitPrice - (Number.isFinite(discountUnit) ? discountUnit : 0)))
          : null;

      await this.stockLedger.append(
        {
          tenantId: batch.tenant_id,
          productId: batch.product_id,
          warehouseId: batch.warehouse_id,
          uomId: batch.uom_id,
          inventoryBatchId: batch.id,
          movementType: InventoryStockLedgerMovementType.SALE,
          quantityDelta: -take,
          unitCostMxn: valuation.unitCostMxn,
          unitSalePriceMxn: saleUnit,
          occurredAt: allocation.created_at ?? new Date(),
          referenceType: STOCK_LEDGER_REFERENCE.SALES_ORDER,
          referenceId: salesOrder?.id ?? detail.sales_order_id,
          referenceFolio: salesOrder?.folio ?? null,
          createdBy: userId,
        },
        manager,
      );

      this.logger.log(
        `FIFO alloc: batch ${batch.batch_number} → ${take} units (remaining: ${remaining - take})`,
      );

      remaining = parseFloat((remaining - take).toFixed(3));
    }

    return allocations;
  }

  /**
   * Devuelve las cantidades de los lotes y elimina las asignaciones.
   * Registra sale_reversal en el kardex (append-only).
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

      const salesMeta = await this.resolveSalesMetaFromAllocation(alloc, manager);

      const valuation = await this.stockLedgerValuation.resolveFromBatchId(
        batch.tenant_id,
        batch.id,
        manager,
      );
      const detail = await manager.findOne(SalesOrderDetail, {
        where: { id: alloc.sales_order_detail_id },
      });
      const unitPrice = parseFloat(String(detail?.unit_price ?? 0));
      const discountUnit = parseFloat(String(detail?.discount_unit ?? 0));
      const saleUnit =
        detail && Number.isFinite(unitPrice)
          ? roundStockMoney(Math.max(0, unitPrice - (Number.isFinite(discountUnit) ? discountUnit : 0)))
          : null;

      await this.stockLedger.append(
        {
          tenantId: batch.tenant_id,
          productId: batch.product_id,
          warehouseId: batch.warehouse_id,
          uomId: batch.uom_id,
          inventoryBatchId: batch.id,
          movementType: InventoryStockLedgerMovementType.SALE_REVERSAL,
          quantityDelta: qty,
          unitCostMxn: valuation.unitCostMxn,
          unitSalePriceMxn: saleUnit,
          occurredAt: new Date(),
          referenceType: STOCK_LEDGER_REFERENCE.SALES_ORDER,
          referenceId: salesMeta.salesOrderId,
          referenceFolio: salesMeta.folio,
          createdBy: alloc.created_by ?? null,
        },
        manager,
      );
    }

    // delete() en vez de remove(): TypeORM intenta SET NULL en sales_order_detail_id (NOT NULL).
    const allocationIds = allocations.map((alloc) => alloc.id).filter(Boolean);
    if (allocationIds.length) {
      await manager.delete(SalesOrderBatchAllocation, allocationIds);
    }
  }

  /** Mensaje de stock para UI: nombre/SKU, nunca el id del producto. */
  private buildInsufficientStockMessage(
    product: Pick<Product, 'name' | 'sku'> | null | undefined,
    needed: number,
    available: number,
  ): string {
    const label = this.formatProductLabel(product);
    const neededLabel = this.formatStockQty(needed);
    const availableLabel = this.formatStockQty(available);
    if (label) {
      return `No hay stock suficiente de ${label}. Pediste ${neededLabel} y hay ${availableLabel} disponible.`;
    }
    return `No hay stock suficiente. Pediste ${neededLabel} y hay ${availableLabel} disponible.`;
  }

  private formatProductLabel(
    product?: Pick<Product, 'name' | 'sku'> | null,
  ): string | null {
    const name = product?.name?.trim();
    return name || product?.sku?.trim() || null;
  }

  private formatStockQty(value: number): string {
    if (!Number.isFinite(value)) {
      return '0';
    }
    return parseFloat(value.toFixed(3)).toString();
  }

  private async resolveSalesOrder(
    detail: SalesOrderDetail,
    manager: EntityManager,
  ): Promise<SalesOrder | null> {
    if (detail.sales_order?.folio) {
      return detail.sales_order;
    }
    if (!detail.sales_order_id) {
      return null;
    }
    return manager.findOne(SalesOrder, { where: { id: detail.sales_order_id } });
  }

  private async resolveSalesMetaFromAllocation(
    alloc: SalesOrderBatchAllocation,
    manager: EntityManager,
  ): Promise<{ salesOrderId: string | null; folio: string | null }> {
    const detail =
      alloc.sales_order_detail ??
      (await manager.findOne(SalesOrderDetail, {
        where: { id: alloc.sales_order_detail_id },
        relations: ['sales_order'],
      }));

    if (!detail) {
      return { salesOrderId: null, folio: null };
    }

    const so =
      detail.sales_order ??
      (await manager.findOne(SalesOrder, { where: { id: detail.sales_order_id } }));

    return {
      salesOrderId: detail.sales_order_id,
      folio: so?.folio ?? null,
    };
  }
}
