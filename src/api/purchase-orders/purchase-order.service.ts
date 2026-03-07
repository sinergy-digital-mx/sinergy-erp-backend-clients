import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from '../../entities/purchase-orders/purchase-order.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { CancelPurchaseOrderDto } from './dto/cancel-purchase-order.dto';
import { PaginatedPurchaseOrderDto } from './dto/paginated-purchase-order.dto';
import { TaxCalculationService } from './tax-calculation.service';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private repo: Repository<PurchaseOrder>,
    private taxCalculationService: TaxCalculationService,
  ) {}

  async create(dto: CreatePurchaseOrderDto, tenantId: string, creatorId: string): Promise<PurchaseOrder> {
    // Validate vendor_id and warehouse_id exist (in real implementation, call external services)
    // For now, we'll assume they're valid UUIDs

    const po = this.repo.create({
      ...dto,
      tenant_id: tenantId,
      creator_id: creatorId,
      status: dto.status || 'En Proceso',
      payment_status: 'No pagado',
      total_subtotal: 0,
      total_iva: 0,
      total_ieps: 0,
      grand_total: 0,
      remaining_amount: 0,
      line_items: [],
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
      .leftJoinAndSelect('po.line_items', 'line_items')
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
      relations: ['line_items', 'payments', 'documents'],
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

  async updateStatus(id: string, newStatus: string, tenantId: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id, tenantId);

    const validStatuses = ['En Proceso', 'Recibida', 'Cancelada'];
    if (!validStatuses.includes(newStatus)) {
      throw new BadRequestException(`Invalid status: ${newStatus}`);
    }

    po.status = newStatus;
    return this.repo.save(po);
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
