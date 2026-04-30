import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import {
  ReceiptLotMode,
  ReceivedItemDto,
} from '../dto/receive-purchase-order.dto';

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
      const quantity = Number(item.quantity || 0);
      const hasLots = Array.isArray(item.lots) && item.lots.length > 0;
      const lots = item.lots || [];
      const lotMode = item.lot_mode || (hasLots ? ReceiptLotMode.MULTIPLE : ReceiptLotMode.SINGLE);
      const lotsTotalQuantity = hasLots
        ? lots.reduce((acc, lot) => acc + Number(lot.quantity || 0), 0)
        : 0;
      const effectiveQuantity =
        lotMode === ReceiptLotMode.MULTIPLE ? lotsTotalQuantity : quantity;

      // Validation 2: All quantities are non-negative
      if (effectiveQuantity < 0) {
        throw new BadRequestException(
          `Received quantity cannot be negative for line item ${item.line_item_id}`,
        );
      }

      // Validation 3: Quantities do not exceed 999,999.999
      if (effectiveQuantity > 999999.999) {
        throw new BadRequestException(
          `Received quantity exceeds maximum limit (999,999.999) for line item ${item.line_item_id}`,
        );
      }

      if (lotMode === ReceiptLotMode.MULTIPLE && !hasLots) {
        throw new BadRequestException(
          `At least one lot is required in multiple lot mode for line item ${item.line_item_id}`,
        );
      }

      if (lotMode === ReceiptLotMode.MULTIPLE && hasLots) {
        for (const lot of lots) {
          if (!lot.tag_identifier?.trim()) {
            throw new BadRequestException(
              `Tag/identifier is required for each lot in line item ${item.line_item_id}`,
            );
          }

          if (Number(lot.quantity || 0) <= 0) {
            throw new BadRequestException(
              `Lot quantity must be greater than zero for line item ${item.line_item_id}`,
            );
          }

          if (lot.product_uom_id !== item.product_uom_id) {
            throw new BadRequestException(
              `Lot UOM must match line item UOM for line item ${item.line_item_id}`,
            );
          }
        }
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
    const hasAtLeastOneItem = items.some((item) => {
      const hasLots = Array.isArray(item.lots) && item.lots.length > 0;
      const lotMode =
        item.lot_mode || (hasLots ? ReceiptLotMode.MULTIPLE : ReceiptLotMode.SINGLE);
      if (lotMode === ReceiptLotMode.MULTIPLE) {
        return (item.lots || []).some((lot) => Number(lot.quantity || 0) > 0);
      }
      return Number(item.quantity || 0) > 0;
    });
    if (!hasAtLeastOneItem) {
      throw new BadRequestException('At least one product must be received with quantity greater than zero');
    }
  }
}
