import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { SalesOrderFulfillmentService } from '../sales-orders/services/sales-order-fulfillment.service';
import { QueryWarehouseControlDto } from './dto/query-warehouse-control.dto';
import { CorroborateSalesOrderDto } from './dto/corroborate-sales-order.dto';
import {
  formatCustomerDisplayName,
  mapPosUser,
} from '../pos-shifts/mappers/pos-sale-collection.mapper';

@Injectable()
export class WarehouseControlService {
  private readonly logger = new Logger(WarehouseControlService.name);

  constructor(
    @InjectRepository(SalesOrder)
    private readonly soRepo: Repository<SalesOrder>,
    @InjectRepository(InventoryBatch)
    private readonly batchRepo: Repository<InventoryBatch>,
    private readonly fulfillmentService: SalesOrderFulfillmentService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Lista OV en En Selección pendientes de corroboración.
   */
  async findPending(tenantId: string, filters: QueryWarehouseControlDto) {
    const {
      search,
      billing_branch_id,
      warehouse_id,
      page = 1,
      limit = 20,
    } = filters;

    const qb = this.soRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'billing_branch')
      .leftJoinAndSelect('so.creator', 'creator')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.general_status = :status', { status: 'En Selección' });

    if (search) {
      qb.andWhere(
        `(so.folio LIKE :s
          OR customer.name LIKE :s
          OR customer.lastname LIKE :s
          OR CONCAT(customer.name, ' ', COALESCE(customer.lastname, '')) LIKE :s)`,
        { s: `%${search}%` },
      );
    }

    if (billing_branch_id) {
      qb.andWhere('warehouse.billing_branch_id = :billing_branch_id', {
        billing_branch_id,
      });
    }

    if (warehouse_id) {
      qb.andWhere('so.warehouse_id = :warehouse_id', { warehouse_id });
    }

    qb.orderBy('so.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();

    const data = rows.map((so) => ({
      id: so.id,
      folio: so.folio,
      general_status: so.general_status,
      payment_status: so.payment_status,
      expected_delivery_date: so.expected_delivery_date,
      total: so.total,
      notes: so.notes,
      requires_selection_assembly: so.requires_selection_assembly,
      created_at: so.created_at,
      customer: so.customer
        ? {
            id: so.customer.id,
            display_name: formatCustomerDisplayName(so.customer),
            name: so.customer.name,
            lastname: (so.customer as any).lastname ?? null,
          }
        : null,
      warehouse: so.warehouse
        ? {
            id: so.warehouse.id,
            name: so.warehouse.name,
            code: so.warehouse.code,
          }
        : null,
      billing_branch: so.warehouse?.billing_branch
        ? {
            id: (so.warehouse.billing_branch as any).id,
            code: (so.warehouse.billing_branch as any).code,
            city: (so.warehouse.billing_branch as any).city ?? null,
            address: (so.warehouse.billing_branch as any).address ?? null,
            display_name: [
              (so.warehouse.billing_branch as any).code,
              (so.warehouse.billing_branch as any).city,
            ]
              .filter(Boolean)
              .join(' — '),
          }
        : null,
      created_by_user: mapPosUser(so.creator),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  /**
   * Detalle para panel de corroboración: qué tomar, de qué almacén, UOM y cantidad.
   */
  async findOneForCorroboration(id: string, tenantId: string) {
    const so = await this.soRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: [
        'customer',
        'warehouse',
        'warehouse.billing_branch',
        'creator',
        'line_items',
        'line_items.product',
        'line_items.product_uom',
        'line_items.product_uom.uom',
        'line_items.base_uom',
      ],
    });

    if (!so) {
      throw new NotFoundException('Orden de venta no encontrada');
    }

    if (so.general_status !== 'En Selección') {
      throw new BadRequestException(
        `La orden ${so.folio} no está pendiente de corroboración (estado: ${so.general_status})`,
      );
    }

    const warehouseId = so.warehouse_id;
    const productIds = (so.line_items ?? []).map((li) => li.product_id);
    const availableByProduct = new Map<string, number>();

    if (productIds.length) {
      const stocks = await this.batchRepo
        .createQueryBuilder('batch')
        .select('batch.product_id', 'product_id')
        .addSelect('SUM(batch.available_quantity)', 'available')
        .where('batch.warehouse_id = :warehouseId', { warehouseId })
        .andWhere('batch.product_id IN (:...productIds)', { productIds })
        .groupBy('batch.product_id')
        .getRawMany<{ product_id: string; available: string }>();

      for (const row of stocks) {
        availableByProduct.set(
          row.product_id,
          parseFloat(row.available?.toString() || '0'),
        );
      }
    }

    return {
      header: {
        id: so.id,
        folio: so.folio,
        general_status: so.general_status,
        payment_status: so.payment_status,
        expected_delivery_date: so.expected_delivery_date,
        notes: so.notes,
        total: so.total,
        requires_selection_assembly: so.requires_selection_assembly,
        created_at: so.created_at,
        customer: so.customer
          ? {
              id: so.customer.id,
              display_name: formatCustomerDisplayName(so.customer),
              name: so.customer.name,
              lastname: (so.customer as any).lastname ?? null,
            }
          : null,
        warehouse: so.warehouse
          ? {
              id: so.warehouse.id,
              name: so.warehouse.name,
              code: so.warehouse.code,
            }
          : null,
        billing_branch: so.warehouse?.billing_branch
          ? {
              id: (so.warehouse.billing_branch as any).id,
              code: (so.warehouse.billing_branch as any).code,
              city: (so.warehouse.billing_branch as any).city ?? null,
              address: (so.warehouse.billing_branch as any).address ?? null,
              display_name: [
                (so.warehouse.billing_branch as any).code,
                (so.warehouse.billing_branch as any).city,
              ]
                .filter(Boolean)
                .join(' — '),
            }
          : null,
        created_by_user: mapPosUser(so.creator),
      },
      line_items: (so.line_items ?? []).map((li) => {
        const uomName =
          (li.product_uom as any)?.uom?.name ??
          (li.base_uom as any)?.name ??
          null;
        return {
          id: li.id,
          product_id: li.product_id,
          product_name: li.product?.name ?? null,
          product_sku: li.product?.sku ?? null,
          product_uom_id: li.product_uom_id,
          uom_name: uomName,
          quantity: li.quantity,
          quantity_base_uom: li.quantity_base_uom,
          warehouse_id: warehouseId,
          warehouse_name: so.warehouse?.name ?? null,
          available_quantity: availableByProduct.get(li.product_id) ?? 0,
        };
      }),
    };
  }

  /**
   * Confirma picking: FIFO + Lista para entrega + quién corroboró.
   */
  async corroborate(
    id: string,
    dto: CorroborateSalesOrderDto,
    tenantId: string,
    userId: string,
  ) {
    const so = await this.soRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['line_items'],
    });

    if (!so) {
      throw new NotFoundException('Orden de venta no encontrada');
    }

    if (so.general_status !== 'En Selección') {
      throw new BadRequestException(
        `La orden ${so.folio} no está pendiente de corroboración (estado: ${so.general_status})`,
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      for (const detail of so.line_items ?? []) {
        await this.fulfillmentService.allocateFifo(
          detail,
          so.warehouse_id,
          userId,
          qr.manager,
        );
      }

      await qr.manager.update(
        SalesOrder,
        { id: so.id, tenant_id: tenantId },
        {
          general_status: 'Lista para entrega',
          corroborated_by: userId,
          corroborated_at: new Date(),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          updated_by: userId,
        },
      );

      await qr.commitTransaction();
      this.logger.log(
        `OV ${so.folio} corroborada por ${userId} → Lista para entrega`,
      );

      return this.findOneAfterCorroboration(id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  private async findOneAfterCorroboration(id: string, tenantId: string) {
    const so = await this.soRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: [
        'customer',
        'warehouse',
        'warehouse.billing_branch',
        'corroborator',
        'line_items',
        'line_items.product',
        'line_items.product_uom',
        'line_items.product_uom.uom',
        'line_items.batch_allocations',
      ],
    });

    if (!so) {
      throw new NotFoundException('Orden de venta no encontrada');
    }

    return {
      id: so.id,
      folio: so.folio,
      general_status: so.general_status,
      corroborated_at: so.corroborated_at,
      corroborated_by_user: mapPosUser(so.corroborator),
      warehouse: so.warehouse
        ? { id: so.warehouse.id, name: so.warehouse.name }
        : null,
      customer: so.customer
        ? {
            id: so.customer.id,
            display_name: formatCustomerDisplayName(so.customer),
          }
        : null,
      line_items_count: so.line_items?.length ?? 0,
    };
  }
}
