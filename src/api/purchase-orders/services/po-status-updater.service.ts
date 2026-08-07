import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';

/**
 * Service for updating purchase order status and audit fields
 * Updates general_status to "Recibida" and sets audit fields
 * Validates: Requirements 4.1, 4.2, 4.3
 */
@Injectable()
export class POStatusUpdaterService {
  constructor(
    @InjectRepository(PurchaseOrderBatch)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderBatch>,
  ) {}

  /**
   * Update purchase order status to "Recibida"
   * Sets updated_by to current user ID and updated_at to current timestamp
   * Persists changes to inv_s_purchase_order_batch table
   *
   * @param purchaseOrderId - The purchase order ID to update
   * @param userId - The user ID performing the update
   * @throws NotFoundException if purchase order not found
   */
  async updatePOStatusToRecibida(
    purchaseOrderId: string,
    userId: string,
  ): Promise<void> {
    // Find the purchase order
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id: purchaseOrderId },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Orden de compra no encontrada: ${purchaseOrderId}`);
    }

    // Update general_status to "Recibida" (Requirement 4.1)
    purchaseOrder.general_status = 'Recibida';

    // Update audit fields (Requirement 4.2, 4.3)
    purchaseOrder.updated_by = userId;
    purchaseOrder.updated_at = new Date();

    // Persist changes to database
    await this.purchaseOrderRepository.save(purchaseOrder);
  }
}
