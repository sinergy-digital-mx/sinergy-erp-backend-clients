import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';

/**
 * Service for validating tenant isolation in receipt operations
 * Ensures purchase orders and batch numbers are scoped to the correct tenant
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4
 */
@Injectable()
export class TenantValidatorService {
  constructor(
    @InjectRepository(PurchaseOrderBatch)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderBatch>,
    @InjectRepository(InventoryBatch)
    private readonly inventoryBatchRepository: Repository<InventoryBatch>,
  ) {}

  /**
   * Verify that a purchase order belongs to the specified tenant
   * Returns NotFoundException if PO doesn't exist or belongs to different tenant
   *
   * @param purchaseOrderId - The purchase order ID to validate
   * @param tenantId - The tenant ID to verify ownership
   * @throws NotFoundException if PO not found or belongs to different tenant
   * Validates: Requirements 11.1, 11.2
   */
  async validatePOBelongsToTenant(
    purchaseOrderId: string,
    tenantId: string,
  ): Promise<void> {
    // Query with both id and tenant_id to ensure tenant isolation (Requirement 11.1, 11.2)
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: {
        id: purchaseOrderId,
        tenant_id: tenantId,
      },
    });

    if (!purchaseOrder) {
      // Return NotFoundException for both missing PO and cross-tenant access (Requirement 11.2)
      throw new NotFoundException(`Purchase order not found: ${purchaseOrderId}`);
    }
  }

  /**
   * Verify that a batch number is unique within the specified tenant
   * Returns BadRequestException if batch number already exists for this tenant
   *
   * @param batchNumber - The batch number to verify
   * @param tenantId - The tenant ID to scope uniqueness check
   * @throws BadRequestException if batch number already exists for this tenant
   * Validates: Requirements 11.4
   */
  async verifyBatchNumberUniquenessWithinTenant(
    batchNumber: string,
    tenantId: string,
  ): Promise<void> {
    // Query with both batch_number and tenant_id to ensure uniqueness within tenant (Requirement 11.4)
    const existingBatch = await this.inventoryBatchRepository.findOne({
      where: {
        batch_number: batchNumber,
        tenant_id: tenantId,
      },
    });

    if (existingBatch) {
      throw new BadRequestException(
        `Batch number ${batchNumber} already exists`,
      );
    }
  }
}
