import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Truck } from '../../entities/logistics/truck.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import {
  ACTIVE_SHIPPING_STATUSES,
  Shipping,
} from '../../entities/logistics/shipping.entity';
import { User } from '../../entities/users/user.entity';
import { S3Service } from '../../common/services/s3.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { QueryTruckDto } from './dto/query-truck.dto';
import { assessTruck } from '../shippings/utils/carta-porte.util';

function driverName(driver: User | null | undefined): string | null {
  if (!driver) return null;
  const name = [driver.first_name, driver.last_name].filter(Boolean).join(' ').trim();
  return name || driver.email?.trim() || null;
}

interface BranchFiscalLabel {
  prefix: string | null;
  razonSocial: string | null;
}

function rawText(row: Record<string, unknown>, ...keys: string[]): string | null {
  const index = new Map<string, unknown>();
  for (const [key, value] of Object.entries(row)) {
    index.set(key.toLowerCase(), value);
  }
  for (const key of keys) {
    const value = index.get(key.toLowerCase());
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

function shippingDay(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(Truck)
    private readonly repo: Repository<Truck>,
    @InjectRepository(Shipping)
    private readonly shippingRepo: Repository<Shipping>,
    @InjectRepository(BillingBranch)
    private readonly branchRepo: Repository<BillingBranch>,
    private readonly s3Service: S3Service,
  ) {}

  async create(dto: CreateTruckDto, tenantId: string): Promise<Truck> {
    if (dto.placa) {
      await this.assertPlacaUnique(tenantId, dto.placa);
    }
    this.sanitizeGps(dto);
    await this.sanitizeBranch(dto, tenantId);
    await this.assertGpsUnitUnique(tenantId, dto.gps_unit_uid);

    const truck = this.repo.create({
      ...dto,
      gps_unit_uid: dto.gps_unit_uid ?? null,
      gps_unit_name: dto.gps_unit_name ?? null,
      tenant_id: tenantId,
      status: dto.status || 'active',
    });
    const saved = await this.repo.save(truck);
    return this.present(saved, tenantId);
  }

  async findAll(tenantId: string, query?: QueryTruckDto) {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const qb = this.repo
      .createQueryBuilder('truck')
      .leftJoinAndSelect('truck.default_billing_branch', 'default_branch')
      .where('truck.tenant_id = :tenantId', { tenantId });

    if (query?.search) {
      qb.andWhere(
        '(LOWER(truck.name) LIKE LOWER(:search) OR LOWER(truck.placa) LIKE LOWER(:search) OR LOWER(truck.code) LIKE LOWER(:search) OR LOWER(truck.serial_number) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    if (query?.status) {
      qb.andWhere('truck.status = :status', { status: query.status });
    }

    const branchIds = (query?.billing_branch_ids ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    if (branchIds.length) {
      qb.andWhere(
        '(truck.default_billing_branch_id IN (:...branchIds) OR truck.default_billing_branch_id IS NULL)',
        { branchIds },
      );
    }

    qb.orderBy('truck.created_at', 'DESC');

    const total = await qb.getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const data = await this.presentMany(rows, tenantId);
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

  async findOne(id: string, tenantId: string): Promise<Truck> {
    const truck = await this.getByIdOrFail(id, tenantId);
    return this.present(truck, tenantId);
  }

  async update(
    id: string,
    dto: UpdateTruckDto,
    tenantId: string,
  ): Promise<Truck> {
    const truck = await this.getByIdOrFail(id, tenantId);
    if (dto.placa && dto.placa !== truck.placa) {
      await this.assertPlacaUnique(tenantId, dto.placa, id);
    }
    this.sanitizeGps(dto);
    await this.sanitizeBranch(dto, tenantId);
    if (dto.gps_unit_uid !== undefined) {
      await this.assertGpsUnitUnique(tenantId, dto.gps_unit_uid, id);
    }
    Object.assign(truck, dto);
    const saved = await this.repo.save(truck);
    return this.present(saved, tenantId);
  }

  async deactivate(id: string, tenantId: string): Promise<Truck> {
    const truck = await this.getByIdOrFail(id, tenantId);
    truck.status = 'inactive';
    const saved = await this.repo.save(truck);
    return this.present(saved, tenantId);
  }

  async uploadPhoto(
    id: string,
    tenantId: string,
    file: Express.Multer.File,
  ): Promise<Truck> {
    const truck = await this.getByIdOrFail(id, tenantId);

    if (truck.photo) {
      await this.s3Service.deleteFile(truck.photo).catch(() => undefined);
    }

    const s3Key = await this.s3Service.uploadEntityFile(
      tenantId,
      'trucks',
      id,
      'photo',
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    truck.photo = s3Key;
    const saved = await this.repo.save(truck);
    return this.present(saved, tenantId);
  }

  private async sanitizeBranch(
    dto: CreateTruckDto | UpdateTruckDto,
    tenantId: string,
  ): Promise<void> {
    if (dto.default_billing_branch_id === undefined) return;
    const branchId = dto.default_billing_branch_id?.trim() || null;
    dto.default_billing_branch_id = branchId;
    if (!branchId) return;
    const found = await this.branchRepo
      .createQueryBuilder('branch')
      .innerJoin('branch.fiscal_configuration', 'fiscal')
      .where('branch.id = :branchId', { branchId })
      .andWhere('fiscal.tenant_id = :tenantId', { tenantId })
      .getOne();
    if (!found) {
      throw new BadRequestException('Esa sucursal no pertenece a la organización');
    }
  }

  private sanitizeGps(dto: CreateTruckDto | UpdateTruckDto): void {
    if (dto.gps_unit_uid === undefined && dto.gps_unit_name === undefined) return;
    const uid = dto.gps_unit_uid?.trim() || null;
    dto.gps_unit_uid = uid;
    dto.gps_unit_name = uid ? dto.gps_unit_name?.trim() || null : null;
  }

  private async assertGpsUnitUnique(
    tenantId: string,
    gpsUnitUid: string | null | undefined,
    excludeId?: string,
  ): Promise<void> {
    if (!gpsUnitUid) return;
    const qb = this.repo
      .createQueryBuilder('truck')
      .where('truck.tenant_id = :tenantId', { tenantId })
      .andWhere('truck.gps_unit_uid = :gpsUnitUid', { gpsUnitUid });
    if (excludeId) qb.andWhere('truck.id != :excludeId', { excludeId });
    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException('Esa unidad GPS ya está enlazada a otro camión.');
    }
  }

  private async present(truck: Truck, tenantId: string): Promise<Truck> {
    const [presented] = await this.presentMany([truck], tenantId);
    return presented;
  }

  private async presentMany(trucks: Truck[], tenantId: string): Promise<Truck[]> {
    const withPhoto = await Promise.all(
      trucks.map((truck) => this.toResponseWithPhotoUrl(truck)),
    );
    if (!withPhoto.length) return withPhoto;

    const active = await this.shippingRepo.find({
      where: {
        tenant_id: tenantId,
        truck_id: In(withPhoto.map((truck) => truck.id)),
        status: In([...ACTIVE_SHIPPING_STATUSES]),
      },
      relations: { driver: true },
    });

    const busy = new Map<string, Shipping>();
    for (const row of active) {
      const current = busy.get(row.truck_id);
      const rowDay = shippingDay(row.shipping_date);
      const currentDay = current ? shippingDay(current.shipping_date) : null;
      if (!current || (rowDay && currentDay && rowDay > currentDay)) {
        busy.set(row.truck_id, row);
      }
    }

    const fiscalByBranch = await this.loadFiscalLabels(
      withPhoto
        .map((truck) => truck.default_billing_branch_id)
        .filter((id): id is string => !!id),
      tenantId,
    );

    return withPhoto.map((truck) => {
      const shipping = busy.get(truck.id);
      const fiscal = truck.default_billing_branch_id
        ? fiscalByBranch.get(truck.default_billing_branch_id)
        : undefined;
      return Object.assign(truck, {
        active_shipping_id: shipping?.id ?? null,
        active_shipping_status: shipping?.status ?? null,
        active_shipping_date: shipping ? shippingDay(shipping.shipping_date) : null,
        active_shipping_driver_name: shipping ? driverName(shipping.driver) : null,
        default_billing_fiscal_prefix: fiscal?.prefix ?? null,
        default_billing_razon_social: fiscal?.razonSocial ?? null,
      });
    });
  }

  /** Solo prefijo y razón social. No carga sellos ni llaves. */
  private async loadFiscalLabels(
    branchIds: string[],
    tenantId: string,
  ): Promise<Map<string, BranchFiscalLabel>> {
    const ids = [...new Set(branchIds)];
    const labels = new Map<string, BranchFiscalLabel>();
    if (!ids.length) return labels;

    const rows: Record<string, unknown>[] = await this.branchRepo
      .createQueryBuilder('branch')
      .innerJoin('branch.fiscal_configuration', 'fiscal')
      .select('branch.id', 'id')
      .addSelect('fiscal.prefix', 'prefix')
      .addSelect('fiscal.razon_social', 'razon_social')
      .where('branch.id IN (:...ids)', { ids })
      .andWhere('fiscal.tenant_id = :tenantId', { tenantId })
      .getRawMany();

    for (const row of rows) {
      const id = rawText(row, 'id', 'branch_id');
      if (!id) continue;
      labels.set(id, {
        prefix: rawText(row, 'prefix', 'fiscal_prefix'),
        razonSocial: rawText(row, 'razon_social', 'fiscal_razon_social'),
      });
    }
    return labels;
  }

  private async getByIdOrFail(id: string, tenantId: string): Promise<Truck> {
    const truck = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
      relations: { default_billing_branch: true },
    });
    if (!truck) {
      throw new NotFoundException('Camión no encontrado');
    }
    return truck;
  }

  private async toResponseWithPhotoUrl(truck: Truck): Promise<Truck> {
    const check = assessTruck(truck);
    const photo = truck.photo
      ? await this.s3Service.getSignedUrl(truck.photo, 900).catch(() => truck.photo)
      : truck.photo;

    return {
      ...truck,
      photo,
      default_billing_branch_name: truck.default_billing_branch?.code?.trim() || null,
      default_billing_branch_prefix: truck.default_billing_branch?.prefix?.trim() || null,
      carta_porte_ready: check.ready,
      carta_porte_missing: check.missing,
    } as Truck;
  }

  private async assertPlacaUnique(
    tenantId: string,
    placa: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.repo
      .createQueryBuilder('truck')
      .where('truck.tenant_id = :tenantId', { tenantId })
      .andWhere('truck.placa = :placa', { placa });

    if (excludeId) {
      qb.andWhere('truck.id != :excludeId', { excludeId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException(
        'Ya existe un camión con esa placa en esta organización',
      );
    }
  }
}
