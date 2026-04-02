import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { ReceivePurchaseOrderDto } from '../dto/receive-purchase-order.dto';
import { ReceiptValidatorService } from './receipt-validator.service';
import { LineItemUpdaterService } from './line-item-updater.service';
import { BatchCreatorService } from './batch-creator.service';
import { TotalCalculatorService } from './total-calculator.service';
import { POStatusUpdaterService } from './po-status-updater.service';
import { TenantValidatorService } from './tenant-validator.service';
import { UnitConversionService } from './unit-conversion.service';

/**
 * Main orchestrator service for the purchase order receipt process
 * Coordinates all specialized services within a database transaction
 * Ensures atomicity: all operations succeed together or all fail together
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4
 */
@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PurchaseOrderBatch)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderBatch>,
    private readonly receiptValidatorService: ReceiptValidatorService,
    private readonly lineItemUpdaterService: LineItemUpdaterService,
    private readonly batchCreatorService: BatchCreatorService,
    private readonly totalCalculatorService: TotalCalculatorService,
    private readonly poStatusUpdaterService: POStatusUpdaterService,
    private readonly tenantValidatorService: TenantValidatorService,
    private readonly unitConversionService: UnitConversionService,
  ) {}

  /**
   * Main method that orchestrates the entire receipt process
   * Starts a database transaction and coordinates all services
   * On success: commits transaction and returns updated purchase order
   * On error: rolls back transaction and throws exception
   *
   * @param id - The purchase order ID
   * @param dto - The receipt data (received items)
   * @param tenantId - The tenant ID for isolation
   * @param userId - The user ID performing the receipt
   * @returns The updated purchase order with all received data
   * @throws NotFoundException if PO not found or doesn't belong to tenant
   * @throws BadRequestException if validation fails
   * @throws Error if any service operation fails (transaction will be rolled back)
   *
   * Validates: Requirements 10.1, 10.2, 10.3, 10.4
   */
  async receive(
    id: string,
    dto: ReceivePurchaseOrderDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrderBatch> {
    // Start database transaction (Requirement 8.1)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate tenant isolation (Requirement 11.1, 11.2)
      // Catch NotFoundException for missing purchase order and re-throw with context (Requirement 10.2)
      try {
        await this.tenantValidatorService.validatePOBelongsToTenant(id, tenantId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          this.logger.warn(
            `Purchase order not found or does not belong to tenant. PO ID: ${id}, Tenant ID: ${tenantId}, User ID: ${userId}`,
          );
          throw error;
        }
        throw error;
      }

      // Fetch the purchase order within the transaction
      const purchaseOrder = await queryRunner.manager.findOne(PurchaseOrderBatch, {
        where: { id, tenant_id: tenantId },
        relations: ['line_items'],
      });

      if (!purchaseOrder) {
        const errorMsg = `Purchase order not found: ${id}`;
        this.logger.error(
          `${errorMsg}. Tenant ID: ${tenantId}, User ID: ${userId}`,
        );
        throw new NotFoundException(errorMsg);
      }

      // Validate input (Requirement 8.2 - part of transaction)
      // Catch BadRequestException for validation errors and re-throw with context (Requirement 10.3)
      try {
        await this.receiptValidatorService.validateReceivedItems(dto.received_items);
      } catch (error) {
        if (error instanceof BadRequestException) {
          this.logger.warn(
            `Validation failed for receipt. PO ID: ${id}, Tenant ID: ${tenantId}, User ID: ${userId}, Error: ${error.message}`,
          );
          throw error;
        }
        if (error instanceof NotFoundException) {
          // Catch NotFoundException for missing line items and re-throw with context (Requirement 10.1)
          this.logger.warn(
            `Line item not found during validation. PO ID: ${id}, Tenant ID: ${tenantId}, User ID: ${userId}, Error: ${error.message}`,
          );
          throw error;
        }
        throw error;
      }

      // Update line items with received data (Requirement 8.2)
      for (const receivedItem of dto.received_items) {
        // Only update items with quantity > 0
        if (receivedItem.quantity > 0) {
          try {
            // Get base unit and convert quantity
            const baseUomId = await this.unitConversionService.getBaseUom(
              receivedItem.product_id,
            );
            const convertedQuantity = await this.unitConversionService.convertToBaseUnit(
              receivedItem.quantity,
              receivedItem.uom_id,
              receivedItem.product_id,
            );

            // Update line item with received data using TypeORM
            await queryRunner.manager.update(
              'inv_s_purchase_order_batch_detail',
              { id: receivedItem.line_item_id },
              {
                received_original_product_id: receivedItem.product_id,
                received_original_uom_id: receivedItem.uom_id,
                received_original_quantity: receivedItem.quantity,
                received_original_unit_total: receivedItem.unit_total,
                received_original_iva_percentage: receivedItem.iva_percentage,
                received_original_iva_unit: receivedItem.iva_unit,
                received_original_ieps_percentage: receivedItem.ieps_percentage,
                received_original_ieps_unit: receivedItem.ieps_unit,
                received_converted_quantity: convertedQuantity,
                received_converted_uom_id: baseUomId,
                updated_by: userId,
                updated_at: new Date(),
              },
            );
          } catch (error) {
            if (error instanceof BadRequestException) {
              this.logger.error(
                `Unit conversion error for line item ${receivedItem.line_item_id}. PO ID: ${id}, Tenant ID: ${tenantId}, User ID: ${userId}, Error: ${error.message}`,
              );
              throw error;
            }
            throw error;
          }
        }
      }

      // Create inventory batches for each received item (Requirement 8.2)
      for (const receivedItem of dto.received_items) {
        if (receivedItem.quantity > 0) {
          try {
            await this.batchCreatorService.createBatchForReceivedItem(
              receivedItem,
              purchaseOrder,
              receivedItem.line_item_id,
              userId,
            );
          } catch (error) {
            if (error instanceof BadRequestException) {
              this.logger.error(
                `Batch creation error for line item ${receivedItem.line_item_id}. PO ID: ${id}, Tenant ID: ${tenantId}, User ID: ${userId}, Error: ${error.message}`,
              );
              throw error;
            }
            throw error;
          }
        }
      }

      // Calculate received totals (Requirement 8.2)
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

      // Update PO with received totals
      purchaseOrder.received_subtotal = receivedSubtotal;
      purchaseOrder.received_iva_total = receivedIvaTotal;
      purchaseOrder.received_ieps_total = receivedIepsTotal;
      purchaseOrder.received_total = receivedTotal;

      // Update PO status to "Recibida" (Requirement 8.2)
      purchaseOrder.general_status = 'Recibida';
      purchaseOrder.updated_by = userId;
      purchaseOrder.updated_at = new Date();

      // Save the updated purchase order
      await queryRunner.manager.save(purchaseOrder);

      // Commit transaction on success (Requirement 8.4)
      await queryRunner.commitTransaction();

      this.logger.log(
        `Receipt processed successfully for PO ${id} by user ${userId} in tenant ${tenantId}`,
      );

      // Fetch and return the updated purchase order with all relations (Requirement 9.1, 9.2, 9.3, 9.4)
      const updatedPO = await this.purchaseOrderRepository.findOne({
        where: { id },
        relations: ['line_items'],
      });

      if (!updatedPO) {
        const errorMsg = `Purchase order not found after receipt: ${id}`;
        this.logger.error(
          `${errorMsg}. Tenant ID: ${tenantId}, User ID: ${userId}`,
        );
        throw new NotFoundException(errorMsg);
      }

      return updatedPO;
    } catch (error) {
      // Rollback transaction on any error (Requirement 8.3)
      await queryRunner.rollbackTransaction();

      // Log all errors with context (Requirement 10.4)
      // Include user ID, PO ID, tenant ID, and error details
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

      // Re-throw the error with context (Requirement 10.1, 10.2, 10.3)
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Catch database errors and provide appropriate error message (Requirement 10.2)
      throw new BadRequestException(
        `Error processing receipt: ${error.message}`,
      );
    } finally {
      // Release the database connection (Requirement 8.5)
      await queryRunner.release();
    }
  }
}
