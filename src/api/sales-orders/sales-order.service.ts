import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { SalesOrderLine } from '../../entities/sales-orders/sales-order-line.entity';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { PaginatedSalesOrderDto } from './dto/paginated-sales-order.dto';
import { TaxCalculationService } from './tax-calculation.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class SalesOrderService {
  private readonly logger = new Logger(SalesOrderService.name);

  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(SalesOrderLine)
    private readonly salesOrderLineRepository: Repository<SalesOrderLine>,
    private readonly taxCalculationService: TaxCalculationService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Create a new sales order
   * @param dto - Sales order creation data
   * @param tenantId - Tenant ID from authenticated user
   * @returns Created sales order
   */
  async create(
    dto: CreateSalesOrderDto,
    tenantId: string,
  ): Promise<SalesOrder> {
    // Calculate totals if line items are provided
    let totals = {
      total_subtotal: 0,
      total_iva: 0,
      total_ieps: 0,
      grand_total: 0,
    };

    let processedLineItems: SalesOrderLine[] = [];

    if (dto.line_items && dto.line_items.length > 0) {
      // Calculate line item totals and create SalesOrderLine instances
      processedLineItems = dto.line_items.map(item => {
        const subtotal = Number(item.quantity) * Number(item.unit_price);
        const iva_percentage = Number(item.iva_percentage || 0);
        const ieps_percentage = Number(item.ieps_percentage || 0);
        
        const iva_amount = (subtotal * iva_percentage) / 100;
        const ieps_amount = (subtotal * ieps_percentage) / 100;
        const line_total = subtotal + iva_amount + ieps_amount;

        return this.salesOrderLineRepository.create({
          product_id: item.product_id,
          uom_id: item.uom_id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          subtotal: Number(subtotal.toFixed(2)),
          iva_percentage: Number(iva_percentage),
          iva_amount: Number(iva_amount.toFixed(2)),
          ieps_percentage: Number(ieps_percentage),
          ieps_amount: Number(ieps_amount.toFixed(2)),
          line_total: Number(line_total.toFixed(2)),
        });
      });

      // Calculate order totals
      totals = this.taxCalculationService.calculateOrderTotals(processedLineItems);
    }

    const salesOrder = this.salesOrderRepository.create({
      tenant_id: tenantId,
      customer_id: dto.customer_id || null,
      warehouse_id: dto.warehouse_id,
      name: dto.name,
      description: dto.description,
      delivery_date: dto.delivery_date ? new Date(dto.delivery_date) : null,
      status: dto.status || 'draft',
      total_subtotal: Number(totals.total_subtotal.toFixed(2)),
      total_iva: Number(totals.total_iva.toFixed(2)),
      total_ieps: Number(totals.total_ieps.toFixed(2)),
      grand_total: Number(totals.grand_total.toFixed(2)),
      metadata: dto.metadata,
      lines: processedLineItems,
    });

    return this.salesOrderRepository.save(salesOrder);
  }

  /**
   * Find all sales orders for a tenant with pagination and filters
   * @param tenantId - Tenant ID from authenticated user
   * @param query - Query parameters (page, limit, search, status)
   * @returns Paginated sales orders
   */
  async findAll(
    tenantId: string,
    query?: QuerySalesOrderDto,
  ): Promise<PaginatedSalesOrderDto> {
    // Normalize and validate pagination parameters
    let page = query?.page !== undefined ? Number(query.page) : 1;
    let limit = query?.limit !== undefined ? Number(query.limit) : 20;

    // Enforce minimum and maximum bounds
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build query with tenant isolation
    const queryBuilder = this.salesOrderRepository
      .createQueryBuilder('sales_order')
      .where('sales_order.tenant_id = :tenantId', { tenantId })
      .leftJoinAndSelect('sales_order.customer', 'customer')
      .leftJoinAndSelect('sales_order.warehouse', 'warehouse')
      .leftJoinAndSelect('sales_order.lines', 'lines')
      .leftJoinAndSelect('lines.product', 'product')
      .leftJoinAndSelect('lines.uom', 'uom');

    // Apply search filter (case-insensitive partial match on name)
    if (query?.search) {
      queryBuilder.andWhere('LOWER(sales_order.name) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    // Apply status filter (exact match)
    if (query?.status) {
      queryBuilder.andWhere('sales_order.status = :status', {
        status: query.status,
      });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('sales_order.created_at', 'DESC');

    // Execute count and data queries
    const total = await queryBuilder.getCount();
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Find a single sales order by ID
   * @param id - Sales order ID
   * @param tenantId - Tenant ID from authenticated user
   * @returns Sales order
   * @throws NotFoundException if not found
   */
  async findOne(id: string, tenantId: string): Promise<SalesOrder> {
    return this.salesOrderRepository.findOneOrFail({
      where: { id, tenant_id: tenantId },
      relations: [
        'customer',
        'warehouse',
        'lines',
        'lines.product',
        'lines.uom',
      ],
    });
  }

  /**
   * Update a sales order
   * @param id - Sales order ID
   * @param dto - Update data
   * @param tenantId - Tenant ID from authenticated user
   * @param userId - User ID for inventory operations
   * @returns Updated sales order
   * @throws NotFoundException if not found
   */
  async update(
    id: string,
    dto: UpdateSalesOrderDto,
    tenantId: string,
    userId?: string,
  ): Promise<SalesOrder> {
    const salesOrder = await this.findOne(id, tenantId);
    const previousStatus = salesOrder.status;
    
    Object.assign(salesOrder, dto);
    const updatedOrder = await this.salesOrderRepository.save(salesOrder);

    // Handle inventory integration based on status changes
    if (dto.status && dto.status !== previousStatus) {
      await this.handleStatusChange(updatedOrder, previousStatus, dto.status, tenantId, userId);
    }

    return updatedOrder;
  }

  /**
   * Handle inventory operations when sales order status changes
   * @param salesOrder - The sales order
   * @param previousStatus - Previous status
   * @param newStatus - New status
   * @param tenantId - Tenant ID
   * @param userId - User ID for inventory operations
   */
  private async handleStatusChange(
    salesOrder: SalesOrder,
    previousStatus: string,
    newStatus: string,
    tenantId: string,
    userId?: string,
  ): Promise<void> {
    try {
      // Load sales order lines if not already loaded
      if (!salesOrder.lines || salesOrder.lines.length === 0) {
        const lines = await this.salesOrderLineRepository.find({
          where: { sales_order_id: salesOrder.id },
          relations: ['product', 'uom'],
        });
        salesOrder.lines = lines;
      }

      // When order is confirmed, create stock reservations
      if (newStatus === 'confirmed' && previousStatus !== 'confirmed') {
        this.logger.log(`Creating stock reservations for sales order ${salesOrder.id}`);
        await this.createStockReservations(salesOrder, tenantId);
      }

      // When order is completed, fulfill stock reservations
      if (newStatus === 'completed' && previousStatus !== 'completed') {
        this.logger.log(`Fulfilling stock reservations for sales order ${salesOrder.id}`);
        await this.fulfillStockReservations(salesOrder, tenantId, userId);
      }

      // When order is cancelled, cancel stock reservations
      if (newStatus === 'cancelled' && previousStatus === 'confirmed') {
        this.logger.log(`Cancelling stock reservations for sales order ${salesOrder.id}`);
        await this.cancelStockReservations(salesOrder, tenantId);
      }
    } catch (error) {
      this.logger.error(`Error handling status change for sales order ${salesOrder.id}: ${error.message}`, error.stack);
      // Don't throw - log error but allow order status update to proceed
      // In production, you might want to implement a retry mechanism or compensation logic
    }
  }

  /**
   * Create stock reservations for all line items
   */
  private async createStockReservations(
    salesOrder: SalesOrder,
    tenantId: string,
  ): Promise<void> {
    for (const line of salesOrder.lines) {
      try {
        await this.inventoryService.createStockReservation(
          {
            product_id: line.product_id,
            warehouse_id: salesOrder.warehouse_id,
            uom_id: line.uom_id,
            quantity_reserved: line.quantity,
            reference_type: 'sales_order',
            reference_id: salesOrder.id,
          },
          tenantId,
        );
        this.logger.log(`Created reservation for product ${line.product_id}, quantity ${line.quantity}`);
      } catch (error) {
        this.logger.error(`Failed to create reservation for line ${line.id}: ${error.message}`);
        throw error; // Re-throw to prevent order confirmation if reservation fails
      }
    }
  }

  /**
   * Fulfill stock reservations for all line items
   */
  private async fulfillStockReservations(
    salesOrder: SalesOrder,
    tenantId: string,
    userId?: string,
  ): Promise<void> {
    // Find all active reservations for this sales order
    const reservations = await this.inventoryService.findStockReservations(
      tenantId,
      {
        reference_type: 'sales_order',
        reference_id: salesOrder.id,
        status: 'active',
      },
    );

    for (const reservation of reservations.data) {
      try {
        await this.inventoryService.fulfillStockReservation(
          reservation.id,
          tenantId,
          userId || tenantId, // Fallback to tenantId if userId not provided
        );
        this.logger.log(`Fulfilled reservation ${reservation.id}`);
      } catch (error) {
        this.logger.error(`Failed to fulfill reservation ${reservation.id}: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Cancel stock reservations for all line items
   */
  private async cancelStockReservations(
    salesOrder: SalesOrder,
    tenantId: string,
  ): Promise<void> {
    // Find all active reservations for this sales order
    const reservations = await this.inventoryService.findStockReservations(
      tenantId,
      {
        reference_type: 'sales_order',
        reference_id: salesOrder.id,
        status: 'active',
      },
    );

    for (const reservation of reservations.data) {
      try {
        await this.inventoryService.cancelStockReservation(
          reservation.id,
          tenantId,
        );
        this.logger.log(`Cancelled reservation ${reservation.id}`);
      } catch (error) {
        this.logger.error(`Failed to cancel reservation ${reservation.id}: ${error.message}`);
        // Continue cancelling other reservations even if one fails
      }
    }
  }

  /**
   * Remove a sales order (hard delete)
   * @param id - Sales order ID
   * @param tenantId - Tenant ID from authenticated user
   * @throws NotFoundException if not found
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const salesOrder = await this.findOne(id, tenantId);
    await this.salesOrderRepository.remove(salesOrder);
  }
}
