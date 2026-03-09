import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from '../../entities/purchase-orders/purchase-order.entity';
import { LineItem } from '../../entities/purchase-orders/line-item.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { CancelPurchaseOrderDto } from './dto/cancel-purchase-order.dto';
import { PaginatedPurchaseOrderDto } from './dto/paginated-purchase-order.dto';
import { TaxCalculationService } from './tax-calculation.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class PurchaseOrderService {
  private readonly logger = new Logger(PurchaseOrderService.name);

  constructor(
    @InjectRepository(PurchaseOrder)
    private repo: Repository<PurchaseOrder>,
    @InjectRepository(LineItem)
    private lineItemRepo: Repository<LineItem>,
    private taxCalculationService: TaxCalculationService,
    private inventoryService: InventoryService,
  ) {}

  async create(dto: CreatePurchaseOrderDto, tenantId: string, creatorId: string): Promise<PurchaseOrder> {
    // Validate vendor_id and warehouse_id exist (in real implementation, call external services)
    // For now, we'll assume they're valid UUIDs

    // Calculate totals if line items are provided
    let totals = {
      total_subtotal: 0,
      total_iva: 0,
      total_ieps: 0,
      grand_total: 0,
    };

    let processedLineItems: LineItem[] = [];

    if (dto.line_items && dto.line_items.length > 0) {
      // Calculate line item totals and create LineItem instances
      processedLineItems = dto.line_items.map(item => {
        const subtotal = Number(item.quantity) * Number(item.unit_price);
        const iva_percentage = Number(item.iva_percentage || 0);
        const ieps_percentage = Number(item.ieps_percentage || 0);
        
        const iva_amount = (subtotal * iva_percentage) / 100;
        const ieps_amount = (subtotal * ieps_percentage) / 100;
        const line_total = subtotal + iva_amount + ieps_amount;

        return this.lineItemRepo.create({
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

    const po = this.repo.create({
      vendor_id: dto.vendor_id,
      purpose: dto.purpose,
      warehouse_id: dto.warehouse_id,
      tentative_receipt_date: dto.tentative_receipt_date,
      tenant_id: tenantId,
      creator_id: creatorId,
      status: dto.status || 'En Proceso',
      payment_status: 'No pagado',
      total_subtotal: Number(totals.total_subtotal.toFixed(2)),
      total_iva: Number(totals.total_iva.toFixed(2)),
      total_ieps: Number(totals.total_ieps.toFixed(2)),
      grand_total: Number(totals.grand_total.toFixed(2)),
      remaining_amount: Number(totals.grand_total.toFixed(2)),
      line_items: processedLineItems,
      payments: [],
      documents: [],
    });

    return this.repo.save(po);
  }

  async findAll(
    tenantId: string,
    query?: QueryPurchaseOrderDto,
  ): Promise<PaginatedPurchaseOrderDto> {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('po')
      .where('po.tenant_id = :tenantId', { tenantId })
      .leftJoinAndSelect('po.vendor', 'vendor')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('po.line_items', 'line_items')
      .leftJoinAndSelect('line_items.product', 'product')
      .leftJoinAndSelect('line_items.uom', 'uom')
      .leftJoinAndSelect('po.payments', 'payments')
      .leftJoinAndSelect('po.documents', 'documents');

    if (query?.vendor_id) {
      queryBuilder.andWhere('po.vendor_id = :vendor_id', { vendor_id: query.vendor_id });
    }

    if (query?.status) {
      queryBuilder.andWhere('po.status = :status', { status: query.status });
    }

    if (query?.start_date) {
      queryBuilder.andWhere('po.created_at >= :start_date', { start_date: query.start_date });
    }

    if (query?.end_date) {
      queryBuilder.andWhere('po.created_at <= :end_date', { end_date: query.end_date });
    }

    queryBuilder.orderBy('po.created_at', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder.skip(skip).take(limit).getMany();

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

  async findOne(id: string, tenantId: string): Promise<PurchaseOrder> {
    const po = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
      relations: [
        'vendor',
        'warehouse',
        'line_items',
        'line_items.product',
        'line_items.uom',
        'payments',
        'documents',
      ],
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found`);
    }

    return po;
  }

  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
    tenantId: string,
  ): Promise<PurchaseOrder> {
    const po = await this.findOne(id, tenantId);

    if (po.status === 'Cancelada') {
      throw new ConflictException('Cannot modify a cancelled purchase order');
    }

    // Preserve created_at timestamp
    const createdAt = po.created_at;

    Object.assign(po, dto);

    // Restore created_at
    po.created_at = createdAt;

    return this.repo.save(po);
  }

  async updateStatus(id: string, newStatus: string, tenantId: string, userId?: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id, tenantId);
    const previousStatus = po.status;

    const validStatuses = ['En Proceso', 'Recibida', 'Cancelada'];
    if (!validStatuses.includes(newStatus)) {
      throw new BadRequestException(`Invalid status: ${newStatus}`);
    }

    po.status = newStatus;
    const updatedPo = await this.repo.save(po);

    // Handle inventory integration when purchase order is received
    if (newStatus === 'Recibida' && previousStatus !== 'Recibida') {
      await this.handlePurchaseReceipt(updatedPo, tenantId, userId);
    }

    return updatedPo;
  }

  /**
   * Handle inventory movements when purchase order is received
   * @param purchaseOrder - The purchase order
   * @param tenantId - Tenant ID
   * @param userId - User ID for inventory operations
   */
  private async handlePurchaseReceipt(
    purchaseOrder: PurchaseOrder,
    tenantId: string,
    userId?: string,
  ): Promise<void> {
    try {
      this.logger.log(`Creating inventory movements for purchase order ${purchaseOrder.id}`);

      for (const lineItem of purchaseOrder.line_items) {
        try {
          await this.inventoryService.createInventoryMovement(
            {
              product_id: lineItem.product_id,
              warehouse_id: purchaseOrder.warehouse_id,
              uom_id: lineItem.uom_id,
              movement_type: 'purchase_receipt',
              quantity: lineItem.quantity,
              unit_cost: lineItem.unit_price,
              reference_type: 'purchase_order',
              reference_id: purchaseOrder.id,
              notes: `Purchase receipt from PO ${purchaseOrder.id}`,
            },
            tenantId,
            userId || tenantId, // Fallback to tenantId if userId not provided
          );
          this.logger.log(`Created inventory movement for product ${lineItem.product_id}, quantity ${lineItem.quantity}`);
        } catch (error) {
          this.logger.error(`Failed to create inventory movement for line item ${lineItem.id}: ${error.message}`);
          // Continue processing other line items even if one fails
        }
      }
    } catch (error) {
      this.logger.error(`Error handling purchase receipt for PO ${purchaseOrder.id}: ${error.message}`, error.stack);
      // Don't throw - log error but allow status update to proceed
    }
  }

  async cancelPurchaseOrder(
    id: string,
    dto: CancelPurchaseOrderDto,
    tenantId: string,
  ): Promise<PurchaseOrder> {
    const po = await this.findOne(id, tenantId);

    if (po.status === 'Cancelada') {
      throw new ConflictException('Purchase order is already cancelled');
    }

    po.status = 'Cancelada';
    po.cancellation_date = new Date();
    po.cancellation_reason = dto.cancellation_reason;

    return this.repo.save(po);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const po = await this.findOne(id, tenantId);
    await this.repo.remove(po);
  }

  async recalculateTotals(id: string, tenantId: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id, tenantId);

    if (po.line_items && po.line_items.length > 0) {
      const totals = this.taxCalculationService.calculateOrderTotals(po.line_items);
      po.total_subtotal = totals.total_subtotal;
      po.total_iva = totals.total_iva;
      po.total_ieps = totals.total_ieps;
      po.grand_total = totals.grand_total;
    } else {
      po.total_subtotal = 0;
      po.total_iva = 0;
      po.total_ieps = 0;
      po.grand_total = 0;
    }

    return this.repo.save(po);
  }
}
