import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subcategory } from '../../entities/categories/subcategory.entity';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { QuerySubcategoryDto } from './dto/query-subcategory.dto';
import { PaginatedSubcategoryDto } from './dto/paginated-subcategory.dto';

@Injectable()
export class SubcategoryService {
  constructor(
    @InjectRepository(Subcategory)
    private repo: Repository<Subcategory>,
  ) {}

  async create(dto: CreateSubcategoryDto, tenantId: string): Promise<Subcategory> {
    const subcategory = this.repo.create({
      ...dto,
      tenant_id: tenantId,
      status: dto.status || 'active',
    });
    const saved = await this.repo.save(subcategory);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(
    tenantId: string,
    query?: QuerySubcategoryDto,
  ): Promise<PaginatedSubcategoryDto> {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('subcategory')
      .where('subcategory.tenant_id = :tenantId', { tenantId });

    if (query?.search) {
      queryBuilder.andWhere(
        'LOWER(subcategory.name) LIKE LOWER(:search)',
        { search: `%${query.search}%` }
      );
    }

    if (query?.status) {
      queryBuilder.andWhere('subcategory.status = :status', { status: query.status });
    }

    if (query?.category_id) {
      queryBuilder.andWhere('subcategory.category_id = :category_id', {
        category_id: query.category_id,
      });
    }

    queryBuilder.orderBy('subcategory.display_order', 'ASC');
    queryBuilder.addOrderBy('subcategory.created_at', 'DESC');

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

  async findOne(id: string, tenantId: string): Promise<Subcategory> {
    const subcategory = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${id} not found`);
    }

    return subcategory;
  }

  async update(
    id: string,
    dto: UpdateSubcategoryDto,
    tenantId: string,
  ): Promise<Subcategory> {
    const subcategory = await this.findOne(id, tenantId);
    Object.assign(subcategory, dto);
    return this.repo.save(subcategory);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const subcategory = await this.findOne(id, tenantId);
    await this.repo.remove(subcategory);
  }
}
