import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  ACTIVE_SHIPPING_STATUSES,
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
  assessDriver,
  decorateShippingCartaPorte,
  isDriverFlag,
} from './utils/carta-porte.util';
import { resolveCargoKind } from './utils/shipping-cargo.util';
import { InventoryTransferService } from '../inventory/services/inventory-transfer.service';
import { InventoryTransfer } from '../../entities/inventory/inventory-transfer.entity';
import { ShippingInventoryTransfer } from '../../entities/logistics/shipping-inventory-transfer.entity';
import {
  hasValidGps,
  routeDistanceKm,
  segmentDistanceKm,
} from '../../common/utils/geo.helper';
import {
  AddShippingStopsDto,
  AddShippingTransfersDto,
  CreateShippingDto,
  PreviewShippingDto,
  QueryAvailableShippingOrdersDto,
  QueryShippingDto,
  ResolveOrdersDto,
  ShippingOrderItemDto,
  UpdateShippingCrewDto,
  UpdateShippingStatusDto,
} from './dto/shipping.dto';

export interface CustomerAddressOption {
  id: number;
  type: string | null;
  type_label: string;
  address_summary: string;
  is_primary: boolean;
  has_gps: boolean;
  latitude: number | null;
  longitude: number | null;
}

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
  customer_addresses: CustomerAddressOption[];
}

type ResolvedAddress = Omit<
  ResolvedStop,
  'sales_order' | 'stop_sequence' | 'customer_id'
>;

type ShippingStopWithAddresses = ShippingStop & {
  customer_addresses?: CustomerAddressOption[];
};

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
    private readonly transfers: InventoryTransferService,
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
    const orders = dto.orders ?? [];
    const transferIds = [...new Set(dto.inventory_transfer_ids ?? [])];
    if (!orders.length && !transferIds.length) {
      throw new BadRequestException(
        'El envío necesita órdenes de entrega, transferencias o ambas',
      );
    }
    const truck = await this.getActiveTruck(dto.truck_id, tenantId);
    const driver = await this.getDriver(dto.driver_id, tenantId);
    const origin = await this.getRouteOriginFromBranch(
      dto.billing_branch_id,
      tenantId,
    );
    let resolved: ResolvedStop[] = [];
    if (orders.length) {
      resolved = await this.resolveStops(orders, origin, tenantId, {
        validateAssignable: true,
      });
      resolved = this.sortStopsByDistanceFromOrigin(origin, resolved);
    }
    const stagedTransfers = await this.transfers.findPendingForShipping(
      tenantId,
      transferIds,
      dto.billing_branch_id,
    );

    const distances = this.buildStopDistances(origin, resolved);
    const distanceKm = this.distanceWithTransfers(
      origin,
      resolved,
      stagedTransfers,
      distances.totalKm,
    );
    const cargoKind = resolveCargoKind(orders.length, stagedTransfers.length);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      await this.assertTruckAvailable(qr.manager, tenantId, truck);
      const shipping = qr.manager.create(Shipping, {
        tenant_id: tenantId,
        shipping_date: dto.shipping_date as any,
        created_by: userId,
        driver_id: driver.id,
        truck_id: truck.id,
        origin_billing_branch_id: origin.billing_branch_id,
        origin_warehouse_id: null,
        status: 'Creado',
        cargo_kind: cargoKind,
        distance_km: distanceKm,
        notes: dto.notes ?? null,
      });
      const saved = await qr.manager.save(shipping);
      if (stagedTransfers.length) {
        await this.transfers.attachToShipping(
          qr.manager,
          tenantId,
          saved.id,
          stagedTransfers.map((transfer) => transfer.id),
          dto.billing_branch_id,
        );
      }

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
    const pageRows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const ids = pageRows.map((row) => row.id);
    let data = pageRows;
    if (ids.length > 0) {
      const detailed = await this.shippingRepo.find({
        where: { id: In(ids), tenant_id: tenantId },
        relations: [
          'truck',
          'driver',
          'origin_warehouse',
          'origin_billing_branch',
          'stops',
          'stops.sales_order',
          'stops.sales_order.customer',
          'transfer_links',
          'transfer_links.inventory_transfer',
          'transfer_links.inventory_transfer.destination_warehouse',
        ],
        order: { stops: { stop_sequence: 'ASC' } },
      });
      const byId = new Map(detailed.map((row) => [row.id, row]));
      data = ids
        .map((id) => byId.get(id))
        .filter((row): row is Shipping => !!row)
        .map((row) => decorateShippingCartaPorte(this.attachTransferView(row)));
    }
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
        'transfer_links',
        'transfer_links.inventory_transfer',
        'transfer_links.inventory_transfer.destination_warehouse',
      ],
      order: { stops: { stop_sequence: 'ASC' } },
    });

    if (!shipping) {
      throw new NotFoundException('Envío no encontrado');
    }

    await this.attachCustomerAddresses(shipping, tenantId);
    return decorateShippingCartaPorte(this.attachTransferView(shipping));
  }

  async setStopAddress(
    shippingId: string,
    salesOrderId: string,
    addressId: number,
    tenantId: string,
  ) {
    const shipping = await this.shippingRepo.findOne({
      where: { id: shippingId, tenant_id: tenantId },
      relations: ['stops', 'stops.sales_order'],
    });
    if (!shipping) {
      throw new NotFoundException('Envío no encontrado');
    }
    if (shipping.status !== 'Creado') {
      throw new BadRequestException(
        'Solo se puede cambiar la dirección en un envío creado',
      );
    }
    const stop = (shipping.stops ?? []).find(
      (item) => item.sales_order_id === salesOrderId,
    );
    if (!stop?.sales_order) {
      throw new NotFoundException('La orden no está en este envío');
    }
    const address = await this.addressRepo.findOne({
      where: {
        id: addressId,
        tenant_id: tenantId,
        customer_id: stop.sales_order.customer_id,
        status: 1,
      },
    });
    if (!address) {
      throw new BadRequestException('La dirección no pertenece a este cliente');
    }
    await this.stopRepo.update(stop.id, { customer_address_id: address.id });
    return this.recalculateDistance(shippingId, tenantId);
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
        customer_addresses: [],
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

      const transferCount = shipping.transfer_links?.length ?? 0;
      await qr.manager.update(
        Shipping,
        { id: shipping.id },
        {
          distance_km: distances.totalKm,
          cargo_kind: resolveCargoKind(mergedResolved.length, transferCount),
        },
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

  async addTransfers(
    id: string,
    dto: AddShippingTransfersDto,
    tenantId: string,
  ) {
    const shipping = await this.findOne(id, tenantId);
    if (shipping.status !== 'Creado') {
      throw new BadRequestException(
        'Solo se pueden agregar transferencias a un envío en estado Creado',
      );
    }
    if (shipping.carta_porte_uuid && shipping.carta_porte_environment !== 'demo') {
      throw new BadRequestException(
        'Este envío ya tiene carta porte. No se pueden agregar transferencias.',
      );
    }

    const origin = await this.getRouteOriginFromShipping(shipping, tenantId);
    if (!origin.billing_branch_id) {
      throw new BadRequestException('El envío no tiene sucursal de origen');
    }

    const requested = [...new Set(dto.inventory_transfer_ids)];
    const already = new Set(
      (shipping.transfer_links ?? []).map((link) => link.inventory_transfer_id),
    );
    const freshIds = requested.filter((transferId) => !already.has(transferId));
    if (!freshIds.length) {
      throw new BadRequestException('Esas transferencias ya están en este envío');
    }
    await this.transfers.findPendingForShipping(
      tenantId,
      freshIds,
      origin.billing_branch_id,
    );

    const existingStops = [...(shipping.stops || [])].sort(
      (a, b) => a.stop_sequence - b.stop_sequence,
    );
    const resolvedStops: ResolvedStop[] = existingStops
      .filter((stop) => !!stop.sales_order)
      .map((stop) => ({
        sales_order: stop.sales_order,
        stop_sequence: stop.stop_sequence,
        customer_address_id: stop.customer_address_id,
        location_status: stop.location_status,
        delivery_latitude: stop.delivery_latitude
          ? Number(stop.delivery_latitude)
          : null,
        delivery_longitude: stop.delivery_longitude
          ? Number(stop.delivery_longitude)
          : null,
        address_summary: null,
        customer_name: null,
        customer_id: stop.sales_order?.customer_id ?? null,
        address_type: null,
        customer_addresses: [],
      }));
    const distances = this.buildStopDistances(origin, resolvedStops);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const locked = await qr.manager
        .createQueryBuilder(Shipping, 'shipping')
        .setLock('pessimistic_write')
        .where('shipping.id = :id', { id: shipping.id })
        .andWhere('shipping.tenant_id = :tenantId', { tenantId })
        .getOne();
      if (!locked || locked.status !== 'Creado') {
        throw new BadRequestException(
          'Solo se pueden agregar transferencias a un envío en estado Creado',
        );
      }
      if (locked.carta_porte_uuid && locked.carta_porte_environment !== 'demo') {
        throw new BadRequestException(
          'Este envío ya tiene carta porte. No se pueden agregar transferencias.',
        );
      }

      await this.transfers.attachToShipping(
        qr.manager,
        tenantId,
        shipping.id,
        freshIds,
        origin.billing_branch_id,
      );

      const links = await qr.manager.find(ShippingInventoryTransfer, {
        where: { shipping_id: shipping.id, tenant_id: tenantId },
      });
      const allTransfers = links.length
        ? await qr.manager.find(InventoryTransfer, {
            where: {
              id: In(links.map((link) => link.inventory_transfer_id)),
              tenant_id: tenantId,
            },
            relations: [
              'destination_warehouse',
              'destination_warehouse.billing_branch',
            ],
          })
        : [];

      const patch: QueryDeepPartialEntity<Shipping> = {
        distance_km: this.distanceWithTransfers(
          origin,
          resolvedStops,
          allTransfers,
          distances.totalKm,
        ),
        cargo_kind: resolveCargoKind(existingStops.length, allTransfers.length),
      };
      if (locked.carta_porte_environment === 'demo' && locked.carta_porte_uuid) {
        patch.carta_porte_uuid = null;
        patch.carta_porte_idccp = null;
        patch.carta_porte_xml = null;
        patch.carta_porte_stamped_at = null;
        patch.carta_porte_error = null;
        patch.carta_porte_peso_kg = null;
        patch.carta_porte_environment = null;
      }
      await qr.manager.update(
        Shipping,
        { id: shipping.id, tenant_id: tenantId },
        patch,
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

  async updateCrew(id: string, dto: UpdateShippingCrewDto, tenantId: string) {
    const current = await this.shippingRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!current) throw new NotFoundException('Envío no encontrado');
    if (current.status !== 'Creado' && current.status !== 'En Ruta') {
      throw new BadRequestException(
        'Solo se puede cambiar el chofer y el camión mientras el viaje está creado o en ruta',
      );
    }
    if (current.carta_porte_uuid && current.carta_porte_environment !== 'demo') {
      throw new BadRequestException(
        'Este viaje ya tiene carta porte timbrada. No se puede cambiar el chofer ni el camión.',
      );
    }

    const driver = await this.getDriver(dto.driver_id, tenantId);
    if (!isDriverFlag(driver.is_driver)) {
      throw new BadRequestException('El usuario no está marcado como chofer');
    }
    const statusCode = driver.status?.code?.toLowerCase();
    if (statusCode === 'inactive' || statusCode === 'deleted') {
      throw new BadRequestException('El chofer está inactivo');
    }
    const truck = await this.getActiveTruck(dto.truck_id, tenantId);
    const changed =
      driver.id !== current.driver_id || truck.id !== current.truck_id;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      if (truck.id !== current.truck_id) {
        await this.assertTruckAvailable(qr.manager, tenantId, truck, current.id);
      }
      const patch: QueryDeepPartialEntity<Shipping> = {
        driver_id: driver.id,
        truck_id: truck.id,
      };
      if (changed && current.carta_porte_environment === 'demo') {
        patch.carta_porte_uuid = null;
        patch.carta_porte_idccp = null;
        patch.carta_porte_xml = null;
        patch.carta_porte_stamped_at = null;
        patch.carta_porte_error = null;
        patch.carta_porte_peso_kg = null;
        patch.carta_porte_environment = null;
      }
      await qr.manager.update(Shipping, { id, tenant_id: tenantId }, patch);
      await qr.commitTransaction();
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
    return this.findOne(id, tenantId);
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
      if (next === 'Completado') {
        await this.transfers.assertReceivedBeforeClose(
          qr.manager,
          tenantId,
          shipping.id,
        );
      }
      if (next === 'Cancelado') {
        await this.transfers.releaseFromCancelledShipping(
          qr.manager,
          tenantId,
          shipping.id,
        );
      }
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

  private attachTransferView(shipping: Shipping): Shipping {
    const links = shipping.transfer_links ?? [];
    Object.assign(shipping, {
      transfers: links.map((link) => ({
        id: link.inventory_transfer_id,
        folio: link.inventory_transfer?.folio ?? '',
        status: link.inventory_transfer?.status ?? null,
        total_quantity: link.inventory_transfer?.total_quantity ?? null,
        destination_warehouse_name:
          link.inventory_transfer?.destination_warehouse?.name ?? null,
      })),
    });
    return shipping;
  }

  private distanceWithTransfers(
    origin: RouteOrigin,
    stops: ResolvedStop[],
    transfers: InventoryTransfer[],
    orderKm: number | null,
  ): number | null {
    const transferPoints = transfers
      .map((transfer) => {
        const warehouse = transfer.destination_warehouse;
        const branch = warehouse?.billing_branch;
        const latitude = warehouse?.latitude ?? branch?.latitude ?? null;
        const longitude = warehouse?.longitude ?? branch?.longitude ?? null;
        return {
          latitude: latitude == null ? null : Number(latitude),
          longitude: longitude == null ? null : Number(longitude),
        };
      })
      .filter((point) => hasValidGps(point));
    if (!transferPoints.length) return orderKm;
    return routeDistanceKm([
      {
        latitude: origin.latitude != null ? Number(origin.latitude) : null,
        longitude: origin.longitude != null ? Number(origin.longitude) : null,
      },
      ...stops.map((stop) => ({
        latitude: stop.delivery_latitude,
        longitude: stop.delivery_longitude,
      })),
      ...transferPoints,
    ]);
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
  ): Promise<ResolvedAddress> {
    const customerName = this.customerName(order);
    const addresses = await this.loadActiveAddresses(order.customer_id, tenantId);
    const customer_addresses = addresses.map((address) =>
      this.toAddressOption(address),
    );

    const preferred = preferredAddressId
      ? addresses.find((address) => address.id === Number(preferredAddressId))
      : undefined;
    const primary = addresses.find((address) => Boolean(address.is_primary));
    const shippingWithGps = addresses.find(
      (address) => address.type === 'shipping' && hasValidGps(address),
    );
    const anyWithGps = addresses.find((address) => hasValidGps(address));
    const shippingAny = addresses.find((address) => address.type === 'shipping');
    const chosen =
      preferred ||
      primary ||
      shippingWithGps ||
      anyWithGps ||
      shippingAny ||
      addresses[0];

    return this.addressSelection(chosen, customerName, customer_addresses);
  }

  private addressSelection(
    chosen: CustomerAddress | undefined,
    customerName: string | null,
    customer_addresses: CustomerAddressOption[],
  ): ResolvedAddress {
    if (!chosen) {
      return {
        customer_address_id: null,
        location_status: 'without_location',
        delivery_latitude: null,
        delivery_longitude: null,
        address_summary: null,
        customer_name: customerName,
        address_type: null,
        customer_addresses,
      };
    }
    const gps = hasValidGps(chosen);
    return {
      customer_address_id: chosen.id,
      location_status: (gps ? 'ok' : 'without_location') as LocationStatus,
      delivery_latitude: gps ? Number(chosen.latitude) : null,
      delivery_longitude: gps ? Number(chosen.longitude) : null,
      address_summary: this.addressSummary(chosen),
      customer_name: customerName,
      address_type: chosen.type ?? null,
      customer_addresses,
    };
  }

  private async loadActiveAddresses(
    customerId: number | null | undefined,
    tenantId: string,
  ): Promise<CustomerAddress[]> {
    if (customerId == null) return [];
    return this.addressRepo.find({
      where: {
        tenant_id: tenantId,
        customer_id: customerId,
        status: 1,
      },
      order: { is_primary: 'DESC', id: 'ASC' },
    });
  }

  private async attachCustomerAddresses(
    shipping: Shipping,
    tenantId: string,
  ): Promise<void> {
    const stops = shipping.stops ?? [];
    const customerIds = [
      ...new Set(
        stops
          .map((stop) => stop.sales_order?.customer_id)
          .filter((id): id is number => id != null),
      ),
    ];
    if (customerIds.length === 0) {
      for (const stop of stops) {
        (stop as ShippingStopWithAddresses).customer_addresses =
          [];
      }
      return;
    }

    const rows = await this.addressRepo.find({
      where: {
        tenant_id: tenantId,
        customer_id: In(customerIds),
        status: 1,
      },
      order: { is_primary: 'DESC', id: 'ASC' },
    });
    const byCustomer = new Map<number, CustomerAddressOption[]>();
    for (const row of rows) {
      const list = byCustomer.get(row.customer_id) ?? [];
      list.push(this.toAddressOption(row));
      byCustomer.set(row.customer_id, list);
    }
    for (const stop of stops) {
      const customerId = stop.sales_order?.customer_id;
      (stop as ShippingStopWithAddresses).customer_addresses =
        customerId != null ? byCustomer.get(customerId) ?? [] : [];
    }
  }

  private toAddressOption(address: CustomerAddress): CustomerAddressOption {
    return {
      id: address.id,
      type: address.type ?? null,
      type_label: this.addressTypeLabel(address.type),
      address_summary: this.addressSummary(address),
      is_primary: Boolean(address.is_primary),
      has_gps: hasValidGps(address),
      latitude: address.latitude != null ? Number(address.latitude) : null,
      longitude: address.longitude != null ? Number(address.longitude) : null,
    };
  }

  private addressTypeLabel(type: string | null | undefined): string {
    switch (type) {
      case 'shipping':
        return 'Entrega';
      case 'billing':
        return 'Facturación';
      case 'primary':
        return 'Principal';
      default:
        return 'Dirección';
    }
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
        customer_addresses: r.customer_addresses ?? [],
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

  private async assertTruckAvailable(
    manager: EntityManager,
    tenantId: string,
    truck: Truck,
    exceptShippingId?: string,
  ): Promise<void> {
    const busyQuery = manager
      .createQueryBuilder(Shipping, 'shipping')
      .setLock('pessimistic_write')
      .where('shipping.tenant_id = :tenantId', { tenantId })
      .andWhere('shipping.truck_id = :truckId', { truckId: truck.id })
      .andWhere('shipping.status IN (:...statuses)', {
        statuses: [...ACTIVE_SHIPPING_STATUSES],
      });
    if (exceptShippingId) {
      busyQuery.andWhere('shipping.id != :exceptShippingId', { exceptShippingId });
    }
    const busy = await busyQuery.getOne();
    if (busy) {
      const label = [truck.name, truck.placa].filter(Boolean).join(' · ');
      throw new ConflictException(
        `La unidad ${label} ya está en un envío activo. Complétalo o cancélalo para volver a usarla.`,
      );
    }
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

  async listDrivers(tenantId: string) {
    const users = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.status', 'status')
      .where('user.tenant_id = :tenantId', { tenantId })
      .andWhere('user.is_driver = 1')
      .andWhere(
        '(status.code IS NULL OR LOWER(status.code) NOT IN (:...hidden))',
        { hidden: ['inactive', 'deleted'] },
      )
      .orderBy('user.first_name', 'ASC')
      .addOrderBy('user.last_name', 'ASC')
      .getMany();

    return {
      data: users.map((user) => {
        const check = assessDriver(user);
        return {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          status: user.status
            ? {
                id: user.status.id,
                code: user.status.code,
                name: user.status.name,
              }
            : null,
          status_id: user.status?.id ?? null,
          is_driver: true,
          driver_license_number: user.driver_license_number,
          driver_rfc: user.driver_rfc,
          carta_porte_ready: check.ready,
          carta_porte_missing: check.missing,
        };
      }),
    };
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
