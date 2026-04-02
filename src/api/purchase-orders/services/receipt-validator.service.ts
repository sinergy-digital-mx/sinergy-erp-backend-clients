import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';

@Injectable()
export class ReceiptValidatorService {
  constructor(
    @InjectRepository(PurchaseOrderBatchDetail)
    private readonly purchaseOrderDetailRepository: Repository<PurchaseOrderBatchDetail>,
  ) {}

  /**
   * Validate received items before processing receipt
   * @param items - Array of received items to validate
   * @throws BadRequestException if validation fails
   * @throws NotFoundException if line item not found
   */
  async validateReceivedItems(items: ReceivedItemDto[]): Promise<void> {
    // Validate each item first (before checking for at least one item)
    for (const item of items) {
      const quantity = Number(item.quantity);

      // Validation 2: All quantities are non-negative
      if (quantity < 0) {
        throw new BadRequestException(
          `Received quantity cannot be negative for line item ${item.line_item_id}`,
        );
      }

      // Validation 3: Quantities do not exceed 999,999.999
      if (quantity > 999999.999) {
        throw new BadRequestException(
          `Received quantity exceeds maximum limit (999,999.999) for line item ${item.line_item_id}`,
        );
      }

      // Validation 4: Line item exists in database
      const lineItem = await this.purchaseOrderDetailRepository.findOne({
        where: { id: item.line_item_id },
      });

      if (!lineItem) {
        throw new NotFoundException(`Line item not found: ${item.line_item_id}`);
      }
    }

    // Validation 1: At least one item with quantity > 0
    const hasAtLeastOneItem = items.some((item) => Number(item.quantity) > 0);
    if (!hasAtLeastOneItem) {
      throw new BadRequestException('At least one product must be received with quantity greater than zero');
    }
  }
}
