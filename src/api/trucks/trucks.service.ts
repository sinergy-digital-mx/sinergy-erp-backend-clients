import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck } from '../../entities/logistics/truck.entity';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { QueryTruckDto } from './dto/query-truck.dto';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(Truck)
    private readonly repo: Repository<Truck>,
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
    return this.repo.save(truck);
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

  async findOne(id: string, tenantId: string): Promise<Truck> {
    const truck = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!truck) {
      throw new NotFoundException('Camión no encontrado');
    }
    return truck;
  }

  async update(
    id: string,
    dto: UpdateTruckDto,
    tenantId: string,
  ): Promise<Truck> {
    const truck = await this.findOne(id, tenantId);
    if (dto.placa && dto.placa !== truck.placa) {
      await this.assertPlacaUnique(tenantId, dto.placa, id);
    }
    Object.assign(truck, dto);
    return this.repo.save(truck);
  }

  async deactivate(id: string, tenantId: string): Promise<Truck> {
    const truck = await this.findOne(id, tenantId);
    truck.status = 'inactive';
    return this.repo.save(truck);
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
