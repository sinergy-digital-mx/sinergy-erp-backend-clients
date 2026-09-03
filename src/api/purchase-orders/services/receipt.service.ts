import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { UoMCatalog } from '../../../entities/uom-catalog/uom-catalog.entity';
import {
  ReceivePurchaseOrderDto,
  ReceiptLotMode,
} from '../dto/receive-purchase-order.dto';
import { ReceiptValidatorService } from './receipt-validator.service';
import { BatchCreatorService } from './batch-creator.service';
import { TotalCalculatorService } from './total-calculator.service';
import { TenantValidatorService } from './tenant-validator.service';
import { PurchaseOrderActivityService } from './purchase-order-activity.service';
import { PurchaseOrderRealCostService } from './purchase-order-real-cost.service';
import { computeReceivedLineBreakdown, roundPoUnitCost } from '../utils/purchase-order-line-breakdown.util';
import {
  activityChange,
  compactActivityChanges,
} from '../utils/purchase-order-activity-change.util';
import { PURCHASE_ORDER_MOVEMENT_TYPES } from '../constants/purchase-order-movements';

/**
 * Orquestador de recepción de órdenes de compra.
 * Usa transacción para que lotes + estado Recibida avancen juntos.
 */
@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    @InjectRepository(PurchaseOrderBatch)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderBatch>,
    @InjectRepository(PurchaseOrderBatchDetail)
    private readonly lineItemRepository: Repository<PurchaseOrderBatchDetail>,
    @InjectRepository(InventoryBatch)
    private readonly inventoryBatchRepository: Repository<InventoryBatch>,
    @InjectRepository(UoMCatalog)
    private readonly uomCatalogRepository: Repository<UoMCatalog>,
    private readonly receiptValidatorService: ReceiptValidatorService,
    private readonly batchCreatorService: BatchCreatorService,
    private readonly totalCalculatorService: TotalCalculatorService,
    private readonly tenantValidatorService: TenantValidatorService,
    private readonly activityService: PurchaseOrderActivityService,
    private readonly realCostService: PurchaseOrderRealCostService,
    private readonly dataSource: DataSource,
  ) {}

  async receive(
    id: string,
    dto: ReceivePurchaseOrderDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrderBatch> {
    try {
      await this.tenantValidatorService.validatePOBelongsToTenant(id, tenantId);

      const purchaseOrder = await this.purchaseOrderRepository.findOne({
        where: { id, tenant_id: tenantId },
        relations: ['line_items'],
      });

      if (!purchaseOrder) {
        throw new NotFoundException(`Orden de compra no encontrada: ${id}`);
      }

      const existingBatchesCount = await this.inventoryBatchRepository.count({
        where: {
          purchase_order_batch_id: id,
          tenant_id: tenantId,
        },
      });

      // Recepción a medias: hay lotes pero el estado no pasó a Recibida
      if (existingBatchesCount > 0 && purchaseOrder.general_status === 'Creada') {
        this.logger.warn(
          `PO ${id} tiene lotes pero sigue en Creada; se completa el estado a Recibida`,
        );
        await this.finalizeReceivedStatus(id, tenantId, userId, dto, purchaseOrder);
        await this.realCostService.recalculateIfEnabled(tenantId, id);
        await this.recordReceivedStatus(id, tenantId, userId, dto.received_items.length);
        return this.loadReceivedPurchaseOrder(id);
      }

      if (purchaseOrder.general_status !== 'Creada') {
        throw new BadRequestException(
          `No se puede recibir la orden de compra. Estado actual: ${purchaseOrder.general_status}`,
        );
      }

      if (existingBatchesCount > 0) {
        throw new BadRequestException(
          'La orden de compra ya tiene lotes de inventario. Si una recepción falló antes, contacta a soporte antes de reintentar.',
        );
      }

      await this.receiptValidatorService.validateReceivedItems(dto.received_items);
      await this.assertMeasureUomsExist(dto.received_items, tenantId);

      const productIds = [...new Set(dto.received_items.map((item) => item.product_id))];
      const productUomsMap = new Map<string, any[]>();

      for (const productId of productIds) {
        const productUoms = await this.lineItemRepository.query(
          `SELECT * FROM product_uoms WHERE product_id = ?`,
          [productId],
        );
        productUomsMap.set(productId, productUoms);
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        for (const receivedItem of dto.received_items) {
          const hasLots = Array.isArray(receivedItem.lots) && receivedItem.lots.length > 0;
          const lots = receivedItem.lots || [];
          const lotMode =
            receivedItem.lot_mode ||
            (hasLots ? ReceiptLotMode.MULTIPLE : ReceiptLotMode.SINGLE);
          const totalQuantityInLineUom =
            lotMode === ReceiptLotMode.MULTIPLE
              ? lots.reduce((acc, lot) => acc + Number(lot.quantity || 0), 0)
              : Number(receivedItem.quantity || 0);

          if (totalQuantityInLineUom > 0) {
            const productUoms = productUomsMap.get(receivedItem.product_id) || [];

            const productUom = productUoms.find((p) => p.id === receivedItem.product_uom_id);
            if (!productUom) {
              throw new BadRequestException(
                `Unidad de medida no soportada para este producto`,
              );
            }

            const baseUom = productUoms.find((p) => p.is_base);
            if (!baseUom) {
              throw new BadRequestException(
                `Unidad de medida base no encontrada para el producto: ${receivedItem.product_id}`,
              );
            }

            const factor = productUom.factor || 1;
            const convertedQuantity = productUom.is_base
              ? totalQuantityInLineUom
              : totalQuantityInLineUom * factor;

            await queryRunner.manager.update(
              PurchaseOrderBatchDetail,
              { id: receivedItem.line_item_id },
              {
                received_original_product_id: receivedItem.product_id,
                received_original_uom_id: productUom.uom_catalog_id,
                product_uom_id: productUom.id,
                received_original_quantity: totalQuantityInLineUom,
                received_original_unit_total: roundPoUnitCost(receivedItem.unit_total),
                received_original_iva_percentage: receivedItem.iva_percentage,
                received_original_iva_unit: receivedItem.iva_unit,
                received_original_ieps_percentage: receivedItem.ieps_percentage,
                received_original_ieps_unit: receivedItem.ieps_unit,
                ...computeReceivedLineBreakdown(
                  Number(totalQuantityInLineUom),
                  Number(receivedItem.unit_total),
                  Number(receivedItem.iva_percentage || 0),
                  Number(receivedItem.ieps_percentage || 0),
                ),
                received_converted_quantity: convertedQuantity,
                received_converted_uom_id: baseUom.uom_catalog_id,
                updated_by: userId,
              },
            );
          }
        }

        for (const receivedItem of dto.received_items) {
          const hasLots = Array.isArray(receivedItem.lots) && receivedItem.lots.length > 0;
          const lots = receivedItem.lots || [];
          const lotMode =
            receivedItem.lot_mode ||
            (hasLots ? ReceiptLotMode.MULTIPLE : ReceiptLotMode.SINGLE);
          const productUoms = productUomsMap.get(receivedItem.product_id) || [];

          if (lotMode === ReceiptLotMode.MULTIPLE && hasLots) {
            for (const lot of lots) {
              const lotReceivedItem = {
                ...receivedItem,
                quantity: Number(lot.quantity || 0),
                product_uom_id: lot.product_uom_id,
                measure: lot.measure ?? receivedItem.measure,
                measure_uom_id: lot.measure_uom_id ?? receivedItem.measure_uom_id,
              };
              await this.batchCreatorService.createBatchForReceivedItem(
                lotReceivedItem,
                purchaseOrder,
                receivedItem.line_item_id,
                userId,
                productUoms,
                lot.tag_identifier,
                queryRunner.manager,
              );
            }
          } else if (Number(receivedItem.quantity || 0) > 0) {
            await this.batchCreatorService.createBatchForReceivedItem(
              receivedItem,
              purchaseOrder,
              receivedItem.line_item_id,
              userId,
              productUoms,
              undefined,
              queryRunner.manager,
            );
          }
        }

        await this.applyReceivedTotals(
          queryRunner.manager.getRepository(PurchaseOrderBatch),
          id,
          tenantId,
          userId,
          dto,
        );

        await queryRunner.commitTransaction();
      } catch (txError) {
        await queryRunner.rollbackTransaction();
        throw txError;
      } finally {
        await queryRunner.release();
      }

      this.logger.log(
        `Recepción procesada para OC ${id} por usuario ${userId}`,
      );
      await this.realCostService.recalculateIfEnabled(tenantId, id);
      await this.recordReceivedStatus(id, tenantId, userId, dto.received_items.length);

      return this.loadReceivedPurchaseOrder(id);
    } catch (error) {
      const errorContext = {
        poId: id,
        tenantId,
        userId,
        errorType: error.constructor.name,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      };

      this.logger.error(
        `Error al procesar recepción. Context: ${JSON.stringify(errorContext)}`,
        error.stack,
      );

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Error al procesar la recepción: ${error.message}`,
      );
    }
  }

  private async finalizeReceivedStatus(
    id: string,
    tenantId: string,
    userId: string,
    dto: ReceivePurchaseOrderDto | null,
    purchaseOrder: PurchaseOrderBatch,
  ): Promise<void> {
    if (dto?.received_items?.length) {
      await this.receiptValidatorService.validateReceivedItems(dto.received_items);
      await this.assertMeasureUomsExist(dto.received_items, tenantId);
      await this.applyReceivedTotals(
        this.purchaseOrderRepository,
        id,
        tenantId,
        userId,
        dto,
      );
      return;
    }

    // Sin DTO: totales desde líneas ya recibidas
    const lines = purchaseOrder.line_items || [];
    let subtotal = 0;
    let iva = 0;
    let ieps = 0;
    for (const line of lines) {
      const qty = Number(line.received_original_quantity || 0);
      if (qty <= 0) continue;
      subtotal += qty * Number(line.received_original_unit_total || 0);
      iva += qty * Number(line.received_original_iva_unit || 0);
      ieps += qty * Number(line.received_original_ieps_unit || 0);
    }

    await this.purchaseOrderRepository.update(
      { id, tenant_id: tenantId },
      {
        general_status: 'Recibida',
        received_subtotal: this.roundMoney(subtotal),
        received_iva_total: this.roundMoney(iva),
        received_ieps_total: this.roundMoney(ieps),
        received_total: this.roundMoney(subtotal + iva + ieps),
        updated_by: userId,
      },
    );
  }

  private async applyReceivedTotals(
    repo: Repository<PurchaseOrderBatch>,
    id: string,
    tenantId: string,
    userId: string,
    dto: ReceivePurchaseOrderDto,
  ): Promise<void> {
    const receivedSubtotal = this.totalCalculatorService.calculateReceivedSubtotal(
      dto.received_items,
    );
    const receivedIvaTotal = this.totalCalculatorService.calculateReceivedIvaTotal(
      dto.received_items,
    );
    const receivedIepsTotal = this.totalCalculatorService.calculateReceivedIepsTotal(
      dto.received_items,
    );
    const receivedTotal = this.totalCalculatorService.calculateReceivedTotal(
      dto.received_items,
    );

    // update() evita problemas de TypeORM al hacer save() con relaciones cargadas
    await repo.update(
      { id, tenant_id: tenantId },
      {
        received_subtotal: receivedSubtotal,
        received_iva_total: receivedIvaTotal,
        received_ieps_total: receivedIepsTotal,
        received_total: receivedTotal,
        general_status: 'Recibida',
        updated_by: userId,
      },
    );
  }

  private async recordReceivedStatus(
    purchaseOrderId: string,
    tenantId: string,
    userId: string,
    receivedItems: number,
  ): Promise<void> {
    try {
      await this.activityService.record({
        tenantId,
        purchaseOrderId,
        type: PURCHASE_ORDER_MOVEMENT_TYPES.STATUS_CHANGED,
        actorId: userId,
        description: 'La orden pasó de Creada a Recibida.',
        changes: compactActivityChanges([
          activityChange('general_status', 'Estatus', 'Creada', 'Recibida'),
        ]),
        metadata: { received_items: receivedItems },
      });
    } catch (error) {
      this.logger.error('No se pudo guardar el movimiento de recepción', error);
    }
  }

  private async loadReceivedPurchaseOrder(id: string): Promise<PurchaseOrderBatch> {
    const updatedPO = await this.purchaseOrderRepository.findOne({
      where: { id },
      relations: [
        'line_items',
        'line_items.product_uom',
        'line_items.product_uom.uom',
        'line_items.received_uom',
      ],
    });

    if (!updatedPO) {
      throw new NotFoundException(
        `Orden de compra no encontrada después de la recepción: ${id}`,
      );
    }

    return updatedPO;
  }

  private async assertMeasureUomsExist(
    items: ReceivePurchaseOrderDto['received_items'],
    tenantId: string,
  ): Promise<void> {
    const ids = new Set<string>();
    for (const item of items) {
      if (item.measure_uom_id) {
        ids.add(item.measure_uom_id);
      }
      for (const lot of item.lots || []) {
        if (lot.measure_uom_id) {
          ids.add(lot.measure_uom_id);
        }
      }
    }
    if (ids.size === 0) {
      return;
    }

    const found = await this.uomCatalogRepository
      .createQueryBuilder('uom')
      .select('uom.id')
      .where('uom.tenant_id = :tenantId', { tenantId })
      .andWhere('uom.id IN (:...ids)', { ids: [...ids] })
      .getMany();

    if (found.length !== ids.size) {
      throw new BadRequestException(
        'Unidad de tamaño no encontrada en el catálogo. Elige Foot, PIES u otra unidad; no uses la de la orden de compra',
      );
    }
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
