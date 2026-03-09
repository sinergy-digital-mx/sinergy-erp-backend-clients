import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { POSOrder } from '../../entities/pos/pos-order.entity';
import { POSOrderLine } from '../../entities/pos/pos-order-line.entity';
import { POSPayment } from '../../entities/pos/pos-payment.entity';
import { POSTable } from '../../entities/pos/pos-table.entity';
import { Product } from '../../entities/products/product.entity';
import { VendorProductPrice } from '../../entities/products/vendor-product-price.entity';
import { CreatePOSOrderDto } from './dto/create-pos-order.dto';
import { AddLineItemDto } from './dto/add-line-item.dto';
import { UpdateLineItemDto } from './dto/update-line-item.dto';
import { QueryPOSOrderDto } from './dto/query-pos-order.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { InventoryService } from '../inventory/inventory.service';
import { CashShiftService } from './cash-shift.service';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class POSService {
  constructor(
    @InjectRepository(POSOrder)
    private posOrderRepo: Repository<POSOrder>,
    @InjectRepository(POSOrderLine)
    private posOrderLineRepo: Repository<POSOrderLine>,
    @InjectRepository(POSPayment)
    private posPaymentRepo: Repository<POSPayment>,
    @InjectRepository(POSTable)
    private posTableRepo: Repository<POSTable>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(VendorProductPrice)
    private vendorPriceRepo: Repository<VendorProductPrice>,
    private inventoryService: InventoryService,
    private cashShiftService: CashShiftService,
    private dataSource: DataSource,
  ) {}

  /**
   * ========================================
   * ORDER MANAGEMENT
   * ========================================
   */

  /**
   * Create a new POS order
   * Requirements: 6.1-6.9
   */
  async createOrder(
    dto: CreatePOSOrderDto,
    tenantId: string,
    waiterId: string,
  ): Promise<POSOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate sequential order number
      const orderNumber = await this.generateOrderNumber(tenantId, dto.warehouse_id);

      // Create order
      const order = this.posOrderRepo.create({
        tenant_id: tenantId,
        order_number: orderNumber,
        warehouse_id: dto.warehouse_id,
        waiter_id: waiterId,
        table_number: dto.table_number,
        zone: dto.zone,
        notes: dto.notes,
        status: 'pending',
        subtotal: 0,
        tax: 0,
        discount: 0,
        tip: 0,
        total: 0,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // If table_number provided, assign and mark as occupied
      if (dto.table_number) {
        const table = await queryRunner.manager.findOne(POSTable, {
          where: {
            tenant_id: tenantId,
            warehouse_id: dto.warehouse_id,
            table_number: dto.table_number,
          },
        });

        if (!table) {
          throw new NotFoundException(
            `Table ${dto.table_number} not found in this warehouse`,
          );
        }

        if (table.status !== 'available') {
          throw new BadRequestException(
            `Table ${dto.table_number} is not available`,
          );
        }

        table.status = 'occupied';
        table.current_order_id = savedOrder.id;
        await queryRunner.manager.save(table);
      }

      await queryRunner.commitTransaction();

      return this.findOrder(savedOrder.id, tenantId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find a single order by ID
   * Requirements: 16.1-16.10
   */
  async findOrder(id: string, tenantId: string): Promise<POSOrder> {
    const order = await this.posOrderRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: [
        'lines',
        'lines.product',
        'lines.uom',
        'payments',
        'waiter',
        'cashier',
        'warehouse',
      ],
    });

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${id} not found for this tenant`,
      );
    }

    return order;
  }

  /**
   * Find orders with pagination and filters
   * Requirements: 16.1-16.10
   */
  async findOrders(
    tenantId: string,
    query: QueryPOSOrderDto,
  ): Promise<PaginatedResponse<POSOrder>> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.posOrderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.waiter', 'waiter')
      .leftJoinAndSelect('order.cashier', 'cashier')
      .leftJoinAndSelect('order.warehouse', 'warehouse')
      .where('order.tenant_id = :tenantId', { tenantId });

    // Apply filters
    if (query.warehouse_id) {
      queryBuilder.andWhere('order.warehouse_id = :warehouseId', {
        warehouseId: query.warehouse_id,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('order.status = :status', { status: query.status });
    }

    if (query.waiter_id) {
      queryBuilder.andWhere('order.waiter_id = :waiterId', {
        waiterId: query.waiter_id,
      });
    }

    if (query.cashier_id) {
      queryBuilder.andWhere('order.cashier_id = :cashierId', {
        cashierId: query.cashier_id,
      });
    }

    if (query.table_number) {
      queryBuilder.andWhere('order.table_number = :tableNumber', {
        tableNumber: query.table_number,
      });
    }

    if (query.zone) {
      queryBuilder.andWhere('order.zone = :zone', { zone: query.zone });
    }



    if (query.date_from) {
      queryBuilder.andWhere('order.created_at >= :dateFrom', {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('order.created_at <= :dateTo', {
        dateTo: new Date(query.date_to),
      });
    }

    // Order by created_at descending (newest first)
    queryBuilder.orderBy('order.created_at', 'DESC');

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
   * Cancel an order
   * Requirements: 15.1-15.5
   */
  async cancelOrder(
    id: string,
    tenantId: string,
    reason: string,
  ): Promise<POSOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(POSOrder, {
        where: { id, tenant_id: tenantId },
      });

      if (!order) {
        throw new NotFoundException(
          `Order with ID ${id} not found for this tenant`,
        );
      }

      // Validate order is not paid
      await this.validateOrderNotPaid(order);

      // Update order status
      order.status = 'cancelled';
      order.notes = order.notes
        ? `${order.notes}\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;

      await queryRunner.manager.save(order);

      // Release table if applicable
      if (order.table_number) {
        await this.releaseTableInternal(
          order.table_number,
          order.warehouse_id,
          tenantId,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();

      return this.findOrder(id, tenantId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ========================================
   * LINE ITEM MANAGEMENT
   * ========================================
   */

  /**
   * Add a line item to an order
   * Requirements: 7.1-7.9
   */
  async addLineItem(
    orderId: string,
    dto: AddLineItemDto,
    tenantId: string,
  ): Promise<POSOrderLine> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate order exists and is not paid
      const order = await queryRunner.manager.findOne(POSOrder, {
        where: { id: orderId, tenant_id: tenantId },
      });

      if (!order) {
        throw new NotFoundException(
          `Order with ID ${orderId} not found for this tenant`,
        );
      }

      await this.validateOrderNotPaid(order);

      // Validate product exists and belongs to tenant
      const product = await this.productRepo.findOne({
        where: { id: dto.product_id, tenant_id: tenantId },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${dto.product_id} not found for this tenant`,
        );
      }

      // Fetch product price (use first vendor price or default to 0)
      let unitPrice = 0;
      const vendorPrice = await this.vendorPriceRepo.findOne({
        where: {
          product_id: dto.product_id,
          uom_id: dto.uom_id,
        },
        order: { created_at: 'DESC' },
      });

      if (vendorPrice) {
        unitPrice = Number(vendorPrice.price);
      }

      // Calculate line totals
      const subtotal = dto.quantity * unitPrice;
      const discountPercentage = dto.discount_percentage || 0;
      const discountAmount = subtotal * (discountPercentage / 100);
      const lineTotal = subtotal - discountAmount;

      // Create line item
      const line = this.posOrderLineRepo.create({
        pos_order_id: orderId,
        product_id: dto.product_id,
        uom_id: dto.uom_id,
        quantity: dto.quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        discount_percentage: discountPercentage,
        discount_amount: discountAmount,
        line_total: lineTotal,
        notes: dto.notes,
        status: 'pending',
      });

      const savedLine = await queryRunner.manager.save(line);

      // Recalculate order totals
      await this.calculateOrderTotals(order, queryRunner);

      await queryRunner.commitTransaction();

      const result = await this.posOrderLineRepo.findOne({
        where: { id: savedLine.id },
        relations: ['product', 'uom'],
      });

      if (!result) {
        throw new NotFoundException(`Line item with ID ${savedLine.id} not found`);
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update a line item
   * Requirements: 8.1-8.6
   */
  async updateLineItem(
    lineId: string,
    dto: UpdateLineItemDto,
    tenantId: string,
  ): Promise<POSOrderLine> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const line = await queryRunner.manager.findOne(POSOrderLine, {
        where: { id: lineId },
        relations: ['pos_order'],
      });

      if (!line) {
        throw new NotFoundException(`Line item with ID ${lineId} not found`);
      }

      // Validate order belongs to tenant and is not paid
      if (line.pos_order.tenant_id !== tenantId) {
        throw new NotFoundException(`Line item with ID ${lineId} not found`);
      }

      await this.validateOrderNotPaid(line.pos_order);

      // Update fields
      if (dto.quantity !== undefined) {
        line.quantity = dto.quantity;
      }

      if (dto.discount_percentage !== undefined) {
        line.discount_percentage = dto.discount_percentage;
      }

      if (dto.notes !== undefined) {
        line.notes = dto.notes;
      }

      // Recalculate line totals
      line.subtotal = line.quantity * line.unit_price;
      line.discount_amount = line.subtotal * (line.discount_percentage / 100);
      line.line_total = line.subtotal - line.discount_amount;

      await queryRunner.manager.save(line);

      // Recalculate order totals
      await this.calculateOrderTotals(line.pos_order, queryRunner);

      await queryRunner.commitTransaction();

      const result = await this.posOrderLineRepo.findOne({
        where: { id: lineId },
        relations: ['product', 'uom'],
      });

      if (!result) {
        throw new NotFoundException(`Line item with ID ${lineId} not found`);
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Remove a line item
   * Requirements: 9.1-9.4
   */
  async removeLineItem(lineId: string, tenantId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const line = await queryRunner.manager.findOne(POSOrderLine, {
        where: { id: lineId },
        relations: ['pos_order'],
      });

      if (!line) {
        throw new NotFoundException(`Line item with ID ${lineId} not found`);
      }

      // Validate order belongs to tenant and is not paid
      if (line.pos_order.tenant_id !== tenantId) {
        throw new NotFoundException(`Line item with ID ${lineId} not found`);
      }

      await this.validateOrderNotPaid(line.pos_order);

      // Remove line
      await queryRunner.manager.remove(line);

      // Recalculate order totals
      await this.calculateOrderTotals(line.pos_order, queryRunner);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ========================================
   * PAYMENT PROCESSING
   * ========================================
   */

  /**
   * Process a payment for an order
   * Requirements: 11.1-11.10
   */
  async processPayment(
    orderId: string,
    dto: ProcessPaymentDto,
    tenantId: string,
    cashierId: string,
  ): Promise<POSPayment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate order exists and is not paid
      const order = await queryRunner.manager.findOne(POSOrder, {
        where: { id: orderId, tenant_id: tenantId },
        relations: ['lines'],
      });

      if (!order) {
        throw new NotFoundException(
          `Order with ID ${orderId} not found for this tenant`,
        );
      }

      await this.validateOrderNotPaid(order);

      // Add tip to order if provided
      if (dto.tip) {
        order.tip = Number(dto.tip);
        order.total = Number(order.subtotal) + Number(order.tax) - Number(order.discount) + Number(order.tip);
      }

      // Validate payment amount
      if (dto.amount < order.total) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) is less than order total (${order.total})`,
        );
      }

      // Get active cash shift
      const cashShift = await this.cashShiftService.getCurrentShift(
        cashierId,
        order.warehouse_id,
        tenantId,
      );

      if (!cashShift) {
        throw new BadRequestException(
          'No active cash shift found. Please open a cash shift first.',
        );
      }

      // Calculate change for cash payments
      let changeAmount = 0;
      if (dto.payment_method === 'cash' && dto.received_amount) {
        changeAmount = Number(dto.received_amount) - Number(dto.amount);
        if (changeAmount < 0) {
          throw new BadRequestException(
            'Received amount is less than payment amount',
          );
        }
      }

      // Create payment
      const payment = this.posPaymentRepo.create({
        pos_order_id: orderId,
        payment_method: dto.payment_method,
        amount: dto.amount,
        received_amount: dto.received_amount,
        change_amount: changeAmount,
        reference: dto.reference,
        cashier_id: cashierId,
        cash_shift_id: cashShift.id,
      });

      const savedPayment = await queryRunner.manager.save(payment);

      // Update order
      order.status = 'paid';
      order.paid_at = new Date();
      order.cashier_id = cashierId;
      await queryRunner.manager.save(order);

      // Create inventory movements
      await this.createInventoryMovements(order, tenantId, cashierId, queryRunner);

      // Release table if applicable
      if (order.table_number) {
        await this.releaseTableInternal(
          order.table_number,
          order.warehouse_id,
          tenantId,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();

      const result = await this.posPaymentRepo.findOne({
        where: { id: savedPayment.id },
        relations: ['cashier', 'cash_shift'],
      });

      if (!result) {
        throw new NotFoundException(`Payment with ID ${savedPayment.id} not found`);
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Process split payment for an order
   * Requirements: 12.1-12.5
   */
  async processSplitPayment(
    orderId: string,
    payments: ProcessPaymentDto[],
    tenantId: string,
    cashierId: string,
  ): Promise<POSPayment[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate order exists and is not paid
      const order = await queryRunner.manager.findOne(POSOrder, {
        where: { id: orderId, tenant_id: tenantId },
        relations: ['lines'],
      });

      if (!order) {
        throw new NotFoundException(
          `Order with ID ${orderId} not found for this tenant`,
        );
      }

      await this.validateOrderNotPaid(order);

      // Validate sum of payments equals order total
      const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      if (Math.abs(totalPayments - Number(order.total)) > 0.01) {
        throw new BadRequestException(
          `Sum of payments (${totalPayments}) does not equal order total (${order.total})`,
        );
      }

      // Get active cash shift
      const cashShift = await this.cashShiftService.getCurrentShift(
        cashierId,
        order.warehouse_id,
        tenantId,
      );

      if (!cashShift) {
        throw new BadRequestException(
          'No active cash shift found. Please open a cash shift first.',
        );
      }

      // Create all payments
      const savedPayments: POSPayment[] = [];
      for (const paymentDto of payments) {
        let changeAmount = 0;
        if (paymentDto.payment_method === 'cash' && paymentDto.received_amount) {
          changeAmount = Number(paymentDto.received_amount) - Number(paymentDto.amount);
          if (changeAmount < 0) {
            throw new BadRequestException(
              'Received amount is less than payment amount',
            );
          }
        }

        const payment = this.posPaymentRepo.create({
          pos_order_id: orderId,
          payment_method: paymentDto.payment_method,
          amount: paymentDto.amount,
          received_amount: paymentDto.received_amount,
          change_amount: changeAmount,
          reference: paymentDto.reference,
          cashier_id: cashierId,
          cash_shift_id: cashShift.id,
        });

        const savedPayment = await queryRunner.manager.save(payment);
        savedPayments.push(savedPayment);
      }

      // Update order
      order.status = 'paid';
      order.paid_at = new Date();
      order.cashier_id = cashierId;
      await queryRunner.manager.save(order);

      // Create inventory movements
      await this.createInventoryMovements(order, tenantId, cashierId, queryRunner);

      // Release table if applicable
      if (order.table_number) {
        await this.releaseTableInternal(
          order.table_number,
          order.warehouse_id,
          tenantId,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();

      return this.posPaymentRepo.find({
        where: { pos_order_id: orderId },
        relations: ['cashier', 'cash_shift'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ========================================
   * TABLE MANAGEMENT
   * ========================================
   */

  /**
   * Assign a table to an order
   */
  async assignTable(
    orderId: string,
    tableNumber: string,
    tenantId: string,
  ): Promise<POSOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(POSOrder, {
        where: { id: orderId, tenant_id: tenantId },
      });

      if (!order) {
        throw new NotFoundException(
          `Order with ID ${orderId} not found for this tenant`,
        );
      }

      await this.validateOrderNotPaid(order);

      const table = await queryRunner.manager.findOne(POSTable, {
        where: {
          tenant_id: tenantId,
          warehouse_id: order.warehouse_id,
          table_number: tableNumber,
        },
      });

      if (!table) {
        throw new NotFoundException(
          `Table ${tableNumber} not found in this warehouse`,
        );
      }

      if (table.status !== 'available') {
        throw new BadRequestException(
          `Table ${tableNumber} is not available`,
        );
      }

      // Update order
      order.table_number = tableNumber;
      order.zone = table.zone;
      await queryRunner.manager.save(order);

      // Update table
      table.status = 'occupied';
      table.current_order_id = orderId;
      await queryRunner.manager.save(table);

      await queryRunner.commitTransaction();

      return this.findOrder(orderId, tenantId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Release a table
   */
  async releaseTable(
    tableNumber: string,
    warehouseId: string,
    tenantId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.releaseTableInternal(tableNumber, warehouseId, tenantId, queryRunner);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ========================================
   * KITCHEN INTEGRATION
   * ========================================
   */

  /**
   * Update line item status (for kitchen display)
   * Requirements: 17.1-17.5
   */
  async updateLineStatus(
    lineId: string,
    status: string,
    tenantId: string,
  ): Promise<POSOrderLine> {
    const line = await this.posOrderLineRepo.findOne({
      where: { id: lineId },
      relations: ['pos_order'],
    });

    if (!line) {
      throw new NotFoundException(`Line item with ID ${lineId} not found`);
    }

    if (line.pos_order.tenant_id !== tenantId) {
      throw new NotFoundException(`Line item with ID ${lineId} not found`);
    }

    // Update line status
    line.status = status;
    await this.posOrderLineRepo.save(line);

    // Check if all lines are ready, update order status
    const allLines = await this.posOrderLineRepo.find({
      where: { pos_order_id: line.pos_order_id },
    });

    const allReady = allLines.every((l) => l.status === 'ready' || l.status === 'delivered');
    if (allReady && line.pos_order.status === 'in_progress') {
      line.pos_order.status = 'ready';
      await this.posOrderRepo.save(line.pos_order);
    }

    const result = await this.posOrderLineRepo.findOne({
      where: { id: lineId },
      relations: ['product', 'uom'],
    });

    if (!result) {
      throw new NotFoundException(`Line item with ID ${lineId} not found`);
    }

    return result;
  }

  /**
   * Get orders for kitchen display
   * Requirements: 17.1-17.5
   */
  async getKitchenOrders(
    warehouseId: string,
    tenantId: string,
  ): Promise<POSOrder[]> {
    return this.posOrderRepo.find({
      where: {
        tenant_id: tenantId,
        warehouse_id: warehouseId,
      },
      relations: ['lines', 'lines.product', 'waiter'],
      order: { created_at: 'ASC' },
    });
  }

  /**
   * ========================================
   * HELPER METHODS
   * ========================================
   */

  /**
   * Calculate order totals
   * Requirements: 10.1-10.6
   */
  private async calculateOrderTotals(
    order: POSOrder,
    queryRunner?: any,
  ): Promise<void> {
    const manager = queryRunner ? queryRunner.manager : this.posOrderRepo.manager;

    // Get all lines for the order
    const lines = await manager.find(POSOrderLine, {
      where: { pos_order_id: order.id },
    });

    // Calculate subtotal
    const subtotal = lines.reduce((sum, line) => sum + Number(line.line_total), 0);

    // Calculate tax (assuming 0% for now, can be configured)
    const taxRate = 0;
    const tax = subtotal * taxRate;

    // Calculate total
    const total = subtotal + tax - Number(order.discount) + Number(order.tip);

    // Update order
    order.subtotal = subtotal;
    order.tax = tax;
    order.total = total;

    await manager.save(POSOrder, order);
  }

  /**
   * Generate sequential order number
   * Format: YYYYMMDD-XXXX
   */
  private async generateOrderNumber(
    tenantId: string,
    warehouseId: string,
  ): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of orders today for this tenant and warehouse
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const queryBuilder = this.posOrderRepo.createQueryBuilder('order');
    const count = await queryBuilder
      .where('order.tenant_id = :tenantId', { tenantId })
      .andWhere('order.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('order.created_at >= :startOfDay', { startOfDay })
      .andWhere('order.created_at <= :endOfDay', { endOfDay })
      .getCount();

    const sequence = (count + 1).toString().padStart(4, '0');
    return `${dateStr}-${sequence}`;
  }

  /**
   * Validate order is not paid
   */
  private async validateOrderNotPaid(order: POSOrder): Promise<void> {
    if (order.status === 'paid') {
      throw new BadRequestException(
        'Cannot modify a paid order',
      );
    }
  }

  /**
   * Create inventory movements for order lines
   * Requirements: 19.1-19.6
   */
  private async createInventoryMovements(
    order: POSOrder,
    tenantId: string,
    userId: string,
    queryRunner: any,
  ): Promise<void> {
    const lines = await queryRunner.manager.find(POSOrderLine, {
      where: { pos_order_id: order.id },
    });

    for (const line of lines) {
      try {
        await this.inventoryService.createInventoryMovement(
          {
            product_id: line.product_id,
            warehouse_id: order.warehouse_id,
            uom_id: line.uom_id,
            movement_type: 'sales_shipment',
            quantity: -Math.abs(line.quantity),
            unit_cost: line.unit_price,
            reference_type: 'pos_order',
            reference_id: order.id,
            movement_date: new Date().toISOString(),
            notes: `POS Order ${order.order_number}`,
          },
          tenantId,
          userId,
        );
      } catch (error) {
        // If inventory movement fails, log but don't fail the payment
        console.error(`Failed to create inventory movement for line ${line.id}:`, error);
      }
    }
  }

  /**
   * Release table (internal method with query runner)
   */
  private async releaseTableInternal(
    tableNumber: string,
    warehouseId: string,
    tenantId: string,
    queryRunner: any,
  ): Promise<void> {
    const table = await queryRunner.manager.findOne(POSTable, {
      where: {
        tenant_id: tenantId,
        warehouse_id: warehouseId,
        table_number: tableNumber,
      },
    });

    if (table && table.status === 'occupied') {
      table.status = 'available';
      table.current_order_id = null;
      await queryRunner.manager.save(table);
    }
  }
}
