import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Product } from '../../../entities/products/product.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { InventoryStockLedgerMovementType } from '../../../entities/inventory/inventory-stock-ledger-movement-type.enum';
import {
  InventoryStockLedgerService,
  STOCK_LEDGER_REFERENCE,
} from '../../inventory/services/inventory-stock-ledger.service';
import { InventoryStockLedgerValuationService } from '../../inventory/services/inventory-stock-ledger-valuation.service';
import { PURCHASE_ORDER_MOVEMENT_TYPES } from '../constants/purchase-order-movements';
import { CorrectPurchaseReceiptDto } from '../dto/correct-purchase-receipt.dto';
import { PurchaseOrderActivityService } from './purchase-order-activity.service';
import { PurchaseOrderActivityChange } from '../../../entities/purchase-orders/purchase-order-activity.entity';
import {
  activityChange,
  compactActivityChanges,
} from '../utils/purchase-order-activity-change.util';
import {
  computeReceivedLineBreakdown,
  roundPoMoney,
  roundPoUnitCost,
} from '../utils/purchase-order-line-breakdown.util';
import {
  formatBlockedLotsMessage,
  isPurchaseLotAlreadyExited,
  lotsBlockingFullExit,
  PURCHASE_REVERSAL_QTY_EPSILON,
  PurchaseLotStock,
  roundPurchaseQty,
} from '../utils/purchase-order-reversal.util';

@Injectable()
export class PurchaseOrderReversalService {
  constructor(
    @InjectRepository(PurchaseOrderBatch)
    private readonly orderRepo: Repository<PurchaseOrderBatch>,
    @InjectRepository(PurchaseOrderBatchDetail)
    private readonly detailRepo: Repository<PurchaseOrderBatchDetail>,
    private readonly dataSource: DataSource,
    private readonly stockLedger: InventoryStockLedgerService,
    private readonly stockLedgerValuation: InventoryStockLedgerValuationService,
    private readonly activityService: PurchaseOrderActivityService,
  ) {}

  async cancel(
    id: string,
    tenantId: string,
    userId: string,
    reason?: string | null,
  ): Promise<void> {
    const order = await this.loadOrder(id, tenantId);
    if (order.general_status === 'Cancelada') {
      throw new BadRequestException('La orden de compra ya está cancelada');
    }
    if (order.general_status !== 'Creada' && order.general_status !== 'Recibida') {
      throw new BadRequestException(
        `No se puede cancelar la orden de compra con estado: ${order.general_status}`,
      );
    }

    const previous = order.general_status;
    if (previous === 'Recibida') {
      await this.exitReceivedInventory(order, userId);
    } else {
      order.general_status = 'Cancelada';
      order.updated_by = userId;
      await this.orderRepo.save(order);
    }

    const note = reason?.trim();
    await this.activityService.record({
      tenantId,
      purchaseOrderId: id,
      type: PURCHASE_ORDER_MOVEMENT_TYPES.STATUS_CHANGED,
      actorId: userId,
      title: previous === 'Recibida' ? 'Orden cancelada y inventario salido' : 'Orden cancelada',
      description: note
        ? `La orden pasó de ${previous} a Cancelada. ${note}`
        : previous === 'Recibida'
          ? 'La orden pasó de Recibida a Cancelada y se dio salida al inventario ingresado.'
          : 'La orden pasó de Creada a Cancelada.',
      changes: compactActivityChanges([
        activityChange('general_status', 'Estatus', previous, 'Cancelada'),
      ]),
    });
  }

  async reopenForAdditionalReceipt(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const order = await this.loadOrder(id, tenantId);
    if (order.general_status !== 'Recibida') {
      throw new BadRequestException(
        `Solo se reabre para otro ingreso una orden recibida. Estado actual: ${order.general_status}`,
      );
    }
    order.general_status = 'Creada';
    order.additional_receipt_open = true;
    order.updated_by = userId;
    await this.orderRepo.save(order);

    await this.activityService.record({
      tenantId,
      purchaseOrderId: id,
      type: PURCHASE_ORDER_MOVEMENT_TYPES.STATUS_CHANGED,
      actorId: userId,
      title: 'Orden reabierta para ingreso',
      description:
        'La orden volvió a Creada para agregar productos y recibir otro ingreso. El inventario ya ingresado se conserva.',
      changes: compactActivityChanges([
        activityChange('general_status', 'Estatus', 'Recibida', 'Creada'),
      ]),
    });
  }

  async closeAdditionalReceipt(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const order = await this.loadOrder(id, tenantId);
    if (!order.additional_receipt_open) {
      throw new BadRequestException('La orden no está abierta para un ingreso adicional');
    }
    order.general_status = 'Recibida';
    order.additional_receipt_open = false;
    order.updated_by = userId;
    await this.orderRepo.save(order);

    await this.activityService.record({
      tenantId,
      purchaseOrderId: id,
      type: PURCHASE_ORDER_MOVEMENT_TYPES.STATUS_CHANGED,
      actorId: userId,
      title: 'Ingreso adicional cerrado',
      description: 'La orden volvió a Recibida sin un ingreso nuevo.',
      changes: compactActivityChanges([
        activityChange('general_status', 'Estatus', 'Creada', 'Recibida'),
      ]),
    });
  }

  async reopen(id: string, tenantId: string, userId: string): Promise<void> {
    const order = await this.loadOrder(id, tenantId);
    if (order.general_status !== 'Cancelada') {
      throw new BadRequestException(
        `Solo se puede reabrir una orden cancelada. Estado actual: ${order.general_status}`,
      );
    }

    const hadReceipt = (order.line_items ?? []).some(
      (line) => Number(line.received_original_quantity ?? 0) > 0,
    );

    order.general_status = 'Creada';
    order.updated_by = userId;
    if (hadReceipt) {
      order.received_subtotal = 0;
      order.received_iva_total = 0;
      order.received_ieps_total = 0;
      order.received_total = 0;
      for (const line of order.line_items ?? []) {
        Object.assign(line, {
          received_original_product_id: null,
          received_original_uom_id: null,
          received_original_quantity: null,
          received_original_unit_total: null,
          received_original_iva_percentage: null,
          received_original_iva_unit: null,
          received_original_ieps_percentage: null,
          received_original_ieps_unit: null,
          received_line_subtotal: null,
          received_line_iva: null,
          received_line_ieps: null,
          received_line_total: null,
          received_converted_uom_id: null,
          received_converted_quantity: null,
        });
      }
      await this.detailRepo.save(order.line_items ?? []);
    }
    await this.orderRepo.save(order);

    await this.activityService.record({
      tenantId,
      purchaseOrderId: id,
      type: PURCHASE_ORDER_MOVEMENT_TYPES.STATUS_CHANGED,
      actorId: userId,
      title: 'Orden reabierta',
      description: hadReceipt
        ? 'La orden volvió a Creada. El inventario de la recepción cancelada no regresa; hay que recibir de nuevo.'
        : 'La orden volvió de Cancelada a Creada.',
      changes: compactActivityChanges([
        activityChange('general_status', 'Estatus', 'Cancelada', 'Creada'),
      ]),
    });
  }

  async correctReceipt(
    id: string,
    dto: CorrectPurchaseReceiptDto,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const order = await this.loadOrder(id, tenantId);
    if (order.general_status !== 'Recibida') {
      throw new BadRequestException('Solo se corrige el recibo de una orden recibida');
    }

    const corrections: Array<{ changes: PurchaseOrderActivityChange[] }> = [];
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.lockPurchaseOrder(queryRunner.manager, order.id, tenantId);
      const batches = await this.lockPurchaseBatches(queryRunner.manager, tenantId, order.id);
      await this.fillProductLabels(queryRunner.manager, batches);

      for (const patch of dto.lines) {
        const line = (order.line_items ?? []).find((item) => item.id === patch.line_item_id);
        if (!line) {
          throw new NotFoundException(`Línea no encontrada: ${patch.line_item_id}`);
        }
        if (patch.quantity == null && patch.unit_total == null) {
          throw new BadRequestException('Indica cantidad o precio para corregir');
        }

        const direct = batches.filter(
          (batch) => batch.purchase_order_detail_id === line.id && !batch.transferred_from_batch_id,
        );
        const previousQty = Number(line.received_original_quantity ?? 0);
        const previousCost = Number(line.received_original_unit_total ?? 0);
        const nextQty = patch.quantity != null ? Number(patch.quantity) : previousQty;
        const nextCost = patch.unit_total != null
          ? roundPoUnitCost(patch.unit_total)
          : previousCost;
        const qtyChanged = patch.quantity != null
          && Math.abs(nextQty - previousQty) > PURCHASE_REVERSAL_QTY_EPSILON;
        const costChanged = patch.unit_total != null
          && Math.abs(nextCost - previousCost) > 0.00005;
        if (!qtyChanged && !costChanged) {
          continue;
        }

        if (qtyChanged) {
          if (direct.length !== 1) {
            throw new BadRequestException(
              'Esta línea tiene varios lotes. Para cambiar la cantidad, el inventario de cada lote debe seguir completo y la corrección es de un solo lote por línea.',
            );
          }
          const blocked = lotsBlockingFullExit(direct.map((batch) => this.toLotStock(batch)));
          if (blocked.length) {
            throw new BadRequestException(formatBlockedLotsMessage(order.folio, blocked));
          }
          await this.applyQuantityCorrection(order, direct[0], line, nextQty, userId, queryRunner.manager);
        }

        line.received_original_quantity = nextQty;
        line.received_original_unit_total = nextCost;
        const ivaPct = Number(line.received_original_iva_percentage ?? 0);
        const iepsPct = Number(line.received_original_ieps_percentage ?? 0);
        line.received_original_iva_unit = roundPoMoney(nextCost * (ivaPct / 100));
        line.received_original_ieps_unit = roundPoMoney(nextCost * (iepsPct / 100));
        Object.assign(line, computeReceivedLineBreakdown(nextQty, nextCost, ivaPct, iepsPct));
        await queryRunner.manager.getRepository(PurchaseOrderBatchDetail).save(line);

        corrections.push({
          changes: compactActivityChanges([
            activityChange('received_original_quantity', 'Cantidad recibida', previousQty, nextQty),
            activityChange('received_original_unit_total', 'Costo unitario recibido', previousCost, nextCost),
          ]),
        });
      }

      this.refreshReceivedTotals(order);
      order.updated_by = userId;
      await queryRunner.manager.getRepository(PurchaseOrderBatch).save(order);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    for (const correction of corrections) {
      await this.activityService.record({
        tenantId,
        purchaseOrderId: id,
        type: PURCHASE_ORDER_MOVEMENT_TYPES.RECEIPT_CORRECTED,
        actorId: userId,
        description: 'Se corrigió cantidad o precio del recibo.',
        changes: correction.changes,
      });
    }
  }

  private async exitReceivedInventory(
    order: PurchaseOrderBatch,
    userId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.lockPurchaseOrder(queryRunner.manager, order.id, order.tenant_id);
      const batches = await this.lockPurchaseBatches(queryRunner.manager, order.tenant_id, order.id);
      await this.fillProductLabels(queryRunner.manager, batches);
      const nets = await this.purchaseNetByBatch(
        queryRunner.manager,
        order.tenant_id,
        batches.map((batch) => batch.id),
      );

      const direct = batches.filter((batch) => {
        if (batch.transferred_from_batch_id) {
          return false;
        }
        const initial = roundPurchaseQty(batch.initial_quantity);
        if (initial <= PURCHASE_REVERSAL_QTY_EPSILON) {
          return false;
        }
        const available = roundPurchaseQty(batch.available_quantity);
        const purchaseNet = nets.get(batch.id) ?? initial;
        return !isPurchaseLotAlreadyExited(available, purchaseNet);
      });

      const blocked = lotsBlockingFullExit(direct.map((batch) => this.toLotStock(batch)));
      if (blocked.length) {
        throw new BadRequestException(formatBlockedLotsMessage(order.folio, blocked));
      }

      for (const batch of direct) {
        const initial = roundPurchaseQty(batch.initial_quantity);
        if (initial <= PURCHASE_REVERSAL_QTY_EPSILON) {
          continue;
        }
        batch.available_quantity = 0;
        await queryRunner.manager.getRepository(InventoryBatch).save(batch);
        const valuation = await this.stockLedgerValuation.resolveFromBatchId(
          order.tenant_id,
          batch.id,
          queryRunner.manager,
        );
        await this.stockLedger.append(
          {
            tenantId: order.tenant_id,
            productId: batch.product_id,
            warehouseId: batch.warehouse_id,
            uomId: batch.uom_id,
            inventoryBatchId: batch.id,
            movementType: InventoryStockLedgerMovementType.PURCHASE_REVERSAL,
            quantityDelta: -initial,
            unitCostMxn: valuation.unitCostMxn,
            unitSalePriceMxn: valuation.unitSalePriceMxn,
            occurredAt: new Date(),
            referenceType: STOCK_LEDGER_REFERENCE.PURCHASE_ORDER,
            referenceId: order.id,
            referenceFolio: order.folio,
            createdBy: userId,
            notes: `Salida por cancelación de ${order.folio}. El ingreso queda en el historial.`,
          },
          queryRunner.manager,
        );
      }

      order.general_status = 'Cancelada';
      order.updated_by = userId;
      await queryRunner.manager.getRepository(PurchaseOrderBatch).save(order);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async applyQuantityCorrection(
    order: PurchaseOrderBatch,
    batch: InventoryBatch,
    line: PurchaseOrderBatchDetail,
    nextQty: number,
    userId: string,
    manager: EntityManager,
  ): Promise<void> {
    const previousOriginal = Number(line.received_original_quantity ?? 0);
    const previousBase = roundPurchaseQty(batch.initial_quantity);
    const factor = previousOriginal > PURCHASE_REVERSAL_QTY_EPSILON
      ? previousBase / previousOriginal
      : 1;
    const nextBase = roundPurchaseQty(nextQty * factor);
    const delta = roundPurchaseQty(nextBase - previousBase);

    batch.initial_quantity = nextBase;
    batch.available_quantity = nextBase;
    line.received_converted_quantity = nextBase;
    await manager.getRepository(InventoryBatch).save(batch);

    if (Math.abs(delta) <= PURCHASE_REVERSAL_QTY_EPSILON) {
      return;
    }

    const valuation = await this.stockLedgerValuation.resolveFromBatchId(
      order.tenant_id,
      batch.id,
      manager,
    );
    await this.stockLedger.append(
      {
        tenantId: order.tenant_id,
        productId: batch.product_id,
        warehouseId: batch.warehouse_id,
        uomId: batch.uom_id,
        inventoryBatchId: batch.id,
        movementType: delta > 0
          ? InventoryStockLedgerMovementType.PURCHASE_RECEIPT
          : InventoryStockLedgerMovementType.PURCHASE_REVERSAL,
        quantityDelta: delta,
        unitCostMxn: valuation.unitCostMxn,
        unitSalePriceMxn: valuation.unitSalePriceMxn,
        occurredAt: new Date(),
        referenceType: STOCK_LEDGER_REFERENCE.PURCHASE_ORDER,
        referenceId: order.id,
        referenceFolio: order.folio,
        createdBy: userId,
        notes: `Corrección de recibo ${order.folio}`,
      },
      manager,
    );
  }

  private refreshReceivedTotals(order: PurchaseOrderBatch): void {
    const lines = order.line_items ?? [];
    order.received_subtotal = roundPoMoney(
      lines.reduce((sum, line) => sum + Number(line.received_line_subtotal ?? 0), 0),
    );
    order.received_iva_total = roundPoMoney(
      lines.reduce((sum, line) => sum + Number(line.received_line_iva ?? 0), 0),
    );
    order.received_ieps_total = roundPoMoney(
      lines.reduce((sum, line) => sum + Number(line.received_line_ieps ?? 0), 0),
    );
    order.received_total = roundPoMoney(
      lines.reduce((sum, line) => sum + Number(line.received_line_total ?? 0), 0),
    );
  }

  private toLotStock(batch: InventoryBatch): PurchaseLotStock {
    const product = batch.product;
    const label = [product?.sku, product?.name].filter(Boolean).join(' · ') || batch.product_id;
    return {
      batch_id: batch.id,
      batch_number: batch.batch_number,
      product_label: label,
      initial_quantity: Number(batch.initial_quantity),
      available_quantity: Number(batch.available_quantity),
      missing_quantity: 0,
      transferred_from_batch_id: batch.transferred_from_batch_id,
    };
  }

  private async lockPurchaseOrder(
    manager: EntityManager,
    orderId: string,
    tenantId: string,
  ): Promise<void> {
    const locked = await manager
      .getRepository(PurchaseOrderBatch)
      .createQueryBuilder('po')
      .setLock('pessimistic_write')
      .where('po.id = :orderId', { orderId })
      .andWhere('po.tenant_id = :tenantId', { tenantId })
      .getOne();
    if (!locked || locked.general_status !== 'Recibida') {
      throw new BadRequestException('La orden ya no está recibida');
    }
  }

  private async lockPurchaseBatches(
    manager: EntityManager,
    tenantId: string,
    orderId: string,
  ): Promise<InventoryBatch[]> {
    return manager
      .getRepository(InventoryBatch)
      .createQueryBuilder('batch')
      .setLock('pessimistic_write')
      .where('batch.tenant_id = :tenantId', { tenantId })
      .andWhere('batch.purchase_order_batch_id = :orderId', { orderId })
      .getMany();
  }

  private async purchaseNetByBatch(
    manager: EntityManager,
    tenantId: string,
    batchIds: string[],
  ): Promise<Map<string, number>> {
    const nets = new Map<string, number>();
    if (!batchIds.length) {
      return nets;
    }
    const placeholders = batchIds.map(() => '?').join(', ');
    const rows: Array<{ inventory_batch_id: string; purchase_net: string | number | null }> =
      await manager.query(
        `
        SELECT inventory_batch_id, SUM(quantity_delta) AS purchase_net
        FROM inv_s_stock_ledger
        WHERE tenant_id = ?
          AND inventory_batch_id IN (${placeholders})
          AND movement_type IN ('purchase_receipt', 'import', 'purchase_reversal')
        GROUP BY inventory_batch_id
        `,
        [tenantId, ...batchIds],
      );
    for (const row of rows) {
      nets.set(row.inventory_batch_id, Number(row.purchase_net ?? 0));
    }
    return nets;
  }

  private async fillProductLabels(
    manager: EntityManager,
    batches: InventoryBatch[],
  ): Promise<void> {
    const ids = [...new Set(batches.map((batch) => batch.product_id).filter(Boolean))];
    if (!ids.length) {
      return;
    }
    const products = await manager.getRepository(Product).find({
      where: { id: In(ids) },
      select: { id: true, name: true, sku: true },
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    for (const batch of batches) {
      const product = byId.get(batch.product_id);
      if (product) {
        batch.product = product;
      }
    }
  }

  private async loadOrder(id: string, tenantId: string): Promise<PurchaseOrderBatch> {
    const order = await this.orderRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['line_items'],
    });
    if (!order) {
      throw new NotFoundException('Orden de compra no encontrada');
    }
    return order;
  }
}
