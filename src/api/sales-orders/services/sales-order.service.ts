import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
import { CreateSalesOrderDto, CreateSalesOrderLineItemDto } from '../dto/create-sales-order.dto';
import { QuerySalesOrderDto } from '../dto/query-sales-order.dto';
import { FulfillSalesOrderDto } from '../dto/fulfill-sales-order.dto';
import { SalesOrderFolioService } from './sales-order-folio.service';
import { SalesOrderFulfillmentService } from './sales-order-fulfillment.service';

@Injectable()
export class SalesOrderService {
  private readonly logger = new Logger(SalesOrderService.name);

  constructor(
    @InjectRepository(SalesOrder)
    private readonly soRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderDetail)
    private readonly detailRepo: Repository<SalesOrderDetail>,
    @InjectRepository(SalesOrderBatchAllocation)
    private readonly allocationRepo: Repository<SalesOrderBatchAllocation>,
    private readonly folioService: SalesOrderFolioService,
    private readonly fulfillmentService: SalesOrderFulfillmentService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Accepts either product_uom.id (preferred) or uom_catalog.id (fallback).
   * Returns the resolved ProductUoM row used by sales-order logic.
   */
  private async resolveProductUom(
    qr: QueryRunner,
    productId: string,
    providedUomId: string,
  ): Promise<{ id: string; factor: number; is_base: boolean; uom_catalog_id: string }> {
    const [productUomRow] = await qr.manager.query(
      `SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
       FROM product_uoms pu
       WHERE pu.id = ? AND pu.product_id = ?
       LIMIT 1`,
      [providedUomId, productId],
    );

    if (productUomRow) {
      return productUomRow;
    }

    const [productUomByCatalog] = await qr.manager.query(
      `SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
       FROM product_uoms pu
       WHERE pu.product_id = ? AND pu.uom_catalog_id = ?
       LIMIT 1`,
      [productId, providedUomId],
    );

    if (productUomByCatalog) {
      return productUomByCatalog;
    }

    throw new BadRequestException(`UOM no encontrado: ${providedUomId}`);
  }

  async create(dto: CreateSalesOrderDto, tenantId: string, userId: string): Promise<SalesOrder> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const folio = await this.folioService.generateFolio(tenantId);

      const so = qr.manager.create(SalesOrder, {
        id: uuidv4(),
        tenant_id: tenantId,
        folio,
        fiscal_configuration_id: dto.fiscal_configuration_id,
        warehouse_id: dto.warehouse_id,
        customer_id: dto.customer_id,
        expected_delivery_date: new Date(dto.expected_delivery_date),
        sales_order_type: dto.sales_order_type || 'MANUAL',
        fiscal_razon_social: dto.fiscal_razon_social,
        payment_status: dto.payment_status || 'Pendiente',
        general_status: 'Creada',
        notes: dto.notes,
        created_by: userId,
      });

      const savedSO = await qr.manager.save(SalesOrder, so);
      const savedDetails: SalesOrderDetail[] = [];

      let subtotal = 0, iva_total = 0, ieps_total = 0, discount_total = 0;

      for (const item of dto.line_items) {
        const line_subtotal = Number(item.quantity) * Number(item.unit_price);
        const discount_pct = Number(item.discount_percentage || 0);
        const line_discount = (line_subtotal * discount_pct) / 100;
        const taxable_subtotal = Math.max(line_subtotal - line_discount, 0);
        const iva_pct = Number(item.iva_percentage || 0);
        const ieps_pct = Number(item.ieps_percentage || 0);
        const line_iva = (taxable_subtotal * iva_pct) / 100;
        const line_ieps = (taxable_subtotal * ieps_pct) / 100;

        // Resolve base UOM for this product UOM
        const productUomRow = await this.resolveProductUom(
          qr,
          item.product_id,
          item.product_uom_id,
        );

        const [baseUomRow] = await qr.manager.query(
          `SELECT pu.uom_catalog_id FROM product_uoms pu
           WHERE pu.product_id = ? AND pu.is_base = 1 LIMIT 1`,
          [item.product_id],
        );

        if (!baseUomRow) {
          throw new BadRequestException(`UOM base no encontrado para producto: ${item.product_id}`);
        }

        const factor = productUomRow.factor || 1;
        const qty_base = productUomRow.is_base
          ? Number(item.quantity)
          : Number(item.quantity) * factor;

        const detail = qr.manager.create(SalesOrderDetail, {
          id: uuidv4(),
          sales_order_id: savedSO.id,
          product_id: item.product_id,
          product_uom_id: productUomRow.id,
          quantity: item.quantity,
          quantity_base_uom: qty_base,
          base_uom_id: baseUomRow.uom_catalog_id,
          unit_price: item.unit_price,
          discount_percentage: discount_pct,
          discount_unit: Number(item.quantity) > 0 ? line_discount / Number(item.quantity) : 0,
          iva_percentage: iva_pct,
          iva_unit: Number(item.quantity) > 0 ? line_iva / Number(item.quantity) : 0,
          ieps_percentage: ieps_pct,
          ieps_unit: Number(item.quantity) > 0 ? line_ieps / Number(item.quantity) : 0,
          created_by: userId,
        });

        await qr.manager.save(SalesOrderDetail, detail);
        savedDetails.push(detail);

        subtotal += line_subtotal;
        discount_total += line_discount;
        iva_total += line_iva;
        ieps_total += line_ieps;
      }

      savedSO.subtotal = subtotal;
      savedSO.discount_total = discount_total;
      savedSO.iva_total = iva_total;
      savedSO.ieps_total = ieps_total;
      savedSO.total = subtotal - discount_total + iva_total + ieps_total;
      await qr.manager.save(SalesOrder, savedSO);

      if ((dto.sales_order_type || 'MANUAL') === 'POS') {
        await this.fulfillOrderLines(
          qr,
          savedSO.id,
          dto.warehouse_id,
          savedDetails,
          userId,
        );
        this.logger.log(`POS sales order ${folio} auto-fulfilled by user ${userId}`);
      }

      await qr.commitTransaction();
      return this.findOne(savedSO.id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAll(tenantId: string, filters: QuerySalesOrderDto) {
    const { search, general_status, payment_status, sales_order_type, warehouse_id, customer_id,
            created_from, created_to, page = 1, limit = 20,
            sort_by = 'created_at', sort_order = 'DESC' } = filters;

    const qb = this.soRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .where('so.tenant_id = :tenantId', { tenantId });

    if (search) {
      qb.andWhere(
        '(so.folio LIKE :s OR customer.name LIKE :s OR customer.lastname LIKE :s OR CONCAT(customer.name, \' \', COALESCE(customer.lastname, \'\')) LIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (general_status) qb.andWhere('so.general_status = :general_status', { general_status });
    if (payment_status) qb.andWhere('so.payment_status = :payment_status', { payment_status });
    if (sales_order_type) qb.andWhere('so.sales_order_type = :sales_order_type', { sales_order_type });
    if (warehouse_id) qb.andWhere('so.warehouse_id = :warehouse_id', { warehouse_id });
    if (customer_id) qb.andWhere('so.customer_id = :customer_id', { customer_id });
    if (created_from) qb.andWhere('so.created_at >= :created_from', { created_from: new Date(created_from) });
    if (created_to) qb.andWhere('so.created_at <= :created_to', { created_to: new Date(created_to) });

    const sortCol = sort_by === 'total' ? 'so.total' : sort_by === 'folio' ? 'so.folio' : 'so.created_at';
    qb.orderBy(sortCol, sort_order).skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string): Promise<SalesOrder> {
    const so = await this.soRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: [
        'customer', 'warehouse', 'fiscal_configuration',
        'line_items', 'line_items.product', 'line_items.product_uom', 'line_items.product_uom.uom',
        'line_items.base_uom',
        'line_items.batch_allocations', 'line_items.batch_allocations.inventory_batch',
      ],
    });
    if (!so) throw new NotFoundException(`Sales order not found: ${id}`);
    return so;
  }

  /**
   * Fulfill (surtir) a sales order.
   * Runs FIFO batch allocation for every line item inside a single transaction.
   * Deducts available_quantity from the corresponding inventory batches.
   */
  async fulfill(id: string, dto: FulfillSalesOrderDto, tenantId: string, userId: string): Promise<SalesOrder> {
    const so = await this.findOne(id, tenantId);

    if (so.general_status !== 'Creada') {
      throw new BadRequestException(`La orden ${so.folio} ya fue ${so.general_status.toLowerCase()}`);
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      await this.fulfillOrderLines(
        qr,
        id,
        so.warehouse_id,
        so.line_items,
        userId,
        dto.notes ?? so.notes,
      );

      await qr.commitTransaction();
      this.logger.log(`Sales order ${so.folio} fulfilled by user ${userId}`);
      return this.findOne(id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async cancel(id: string, tenantId: string, userId: string): Promise<SalesOrder> {
    const so = await this.findOne(id, tenantId);

    if (so.general_status === 'Cancelada') {
      throw new BadRequestException('La orden ya está cancelada');
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // If already fulfilled, release inventory back
      if (so.general_status === 'Surtida') {
        const allAllocations = so.line_items.flatMap((d) => d.batch_allocations ?? []);
        await this.fulfillmentService.releaseAllocations(allAllocations, qr.manager);
      }

      await qr.manager.update(SalesOrder, { id }, {
        general_status: 'Cancelada',
        updated_by: userId,
      });

      await qr.commitTransaction();
      return this.findOne(id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async replace(
    id: string,
    dto: CreateSalesOrderDto,
    tenantId: string,
    userId: string,
  ): Promise<SalesOrder> {
    const existing = await this.findOne(id, tenantId);
    if (existing.general_status !== 'Creada') {
      throw new BadRequestException(
        `Cannot edit sales order with status: ${existing.general_status}`,
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      await qr.manager.delete(SalesOrderDetail, { sales_order_id: id });
      const so = await qr.manager.findOne(SalesOrder, { where: { id, tenant_id: tenantId } });
      if (!so) {
        throw new NotFoundException(`Sales order not found: ${id}`);
      }

      so.fiscal_configuration_id = dto.fiscal_configuration_id;
      so.warehouse_id = dto.warehouse_id;
      so.customer_id = dto.customer_id;
      so.expected_delivery_date = new Date(dto.expected_delivery_date);
      so.sales_order_type = dto.sales_order_type || so.sales_order_type || 'MANUAL';
      if (dto.fiscal_razon_social !== undefined) {
        so.fiscal_razon_social = dto.fiscal_razon_social;
      }
      so.payment_status = dto.payment_status || so.payment_status;
      if (dto.notes !== undefined) {
        so.notes = dto.notes;
      }
      so.updated_by = userId;

      await qr.manager.save(SalesOrder, so);
      await this.insertSalesOrderLineItems(qr, so.id, dto.line_items, userId);
      await this.recomputeTotals(qr, so.id, tenantId, userId);

      await qr.commitTransaction();
      return this.findOne(id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  private async fulfillOrderLines(
    qr: QueryRunner,
    salesOrderId: string,
    warehouseId: string,
    lineItems: SalesOrderDetail[],
    userId: string,
    notes?: string,
  ): Promise<void> {
    for (const detail of lineItems) {
      await this.fulfillmentService.allocateFifo(detail, warehouseId, userId, qr.manager);
    }

    await qr.manager.update(SalesOrder, { id: salesOrderId }, {
      general_status: 'Surtida',
      ...(notes !== undefined ? { notes } : {}),
      updated_by: userId,
    });
  }

  private async insertSalesOrderLineItems(
    qr: QueryRunner,
    salesOrderId: string,
    lineItems: CreateSalesOrderLineItemDto[],
    userId: string,
  ): Promise<void> {
    for (const item of lineItems) {
      const line_subtotal = Number(item.quantity) * Number(item.unit_price);
      const discount_pct = Number(item.discount_percentage || 0);
      const line_discount = (line_subtotal * discount_pct) / 100;
      const taxable_subtotal = Math.max(line_subtotal - line_discount, 0);
      const iva_pct = Number(item.iva_percentage || 0);
      const ieps_pct = Number(item.ieps_percentage || 0);
      const line_iva = (taxable_subtotal * iva_pct) / 100;
      const line_ieps = (taxable_subtotal * ieps_pct) / 100;

      const productUomRow = await this.resolveProductUom(
        qr,
        item.product_id,
        item.product_uom_id,
      );

      const [baseUomRow] = await qr.manager.query(
        `SELECT pu.uom_catalog_id FROM product_uoms pu
         WHERE pu.product_id = ? AND pu.is_base = 1 LIMIT 1`,
        [item.product_id],
      );
      if (!baseUomRow) {
        throw new BadRequestException(`UOM base no encontrado para producto: ${item.product_id}`);
      }

      const factor = productUomRow.factor || 1;
      const qty_base = productUomRow.is_base
        ? Number(item.quantity)
        : Number(item.quantity) * factor;

      const detail = qr.manager.create(SalesOrderDetail, {
        id: uuidv4(),
        sales_order_id: salesOrderId,
        product_id: item.product_id,
        product_uom_id: productUomRow.id,
        quantity: item.quantity,
        quantity_base_uom: qty_base,
        base_uom_id: baseUomRow.uom_catalog_id,
        unit_price: item.unit_price,
        discount_percentage: discount_pct,
        discount_unit: Number(item.quantity) > 0 ? line_discount / Number(item.quantity) : 0,
        iva_percentage: iva_pct,
        iva_unit: Number(item.quantity) > 0 ? line_iva / Number(item.quantity) : 0,
        ieps_percentage: ieps_pct,
        ieps_unit: Number(item.quantity) > 0 ? line_ieps / Number(item.quantity) : 0,
        created_by: userId,
      });
      await qr.manager.save(SalesOrderDetail, detail);
    }
  }

  private async recomputeTotals(
    qr: QueryRunner,
    salesOrderId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const so = await qr.manager.findOne(SalesOrder, { where: { id: salesOrderId, tenant_id: tenantId } });
    if (!so) {
      throw new NotFoundException(`Sales order not found: ${salesOrderId}`);
    }

    const details = await qr.manager.find(SalesOrderDetail, { where: { sales_order_id: salesOrderId } });
    let subtotal = 0;
    let discount_total = 0;
    let iva_total = 0;
    let ieps_total = 0;
    for (const detail of details) {
      const qty = Number(detail.quantity || 0);
      const line_subtotal = qty * Number(detail.unit_price || 0);
      const line_discount = qty * Number(detail.discount_unit || 0);
      const taxable_subtotal = Math.max(line_subtotal - line_discount, 0);
      subtotal += line_subtotal;
      discount_total += line_discount;
      iva_total += (taxable_subtotal * Number(detail.iva_percentage || 0)) / 100;
      ieps_total += (taxable_subtotal * Number(detail.ieps_percentage || 0)) / 100;
    }
    so.subtotal = subtotal;
    so.discount_total = discount_total;
    so.iva_total = iva_total;
    so.ieps_total = ieps_total;
    so.total = subtotal - discount_total + iva_total + ieps_total;
    so.updated_by = userId;
    await qr.manager.save(SalesOrder, so);
  }
}
