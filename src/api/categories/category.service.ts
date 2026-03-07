import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/categories/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { PaginatedCategoryDto } from './dto/paginated-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto, tenantId: string): Promise<Category> {
    const category = this.repo.create({
      ...dto,
      tenant_id: tenantId,
      status: dto.status || 'active',
    });
    const saved = await this.repo.save(category);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(
    tenantId: string,
    query?: QueryCategoryDto,
  ): Promise<PaginatedCategoryDto> {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('category')
      .where('category.tenant_id = :tenantId', { tenantId });

    if (query?.search) {
      queryBuilder.andWhere(
        'LOWER(category.name) LIKE LOWER(:search)',
        { search: `%${query.search}%` }
      );
    }

    if (query?.status) {
      queryBuilder.andWhere('category.status = :status', { status: query.status });
    }

    queryBuilder.orderBy('category.display_order', 'ASC');
    queryBuilder.addOrderBy('category.created_at', 'DESC');

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

  async findOne(id: string, tenantId: string): Promise<Category> {
    const category = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['subcategories'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    tenantId: string,
  ): Promise<Category> {
    const category = await this.findOne(id, tenantId);
    Object.assign(category, dto);
    return this.repo.save(category);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const category = await this.findOne(id, tenantId);
    await this.repo.remove(category);
  }
}
