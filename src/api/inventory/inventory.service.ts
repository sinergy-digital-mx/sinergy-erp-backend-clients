import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { BatchFilterDto } from './dto/batch-filter.dto';
import { BatchListResponseDto } from './dto/batch-list-response.dto';
import { BatchResponseDto } from './dto/batch-response.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryBatch)
    private inventoryBatchRepo: Repository<InventoryBatch>,
  ) {}

  /**
   * Find all batches with filtering and pagination
   * @param tenantId - Tenant ID for isolation
   * @param filters - Filter and pagination options
   * @returns Paginated list of batches
   */
  async findAll(
    tenantId: string,
    filters: BatchFilterDto,
  ): Promise<BatchListResponseDto> {
    try {
      this.logger.debug(
        `Finding all batches for tenant: ${tenantId}, filters: ${JSON.stringify(filters)}`,
      );

      const query = this.inventoryBatchRepo
        .createQueryBuilder('batch')
        .where('batch.tenant_id = :tenantId', { tenantId })
        .leftJoinAndSelect('batch.product', 'product')
        .leftJoinAndSelect('batch.warehouse', 'warehouse')
        .leftJoinAndSelect('batch.uom', 'uom')
        .leftJoinAndSelect('batch.purchase_order_batch', 'purchase_order_batch');

      // Apply filters
      if (filters.batch_number) {
        query.andWhere('batch.batch_number ILIKE :batch_number', {
          batch_number: `%${filters.batch_number}%`,
        });
      }

      if (filters.product_id) {
        query.andWhere('batch.product_id = :product_id', {
          product_id: filters.product_id,
        });
      }

      if (filters.warehouse_id) {
        query.andWhere('batch.warehouse_id = :warehouse_id', {
          warehouse_id: filters.warehouse_id,
        });
      }

      if (filters.purchase_order_batch_id) {
        query.andWhere('batch.purchase_order_batch_id = :purchase_order_batch_id', {
          purchase_order_batch_id: filters.purchase_order_batch_id,
        });
      }

      if (filters.purchase_order_id) {
        query.andWhere('batch.purchase_order_batch_id = :purchase_order_id', {
          purchase_order_id: filters.purchase_order_id,
        });
      }

      if (filters.created_from) {
        query.andWhere('batch.created_at >= :created_from', {
          created_from: new Date(filters.created_from),
        });
      }

      if (filters.created_to) {
        query.andWhere('batch.created_at <= :created_to', {
          created_to: new Date(filters.created_to),
        });
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'DESC';
      query.orderBy(`batch.${sortBy}`, sortOrder as 'ASC' | 'DESC');

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      query.skip(skip).take(limit);

      const [data, total] = await query.getManyAndCount();

      // Map to response DTOs
      const batchDtos = data.map(batch => this.mapToResponseDto(batch));

      const totalPages = Math.ceil(total / limit);

      this.logger.log(
        `Successfully retrieved ${data.length} batches out of ${total} total for tenant: ${tenantId}`,
      );

      return {
        data: batchDtos,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Error finding all batches for tenant ${tenantId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find a single batch by ID with all relations loaded
   * @param id - Batch ID
   * @param tenantId - Tenant ID for isolation
   * @returns Batch response DTO
   * @throws NotFoundException if batch not found
   */
  async findById(id: string, tenantId: string): Promise<BatchResponseDto> {
    try {
      this.logger.debug(`Finding batch by ID: ${id} for tenant: ${tenantId}`);

      const batch = await this.inventoryBatchRepo
        .createQueryBuilder('batch')
        .where('batch.id = :id AND batch.tenant_id = :tenantId', { id, tenantId })
        .leftJoinAndSelect('batch.product', 'product')
        .leftJoinAndSelect('batch.warehouse', 'warehouse')
        .leftJoinAndSelect('batch.uom', 'uom')
        .leftJoinAndSelect('batch.purchase_order_batch', 'purchase_order_batch')
        .getOne();

      if (!batch) {
        this.logger.warn(`Batch not found: ${id} for tenant: ${tenantId}`);
        throw new NotFoundException(`Batch not found: ${id}`);
      }

      this.logger.log(`Successfully retrieved batch: ${id}`);
      return this.mapToResponseDto(batch);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error finding batch ${id} for tenant ${tenantId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all batches for a specific purchase order with pagination
   * @param poId - Purchase order ID
   * @param tenantId - Tenant ID for isolation
   * @param filters - Filter and pagination options
   * @returns Paginated list of batches for the purchase order
   */
  async findByPurchaseOrderId(
    poId: string,
    tenantId: string,
    filters: BatchFilterDto,
  ): Promise<BatchListResponseDto> {
    try {
      this.logger.debug(
        `Finding batches for purchase order: ${poId}, tenant: ${tenantId}, filters: ${JSON.stringify(filters)}`,
      );

      const query = this.inventoryBatchRepo
        .createQueryBuilder('batch')
        .where('batch.tenant_id = :tenantId', { tenantId })
        .andWhere('batch.purchase_order_batch_id = :poId', { poId })
        .leftJoinAndSelect('batch.product', 'product')
        .leftJoinAndSelect('batch.warehouse', 'warehouse')
        .leftJoinAndSelect('batch.uom', 'uom')
        .leftJoinAndSelect('batch.purchase_order_batch', 'purchase_order_batch');

      // Apply filters
      if (filters.batch_number) {
        query.andWhere('batch.batch_number ILIKE :batch_number', {
          batch_number: `%${filters.batch_number}%`,
        });
      }

      if (filters.product_id) {
        query.andWhere('batch.product_id = :product_id', {
          product_id: filters.product_id,
        });
      }

      if (filters.warehouse_id) {
        query.andWhere('batch.warehouse_id = :warehouse_id', {
          warehouse_id: filters.warehouse_id,
        });
      }

      if (filters.created_from) {
        query.andWhere('batch.created_at >= :created_from', {
          created_from: new Date(filters.created_from),
        });
      }

      if (filters.created_to) {
        query.andWhere('batch.created_at <= :created_to', {
          created_to: new Date(filters.created_to),
        });
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'DESC';
      query.orderBy(`batch.${sortBy}`, sortOrder as 'ASC' | 'DESC');

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      query.skip(skip).take(limit);

      const [data, total] = await query.getManyAndCount();

      // Map to response DTOs
      const batchDtos = data.map(batch => this.mapToResponseDto(batch));

      const totalPages = Math.ceil(total / limit);

      this.logger.log(
        `Successfully retrieved ${data.length} batches out of ${total} total for purchase order: ${poId}`,
      );

      return {
        data: batchDtos,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Error finding batches for purchase order ${poId}, tenant ${tenantId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate the total quantity from a list of batches
   * @param batches - Array of batch response DTOs
   * @returns Total quantity as a number
   */
  calculateTotalQuantity(batches: BatchResponseDto[]): number {
    try {
      if (!batches || batches.length === 0) {
        this.logger.debug('No batches provided for quantity calculation');
        return 0;
      }

      const totalQuantity = batches.reduce((sum, batch) => {
        const quantity = parseFloat(batch.quantity) || 0;
        return sum + quantity;
      }, 0);

      this.logger.debug(
        `Calculated total quantity: ${totalQuantity} from ${batches.length} batches`,
      );

      return totalQuantity;
    } catch (error) {
      this.logger.error(
        `Error calculating total quantity: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Map InventoryBatch entity to BatchResponseDto
   */
  private mapToResponseDto(batch: InventoryBatch): BatchResponseDto {
    return {
      id: batch.id,
      batch_number: batch.batch_number,
      warehouse_id: batch.warehouse_id,
      warehouse_name: batch.warehouse?.name,
      product_id: batch.product_id,
      product_name: batch.product?.name,
      product_sku: batch.product?.sku,
      uom_id: batch.uom_id,
      uom_name: batch.uom?.name,
      quantity: batch.quantity.toString(),
      purchase_order_batch_id: batch.purchase_order_batch_id,
      purchase_order_id: batch.purchase_order_batch_id, // purchase_order_id is the same as purchase_order_batch_id
      purchase_order_detail_id: batch.purchase_order_detail_id,
      created_by: batch.created_by,
      created_at: batch.created_at,
    };
  }
}
