import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { QueryInventoryBatchDto } from '../dto/query-inventory-batch.dto';
import { S3Service } from '../../../common/services/s3.service';

/**
 * Service for querying and listing inventory batches
 * Provides filtering, pagination, and sorting capabilities
 */
@Injectable()
export class InventoryBatchService {
  constructor(
    @InjectRepository(InventoryBatch)
    private readonly inventoryBatchRepository: Repository<InventoryBatch>,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Query inventory batches with filters and pagination
   * @param tenantId - Tenant ID for multi-tenancy isolation
   * @param query - Query parameters with filters, pagination, and sorting
   * @returns Paginated list of inventory batches with metadata
   */
  async queryBatches(tenantId: string, query: QueryInventoryBatchDto) {
    const {
      batch_number,
      product_id,
      warehouse_id,
      purchase_order_batch_id,
      created_from,
      created_to,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = query;

    let qb: SelectQueryBuilder<InventoryBatch> = this.inventoryBatchRepository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('batch.warehouse', 'warehouse')
      .leftJoinAndSelect('batch.uom', 'uom')
      .leftJoinAndSelect('batch.purchase_order', 'purchase_order')
      .where('batch.tenant_id = :tenantId', { tenantId });

    // Apply filters
    if (batch_number) {
      qb = qb.andWhere('batch.batch_number ILIKE :batch_number', {
        batch_number: `%${batch_number}%`,
      });
    }

    if (product_id) {
      qb = qb.andWhere('batch.product_id = :product_id', { product_id });
    }

    if (warehouse_id) {
      qb = qb.andWhere('batch.warehouse_id = :warehouse_id', { warehouse_id });
    }

    if (purchase_order_batch_id) {
      qb = qb.andWhere('batch.purchase_order_batch_id = :purchase_order_batch_id', {
        purchase_order_batch_id,
      });
    }

    if (created_from) {
      qb = qb.andWhere('batch.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }

    if (created_to) {
      qb = qb.andWhere('batch.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    // Apply sorting
    const sortColumn = `batch.${sort_by}`;
    qb = qb.orderBy(sortColumn, sort_order);

    // Apply pagination
    const skip = (page - 1) * limit;
    qb = qb.skip(skip).take(limit);

    // Get results and total count
    const [data, total] = await qb.getManyAndCount();
    const dataWithPhotoUrls = await Promise.all(
      data.map((batch) => this.toResponseWithPhotoUrl(batch)),
    );

    return {
      data: dataWithPhotoUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get batch statistics for a warehouse
   * @param tenantId - Tenant ID
   * @param warehouseId - Warehouse ID
   * @returns Statistics about batches in the warehouse
   */
  async getWarehouseStats(tenantId: string, warehouseId: string) {
    const stats = await this.inventoryBatchRepository
      .createQueryBuilder('batch')
      .select('COUNT(DISTINCT batch.id)', 'total_batches')
      .addSelect('COUNT(DISTINCT batch.product_id)', 'unique_products')
      .addSelect('SUM(batch.available_quantity)', 'total_quantity')
      .where('batch.tenant_id = :tenantId', { tenantId })
      .andWhere('batch.warehouse_id = :warehouseId', { warehouseId })
      .getRawOne();

    return {
      total_batches: parseInt(stats.total_batches || 0),
      unique_products: parseInt(stats.unique_products || 0),
      total_quantity: parseFloat(stats.total_quantity || 0),
    };
  }

  async uploadPhoto(
    id: string,
    tenantId: string,
    file: Express.Multer.File,
  ): Promise<InventoryBatch> {
    const batch = await this.getByIdOrFail(id, tenantId);

    if (batch.photo) {
      await this.s3Service.deleteFile(batch.photo).catch(() => undefined);
    }

    const s3Key = await this.s3Service.uploadEntityFile(
      tenantId,
      'inventory_batches',
      id,
      'photo',
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    batch.photo = s3Key;
    const saved = await this.inventoryBatchRepository.save(batch);
    return this.toResponseWithPhotoUrl(saved);
  }

  private async getByIdOrFail(id: string, tenantId: string): Promise<InventoryBatch> {
    const batch = await this.inventoryBatchRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!batch) {
      throw new NotFoundException(`Lote de inventario con ID ${id} no encontrado`);
    }

    return batch;
  }

  private async toResponseWithPhotoUrl(batch: InventoryBatch): Promise<InventoryBatch> {
    if (!batch.photo) {
      return batch;
    }

    const photoUrl = await this.s3Service
      .getSignedUrl(batch.photo, 900)
      .catch(() => batch.photo);

    return {
      ...batch,
      photo: photoUrl,
    };
  }
}
