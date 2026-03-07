import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { PaginatedVendorDto } from './dto/paginated-vendor.dto';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private repo: Repository<Vendor>,
  ) {}

  async create(dto: CreateVendorDto, tenantId: string): Promise<Vendor> {
    const vendor = this.repo.create({
      ...dto,
      tenant_id: tenantId,
      status: dto.status || 'active',
    });
    return this.repo.save(vendor);
  }

  async findAll(
    tenantId: string,
    query?: QueryVendorDto,
  ): Promise<PaginatedVendorDto> {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('vendor')
      .where('vendor.tenant_id = :tenantId', { tenantId });

    if (query?.search) {
      queryBuilder.andWhere(
        '(LOWER(vendor.name) LIKE LOWER(:search) OR LOWER(vendor.company_name) LIKE LOWER(:search))',
        { search: `%${query.search}%` }
      );
    }

    if (query?.status) {
      queryBuilder.andWhere('vendor.status = :status', { status: query.status });
    }

    if (query?.state) {
      queryBuilder.andWhere('vendor.state = :state', { state: query.state });
    }

    if (query?.country) {
      queryBuilder.andWhere('vendor.country = :country', { country: query.country });
    }

    queryBuilder.orderBy('vendor.created_at', 'DESC');

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

  async findOne(id: string, tenantId: string): Promise<Vendor> {
    const vendor = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  async update(
    id: string,
    dto: UpdateVendorDto,
    tenantId: string,
  ): Promise<Vendor> {
    const vendor = await this.findOne(id, tenantId);
    Object.assign(vendor, dto);
    return this.repo.save(vendor);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const vendor = await this.findOne(id, tenantId);
    await this.repo.remove(vendor);
  }
}
