import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { QueryWarehouseDto } from './dto/query-warehouse.dto';
import { PaginatedWarehouseDto } from './dto/paginated-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private repo: Repository<Warehouse>,
  ) {}

  async create(dto: CreateWarehouseDto, tenantId: string): Promise<Warehouse> {
    const warehouse = this.repo.create({
      ...dto,
      tenant_id: tenantId,
      status: dto.status || 'active',
    });
    return this.repo.save(warehouse);
  }

  async findAll(
    tenantId: string,
    query?: QueryWarehouseDto,
  ): Promise<PaginatedWarehouseDto> {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('warehouse')
      .where('warehouse.tenant_id = :tenantId', { tenantId });

    if (query?.search) {
      queryBuilder.andWhere(
        '(LOWER(warehouse.name) LIKE LOWER(:search) OR LOWER(warehouse.code) LIKE LOWER(:search))',
        { search: `%${query.search}%` }
      );
    }

    if (query?.status) {
      queryBuilder.andWhere('warehouse.status = :status', { status: query.status });
    }

    if (query?.state) {
      queryBuilder.andWhere('warehouse.state = :state', { state: query.state });
    }

    if (query?.country) {
      queryBuilder.andWhere('warehouse.country = :country', { country: query.country });
    }

    if (query?.code) {
      queryBuilder.andWhere('warehouse.code = :code', { code: query.code });
    }

    queryBuilder.orderBy('warehouse.created_at', 'DESC');

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

  async findOne(id: string, tenantId: string): Promise<Warehouse> {
    const warehouse = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async update(
    id: string,
    dto: UpdateWarehouseDto,
    tenantId: string,
  ): Promise<Warehouse> {
    const warehouse = await this.findOne(id, tenantId);
    Object.assign(warehouse, dto);
    return this.repo.save(warehouse);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const warehouse = await this.findOne(id, tenantId);
    await this.repo.remove(warehouse);
  }
}
