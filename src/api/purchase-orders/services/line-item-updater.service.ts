import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';

/**
 * Service for updating line items with received data
 * Stores received original data, converted data, and audit fields
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12
 */
@Injectable()
export class LineItemUpdaterService {
  constructor(
    @InjectRepository(PurchaseOrderBatchDetail)
    private readonly lineItemRepository: Repository<PurchaseOrderBatchDetail>,
  ) {}

  /**
   * Update a line item with received data
   * Stores all received_original_* fields from the received item
   * Stores received_converted_* fields (quantity in base unit, base uom_id)
   * Updates audit fields (updated_by, updated_at)
   * Persists changes to inv_s_purchase_order_batch_detail table
   *
   * @param lineItemId - The line item ID to update
   * @param receivedItem - The received item data
   * @param convertedQuantity - The quantity converted to base unit
   * @param baseUomId - The base unit of measurement ID
   * @param userId - The user ID performing the update
   * @throws NotFoundException if line item not found
   */
  async updateLineItemWithReceivedData(
    lineItemId: string,
    receivedItem: ReceivedItemDto,
    convertedQuantity: number,
    baseUomId: string,
    userId: string,
  ): Promise<void> {
    // Find the line item
    const lineItem = await this.lineItemRepository.findOne({
      where: { id: lineItemId },
    });

    if (!lineItem) {
      throw new NotFoundException(`Línea no encontrada: ${lineItemId}`);
    }

    // Update received original fields (Requirement 7.1-7.8)
    lineItem.received_original_product_id = receivedItem.product_id;
    lineItem.received_original_uom_id = receivedItem.product_uom_id;
    lineItem.received_original_quantity = receivedItem.quantity;
    lineItem.received_original_unit_total = receivedItem.unit_total;
    lineItem.received_original_iva_percentage = receivedItem.iva_percentage;
    lineItem.received_original_iva_unit = receivedItem.iva_unit;
    lineItem.received_original_ieps_percentage = receivedItem.ieps_percentage;
    lineItem.received_original_ieps_unit = receivedItem.ieps_unit;

    // Update received converted fields (Requirement 7.9-7.10)
    lineItem.received_converted_quantity = convertedQuantity;
    lineItem.received_converted_uom_id = baseUomId;

    // Update audit fields (Requirement 7.11-7.12)
    lineItem.updated_by = userId;
    lineItem.updated_at = new Date();

    // Persist changes to database
    await this.lineItemRepository.save(lineItem);
  }
}
