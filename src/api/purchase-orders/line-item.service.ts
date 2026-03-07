import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LineItem } from '../../entities/purchase-orders/line-item.entity';
import { CreateLineItemDto } from './dto/create-line-item.dto';
import { TaxCalculationService } from './tax-calculation.service';
import { PurchaseOrderService } from './purchase-order.service';

@Injectable()
export class LineItemService {
  constructor(
    @InjectRepository(LineItem)
    private repo: Repository<LineItem>,
    private taxCalculationService: TaxCalculationService,
    private poService: PurchaseOrderService,
  ) {}

  async addLineItem(
    purchaseOrderId: string,
    dto: CreateLineItemDto,
    tenantId: string,
  ): Promise<LineItem> {
    // Verify PO exists and belongs to tenant
    const po = await this.poService.findOne(purchaseOrderId, tenantId);

    if (po.status === 'Cancelada') {
      throw new ConflictException('Cannot add line items to a cancelled purchase order');
    }

    // Calculate totals
    const totals = this.taxCalculationService.calculateLineItemTotals(
      dto.quantity,
      dto.unit_price,
      dto.iva_percentage || 0,
      dto.ieps_percentage || 0,
    );

    const lineItem = this.repo.create({
      purchase_order_id: purchaseOrderId,
      product_id: dto.product_id,
      quantity: dto.quantity,
      unit_price: dto.unit_price,
      subtotal: totals.subtotal,
      iva_percentage: dto.iva_percentage || 0,
      iva_amount: totals.iva_amount,
      ieps_percentage: dto.ieps_percentage || 0,
      ieps_amount: totals.ieps_amount,
      line_total: totals.line_total,
    });

    const saved = await this.repo.save(lineItem);

    // Recalculate order totals
    await this.poService.recalculateTotals(purchaseOrderId, tenantId);

    return saved;
  }

  async editLineItem(
    purchaseOrderId: string,
    lineItemId: string,
    dto: CreateLineItemDto,
    tenantId: string,
  ): Promise<LineItem> {
    // Verify PO exists and belongs to tenant
    const po = await this.poService.findOne(purchaseOrderId, tenantId);

    if (po.status === 'Cancelada') {
      throw new ConflictException('Cannot edit line items in a cancelled purchase order');
    }

    const lineItem = await this.repo.findOne({
      where: { id: lineItemId, purchase_order_id: purchaseOrderId },
    });

    if (!lineItem) {
      throw new NotFoundException(`Line item with ID ${lineItemId} not found`);
    }

    // Calculate new totals
    const totals = this.taxCalculationService.calculateLineItemTotals(
      dto.quantity,
      dto.unit_price,
      dto.iva_percentage || 0,
      dto.ieps_percentage || 0,
    );

    lineItem.product_id = dto.product_id;
    lineItem.quantity = dto.quantity;
    lineItem.unit_price = dto.unit_price;
    lineItem.subtotal = totals.subtotal;
    lineItem.iva_percentage = dto.iva_percentage || 0;
    lineItem.iva_amount = totals.iva_amount;
    lineItem.ieps_percentage = dto.ieps_percentage || 0;
    lineItem.ieps_amount = totals.ieps_amount;
    lineItem.line_total = totals.line_total;

    const saved = await this.repo.save(lineItem);

    // Recalculate order totals
    await this.poService.recalculateTotals(purchaseOrderId, tenantId);

    return saved;
  }

  async removeLineItem(
    purchaseOrderId: string,
    lineItemId: string,
    tenantId: string,
  ): Promise<void> {
    // Verify PO exists and belongs to tenant
    const po = await this.poService.findOne(purchaseOrderId, tenantId);

    if (po.status === 'Cancelada') {
      throw new ConflictException('Cannot remove line items from a cancelled purchase order');
    }

    const lineItem = await this.repo.findOne({
      where: { id: lineItemId, purchase_order_id: purchaseOrderId },
    });

    if (!lineItem) {
      throw new NotFoundException(`Line item with ID ${lineItemId} not found`);
    }

    await this.repo.remove(lineItem);

    // Recalculate order totals
    await this.poService.recalculateTotals(purchaseOrderId, tenantId);
  }
}
