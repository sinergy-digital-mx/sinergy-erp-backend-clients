import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Truck } from '../../entities/logistics/truck.entity';
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
    private readonly s3Service: S3Service,
  ) {}

  async create(dto: CreateTruckDto, tenantId: string): Promise<Truck> {
    if (dto.placa) {
      await this.assertPlacaUnique(tenantId, dto.placa);
    }
    this.sanitizeGps(dto);
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

    return withPhoto.map((truck) => {
      const shipping = busy.get(truck.id);
      return Object.assign(truck, {
        active_shipping_id: shipping?.id ?? null,
        active_shipping_status: shipping?.status ?? null,
        active_shipping_date: shipping ? shippingDay(shipping.shipping_date) : null,
        active_shipping_driver_name: shipping ? driverName(shipping.driver) : null,
      });
    });
  }

  private async getByIdOrFail(id: string, tenantId: string): Promise<Truck> {
    const truck = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
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
