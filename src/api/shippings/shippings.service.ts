import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  Shipping,
  ShippingStatus,
} from '../../entities/logistics/shipping.entity';
import {
  LocationStatus,
  ShippingStop,
} from '../../entities/logistics/shipping-stop.entity';
import { Truck } from '../../entities/logistics/truck.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { User } from '../../entities/users/user.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { CustomerAddress } from '../../entities/customers/customer-address.entity';
import {
  hasValidGps,
  routeDistanceKm,
  segmentDistanceKm,
} from '../../common/utils/geo.helper';
import {
  AddShippingStopsDto,
  CreateShippingDto,
  PreviewShippingDto,
  QueryAvailableShippingOrdersDto,
  QueryShippingDto,
  ResolveOrdersDto,
  ShippingOrderItemDto,
  UpdateShippingStatusDto,
} from './dto/shipping.dto';

const ELIGIBLE_SHIPPING_STATUSES = ['Surtida', 'Lista para entrega'] as const;

const ALLOWED_TRANSITIONS: Record<ShippingStatus, ShippingStatus[]> = {
  Creado: ['En Ruta', 'Cancelado'],
  'En Ruta': ['Completado', 'Cancelado'],
  Completado: [],
  Cancelado: [],
};

interface ResolvedStop {
  sales_order: SalesOrder;
  stop_sequence: number;
  customer_address_id: number | null;
  location_status: LocationStatus;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  address_summary: string | null;
  customer_name: string | null;
  customer_id: number | null;
  address_type: string | null;
}

/** Labels de ruta: A = origen (sucursal), B/C/D… = paradas. */
function routeLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

interface RouteOrigin {
  billing_branch_id: string | null;
  warehouse_id: string | null;
  fiscal_configuration_id: string | null;
  name: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

@Injectable()
export class ShippingsService {
  constructor(
    @InjectRepository(Shipping)
    private readonly shippingRepo: Repository<Shipping>,
    @InjectRepository(ShippingStop)
    private readonly stopRepo: Repository<ShippingStop>,
    @InjectRepository(Truck)
    private readonly truckRepo: Repository<Truck>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
    @InjectRepository(BillingBranch)
    private readonly branchRepo: Repository<BillingBranch>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(SalesOrder)
    private readonly soRepo: Repository<SalesOrder>,
    @InjectRepository(CustomerAddress)
    private readonly addressRepo: Repository<CustomerAddress>,
    private readonly dataSource: DataSource,
  ) {}

  async preview(dto: PreviewShippingDto, tenantId: string) {
    const origin = await this.getRouteOriginFromBranch(
      dto.billing_branch_id,
      tenantId,
    );
    let resolved = await this.resolveStops(dto.orders, origin, tenantId);
    resolved = this.sortStopsByDistanceFromOrigin(origin, resolved);

    return this.buildPreviewResponse(origin, resolved);
  }

  async create(dto: CreateShippingDto, tenantId: string, userId: string) {
    const truck = await this.getActiveTruck(dto.truck_id, tenantId);
    const driver = await this.getDriver(dto.driver_id, tenantId);
    const origin = await this.getRouteOriginFromBranch(
      dto.billing_branch_id,
      tenantId,
    );
    let resolved = await this.resolveStops(dto.orders, origin, tenantId, {
      validateAssignable: true,
    });
    resolved = this.sortStopsByDistanceFromOrigin(origin, resolved);

    const distances = this.buildStopDistances(origin, resolved);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const shipping = qr.manager.create(Shipping, {
        tenant_id: tenantId,
        shipping_date: dto.shipping_date as any,
        created_by: userId,
        driver_id: driver.id,
        truck_id: truck.id,
        origin_billing_branch_id: origin.billing_branch_id,
        origin_warehouse_id: null,
        status: 'Creado',
        distance_km: distances.totalKm,
        notes: dto.notes ?? null,
      });
      const saved = await qr.manager.save(shipping);

      for (const r of resolved) {
        const dist = distances.byOrderId.get(r.sales_order.id) ?? null;
        await qr.manager.save(
          qr.manager.create(ShippingStop, {
            tenant_id: tenantId,
            shipping_id: saved.id,
            sales_order_id: r.sales_order.id,
            stop_sequence: r.stop_sequence,
            customer_address_id: r.customer_address_id,
            location_status: r.location_status,
            delivery_latitude: r.delivery_latitude,
            delivery_longitude: r.delivery_longitude,
            distance_from_previous_km: dist,
          }),
        );

        await qr.manager.update(
          SalesOrder,
          { id: r.sales_order.id, tenant_id: tenantId },
          { general_status: 'En Camino' },
        );
      }

      await qr.commitTransaction();
      return this.findOne(saved.id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAll(tenantId: string, query?: QueryShippingDto) {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const qb = this.shippingRepo
      .createQueryBuilder('shipping')
      .leftJoinAndSelect('shipping.truck', 'truck')
      .leftJoinAndSelect('shipping.driver', 'driver')
      .leftJoinAndSelect('shipping.origin_warehouse', 'warehouse')
      .leftJoinAndSelect('shipping.origin_billing_branch', 'branch')
      .leftJoinAndSelect('branch.fiscal_configuration', 'fiscal')
      .where('shipping.tenant_id = :tenantId', { tenantId });

    if (query?.status) {
      qb.andWhere('shipping.status = :status', { status: query.status });
    }
    if (query?.driver_id) {
      qb.andWhere('shipping.driver_id = :driver_id', {
        driver_id: query.driver_id,
      });
    }
    if (query?.truck_id) {
      qb.andWhere('shipping.truck_id = :truck_id', { truck_id: query.truck_id });
    }
    if (query?.billing_branch_id) {
      qb.andWhere('shipping.origin_billing_branch_id = :billing_branch_id', {
        billing_branch_id: query.billing_branch_id,
      });
    }
    if (query?.origin_warehouse_id) {
      qb.andWhere('shipping.origin_warehouse_id = :origin_warehouse_id', {
        origin_warehouse_id: query.origin_warehouse_id,
      });
    }
    if (query?.date_from) {
      qb.andWhere('shipping.shipping_date >= :date_from', {
        date_from: query.date_from,
      });
    }
    if (query?.date_to) {
      qb.andWhere('shipping.shipping_date <= :date_to', {
        date_to: query.date_to,
      });
    }

    qb.orderBy('shipping.shipping_date', 'DESC').addOrderBy(
      'shipping.created_at',
      'DESC',
    );

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const totalPages = Math.ceil(total / limit) || 1;

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
   * OV elegibles para el wizard: Surtida | Lista para entrega de la sucursal,
   * sin envío activo (≠ Cancelado). No filtra por almacén.
   */
  async findAvailableOrders(
    tenantId: string,
    query: QueryAvailableShippingOrdersDto,
  ) {
    await this.getOriginBranch(
      query.billing_branch_id,
      tenantId,
      query.fiscal_configuration_id,
    );

    let page = Number(query.page) || 1;
    let limit = Number(query.limit) || 50;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const qb = this.soRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.billing_branch', 'billing_branch')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'warehouse_branch')
      .leftJoinAndSelect('so.fiscal_configuration', 'fiscal')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere(
        '(so.billing_branch_id = :billingBranchId OR (so.billing_branch_id IS NULL AND warehouse.billing_branch_id = :billingBranchId))',
        { billingBranchId: query.billing_branch_id },
      )
      .andWhere('so.general_status IN (:...statuses)', {
        statuses: [...ELIGIBLE_SHIPPING_STATUSES],
      })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM shipping_stops ss
          INNER JOIN shippings s ON s.id = ss.shipping_id
          WHERE ss.sales_order_id = so.id
            AND ss.tenant_id = :tenantId
            AND s.status <> 'Cancelado'
        )`,
      );

    if (query.fiscal_configuration_id) {
      qb.andWhere('so.fiscal_configuration_id = :fiscalId', {
        fiscalId: query.fiscal_configuration_id,
      });
    }

    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere(
        `(so.folio LIKE :term
          OR customer.name LIKE :term
          OR customer.lastname LIKE :term
          OR customer.company_name LIKE :term
          OR CONCAT(COALESCE(customer.name, ''), ' ', COALESCE(customer.lastname, '')) LIKE :term)`,
        { term },
      );
    }

    qb.orderBy('so.created_at', 'DESC');

    const total = await qb.getCount();
    const rows = await qb.skip((page - 1) * limit).take(limit).getMany();

    const data = rows.map((so) => {
      const branch = so.billing_branch ?? so.warehouse?.billing_branch ?? null;
      return {
        id: so.id,
        folio: so.folio,
        general_status: so.general_status,
        payment_status: so.payment_status,
        total: so.total,
        created_at: so.created_at,
        fiscal_configuration_id: so.fiscal_configuration_id,
        razon_social:
          so.fiscal_razon_social ||
          so.fiscal_configuration?.razon_social ||
          null,
        billing_branch_id: so.billing_branch_id ?? so.warehouse?.billing_branch_id ?? branch?.id ?? null,
        sucursal: branch?.code ?? null,
        billing_branch: branch
          ? {
              id: branch.id,
              code: branch.code,
              city: branch.city,
              state: branch.state,
            }
          : null,
        customer_id: so.customer_id,
        customer_name: this.customerName(so),
        customer: so.customer
          ? {
              id: so.customer.id,
              name: so.customer.name,
              lastname: so.customer.lastname,
              company_name: so.customer.company_name,
            }
          : null,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;
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

  async findOne(id: string, tenantId: string) {
    const shipping = await this.shippingRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: [
        'truck',
        'driver',
        'origin_warehouse',
        'origin_billing_branch',
        'origin_billing_branch.fiscal_configuration',
        'creator',
        'editor',
        'stops',
        'stops.sales_order',
        'stops.sales_order.customer',
        'stops.customer_address',
      ],
      order: { stops: { stop_sequence: 'ASC' } },
    });

    if (!shipping) {
      throw new NotFoundException('Envío no encontrado');
    }

    return shipping;
  }

  async addStops(
    id: string,
    dto: AddShippingStopsDto,
    tenantId: string,
  ) {
    const shipping = await this.findOne(id, tenantId);
    if (shipping.status !== 'Creado') {
      throw new BadRequestException(
        'Solo se pueden agregar órdenes a un envío en estado Creado',
      );
    }

    const origin = await this.getRouteOriginFromShipping(shipping, tenantId);
    const resolved = await this.resolveStops(dto.orders, origin, tenantId, {
      validateAssignable: true,
    });

    const existingStops = [...(shipping.stops || [])].sort(
      (a, b) => a.stop_sequence - b.stop_sequence,
    );
    const mergedResolved: ResolvedStop[] = [
      ...existingStops.map((s) => ({
        sales_order: s.sales_order,
        stop_sequence: s.stop_sequence,
        customer_address_id: s.customer_address_id,
        location_status: s.location_status,
        delivery_latitude: s.delivery_latitude
          ? Number(s.delivery_latitude)
          : null,
        delivery_longitude: s.delivery_longitude
          ? Number(s.delivery_longitude)
          : null,
        address_summary: null,
        customer_name: null,
        customer_id: s.sales_order?.customer_id ?? null,
        address_type: null,
      })),
      ...resolved,
    ];

    const distances = this.buildStopDistances(origin, mergedResolved);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      for (const r of resolved) {
        await qr.manager.save(
          qr.manager.create(ShippingStop, {
            tenant_id: tenantId,
            shipping_id: shipping.id,
            sales_order_id: r.sales_order.id,
            stop_sequence: r.stop_sequence,
            customer_address_id: r.customer_address_id,
            location_status: r.location_status,
            delivery_latitude: r.delivery_latitude,
            delivery_longitude: r.delivery_longitude,
            distance_from_previous_km:
              distances.byOrderId.get(r.sales_order.id) ?? null,
          }),
        );
        await qr.manager.update(
          SalesOrder,
          { id: r.sales_order.id, tenant_id: tenantId },
          { general_status: 'En Camino' },
        );
      }

      // Recalcular tramos de paradas existentes también
      for (const stop of existingStops) {
        await qr.manager.update(
          ShippingStop,
          { id: stop.id },
          {
            distance_from_previous_km:
              distances.byOrderId.get(stop.sales_order_id) ?? null,
          },
        );
      }

      await qr.manager.update(
        Shipping,
        { id: shipping.id },
        { distance_km: distances.totalKm },
      );

      await qr.commitTransaction();
      return this.findOne(id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async recalculateDistance(id: string, tenantId: string) {
    const shipping = await this.findOne(id, tenantId);
    const origin = await this.getRouteOriginFromShipping(shipping, tenantId);

    const stops = [...(shipping.stops || [])].sort(
      (a, b) => a.stop_sequence - b.stop_sequence,
    );

    const refreshed: ResolvedStop[] = [];
    for (const stop of stops) {
      const resolved = await this.resolveAddressForOrder(
        stop.sales_order,
        stop.customer_address_id ?? undefined,
        tenantId,
      );
      refreshed.push({
        sales_order: stop.sales_order,
        stop_sequence: stop.stop_sequence,
        customer_id: stop.sales_order?.customer_id ?? null,
        ...resolved,
      });
    }

    const distances = this.buildStopDistances(origin, refreshed);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      for (const r of refreshed) {
        const stop = stops.find((s) => s.sales_order_id === r.sales_order.id);
        if (!stop) continue;
        await qr.manager.update(
          ShippingStop,
          { id: stop.id },
          {
            customer_address_id: r.customer_address_id,
            location_status: r.location_status,
            delivery_latitude: r.delivery_latitude,
            delivery_longitude: r.delivery_longitude,
            distance_from_previous_km:
              distances.byOrderId.get(r.sales_order.id) ?? null,
          },
        );
      }

      await qr.manager.update(
        Shipping,
        { id: shipping.id },
        { distance_km: distances.totalKm },
      );

      await qr.commitTransaction();
      return this.findOne(id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async updateStatus(
    id: string,
    dto: UpdateShippingStatusDto,
    tenantId: string,
    userId: string,
  ) {
    const shipping = await this.findOne(id, tenantId);
    const next = dto.status as ShippingStatus;
    const allowed = ALLOWED_TRANSITIONS[shipping.status] || [];

    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `No se puede cambiar el envío de ${shipping.status} a ${dto.status}`,
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      await qr.manager.update(
        Shipping,
        { id: shipping.id },
        { status: next, edited_by: userId },
      );

      if (next === 'Cancelado') {
        const stops = shipping.stops || [];
        for (const stop of stops) {
          const order = await qr.manager.findOne(SalesOrder, {
            where: { id: stop.sales_order_id, tenant_id: tenantId },
          });
          if (!order) continue;

          const restoreStatus =
            order.corroborated_at || order.requires_selection_assembly
              ? 'Lista para entrega'
              : 'Surtida';

          await qr.manager.update(
            SalesOrder,
            { id: order.id, tenant_id: tenantId },
            { general_status: restoreStatus },
          );
        }
      }

      await qr.commitTransaction();
      return this.findOne(id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async resolveOrders(dto: ResolveOrdersDto, tenantId: string) {
    const orders = await this.soRepo.find({
      where: { id: In(dto.sales_order_ids), tenant_id: tenantId },
      relations: ['customer'],
    });

    const byId = new Map(orders.map((o) => [o.id, o]));
    const results: Array<{
      sales_order_id: string;
      found: boolean;
      folio?: string;
      customer_name?: string | null;
      customer_address_id?: number | null;
      location_status: LocationStatus | string;
      delivery_latitude?: number | null;
      delivery_longitude?: number | null;
      address_summary?: string | null;
    }> = [];

    for (const id of dto.sales_order_ids) {
      const order = byId.get(id);
      if (!order) {
        results.push({
          sales_order_id: id,
          found: false,
          location_status: 'without_location',
        });
        continue;
      }
      const resolved = await this.resolveAddressForOrder(
        order,
        undefined,
        tenantId,
      );
      results.push({
        sales_order_id: id,
        folio: order.folio,
        found: true,
        ...resolved,
      });
    }

    return {
      orders: results,
      missing_location_count: results.filter(
        (r) => r.location_status === 'without_location',
      ).length,
    };
  }

  async getShippingSummaryForOrder(salesOrderId: string, tenantId: string) {
    const stop = await this.stopRepo
      .createQueryBuilder('stop')
      .innerJoinAndSelect('stop.shipping', 'shipping')
      .leftJoinAndSelect('shipping.driver', 'driver')
      .leftJoinAndSelect('shipping.truck', 'truck')
      .leftJoinAndSelect('shipping.stops', 'all_stops')
      .where('stop.sales_order_id = :salesOrderId', { salesOrderId })
      .andWhere('stop.tenant_id = :tenantId', { tenantId })
      .andWhere('shipping.status != :cancelled', { cancelled: 'Cancelado' })
      .orderBy('shipping.created_at', 'DESC')
      .getOne();

    if (!stop?.shipping) {
      return {
        has_shipping: false,
        shipping_id: null,
        status: null,
        driver_name: null,
        truck_name: null,
        stop_sequence: null,
        route_summary: null,
      };
    }

    const shipping = stop.shipping;
    const driver = shipping.driver;
    const driverName = driver
      ? [driver.first_name, driver.last_name].filter(Boolean).join(' ') ||
        driver.email
      : null;

    return {
      has_shipping: true,
      shipping_id: shipping.id,
      status: shipping.status,
      driver_name: driverName,
      truck_name: shipping.truck?.name ?? null,
      stop_sequence: stop.stop_sequence,
      route_summary: {
        distance_km: shipping.distance_km
          ? Number(shipping.distance_km)
          : null,
        stops_count: shipping.stops?.length ?? 0,
      },
    };
  }

  private buildStopDistances(
    origin: RouteOrigin,
    stops: ResolvedStop[],
  ): { totalKm: number | null; byOrderId: Map<string, number | null> } {
    const sorted = [...stops].sort((a, b) => a.stop_sequence - b.stop_sequence);
    const byOrderId = new Map<string, number | null>();
    let previous = {
      latitude: origin.latitude != null ? Number(origin.latitude) : null,
      longitude: origin.longitude != null ? Number(origin.longitude) : null,
    };

    for (const stop of sorted) {
      const current = {
        latitude: stop.delivery_latitude,
        longitude: stop.delivery_longitude,
      };
      const segment = segmentDistanceKm(previous, current);
      byOrderId.set(stop.sales_order.id, segment);
      if (hasValidGps(current)) {
        previous = current;
      }
    }

    const points = [
      {
        latitude: origin.latitude != null ? Number(origin.latitude) : null,
        longitude: origin.longitude != null ? Number(origin.longitude) : null,
      },
      ...sorted.map((s) => ({
        latitude: s.delivery_latitude,
        longitude: s.delivery_longitude,
      })),
    ];

    return { totalKm: routeDistanceKm(points), byOrderId };
  }

  private async resolveStops(
    orders: ShippingOrderItemDto[],
    origin: RouteOrigin,
    tenantId: string,
    opts?: { validateAssignable?: boolean },
  ): Promise<ResolvedStop[]> {
    const sequences = new Set<number>();
    for (const item of orders) {
      if (sequences.has(item.stop_sequence)) {
        throw new BadRequestException(
          `stop_sequence duplicado: ${item.stop_sequence}`,
        );
      }
      sequences.add(item.stop_sequence);
    }

    const ids = orders.map((o) => o.sales_order_id);
    const salesOrders = await this.soRepo.find({
      where: { id: In(ids), tenant_id: tenantId },
      relations: ['customer', 'warehouse', 'billing_branch'],
    });
    const byId = new Map(salesOrders.map((o) => [o.id, o]));

    if (opts?.validateAssignable) {
      const existing = await this.stopRepo.find({
        where: { sales_order_id: In(ids), tenant_id: tenantId },
        relations: ['shipping'],
      });
      for (const stop of existing) {
        if (stop.shipping?.status !== 'Cancelado') {
          throw new BadRequestException(
            `La orden ${stop.sales_order_id} ya está asignada a otro envío`,
          );
        }
      }
    }

    const resolved: ResolvedStop[] = [];
    for (const item of orders) {
      const so = byId.get(item.sales_order_id);
      if (!so) {
        throw new BadRequestException(
          `La orden ${item.sales_order_id} no existe en esta organización`,
        );
      }

      if (opts?.validateAssignable) {
        if (
          origin.billing_branch_id &&
          so.billing_branch_id !== origin.billing_branch_id &&
          so.warehouse?.billing_branch_id !== origin.billing_branch_id
        ) {
          throw new BadRequestException(
            `La orden ${so.folio} no pertenece a la sucursal de origen`,
          );
        }
        if (
          so.general_status !== 'Surtida' &&
          so.general_status !== 'Lista para entrega'
        ) {
          throw new BadRequestException(
            `La orden ${so.folio} no está lista para envío (estado: ${so.general_status})`,
          );
        }
      }

      const address = await this.resolveAddressForOrder(
        so,
        item.customer_address_id,
        tenantId,
      );

      resolved.push({
        sales_order: so,
        stop_sequence: item.stop_sequence,
        customer_id: so.customer_id ?? null,
        ...address,
      });
    }

    return resolved.sort((a, b) => a.stop_sequence - b.stop_sequence);
  }

  private async resolveAddressForOrder(
    order: SalesOrder,
    preferredAddressId: number | undefined,
    tenantId: string,
  ): Promise<{
    customer_address_id: number | null;
    location_status: LocationStatus;
    delivery_latitude: number | null;
    delivery_longitude: number | null;
    address_summary: string | null;
    customer_name: string | null;
    address_type: string | null;
  }> {
    const customerName = this.customerName(order);

    if (preferredAddressId) {
      const preferred = await this.addressRepo.findOne({
        where: {
          id: preferredAddressId,
          tenant_id: tenantId,
          customer_id: order.customer_id,
          status: 1,
        } as any,
      });
      if (preferred && hasValidGps(preferred)) {
        return {
          customer_address_id: preferred.id,
          location_status: 'ok',
          delivery_latitude: Number(preferred.latitude),
          delivery_longitude: Number(preferred.longitude),
          address_summary: this.addressSummary(preferred),
          customer_name: customerName,
          address_type: preferred.type ?? null,
        };
      }
    }

    const addresses = await this.addressRepo.find({
      where: {
        tenant_id: tenantId,
        customer_id: order.customer_id,
        status: 1,
      } as any,
      order: { is_primary: 'DESC', id: 'ASC' },
    });

    // Preferencia: type shipping (Entrega) con GPS → cualquier GPS → shipping sin GPS → cualquiera
    const shippingWithGps = addresses.find(
      (a) => a.type === 'shipping' && hasValidGps(a),
    );
    const anyWithGps = addresses.find((a) => hasValidGps(a));
    const shippingAny = addresses.find((a) => a.type === 'shipping');
    const chosen = shippingWithGps || anyWithGps || shippingAny || addresses[0];

    if (chosen && hasValidGps(chosen)) {
      return {
        customer_address_id: chosen.id,
        location_status: 'ok',
        delivery_latitude: Number(chosen.latitude),
        delivery_longitude: Number(chosen.longitude),
        address_summary: this.addressSummary(chosen),
        customer_name: customerName,
        address_type: chosen.type ?? null,
      };
    }

    return {
      customer_address_id: chosen?.id ?? null,
      location_status: 'without_location',
      delivery_latitude: null,
      delivery_longitude: null,
      address_summary: chosen ? this.addressSummary(chosen) : null,
      customer_name: customerName,
      address_type: chosen?.type ?? null,
    };
  }

  /**
   * Ordena paradas por distancia Haversine desde la sucursal (más cerca primero).
   * Sin GPS del origen o de la parada → van al final.
   * Reasigna stop_sequence 1..n.
   */
  private sortStopsByDistanceFromOrigin(
    origin: RouteOrigin,
    stops: ResolvedStop[],
  ): ResolvedStop[] {
    const originGps = {
      latitude: origin.latitude != null ? Number(origin.latitude) : null,
      longitude: origin.longitude != null ? Number(origin.longitude) : null,
    };

    const withDistance = stops.map((stop, index) => {
      const dist =
        hasValidGps(originGps) &&
        hasValidGps({
          latitude: stop.delivery_latitude,
          longitude: stop.delivery_longitude,
        })
          ? segmentDistanceKm(originGps, {
              latitude: stop.delivery_latitude,
              longitude: stop.delivery_longitude,
            })
          : null;
      return { stop, dist, index };
    });

    withDistance.sort((a, b) => {
      if (a.dist == null && b.dist == null) return a.index - b.index;
      if (a.dist == null) return 1;
      if (b.dist == null) return -1;
      if (a.dist !== b.dist) return a.dist - b.dist;
      return a.index - b.index;
    });

    return withDistance.map((item, i) => ({
      ...item.stop,
      stop_sequence: i + 1,
    }));
  }

  private buildPreviewResponse(originLoc: RouteOrigin, resolved: ResolvedStop[]) {
    const originGps = hasValidGps({
      latitude: originLoc.latitude,
      longitude: originLoc.longitude,
    });
    const originPoint = {
      latitude: originLoc.latitude != null ? Number(originLoc.latitude) : null,
      longitude:
        originLoc.longitude != null ? Number(originLoc.longitude) : null,
    };

    const origin = {
      label: 'A',
      billing_branch_id: originLoc.billing_branch_id,
      fiscal_configuration_id: originLoc.fiscal_configuration_id,
      warehouse_id: originLoc.warehouse_id,
      name: originLoc.name,
      street: originLoc.street,
      city: originLoc.city,
      state: originLoc.state,
      zip_code: originLoc.zip_code,
      country: originLoc.country,
      address_summary: [originLoc.street, originLoc.city, originLoc.state]
        .filter(Boolean)
        .join(', '),
      latitude: originPoint.latitude,
      longitude: originPoint.longitude,
      location_status: (originGps ? 'ok' : 'without_location') as LocationStatus,
      distance_from_previous_km: null as number | null,
    };

    let previous = originPoint;
    const orders = resolved.map((r, i) => {
      const current = {
        latitude: r.delivery_latitude,
        longitude: r.delivery_longitude,
      };
      const segment = segmentDistanceKm(previous, current);
      if (hasValidGps(current)) {
        previous = current;
      }

      return {
        label: routeLabel(i + 1),
        sales_order_id: r.sales_order.id,
        folio: r.sales_order.folio,
        customer_id: r.customer_id,
        customer_name: r.customer_name,
        stop_sequence: r.stop_sequence,
        location_status: r.location_status,
        delivery_latitude: r.delivery_latitude,
        delivery_longitude: r.delivery_longitude,
        address_summary: r.address_summary,
        customer_address_id: r.customer_address_id,
        address_type: r.address_type,
        distance_from_previous_km: segment,
        distance_from_origin_km: segmentDistanceKm(originPoint, current),
      };
    });

    const route_points = [
      {
        label: origin.label,
        kind: 'origin' as const,
        name: origin.name,
        address_summary: origin.address_summary,
        latitude: origin.latitude,
        longitude: origin.longitude,
        location_status: origin.location_status,
        distance_from_previous_km: null,
        billing_branch_id: originLoc.billing_branch_id,
        warehouse_id: originLoc.warehouse_id,
        sales_order_id: null,
        customer_id: null,
        customer_address_id: null,
      },
      ...orders.map((o) => ({
        label: o.label,
        kind: 'stop' as const,
        name: o.customer_name,
        address_summary: o.address_summary,
        latitude: o.delivery_latitude,
        longitude: o.delivery_longitude,
        location_status: o.location_status,
        distance_from_previous_km: o.distance_from_previous_km,
        billing_branch_id: null,
        warehouse_id: null,
        sales_order_id: o.sales_order_id,
        customer_id: o.customer_id,
        customer_address_id: o.customer_address_id,
      })),
    ];

    const points = [
      originPoint,
      ...resolved.map((r) => ({
        latitude: r.delivery_latitude,
        longitude: r.delivery_longitude,
      })),
    ];

    return {
      origin,
      orders,
      route_points,
      estimated_distance_km: routeDistanceKm(points),
      missing_location_count:
        (originGps ? 0 : 1) +
        resolved.filter((r) => r.location_status === 'without_location').length,
      origin_missing_location: !originGps,
    };
  }

  private addressSummary(address: CustomerAddress): string {
    return [address.street_address, address.city, address.state]
      .filter(Boolean)
      .join(', ');
  }

  private customerName(order: SalesOrder): string | null {
    const c = order.customer as any;
    if (!c) return null;
    return (
      c.company_name ||
      [c.name, c.lastname].filter(Boolean).join(' ') ||
      c.email ||
      null
    );
  }

  private originFromBranch(branch: BillingBranch): RouteOrigin {
    return {
      billing_branch_id: branch.id,
      warehouse_id: null,
      fiscal_configuration_id: branch.fiscal_configuration_id,
      name: branch.code,
      street: branch.address,
      city: branch.city,
      state: branch.state,
      zip_code: branch.postal_code,
      country: branch.country,
      latitude: branch.latitude != null ? Number(branch.latitude) : null,
      longitude: branch.longitude != null ? Number(branch.longitude) : null,
    };
  }

  private originFromWarehouse(warehouse: Warehouse): RouteOrigin {
    return {
      billing_branch_id: warehouse.billing_branch_id ?? null,
      warehouse_id: warehouse.id,
      fiscal_configuration_id: null,
      name: warehouse.name,
      street: warehouse.street,
      city: warehouse.city,
      state: warehouse.state,
      zip_code: warehouse.zip_code,
      country: warehouse.country,
      latitude: warehouse.latitude != null ? Number(warehouse.latitude) : null,
      longitude:
        warehouse.longitude != null ? Number(warehouse.longitude) : null,
    };
  }

  private async getOriginBranch(
    id: string,
    tenantId: string,
    fiscalConfigurationId?: string,
  ): Promise<BillingBranch> {
    const branch = await this.branchRepo.findOne({
      where: { id },
      relations: ['fiscal_configuration'],
    });
    if (!branch || branch.fiscal_configuration?.tenant_id !== tenantId) {
      throw new NotFoundException('Sucursal de origen no encontrada');
    }
    if (
      fiscalConfigurationId &&
      branch.fiscal_configuration_id !== fiscalConfigurationId
    ) {
      throw new BadRequestException(
        'La sucursal no pertenece a la razón social seleccionada',
      );
    }
    return branch;
  }

  private async getRouteOriginFromBranch(
    billingBranchId: string,
    tenantId: string,
  ): Promise<RouteOrigin> {
    const branch = await this.getOriginBranch(billingBranchId, tenantId);
    return this.originFromBranch(branch);
  }

  private async getRouteOriginFromShipping(
    shipping: Shipping,
    tenantId: string,
  ): Promise<RouteOrigin> {
    if (shipping.origin_billing_branch_id) {
      const branch =
        shipping.origin_billing_branch ||
        (await this.getOriginBranch(
          shipping.origin_billing_branch_id,
          tenantId,
        ));
      if (branch.fiscal_configuration?.tenant_id &&
          branch.fiscal_configuration.tenant_id !== tenantId) {
        throw new NotFoundException('Sucursal de origen no encontrada');
      }
      return this.originFromBranch(branch);
    }

    if (shipping.origin_warehouse_id) {
      const warehouse =
        shipping.origin_warehouse ||
        (await this.warehouseRepo.findOne({
          where: { id: shipping.origin_warehouse_id, tenant_id: tenantId },
        }));
      if (!warehouse) {
        throw new NotFoundException('Almacén de origen no encontrado');
      }
      return this.originFromWarehouse(warehouse);
    }

    throw new BadRequestException('El envío no tiene sucursal de origen');
  }

  private async getActiveTruck(id: string, tenantId: string): Promise<Truck> {
    const truck = await this.truckRepo.findOne({
      where: { id, tenant_id: tenantId, status: 'active' },
    });
    if (!truck) {
      throw new BadRequestException('El camión no existe o está inactivo');
    }
    return truck;
  }

  private async getDriver(id: string, tenantId: string): Promise<User> {
    const driver = await this.userRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['status'],
    });
    if (!driver) {
      throw new BadRequestException(
        'El chofer no pertenece a esta organización',
      );
    }
    return driver;
  }
}
