import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { ReceivePurchaseOrderDto } from '../dto/receive-purchase-order.dto';
import { ReceiptValidatorService } from './receipt-validator.service';
import { BatchCreatorService } from './batch-creator.service';
import { TotalCalculatorService } from './total-calculator.service';
import { TenantValidatorService } from './tenant-validator.service';

/**
 * Main orchestrator service for the purchase order receipt process
 * Simplified implementation without complex transactions to avoid deadlocks
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
    private readonly receiptValidatorService: ReceiptValidatorService,
    private readonly batchCreatorService: BatchCreatorService,
    private readonly totalCalculatorService: TotalCalculatorService,
    private readonly tenantValidatorService: TenantValidatorService,
  ) {}

  /**
   * Main method that orchestrates the entire receipt process
   * Simplified approach: validate, update line items, create batches, update PO
   *
   * @param id - The purchase order ID
   * @param dto - The receipt data (received items)
   * @param tenantId - The tenant ID for isolation
   * @param userId - The user ID performing the receipt
   * @returns The updated purchase order with all received data
   */
  async receive(
    id: string,
    dto: ReceivePurchaseOrderDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrderBatch> {
    try {
      // 1. Validate tenant isolation
      await this.tenantValidatorService.validatePOBelongsToTenant(id, tenantId);

      // 2. Fetch the purchase order
      const purchaseOrder = await this.purchaseOrderRepository.findOne({
        where: { id, tenant_id: tenantId },
        relations: ['line_items'],
      });

      if (!purchaseOrder) {
        throw new NotFoundException(`Purchase order not found: ${id}`);
      }

      // 3. Validate input
      await this.receiptValidatorService.validateReceivedItems(dto.received_items);

      // 4. Pre-load all product UOMs
      const productIds = [...new Set(dto.received_items.map(item => item.product_id))];
      const productUomsMap = new Map();
      
      for (const productId of productIds) {
        const productUoms = await this.lineItemRepository.query(
          `SELECT * FROM product_uoms WHERE product_id = ?`,
          [productId],
        );
        productUomsMap.set(productId, productUoms);
      }

      // 5. Update line items one by one (simple, no transaction)
      for (const receivedItem of dto.received_items) {
        if (receivedItem.quantity > 0) {
          const productUoms = productUomsMap.get(receivedItem.product_id) || [];
          
          const productUom = productUoms.find(p => p.id === receivedItem.product_uom_id);
          if (!productUom) {
            throw new BadRequestException(
              `Unit of measurement not supported for this product`,
            );
          }

          const baseUom = productUoms.find(p => p.is_base);
          if (!baseUom) {
            throw new BadRequestException(
              `Base unit of measurement not found for product: ${receivedItem.product_id}`,
            );
          }

          const factor = productUom.factor || 1;
          const convertedQuantity = productUom.is_base 
            ? receivedItem.quantity 
            : receivedItem.quantity * factor;

          // Update line item
          await this.lineItemRepository.update(
            { id: receivedItem.line_item_id },
            {
              received_original_product_id: receivedItem.product_id,
              received_original_uom_id: productUom.uom_catalog_id,
              product_uom_id: productUom.id,
              received_original_quantity: receivedItem.quantity,
              received_original_unit_total: receivedItem.unit_total,
              received_original_iva_percentage: receivedItem.iva_percentage,
              received_original_iva_unit: receivedItem.iva_unit,
              received_original_ieps_percentage: receivedItem.ieps_percentage,
              received_original_ieps_unit: receivedItem.ieps_unit,
              received_converted_quantity: convertedQuantity,
              received_converted_uom_id: baseUom.uom_catalog_id,
              updated_by: userId,
              updated_at: new Date(),
            },
          );
        }
      }

      // 6. Create inventory batches
      for (const receivedItem of dto.received_items) {
        if (receivedItem.quantity > 0) {
          try {
            const productUoms = productUomsMap.get(receivedItem.product_id) || [];
            await this.batchCreatorService.createBatchForReceivedItem(
              receivedItem,
              purchaseOrder,
              receivedItem.line_item_id,
              userId,
              productUoms,
            );
            this.logger.log(
              `Batch created successfully for line item ${receivedItem.line_item_id}`,
            );
          } catch (batchError) {
            this.logger.error(
              `Failed to create batch for line item ${receivedItem.line_item_id}: ${batchError.message}`,
              batchError.stack,
            );
            throw batchError;
          }
        }
      }

      // 7. Calculate totals
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

      // 8. Update PO
      purchaseOrder.received_subtotal = receivedSubtotal;
      purchaseOrder.received_iva_total = receivedIvaTotal;
      purchaseOrder.received_ieps_total = receivedIepsTotal;
      purchaseOrder.received_total = receivedTotal;
      purchaseOrder.general_status = 'Recibida';
      purchaseOrder.updated_by = userId;
      purchaseOrder.updated_at = new Date();

      await this.purchaseOrderRepository.save(purchaseOrder);

      this.logger.log(
        `Receipt processed successfully for PO ${id} by user ${userId} in tenant ${tenantId}`,
      );

      // 9. Return updated PO with relations
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
        throw new NotFoundException(`Purchase order not found after receipt: ${id}`);
      }

      return updatedPO;
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
        `Error processing receipt. Context: ${JSON.stringify(errorContext)}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Error processing receipt: ${error.message}`,
      );
    }
  }
}
