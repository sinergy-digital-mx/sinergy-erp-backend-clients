import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';

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
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  /**
   * Create an inventory batch record for a received item
   * Sets all required fields including batch number, warehouse, product, quantity, and references
   * Persists to inv_s_batches table
   */
  async createBatchForReceivedItem(
    receivedItem: ReceivedItemDto,
    purchaseOrder: PurchaseOrderBatch,
    purchaseOrderDetailId: string,
    userId: string,
    productUoms?: any[],
    sourceTagIdentifier?: string,
  ): Promise<InventoryBatch> {
    try {
      // 1. Get warehouse prefix
      const warehouse = await this.warehouseRepository.findOne({
        where: { id: purchaseOrder.warehouse_id },
      });

      if (!warehouse) {
        throw new BadRequestException(
          `Warehouse not found: ${purchaseOrder.warehouse_id}`,
        );
      }

      if (!warehouse.prefix) {
        throw new BadRequestException(
          `Warehouse ${purchaseOrder.warehouse_id} does not have a prefix configured`,
        );
      }

      // 2. Get next sequential number
      const lastBatch = await this.inventoryBatchRepository
        .createQueryBuilder('batch')
        .where('batch.warehouse_id = :warehouseId', {
          warehouseId: purchaseOrder.warehouse_id,
        })
        .andWhere('batch.tenant_id = :tenantId', {
          tenantId: purchaseOrder.tenant_id,
        })
        .orderBy('batch.created_at', 'DESC')
        .take(1)
        .getOne();

      let sequenceNumber = 1;
      if (lastBatch && lastBatch.batch_number) {
        const match = lastBatch.batch_number.match(/-LOTE-(\d+)$/);
        if (match) {
          sequenceNumber = parseInt(match[1], 10) + 1;
        }
      }

      // 3. Generate batch number
      const paddedNumber = String(sequenceNumber).padStart(6, '0');
      const batchNumber = `${warehouse.prefix}-LOTE-${paddedNumber}`;

      // 4. Find base UOM
      const uoms = productUoms || [];
      const baseUom = uoms.find(u => u.is_base);
      if (!baseUom) {
        throw new BadRequestException(
          `Base unit of measurement not found for product: ${receivedItem.product_id}`,
        );
      }

      // 5. Find the product UOM
      const productUom = uoms.find(u => u.id === receivedItem.product_uom_id);
      if (!productUom) {
        throw new BadRequestException(
          `Unit of measurement not supported for this product`,
        );
      }

      // 6. Calculate converted quantity
      const factor = productUom.factor || 1;
      const convertedQuantity = productUom.is_base
        ? receivedItem.quantity
        : receivedItem.quantity * factor;

      // 7. Create and save batch
      const batch = this.inventoryBatchRepository.create({
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

      const savedBatch = await this.inventoryBatchRepository.save(batch);
      
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
