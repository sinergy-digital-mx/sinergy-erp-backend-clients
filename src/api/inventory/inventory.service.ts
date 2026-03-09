import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventoryItem } from '../../entities/inventory/inventory-item.entity';
import { InventoryMovement } from '../../entities/inventory/inventory-movement.entity';
import { StockReservation } from '../../entities/inventory/stock-reservation.entity';
import { Product } from '../../entities/products/product.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { UoM } from '../../entities/products/uom.entity';
import { ValuationService } from './valuation.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryItemDto } from './dto/query-inventory-item.dto';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { QueryInventoryMovementDto } from './dto/query-inventory-movement.dto';
import { CreateStockReservationDto } from './dto/create-stock-reservation.dto';
import { QueryStockReservationDto } from './dto/query-stock-reservation.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { v4 as uuidv4 } from 'uuid';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ValuationReport {
  items: Array<{
    product_id: string;
    product_name: string;
    product_sku: string;
    warehouse_id: string;
    warehouse_name: string;
    quantity_on_hand: number;
    unit_cost: number;
    total_value: number;
  }>;
  summary: {
    total_value: number;
    by_warehouse: Array<{
      warehouse_id: string;
      warehouse_name: string;
      total_value: number;
    }>;
  };
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryItemRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryMovement)
    private inventoryMovementRepo: Repository<InventoryMovement>,
    @InjectRepository(StockReservation)
    private stockReservationRepo: Repository<StockReservation>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(UoM)
    private uomRepo: Repository<UoM>,
    private valuationService: ValuationService,
    private dataSource: DataSource,
  ) {}

  /**
   * ========================================
   * INVENTORY ITEM MANAGEMENT (Tasks 7.1-7.5)
   * ========================================
   */

  /**
   * Create a new inventory item
   * Task 7.2 - Requirements: 4.1-4.11
   */
  async createInventoryItem(
    dto: CreateInventoryItemDto,
    tenantId: string,
  ): Promise<InventoryItem> {
    // Validate product exists and belongs to tenant
    const product = await this.productRepo.findOne({
      where: { id: dto.product_id, tenant_id: tenantId },
    });
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${dto.product_id} not found for this tenant`,
      );
    }

    // Validate warehouse exists and belongs to tenant
    const warehouse = await this.warehouseRepo.findOne({
      where: { id: dto.warehouse_id, tenant_id: tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException(
        `Warehouse with ID ${dto.warehouse_id} not found for this tenant`,
      );
    }

    // Validate UoM exists and is assigned to the product
    const uom = await this.uomRepo.findOne({
      where: { id: dto.uom_id },
    });
    if (!uom) {
      throw new NotFoundException(`UoM with ID ${dto.uom_id} not found`);
    }

    // Check for duplicate (tenant_id, product_id, warehouse_id, uom_id, location)
    const existing = await this.inventoryItemRepo.findOne({
      where: {
        tenant_id: tenantId,
        product_id: dto.product_id,
        warehouse_id: dto.warehouse_id,
        uom_id: dto.uom_id,
        location: dto.location || (null as any),
      },
    });
    if (existing) {
      throw new ConflictException(
        'Inventory item already exists for this product, warehouse, UoM, and location combination',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create inventory item
      const quantityOnHand = dto.quantity_on_hand || 0;
      const unitCost = dto.unit_cost || 0;

      const inventoryItem = this.inventoryItemRepo.create({
        tenant_id: tenantId,
        product_id: dto.product_id,
        warehouse_id: dto.warehouse_id,
        uom_id: dto.uom_id,
        quantity_on_hand: quantityOnHand,
        quantity_reserved: 0,
        quantity_available: quantityOnHand,
        reorder_point: dto.reorder_point,
        reorder_quantity: dto.reorder_quantity,
        location: dto.location,
        valuation_method: dto.valuation_method || 'Weighted_Average',
        unit_cost: unitCost,
        total_value: quantityOnHand * unitCost,
        cost_layers: [],
      });

      const savedItem = await queryRunner.manager.save(inventoryItem);

      // If initial quantity > 0, create initial_balance movement
      if (quantityOnHand > 0) {
        const movement = this.inventoryMovementRepo.create({
          tenant_id: tenantId,
          product_id: dto.product_id,
          warehouse_id: dto.warehouse_id,
          uom_id: dto.uom_id,
          movement_type: 'initial_balance',
          quantity: quantityOnHand,
          unit_cost: unitCost,
          total_cost: quantityOnHand * unitCost,
          location: dto.location,
          movement_date: new Date(),
          created_by_user_id: tenantId, // Will be replaced with actual user ID in controller
          notes: 'Initial inventory balance',
        });

        await queryRunner.manager.save(movement);

        // Initialize cost layers based on valuation method
        if (savedItem.valuation_method === 'FIFO' || savedItem.valuation_method === 'LIFO') {
          await this.valuationService.updateInventoryValuation(
            savedItem,
            quantityOnHand,
            unitCost,
          );
          await queryRunner.manager.save(savedItem);
        }
      }

      await queryRunner.commitTransaction();

      return this.findInventoryItemById(savedItem.id, tenantId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update an inventory item
   * Task 7.3 - Requirements: 5.1-5.7
   */
  async updateInventoryItem(
    id: string,
    dto: UpdateInventoryItemDto,
    tenantId: string,
  ): Promise<InventoryItem> {
    const inventoryItem = await this.inventoryItemRepo.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!inventoryItem) {
      throw new NotFoundException(
        `Inventory item with ID ${id} not found for this tenant`,
      );
    }

    // Only allow updating configuration fields, not quantities
    if (dto.reorder_point !== undefined) {
      inventoryItem.reorder_point = dto.reorder_point;
    }
    if (dto.reorder_quantity !== undefined) {
      inventoryItem.reorder_quantity = dto.reorder_quantity;
    }
    if (dto.location !== undefined) {
      inventoryItem.location = dto.location;
    }
    if (dto.valuation_method !== undefined) {
      inventoryItem.valuation_method = dto.valuation_method;
    }

    await this.inventoryItemRepo.save(inventoryItem);

    return this.findInventoryItemById(id, tenantId);
  }

  /**
   * Find inventory items with pagination and filters
   * Task 7.4 - Requirements: 6.1-6.12
   */
  async findInventoryItems(
    tenantId: string,
    query: QueryInventoryItemDto,
  ): Promise<PaginatedResponse<InventoryItem>> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.inventoryItemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('item.warehouse', 'warehouse')
      .leftJoinAndSelect('item.uom', 'uom')
      .where('item.tenant_id = :tenantId', { tenantId });

    // Apply filters
    if (query.product_id) {
      queryBuilder.andWhere('item.product_id = :productId', {
        productId: query.product_id,
      });
    }

    if (query.warehouse_id) {
      queryBuilder.andWhere('item.warehouse_id = :warehouseId', {
        warehouseId: query.warehouse_id,
      });
    }

    if (query.location) {
      queryBuilder.andWhere('item.location = :location', {
        location: query.location,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.low_stock) {
      queryBuilder.andWhere(
        '(item.quantity_available <= item.reorder_point AND item.reorder_point IS NOT NULL)',
      );
    }

    // Order by product name and warehouse name
    queryBuilder
      .orderBy('product.name', 'ASC')
      .addOrderBy('warehouse.name', 'ASC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find inventory item by ID
   * Task 7.5 - Requirements: 6.1-6.12
   */
  async findInventoryItemById(
    id: string,
    tenantId: string,
  ): Promise<InventoryItem> {
    const inventoryItem = await this.inventoryItemRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['product', 'warehouse', 'uom'],
    });

    if (!inventoryItem) {
      throw new NotFoundException(
        `Inventory item with ID ${id} not found for this tenant`,
      );
    }

    return inventoryItem;
  }

  /**
   * Delete inventory item
   * Task 7.5 - Requirements: 6.1-6.12
   */
  async deleteInventoryItem(id: string, tenantId: string): Promise<void> {
    const inventoryItem = await this.inventoryItemRepo.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!inventoryItem) {
      throw new NotFoundException(
        `Inventory item with ID ${id} not found for this tenant`,
      );
    }

    await this.inventoryItemRepo.remove(inventoryItem);
  }

  /**
   * ========================================
   * INVENTORY MOVEMENT MANAGEMENT (Tasks 8.1-8.3)
   * ========================================
   */

  /**
   * Create an inventory movement
   * Task 8.1 - Requirements: 7.1-7.12
   */
  async createInventoryMovement(
    dto: CreateInventoryMovementDto,
    tenantId: string,
    userId: string,
  ): Promise<InventoryMovement> {
    // Validate product, warehouse, and UoM
    const product = await this.productRepo.findOne({
      where: { id: dto.product_id, tenant_id: tenantId },
    });
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${dto.product_id} not found for this tenant`,
      );
    }

    const warehouse = await this.warehouseRepo.findOne({
      where: { id: dto.warehouse_id, tenant_id: tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException(
        `Warehouse with ID ${dto.warehouse_id} not found for this tenant`,
      );
    }

    const uom = await this.uomRepo.findOne({
      where: { id: dto.uom_id },
    });
    if (!uom) {
      throw new NotFoundException(`UoM with ID ${dto.uom_id} not found`);
    }

    // Validate quantity is not zero
    if (dto.quantity === 0) {
      throw new BadRequestException('Quantity cannot be zero');
    }

    // Validate quantity sign based on movement type
    const positiveTypes = [
      'purchase_receipt',
      'transfer_in',
      'return_from_customer',
      'initial_balance',
    ];
    const negativeTypes = [
      'sales_shipment',
      'transfer_out',
      'return_to_vendor',
    ];

    if (positiveTypes.includes(dto.movement_type) && dto.quantity < 0) {
      throw new BadRequestException(
        `Movement type ${dto.movement_type} requires positive quantity`,
      );
    }

    if (negativeTypes.includes(dto.movement_type) && dto.quantity > 0) {
      throw new BadRequestException(
        `Movement type ${dto.movement_type} requires negative quantity`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get or create inventory item
      let inventoryItem = await this.getOrCreateInventoryItem(
        dto.product_id,
        dto.warehouse_id,
        dto.uom_id,
        tenantId,
        queryRunner,
      );

      // Validate sufficient stock for negative movements
      if (dto.quantity < 0) {
        const requiredQuantity = Math.abs(dto.quantity);
        if (inventoryItem.quantity_on_hand < requiredQuantity) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${inventoryItem.quantity_on_hand}, Required: ${requiredQuantity}`,
          );
        }
      }

      // Create movement
      const movement = this.inventoryMovementRepo.create({
        tenant_id: tenantId,
        product_id: dto.product_id,
        warehouse_id: dto.warehouse_id,
        uom_id: dto.uom_id,
        movement_type: dto.movement_type,
        quantity: dto.quantity,
        unit_cost: dto.unit_cost,
        total_cost: dto.quantity * dto.unit_cost,
        reference_type: dto.reference_type,
        reference_id: dto.reference_id,
        location: dto.location,
        lot_number: dto.lot_number,
        serial_number: dto.serial_number,
        notes: dto.notes,
        movement_date: dto.movement_date ? new Date(dto.movement_date) : new Date(),
        created_by_user_id: userId,
      });

      const savedMovement = await queryRunner.manager.save(movement);

      // Update inventory item quantity
      inventoryItem.quantity_on_hand = Number(inventoryItem.quantity_on_hand) + Number(dto.quantity);

      // Update valuation
      await this.valuationService.updateInventoryValuation(
        inventoryItem,
        dto.quantity,
        dto.unit_cost,
      );

      // Recalculate available quantity
      inventoryItem.quantity_available =
        Number(inventoryItem.quantity_on_hand) - Number(inventoryItem.quantity_reserved);

      await queryRunner.manager.save(inventoryItem);

      await queryRunner.commitTransaction();

      return this.findInventoryMovementById(savedMovement.id, tenantId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find inventory movements with filters
   * Task 8.2 - Requirements: 8.1-8.10
   */
  async findInventoryMovements(
    tenantId: string,
    query: QueryInventoryMovementDto,
  ): Promise<PaginatedResponse<InventoryMovement>> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.inventoryMovementRepo
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.warehouse', 'warehouse')
      .leftJoinAndSelect('movement.uom', 'uom')
      .leftJoinAndSelect('movement.created_by_user', 'user')
      .where('movement.tenant_id = :tenantId', { tenantId });

    // Apply filters
    if (query.product_id) {
      queryBuilder.andWhere('movement.product_id = :productId', {
        productId: query.product_id,
      });
    }

    if (query.warehouse_id) {
      queryBuilder.andWhere('movement.warehouse_id = :warehouseId', {
        warehouseId: query.warehouse_id,
      });
    }

    if (query.movement_type) {
      queryBuilder.andWhere('movement.movement_type = :movementType', {
        movementType: query.movement_type,
      });
    }

    if (query.movement_date_from) {
      queryBuilder.andWhere('movement.movement_date >= :dateFrom', {
        dateFrom: new Date(query.movement_date_from),
      });
    }

    if (query.movement_date_to) {
      queryBuilder.andWhere('movement.movement_date <= :dateTo', {
        dateTo: new Date(query.movement_date_to),
      });
    }

    if (query.reference_type) {
      queryBuilder.andWhere('movement.reference_type = :referenceType', {
        referenceType: query.reference_type,
      });
    }

    if (query.reference_id) {
      queryBuilder.andWhere('movement.reference_id = :referenceId', {
        referenceId: query.reference_id,
      });
    }

    if (query.lot_number) {
      queryBuilder.andWhere('movement.lot_number = :lotNumber', {
        lotNumber: query.lot_number,
      });
    }

    if (query.serial_number) {
      queryBuilder.andWhere('movement.serial_number = :serialNumber', {
        serialNumber: query.serial_number,
      });
    }

    // Order by movement_date descending (newest first)
    queryBuilder.orderBy('movement.movement_date', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find inventory movement by ID
   * Task 8.3 - Requirements: 8.1-8.10
   */
  async findInventoryMovementById(
    id: string,
    tenantId: string,
  ): Promise<InventoryMovement> {
    const movement = await this.inventoryMovementRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['product', 'warehouse', 'uom', 'created_by_user'],
    });

    if (!movement) {
      throw new NotFoundException(
        `Inventory movement with ID ${id} not found for this tenant`,
      );
    }

    return movement;
  }

  /**
   * ========================================
   * STOCK RESERVATION MANAGEMENT (Tasks 9.1-9.4)
   * ========================================
   */

  /**
   * Create a stock reservation
   * Task 9.1 - Requirements: 9.1-9.9
   */
  async createStockReservation(
    dto: CreateStockReservationDto,
    tenantId: string,
  ): Promise<StockReservation> {
    // Validate product, warehouse, and UoM
    const product = await this.productRepo.findOne({
      where: { id: dto.product_id, tenant_id: tenantId },
    });
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${dto.product_id} not found for this tenant`,
      );
    }

    const warehouse = await this.warehouseRepo.findOne({
      where: { id: dto.warehouse_id, tenant_id: tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException(
        `Warehouse with ID ${dto.warehouse_id} not found for this tenant`,
      );
    }

    const uom = await this.uomRepo.findOne({
      where: { id: dto.uom_id },
    });
    if (!uom) {
      throw new NotFoundException(`UoM with ID ${dto.uom_id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get inventory item
      const inventoryItem = await queryRunner.manager.findOne(InventoryItem, {
        where: {
          tenant_id: tenantId,
          product_id: dto.product_id,
          warehouse_id: dto.warehouse_id,
          uom_id: dto.uom_id,
        },
      });

      if (!inventoryItem) {
        throw new NotFoundException(
          'Inventory item not found for this product, warehouse, and UoM combination',
        );
      }

      // Validate sufficient available stock
      if (Number(inventoryItem.quantity_available) < dto.quantity_reserved) {
        throw new BadRequestException(
          `Insufficient available stock. Available: ${inventoryItem.quantity_available}, Required: ${dto.quantity_reserved}`,
        );
      }

      // Create reservation
      const reservation = this.stockReservationRepo.create({
        tenant_id: tenantId,
        product_id: dto.product_id,
        warehouse_id: dto.warehouse_id,
        uom_id: dto.uom_id,
        quantity_reserved: dto.quantity_reserved,
        reference_type: dto.reference_type,
        reference_id: dto.reference_id,
        status: 'active',
        reserved_at: new Date(),
        expires_at: dto.expires_at ? new Date(dto.expires_at) : undefined,
      });

      const savedReservation = await queryRunner.manager.save(reservation) as StockReservation;

      // Update inventory item
      inventoryItem.quantity_reserved =
        Number(inventoryItem.quantity_reserved) + Number(dto.quantity_reserved);
      inventoryItem.quantity_available =
        Number(inventoryItem.quantity_on_hand) - Number(inventoryItem.quantity_reserved);

      await queryRunner.manager.save(inventoryItem);

      await queryRunner.commitTransaction();

      return this.findStockReservationById(savedReservation.id, tenantId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Fulfill a stock reservation
   * Task 9.2 - Requirements: 10.1-10.8
   */
  async fulfillStockReservation(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reservation = await queryRunner.manager.findOne(StockReservation, {
        where: { id, tenant_id: tenantId },
      });

      if (!reservation) {
        throw new NotFoundException(
          `Stock reservation with ID ${id} not found for this tenant`,
        );
      }

      if (reservation.status !== 'active') {
        throw new BadRequestException(
          `Cannot fulfill reservation with status ${reservation.status}`,
        );
      }

      // Get inventory item
      const inventoryItem = await queryRunner.manager.findOne(InventoryItem, {
        where: {
          tenant_id: tenantId,
          product_id: reservation.product_id,
          warehouse_id: reservation.warehouse_id,
          uom_id: reservation.uom_id,
        },
      });

      if (!inventoryItem) {
        throw new NotFoundException('Inventory item not found');
      }

      // Create sales_shipment movement
      const movement = this.inventoryMovementRepo.create({
        tenant_id: tenantId,
        product_id: reservation.product_id,
        warehouse_id: reservation.warehouse_id,
        uom_id: reservation.uom_id,
        movement_type: 'sales_shipment',
        quantity: -Math.abs(reservation.quantity_reserved),
        unit_cost: inventoryItem.unit_cost,
        total_cost: -Math.abs(reservation.quantity_reserved) * inventoryItem.unit_cost,
        reference_type: reservation.reference_type,
        reference_id: reservation.reference_id,
        movement_date: new Date(),
        created_by_user_id: userId,
        notes: `Fulfillment of reservation ${id}`,
      });

      await queryRunner.manager.save(movement);

      // Update inventory item
      inventoryItem.quantity_on_hand =
        Number(inventoryItem.quantity_on_hand) - Number(reservation.quantity_reserved);
      inventoryItem.quantity_reserved =
        Number(inventoryItem.quantity_reserved) - Number(reservation.quantity_reserved);
      inventoryItem.quantity_available =
        Number(inventoryItem.quantity_on_hand) - Number(inventoryItem.quantity_reserved);

      // Update valuation
      await this.valuationService.updateInventoryValuation(
        inventoryItem,
        -Math.abs(reservation.quantity_reserved),
        inventoryItem.unit_cost,
      );

      await queryRunner.manager.save(inventoryItem);

      // Update reservation
      reservation.status = 'fulfilled';
      reservation.fulfilled_at = new Date();
      await queryRunner.manager.save(reservation);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancel a stock reservation
   * Task 9.3 - Requirements: 11.1-11.6
   */
  async cancelStockReservation(id: string, tenantId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reservation = await queryRunner.manager.findOne(StockReservation, {
        where: { id, tenant_id: tenantId },
      });

      if (!reservation) {
        throw new NotFoundException(
          `Stock reservation with ID ${id} not found for this tenant`,
        );
      }

      if (reservation.status === 'fulfilled') {
        throw new BadRequestException(
          'Cannot cancel a fulfilled reservation',
        );
      }

      if (reservation.status !== 'active') {
        throw new BadRequestException(
          `Cannot cancel reservation with status ${reservation.status}`,
        );
      }

      // Get inventory item
      const inventoryItem = await queryRunner.manager.findOne(InventoryItem, {
        where: {
          tenant_id: tenantId,
          product_id: reservation.product_id,
          warehouse_id: reservation.warehouse_id,
          uom_id: reservation.uom_id,
        },
      });

      if (!inventoryItem) {
        throw new NotFoundException('Inventory item not found');
      }

      // Update inventory item
      inventoryItem.quantity_reserved =
        Number(inventoryItem.quantity_reserved) - Number(reservation.quantity_reserved);
      inventoryItem.quantity_available =
        Number(inventoryItem.quantity_on_hand) - Number(inventoryItem.quantity_reserved);

      await queryRunner.manager.save(inventoryItem);

      // Update reservation
      reservation.status = 'cancelled';
      await queryRunner.manager.save(reservation);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find stock reservations with filters
   * Task 9.4
   */
  async findStockReservations(
    tenantId: string,
    query: QueryStockReservationDto,
  ): Promise<PaginatedResponse<StockReservation>> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.stockReservationRepo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.product', 'product')
      .leftJoinAndSelect('reservation.warehouse', 'warehouse')
      .leftJoinAndSelect('reservation.uom', 'uom')
      .where('reservation.tenant_id = :tenantId', { tenantId });

    // Apply filters
    if (query.product_id) {
      queryBuilder.andWhere('reservation.product_id = :productId', {
        productId: query.product_id,
      });
    }

    if (query.warehouse_id) {
      queryBuilder.andWhere('reservation.warehouse_id = :warehouseId', {
        warehouseId: query.warehouse_id,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('reservation.status = :status', {
        status: query.status,
      });
    }

    if (query.reference_type) {
      queryBuilder.andWhere('reservation.reference_type = :referenceType', {
        referenceType: query.reference_type,
      });
    }

    if (query.reference_id) {
      queryBuilder.andWhere('reservation.reference_id = :referenceId', {
        referenceId: query.reference_id,
      });
    }

    // Order by reserved_at descending
    queryBuilder.orderBy('reservation.reserved_at', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find stock reservation by ID
   */
  private async findStockReservationById(
    id: string,
    tenantId: string,
  ): Promise<StockReservation> {
    const reservation = await this.stockReservationRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['product', 'warehouse', 'uom'],
    });

    if (!reservation) {
      throw new NotFoundException(
        `Stock reservation with ID ${id} not found for this tenant`,
      );
    }

    return reservation;
  }

  /**
   * ========================================
   * TRANSFER AND ADJUSTMENT MANAGEMENT (Tasks 10.1-10.2)
   * ========================================
   */

  /**
   * Transfer inventory between warehouses
   * Task 10.1 - Requirements: 12.1-12.8
   */
  async transferInventory(
    dto: TransferInventoryDto,
    tenantId: string,
    userId: string,
  ): Promise<{ outMovement: InventoryMovement; inMovement: InventoryMovement }> {
    // Validate source and destination are different
    if (dto.source_warehouse_id === dto.destination_warehouse_id) {
      throw new BadRequestException(
        'Source and destination warehouses must be different',
      );
    }

    // Validate product, warehouses, and UoM
    const product = await this.productRepo.findOne({
      where: { id: dto.product_id, tenant_id: tenantId },
    });
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${dto.product_id} not found for this tenant`,
      );
    }

    const sourceWarehouse = await this.warehouseRepo.findOne({
      where: { id: dto.source_warehouse_id, tenant_id: tenantId },
    });
    if (!sourceWarehouse) {
      throw new NotFoundException(
        `Source warehouse with ID ${dto.source_warehouse_id} not found for this tenant`,
      );
    }

    const destWarehouse = await this.warehouseRepo.findOne({
      where: { id: dto.destination_warehouse_id, tenant_id: tenantId },
    });
    if (!destWarehouse) {
      throw new NotFoundException(
        `Destination warehouse with ID ${dto.destination_warehouse_id} not found for this tenant`,
      );
    }

    const uom = await this.uomRepo.findOne({
      where: { id: dto.uom_id },
    });
    if (!uom) {
      throw new NotFoundException(`UoM with ID ${dto.uom_id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get source inventory item
      const sourceItem = await queryRunner.manager.findOne(InventoryItem, {
        where: {
          tenant_id: tenantId,
          product_id: dto.product_id,
          warehouse_id: dto.source_warehouse_id,
          uom_id: dto.uom_id,
        },
      });

      if (!sourceItem) {
        throw new NotFoundException(
          'Inventory item not found in source warehouse',
        );
      }

      // Validate sufficient stock
      if (Number(sourceItem.quantity_on_hand) < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock in source warehouse. Available: ${sourceItem.quantity_on_hand}, Required: ${dto.quantity}`,
        );
      }

      // Generate reference ID to link both movements
      const referenceId = uuidv4();

      // Create transfer_out movement
      const outMovement = this.inventoryMovementRepo.create({
        tenant_id: tenantId,
        product_id: dto.product_id,
        warehouse_id: dto.source_warehouse_id,
        uom_id: dto.uom_id,
        movement_type: 'transfer_out',
        quantity: -Math.abs(dto.quantity),
        unit_cost: dto.unit_cost,
        total_cost: -Math.abs(dto.quantity) * dto.unit_cost,
        reference_type: 'inventory_transfer',
        reference_id: referenceId,
        movement_date: new Date(),
        created_by_user_id: userId,
        notes: dto.notes || `Transfer to warehouse ${dto.destination_warehouse_id}`,
      });

      const savedOutMovement = await queryRunner.manager.save(outMovement);

      // Update source inventory item
      sourceItem.quantity_on_hand =
        Number(sourceItem.quantity_on_hand) - Number(dto.quantity);
      sourceItem.quantity_available =
        Number(sourceItem.quantity_on_hand) - Number(sourceItem.quantity_reserved);

      // Update valuation for source
      await this.valuationService.updateInventoryValuation(
        sourceItem,
        -Math.abs(dto.quantity),
        dto.unit_cost,
      );

      await queryRunner.manager.save(sourceItem);

      // Get or create destination inventory item
      let destItem = await queryRunner.manager.findOne(InventoryItem, {
        where: {
          tenant_id: tenantId,
          product_id: dto.product_id,
          warehouse_id: dto.destination_warehouse_id,
          uom_id: dto.uom_id,
        },
      });

      if (!destItem) {
        destItem = this.inventoryItemRepo.create({
          tenant_id: tenantId,
          product_id: dto.product_id,
          warehouse_id: dto.destination_warehouse_id,
          uom_id: dto.uom_id,
          quantity_on_hand: 0,
          quantity_reserved: 0,
          quantity_available: 0,
          valuation_method: sourceItem.valuation_method,
          unit_cost: 0,
          total_value: 0,
          cost_layers: [],
        });
        destItem = await queryRunner.manager.save(destItem);
      }

      // Create transfer_in movement
      const inMovement = this.inventoryMovementRepo.create({
        tenant_id: tenantId,
        product_id: dto.product_id,
        warehouse_id: dto.destination_warehouse_id,
        uom_id: dto.uom_id,
        movement_type: 'transfer_in',
        quantity: Math.abs(dto.quantity),
        unit_cost: dto.unit_cost,
        total_cost: Math.abs(dto.quantity) * dto.unit_cost,
        reference_type: 'inventory_transfer',
        reference_id: referenceId,
        movement_date: new Date(),
        created_by_user_id: userId,
        notes: dto.notes || `Transfer from warehouse ${dto.source_warehouse_id}`,
      });

      const savedInMovement = await queryRunner.manager.save(inMovement);

      // Update destination inventory item
      destItem.quantity_on_hand =
        Number(destItem.quantity_on_hand) + Number(dto.quantity);
      destItem.quantity_available =
        Number(destItem.quantity_on_hand) - Number(destItem.quantity_reserved);

      // Update valuation for destination
      await this.valuationService.updateInventoryValuation(
        destItem,
        dto.quantity,
        dto.unit_cost,
      );

      await queryRunner.manager.save(destItem);

      await queryRunner.commitTransaction();

      return {
        outMovement: await this.findInventoryMovementById(savedOutMovement.id, tenantId),
        inMovement: await this.findInventoryMovementById(savedInMovement.id, tenantId),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Adjust inventory quantity
   * Task 10.2 - Requirements: 13.1-13.7
   */
  async adjustInventory(
    dto: AdjustInventoryDto,
    tenantId: string,
    userId: string,
  ): Promise<InventoryMovement> {
    // Validate notes is provided (required for audit)
    if (!dto.notes || dto.notes.trim() === '') {
      throw new BadRequestException(
        'Notes are required for inventory adjustments',
      );
    }

    // Validate quantity is not zero
    if (dto.quantity === 0) {
      throw new BadRequestException('Adjustment quantity cannot be zero');
    }

    // Validate product, warehouse, and UoM
    const product = await this.productRepo.findOne({
      where: { id: dto.product_id, tenant_id: tenantId },
    });
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${dto.product_id} not found for this tenant`,
      );
    }

    const warehouse = await this.warehouseRepo.findOne({
      where: { id: dto.warehouse_id, tenant_id: tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException(
        `Warehouse with ID ${dto.warehouse_id} not found for this tenant`,
      );
    }

    const uom = await this.uomRepo.findOne({
      where: { id: dto.uom_id },
    });
    if (!uom) {
      throw new NotFoundException(`UoM with ID ${dto.uom_id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get or create inventory item
      let inventoryItem = await this.getOrCreateInventoryItem(
        dto.product_id,
        dto.warehouse_id,
        dto.uom_id,
        tenantId,
        queryRunner,
      );

      // Validate sufficient stock for negative adjustments
      if (dto.quantity < 0) {
        const requiredQuantity = Math.abs(dto.quantity);
        if (Number(inventoryItem.quantity_on_hand) < requiredQuantity) {
          throw new BadRequestException(
            `Insufficient stock for adjustment. Available: ${inventoryItem.quantity_on_hand}, Required: ${requiredQuantity}`,
          );
        }
      }

      // Create adjustment movement
      const movement = this.inventoryMovementRepo.create({
        tenant_id: tenantId,
        product_id: dto.product_id,
        warehouse_id: dto.warehouse_id,
        uom_id: dto.uom_id,
        movement_type: 'adjustment',
        quantity: dto.quantity,
        unit_cost: dto.unit_cost,
        total_cost: dto.quantity * dto.unit_cost,
        location: dto.location,
        lot_number: dto.lot_number,
        serial_number: dto.serial_number,
        notes: dto.notes,
        movement_date: new Date(),
        created_by_user_id: userId,
      });

      const savedMovement = await queryRunner.manager.save(movement);

      // Update inventory item
      inventoryItem.quantity_on_hand =
        Number(inventoryItem.quantity_on_hand) + Number(dto.quantity);

      // Update valuation
      await this.valuationService.updateInventoryValuation(
        inventoryItem,
        dto.quantity,
        dto.unit_cost,
      );

      // Recalculate available quantity
      inventoryItem.quantity_available =
        Number(inventoryItem.quantity_on_hand) - Number(inventoryItem.quantity_reserved);

      await queryRunner.manager.save(inventoryItem);

      await queryRunner.commitTransaction();

      return this.findInventoryMovementById(savedMovement.id, tenantId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ========================================
   * REPORTING METHODS (Tasks 11.1-11.3)
   * ========================================
   */

  /**
   * Get low stock items
   * Task 11.1 - Requirements: 16.1-16.5
   */
  async getLowStockItems(tenantId: string): Promise<InventoryItem[]> {
    const items = await this.inventoryItemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('item.warehouse', 'warehouse')
      .leftJoinAndSelect('item.uom', 'uom')
      .where('item.tenant_id = :tenantId', { tenantId })
      .andWhere('item.reorder_point IS NOT NULL')
      .andWhere('item.quantity_available <= item.reorder_point')
      .orderBy('product.name', 'ASC')
      .addOrderBy('warehouse.name', 'ASC')
      .getMany();

    return items;
  }

  /**
   * Get inventory valuation report
   * Task 11.2 - Requirements: 17.1-17.7
   */
  async getInventoryValuationReport(
    tenantId: string,
    warehouseId?: string,
  ): Promise<ValuationReport> {
    const queryBuilder = this.inventoryItemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('item.warehouse', 'warehouse')
      .where('item.tenant_id = :tenantId', { tenantId });

    if (warehouseId) {
      queryBuilder.andWhere('item.warehouse_id = :warehouseId', { warehouseId });
    }

    const items = await queryBuilder
      .orderBy('warehouse.name', 'ASC')
      .addOrderBy('product.name', 'ASC')
      .getMany();

    // Calculate total value for each item
    const reportItems = items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product.name,
      product_sku: item.product.sku,
      warehouse_id: item.warehouse_id,
      warehouse_name: item.warehouse.name,
      quantity_on_hand: Number(item.quantity_on_hand),
      unit_cost: Number(item.unit_cost),
      total_value: Number(item.total_value),
    }));

    // Calculate summary by warehouse
    const warehouseMap = new Map<string, { warehouse_id: string; warehouse_name: string; total_value: number }>();

    for (const item of reportItems) {
      if (!warehouseMap.has(item.warehouse_id)) {
        warehouseMap.set(item.warehouse_id, {
          warehouse_id: item.warehouse_id,
          warehouse_name: item.warehouse_name,
          total_value: 0,
        });
      }
      const warehouseSummary = warehouseMap.get(item.warehouse_id);
      if (warehouseSummary) {
        warehouseSummary.total_value += item.total_value;
      }
    }

    const by_warehouse = Array.from(warehouseMap.values());

    // Calculate grand total
    const total_value = reportItems.reduce((sum, item) => sum + item.total_value, 0);

    return {
      items: reportItems,
      summary: {
        total_value,
        by_warehouse,
      },
    };
  }

  /**
   * Get stock by product across all warehouses
   * Task 11.3 - Requirements: 6.1-6.12
   */
  async getStockByProduct(
    productId: string,
    tenantId: string,
  ): Promise<InventoryItem[]> {
    const items = await this.inventoryItemRepo.find({
      where: {
        tenant_id: tenantId,
        product_id: productId,
      },
      relations: ['product', 'warehouse', 'uom'],
      order: {
        warehouse: {
          name: 'ASC',
        },
      },
    });

    return items;
  }

  /**
   * Get all stock in a warehouse
   * Task 11.3 - Requirements: 6.1-6.12
   */
  async getStockByWarehouse(
    warehouseId: string,
    tenantId: string,
  ): Promise<InventoryItem[]> {
    const items = await this.inventoryItemRepo.find({
      where: {
        tenant_id: tenantId,
        warehouse_id: warehouseId,
      },
      relations: ['product', 'warehouse', 'uom'],
      order: {
        product: {
          name: 'ASC',
        },
      },
    });

    return items;
  }

  /**
   * ========================================
   * INTERNAL HELPER METHODS
   * ========================================
   */

  /**
   * Get or create inventory item
   * Internal helper method
   */
  private async getOrCreateInventoryItem(
    productId: string,
    warehouseId: string,
    uomId: string,
    tenantId: string,
    queryRunner?: any,
  ): Promise<InventoryItem> {
    const manager = queryRunner ? queryRunner.manager : this.inventoryItemRepo.manager;

    let inventoryItem = await manager.findOne(InventoryItem, {
      where: {
        tenant_id: tenantId,
        product_id: productId,
        warehouse_id: warehouseId,
        uom_id: uomId,
      },
    });

    if (!inventoryItem) {
      inventoryItem = this.inventoryItemRepo.create({
        tenant_id: tenantId,
        product_id: productId,
        warehouse_id: warehouseId,
        uom_id: uomId,
        quantity_on_hand: 0,
        quantity_reserved: 0,
        quantity_available: 0,
        valuation_method: 'Weighted_Average',
        unit_cost: 0,
        total_value: 0,
        cost_layers: [],
      });
      inventoryItem = await manager.save(inventoryItem);
    }

    return inventoryItem;
  }
}
