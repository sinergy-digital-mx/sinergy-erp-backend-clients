import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';
import { BatchNumberGeneratorService } from './batch-number-generator.service';
import { UnitConversionService } from './unit-conversion.service';

/**
 * Service for creating inventory batch records for received items
 * Generates unique batch numbers and persists batch records to inv_s_batches table
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 11.3
 */
@Injectable()
export class BatchCreatorService {
  constructor(
    @InjectRepository(InventoryBatch)
    private readonly inventoryBatchRepository: Repository<InventoryBatch>,
    private readonly batchNumberGeneratorService: BatchNumberGeneratorService,
    private readonly unitConversionService: UnitConversionService,
  ) {}

  /**
   * Create an inventory batch record for a received item
   * Sets all required fields including batch number, warehouse, product, quantity, and references
   * Persists to inv_s_batches table
   *
   * @param receivedItem - The received item data
   * @param purchaseOrder - The purchase order batch
   * @param purchaseOrderDetailId - The purchase order detail (line item) ID
   * @param userId - The user ID performing the creation
   * @returns The created InventoryBatch record
   * @throws BadRequestException if batch number generation fails
   * @throws BadRequestException if unit conversion fails
   */
  async createBatchForReceivedItem(
    receivedItem: ReceivedItemDto,
    purchaseOrder: PurchaseOrderBatch,
    purchaseOrderDetailId: string,
    userId: string,
  ): Promise<InventoryBatch> {
    // Generate unique batch number (Requirement 3.2, 3.4, 3.5)
    const batchNumber = await this.batchNumberGeneratorService.generateBatchNumber(
      purchaseOrder.warehouse_id,
      purchaseOrder.tenant_id,
    );

    // Get base unit and convert quantity (Requirement 3.8, 3.9)
    const baseUomId = await this.unitConversionService.getBaseUom(
      receivedItem.product_id,
    );
    const convertedQuantity = await this.unitConversionService.convertToBaseUnit(
      receivedItem.quantity,
      receivedItem.uom_id,
      receivedItem.product_id,
    );

    // Create inventory batch record (Requirement 3.1, 3.3, 3.6, 3.7, 3.10, 3.11, 3.12, 3.13, 11.3)
    const batch = this.inventoryBatchRepository.create({
      tenant_id: purchaseOrder.tenant_id,
      batch_number: batchNumber,
      warehouse_id: purchaseOrder.warehouse_id,
      product_id: receivedItem.product_id,
      uom_id: baseUomId,
      quantity: convertedQuantity,
      purchase_order_batch_id: purchaseOrder.id,
      purchase_order_detail_id: purchaseOrderDetailId,
      created_by: userId,
      created_at: new Date(),
    });

    // Persist to database
    return await this.inventoryBatchRepository.save(batch);
  }
}
