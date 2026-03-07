import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { CreateFiscalConfigurationDto } from './dto/create-fiscal-configuration.dto';
import { UpdateFiscalConfigurationDto } from './dto/update-fiscal-configuration.dto';
import { QueryFiscalConfigurationDto } from './dto/query-fiscal-configuration.dto';
import { PaginatedFiscalConfigurationDto } from './dto/paginated-fiscal-configuration.dto';

@Injectable()
export class FiscalConfigurationService {
  constructor(
    @InjectRepository(FiscalConfiguration)
    private repo: Repository<FiscalConfiguration>,
  ) {}

  async create(dto: CreateFiscalConfigurationDto, tenantId: string): Promise<FiscalConfiguration> {
    const config = this.repo.create({
      ...dto,
      tenant_id: tenantId,
      status: dto.status || 'active',
    });
    const saved = await this.repo.save(config);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(
    tenantId: string,
    query?: QueryFiscalConfigurationDto,
  ): Promise<PaginatedFiscalConfigurationDto> {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('config')
      .where('config.tenant_id = :tenantId', { tenantId });

    if (query?.search) {
      queryBuilder.andWhere(
        '(LOWER(config.razon_social) LIKE LOWER(:search) OR LOWER(config.rfc) LIKE LOWER(:search))',
        { search: `%${query.search}%` }
      );
    }

    if (query?.status) {
      queryBuilder.andWhere('config.status = :status', { status: query.status });
    }

    queryBuilder.orderBy('config.created_at', 'DESC');

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

  async findOne(id: string, tenantId: string): Promise<FiscalConfiguration> {
    const config = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!config) {
      throw new NotFoundException(`Fiscal Configuration with ID ${id} not found`);
    }

    return config;
  }



  async update(
    id: string,
    dto: UpdateFiscalConfigurationDto,
    tenantId: string,
  ): Promise<FiscalConfiguration> {
    const config = await this.findOne(id, tenantId);
    Object.assign(config, dto);
    return this.repo.save(config);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const config = await this.findOne(id, tenantId);
    await this.repo.remove(config);
  }
}
