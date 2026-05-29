import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { PosSession, PosSessionStatus } from '../../entities/pos/pos-session.entity';
import { PosConfiguration } from '../../entities/billing/pos-configuration.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { S3Service } from '../../common/services/s3.service';
import { BatchFilterDto } from './dto/batch-filter.dto';
import { BatchListResponseDto } from './dto/batch-list-response.dto';
import { BatchResponseDto } from './dto/batch-response.dto';
import { BatchDetailResponseDto } from './dto/batch-detail-response.dto';
import { InventorySummaryFilterDto } from './dto/inventory-summary-filter.dto';
import { InventorySummaryResponseDto, ProductInventorySummaryDto } from './dto/inventory-summary-response.dto';
import { PosSessionInventorySummaryResponseDto, PosSessionProductInventorySummaryDto } from './dto/pos-session-inventory-summary-response.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryBatch)
    private inventoryBatchRepo: Repository<InventoryBatch>,
    @InjectRepository(ProductPrice)
    private readonly productPriceRepo: Repository<ProductPrice>,
    @InjectRepository(PosSession)
    private readonly posSessionRepo: Repository<PosSession>,
    @InjectRepository(PosConfiguration)
    private readonly posConfigRepo: Repository<PosConfiguration>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
    private readonly s3Service: S3Service,
  ) {}

  private async getSignedPhotoUrl(photoKey: string | null | undefined): Promise<string | null> {
    if (!photoKey) return null;
    return this.s3Service.getSignedUrl(photoKey, 900).catch(() => photoKey);
  }

  async getPosSessionInventorySummary(
    tenantId: string,
    sessionId: string,
    filters: InventorySummaryFilterDto,
  ): Promise<PosSessionInventorySummaryResponseDto> {
    const session = await this.posSessionRepo.findOne({
      where: { id: sessionId, tenant_id: tenantId, status: PosSessionStatus.OPEN },
    });

    if (!session) {
      throw new NotFoundException('No se encontró una sesión POS abierta');
    }

    const posConfig = await this.posConfigRepo.findOne({
      where: { id: session.pos_configuration_id, tenant_id: tenantId },
    });

    if (!posConfig?.sucursal) {
      throw new BadRequestException('La sesión POS no tiene una sucursal válida asociada');
    }

    const branchWarehouses = await this.warehouseRepo.find({
      where: { tenant_id: tenantId, billing_branch_id: posConfig.sucursal },
      select: ['id', 'name', 'status'],
    });

    if (branchWarehouses.length === 0) {
      throw new NotFoundException('No se encontraron almacenes para la sucursal de la sesión');
    }

    const availableWarehouseIds = new Set(branchWarehouses.map((w) => w.id));
    const selectedWarehouseId = filters.warehouse_id?.trim();

    if (selectedWarehouseId && !availableWarehouseIds.has(selectedWarehouseId)) {
      throw new BadRequestException(
        'El almacén seleccionado no pertenece a la sucursal asignada a esta sesión POS',
      );
    }

    const targetWarehouseIds = selectedWarehouseId
      ? [selectedWarehouseId]
      : branchWarehouses.map((w) => w.id);

    let query = this.inventoryBatchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('batch.warehouse', 'warehouse')
      .leftJoinAndSelect('batch.uom', 'uom')
      .leftJoinAndSelect('batch.purchase_order_batch', 'po')
      .where('batch.tenant_id = :tenantId', { tenantId })
      .andWhere('batch.warehouse_id IN (:...warehouseIds)', { warehouseIds: targetWarehouseIds });

    if (filters.search) {
      query = query.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.product_id) {
      query = query.andWhere('batch.product_id = :product_id', {
        product_id: filters.product_id,
      });
    }

    if (filters.only_available) {
      query = query.andWhere('batch.available_quantity > 0');
    }

    const batches = await query.getMany();
    const grouped = new Map<string, InventoryBatch[]>();

    for (const batch of batches) {
      const key = `${batch.product_id}|${batch.uom_id}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(batch);
    }

    const productIds = Array.from(new Set(batches.map((b) => b.product_id)));
    const uomIds = Array.from(new Set(batches.map((b) => b.uom_id)));
    const priceMap = await this.buildPriceMap(productIds, uomIds);

    const summaries: PosSessionProductInventorySummaryDto[] = [];

    for (const batchGroup of grouped.values()) {
      const first = batchGroup[0];
      const totalAvailable = batchGroup.reduce(
        (sum, b) => sum + parseFloat(b.available_quantity?.toString() ?? '0'),
        0,
      );
      const totalInitial = batchGroup.reduce(
        (sum, b) => sum + parseFloat(b.initial_quantity?.toString() ?? '0'),
        0,
      );
      const warehouseIds = Array.from(new Set(batchGroup.map((b) => b.warehouse_id)));
      const warehouseNames = Array.from(
        new Set(batchGroup.map((b) => b.warehouse?.name).filter((name): name is string => !!name)),
      );

      const priceKey = `${first.product_id}|${first.uom_id}`;
      const pricingOptions = priceMap.get(priceKey) || [];
      const suggestedPrice = pricingOptions[0] || null;

      summaries.push({
        product_id: first.product_id,
        product_name: first.product?.name ?? '',
        product_sku: first.product?.sku ?? '',
        product_photo: await this.getSignedPhotoUrl(first.product?.photo),
        uom_id: first.uom_id,
        uom_name: first.uom?.name ?? '',
        warehouse_ids: warehouseIds,
        warehouse_names: warehouseNames,
        suggested_unit_price: suggestedPrice?.price ?? null,
        suggested_iva_percentage: suggestedPrice?.iva_percentage ?? null,
        suggested_ieps_percentage: suggestedPrice?.ieps_percentage ?? null,
        pricing_options: pricingOptions,
        total_available_quantity: totalAvailable.toFixed(3),
        total_initial_quantity: totalInitial.toFixed(3),
        total_batches: batchGroup.length,
        batches: batchGroup.map((b) => ({
          batch_id: b.id,
          batch_number: b.batch_number,
          source_tag_identifier: b.source_tag_identifier ?? null,
          warehouse_id: b.warehouse_id,
          warehouse_name: b.warehouse?.name ?? '',
          available_quantity: parseFloat(b.available_quantity?.toString() ?? '0').toFixed(3),
          initial_quantity: parseFloat(b.initial_quantity?.toString() ?? '0').toFixed(3),
          purchase_order_folio: b.purchase_order_batch?.folio ?? null,
          created_at: b.created_at,
        })),
      });
    }

    const sortBy = filters.sort_by || 'product_name';
    const sortOrder = filters.sort_order || 'ASC';
    summaries.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;
      switch (sortBy) {
        case 'product_sku':
          valA = a.product_sku;
          valB = b.product_sku;
          break;
        case 'total_available_quantity':
          valA = parseFloat(a.total_available_quantity);
          valB = parseFloat(b.total_available_quantity);
          break;
        default:
          valA = a.product_name;
          valB = b.product_name;
      }
      if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
      if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = summaries.length;
    const start = (page - 1) * limit;
    const paginatedData = summaries.slice(start, start + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async buildPriceMap(
    productIds: string[],
    uomIds: string[],
  ): Promise<
    Map<
      string,
      Array<{
        price_list_id: string;
        price_list_name: string;
        price: string;
        iva_percentage: string;
        ieps_percentage: string;
        total: string;
      }>
    >
  > {
    const priceMap = new Map<
      string,
      Array<{
        price_list_id: string;
        price_list_name: string;
        price: string;
        iva_percentage: string;
        ieps_percentage: string;
        total: string;
      }>
    >();

    if (productIds.length === 0 || uomIds.length === 0) {
      return priceMap;
    }

    const prices = await this.productPriceRepo
      .createQueryBuilder('pp')
      .leftJoinAndSelect('pp.price_list', 'price_list')
      .leftJoinAndSelect('pp.product_uom', 'product_uom')
      .where('pp.product_id IN (:...productIds)', { productIds })
      .andWhere('product_uom.uom_catalog_id IN (:...uomIds)', { uomIds })
      .andWhere('price_list.is_active = :isActive', { isActive: true })
      .orderBy('price_list.created_at', 'ASC')
      .addOrderBy('pp.created_at', 'ASC')
      .getMany();

    for (const price of prices) {
      const uomCatalogId = price.product_uom?.uom_catalog_id;
      if (!uomCatalogId) continue;

      const key = `${price.product_id}|${uomCatalogId}`;
      const options = priceMap.get(key) || [];
      options.push({
        price_list_id: price.price_list_id,
        price_list_name: price.price_list?.name ?? 'N/A',
        price: Number(price.price ?? 0).toFixed(2),
        iva_percentage: Number(price.iva_percentage ?? 0).toFixed(2),
        ieps_percentage: Number(price.ieps_percentage ?? 0).toFixed(2),
        total: Number(price.total ?? 0).toFixed(2),
      });
      priceMap.set(key, options);
    }

    return priceMap;
  }

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
      if (filters.search) {
        query.andWhere(
          '(batch.batch_number ILIKE :search OR product.name ILIKE :search OR product.sku ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

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

      // Apply sorting — 'quantity' maps to available_quantity column
      const sortBy = filters.sort_by === 'quantity' ? 'available_quantity' : (filters.sort_by || 'created_at');
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
   * Returns enriched detail including quantity breakdown and movement summary
   * @param id - Batch ID
   * @param tenantId - Tenant ID for isolation
   * @returns Batch detail response DTO
   * @throws NotFoundException if batch not found
   */
  async findById(id: string, tenantId: string): Promise<BatchDetailResponseDto> {
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
      return this.mapToDetailResponseDto(batch);
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
      if (filters.search) {
        query.andWhere(
          '(batch.batch_number ILIKE :search OR product.name ILIKE :search OR product.sku ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

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

      // Apply sorting — 'quantity' maps to available_quantity column
      const sortBy = filters.sort_by === 'quantity' ? 'available_quantity' : (filters.sort_by || 'created_at');
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
      source_tag_identifier: batch.source_tag_identifier ?? null,
      warehouse_id: batch.warehouse_id,
      warehouse_name: batch.warehouse?.name,
      product_id: batch.product_id,
      product_name: batch.product?.name,
      product_sku: batch.product?.sku,
      uom_id: batch.uom_id,
      uom_name: batch.uom?.name,
      quantity: batch.available_quantity.toString(),
      purchase_order_batch_id: batch.purchase_order_batch_id,
      purchase_order_id: batch.purchase_order_batch_id,
      purchase_order_detail_id: batch.purchase_order_detail_id,
      purchase_order_folio: batch.purchase_order_batch?.folio,
      created_by: batch.created_by,
      created_at: batch.created_at,
    };
  }

  /**
   * Get inventory summary grouped by product and warehouse.
   * Shows total available quantity and breakdown by batch.
   */
  async getInventorySummary(
    tenantId: string,
    filters: InventorySummaryFilterDto,
  ): Promise<InventorySummaryResponseDto> {
    try {
      this.logger.debug(`Getting inventory summary for tenant: ${tenantId}`);

      // Build base query to get all batches with relations
      let query = this.inventoryBatchRepo
        .createQueryBuilder('batch')
        .leftJoinAndSelect('batch.product', 'product')
        .leftJoinAndSelect('batch.warehouse', 'warehouse')
        .leftJoinAndSelect('batch.uom', 'uom')
        .leftJoinAndSelect('batch.purchase_order_batch', 'po')
        .where('batch.tenant_id = :tenantId', { tenantId });

      // Apply filters
      if (filters.search) {
        query = query.andWhere(
          '(product.name ILIKE :search OR product.sku ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      if (filters.warehouse_id) {
        query = query.andWhere('batch.warehouse_id = :warehouse_id', {
          warehouse_id: filters.warehouse_id,
        });
      }

      if (filters.product_id) {
        query = query.andWhere('batch.product_id = :product_id', {
          product_id: filters.product_id,
        });
      }

      if (filters.only_available) {
        query = query.andWhere('batch.available_quantity > 0');
      }

      // Get all matching batches
      const batches = await query.getMany();

      // Group by product_id + warehouse_id
      const grouped = new Map<string, InventoryBatch[]>();
      for (const batch of batches) {
        const key = `${batch.product_id}|${batch.warehouse_id}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(batch);
      }

      const productIds = Array.from(new Set(batches.map((b) => b.product_id)));
      const uomIds = Array.from(new Set(batches.map((b) => b.uom_id)));
      const priceMap = await this.buildPriceMap(productIds, uomIds);

      // Build summary DTOs
      const summaries: ProductInventorySummaryDto[] = [];
      for (const [key, batchGroup] of grouped.entries()) {
        const first = batchGroup[0];
        
        const totalAvailable = batchGroup.reduce(
          (sum, b) => sum + parseFloat(b.available_quantity?.toString() ?? '0'),
          0,
        );
        const totalInitial = batchGroup.reduce(
          (sum, b) => sum + parseFloat(b.initial_quantity?.toString() ?? '0'),
          0,
        );
        const priceKey = `${first.product_id}|${first.uom_id}`;
        const pricingOptions = priceMap.get(priceKey) || [];
        const suggestedPrice = pricingOptions[0] || null;

        summaries.push({
          product_id: first.product_id,
          product_name: first.product?.name ?? '',
          product_sku: first.product?.sku ?? '',
          product_photo: await this.getSignedPhotoUrl(first.product?.photo),
          warehouse_id: first.warehouse_id,
          warehouse_name: first.warehouse?.name ?? '',
          uom_id: first.uom_id,
          uom_name: first.uom?.name ?? '',
          suggested_unit_price: suggestedPrice?.price ?? null,
          suggested_iva_percentage: suggestedPrice?.iva_percentage ?? null,
          suggested_ieps_percentage: suggestedPrice?.ieps_percentage ?? null,
          pricing_options: pricingOptions,
          total_available_quantity: totalAvailable.toFixed(3),
          total_initial_quantity: totalInitial.toFixed(3),
          total_batches: batchGroup.length,
          batches: batchGroup.map((b) => ({
            batch_id: b.id,
            batch_number: b.batch_number,
            source_tag_identifier: b.source_tag_identifier ?? null,
            available_quantity: parseFloat(b.available_quantity?.toString() ?? '0').toFixed(3),
            initial_quantity: parseFloat(b.initial_quantity?.toString() ?? '0').toFixed(3),
            purchase_order_folio: b.purchase_order_batch?.folio ?? null,
            created_at: b.created_at,
          })),
        });
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'product_name';
      const sortOrder = filters.sort_order || 'ASC';
      summaries.sort((a, b) => {
        let valA: any, valB: any;
        switch (sortBy) {
          case 'product_sku':
            valA = a.product_sku;
            valB = b.product_sku;
            break;
          case 'warehouse_name':
            valA = a.warehouse_name;
            valB = b.warehouse_name;
            break;
          case 'total_available_quantity':
            valA = parseFloat(a.total_available_quantity);
            valB = parseFloat(b.total_available_quantity);
            break;
          default:
            valA = a.product_name;
            valB = b.product_name;
        }
        if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
        if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
        return 0;
      });

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const total = summaries.length;
      const start = (page - 1) * limit;
      const paginatedData = summaries.slice(start, start + limit);

      this.logger.log(
        `Inventory summary: ${paginatedData.length} products out of ${total} total`,
      );

      return {
        data: paginatedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(
        `Error getting inventory summary for tenant ${tenantId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Map InventoryBatch entity to BatchDetailResponseDto
   * Includes quantity breakdown and movement summary
   * Since there is no movement tracking table yet, initial = available = current quantity
   */
  private mapToDetailResponseDto(batch: InventoryBatch): BatchDetailResponseDto {
    const initial = parseFloat(batch.initial_quantity?.toString() ?? '0');
    const available = parseFloat(batch.available_quantity?.toString() ?? '0');
    const consumed = parseFloat((initial - available).toFixed(3));
    const availabilityPct = initial > 0 ? Math.round((available / initial) * 100) : 100;

    return {
      id: batch.id,
      batch_number: batch.batch_number,
      source_tag_identifier: batch.source_tag_identifier ?? null,
      product_id: batch.product_id,
      product_name: batch.product?.name ?? null,
      product_sku: batch.product?.sku ?? null,
      warehouse_id: batch.warehouse_id,
      warehouse_name: batch.warehouse?.name ?? null,
      purchase_order_id: batch.purchase_order_batch_id ?? null,
      purchase_order_batch_id: batch.purchase_order_batch_id ?? null,
      purchase_order_detail_id: batch.purchase_order_detail_id ?? null,
      purchase_order_folio: batch.purchase_order_batch?.folio ?? null,
      uom_id: batch.uom_id,
      uom_name: batch.uom?.name ?? null,
      initial_quantity: initial.toFixed(3),
      available_quantity: available.toFixed(3),
      quantity_consumed: consumed.toFixed(3),
      availability_percentage: availabilityPct,
      created_by: batch.created_by,
      created_at: batch.created_at,
      movement_summary: {
        total_movements: 0,
        total_out: 0,
        total_in: 0,
        by_type: {
          orders: 0,
          transfers_out: 0,
          transfers_in: 0,
          adjustments: 0,
        },
      },
    };
  }
}
