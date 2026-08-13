import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';
import { BatchNumberGeneratorService } from './batch-number-generator.service';

/**
 * Service for creating inventory batch records for received items
 * Generates unique batch numbers and persists batch records to inv_s_batches table
 */
@Injectable()
export class BatchCreatorService {
  private readonly logger = new Logger(BatchCreatorService.name);

  constructor(
    @InjectRepository(InventoryBatch)
    private readonly inventoryBatchRepository: Repository<InventoryBatch>,
    private readonly batchNumberGeneratorService: BatchNumberGeneratorService,
  ) {}

  /**
   * Create an inventory batch record for a received item.
   * Si se pasa `manager`, persiste dentro de esa transacción.
   */
  async createBatchForReceivedItem(
    receivedItem: ReceivedItemDto,
    purchaseOrder: PurchaseOrderBatch,
    purchaseOrderDetailId: string,
    userId: string,
    productUoms?: any[],
    sourceTagIdentifier?: string,
    manager?: EntityManager,
  ): Promise<InventoryBatch> {
    try {
      const batchNumber = await this.batchNumberGeneratorService.generateBatchNumber(
        purchaseOrder.warehouse_id,
        purchaseOrder.tenant_id,
        manager,
      );

      const uoms = productUoms || [];
      const baseUom = uoms.find((u) => u.is_base);
      if (!baseUom) {
        throw new BadRequestException(
          `Unidad de medida base no encontrada para el producto: ${receivedItem.product_id}`,
        );
      }

      const productUom = uoms.find((u) => u.id === receivedItem.product_uom_id);
      if (!productUom) {
        throw new BadRequestException(
          `Unidad de medida no soportada para este producto`,
        );
      }

      const factor = productUom.factor || 1;
      const convertedQuantity = productUom.is_base
        ? receivedItem.quantity
        : receivedItem.quantity * factor;

      const repo = manager
        ? manager.getRepository(InventoryBatch)
        : this.inventoryBatchRepository;

      const batch = repo.create({
        tenant_id: purchaseOrder.tenant_id,
        batch_number: batchNumber,
        source_tag_identifier: sourceTagIdentifier || null,
        warehouse_id: purchaseOrder.warehouse_id,
        product_id: receivedItem.product_id,
        uom_id: baseUom.uom_catalog_id,
        initial_quantity: convertedQuantity,
        available_quantity: convertedQuantity,
        purchase_order_batch_id: purchaseOrder.id,
        purchase_order_detail_id: purchaseOrderDetailId,
        created_by: userId,
        created_at: new Date(),
      });

      const savedBatch = await repo.save(batch);

      this.logger.log(
        `Batch created: ${batchNumber} for product ${receivedItem.product_id}`,
      );

      return savedBatch;
    } catch (error) {
      this.logger.error(
        `Error creating batch for line item ${purchaseOrderDetailId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
