import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck } from '../../entities/logistics/truck.entity';
import { S3Service } from '../../common/services/s3.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { QueryTruckDto } from './dto/query-truck.dto';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(Truck)
    private readonly repo: Repository<Truck>,
    private readonly s3Service: S3Service,
  ) {}

  async create(dto: CreateTruckDto, tenantId: string): Promise<Truck> {
    if (dto.placa) {
      await this.assertPlacaUnique(tenantId, dto.placa);
    }

    const truck = this.repo.create({
      ...dto,
      tenant_id: tenantId,
      status: dto.status || 'active',
    });
    const saved = await this.repo.save(truck);
    return this.toResponseWithPhotoUrl(saved);
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
        '(LOWER(truck.name) LIKE LOWER(:search) OR LOWER(truck.placa) LIKE LOWER(:search) OR LOWER(truck.code) LIKE LOWER(:search))',
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
    const data = await Promise.all(
      rows.map((truck) => this.toResponseWithPhotoUrl(truck)),
    );
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
    return this.toResponseWithPhotoUrl(truck);
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
    Object.assign(truck, dto);
    const saved = await this.repo.save(truck);
    return this.toResponseWithPhotoUrl(saved);
  }

  async deactivate(id: string, tenantId: string): Promise<Truck> {
    const truck = await this.getByIdOrFail(id, tenantId);
    truck.status = 'inactive';
    const saved = await this.repo.save(truck);
    return this.toResponseWithPhotoUrl(saved);
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
    return this.toResponseWithPhotoUrl(saved);
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
    if (!truck.photo) {
      return truck;
    }

    const photoUrl = await this.s3Service
      .getSignedUrl(truck.photo, 900)
      .catch(() => truck.photo);

    return {
      ...truck,
      photo: photoUrl,
    };
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
