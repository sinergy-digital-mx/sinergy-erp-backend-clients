import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PosConfiguration } from '../../entities/billing/pos-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { CreatePosConfigurationDto } from './dto/create-pos-configuration.dto';
import { UpdatePosConfigurationDto } from './dto/update-pos-configuration.dto';
import { QueryPosConfigurationDto } from './dto/query-pos-configuration.dto';
import { PaginatedPosConfigurationDto } from './dto/paginated-pos-configuration.dto';

@Injectable()
export class PosConfigurationService {
  constructor(
    @InjectRepository(PosConfiguration)
    private repo: Repository<PosConfiguration>,
    @InjectRepository(BillingBranch)
    private branchRepo: Repository<BillingBranch>,
  ) {}

  async create(dto: CreatePosConfigurationDto, tenantId: string): Promise<PosConfiguration> {
    // Validate branch reference
    await this.validateBranch(dto.sucursal, tenantId);

    const config = this.repo.create({
      ...dto,
      tenant_id: tenantId,
      status: dto.status ?? 1,
    });
    
    const saved = await this.repo.save(config);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(
    tenantId: string,
    query?: QueryPosConfigurationDto,
  ): Promise<PaginatedPosConfigurationDto> {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.branch', 'branch')
      .where('config.tenant_id = :tenantId', { tenantId });

    if (query?.search) {
      queryBuilder.andWhere(
        'LOWER(config.code) LIKE LOWER(:search)',
        { search: `%${query.search}%` }
      );
    }

    if (query?.status !== undefined) {
      queryBuilder.andWhere('config.status = :status', { status: query.status });
    }

    if (query?.sucursal) {
      queryBuilder.andWhere('config.sucursal = :sucursal', { sucursal: query.sucursal });
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

  async findOne(id: string, tenantId: string): Promise<PosConfiguration> {
    const config = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['branch'],
    });

    if (!config) {
      throw new NotFoundException(
        `POS Configuration with ID "${id}" not found or does not belong to your organization`,
      );
    }

    return config;
  }

  async update(
    id: string,
    dto: UpdatePosConfigurationDto,
    tenantId: string,
  ): Promise<PosConfiguration> {
    const config = await this.findOne(id, tenantId);

    // Validate branch reference if sucursal is being updated
    if (dto.sucursal && dto.sucursal !== config.sucursal) {
      await this.validateBranch(dto.sucursal, tenantId);
    }

    Object.assign(config, dto);
    return this.repo.save(config);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const config = await this.findOne(id, tenantId);
    try {
      await this.repo.remove(config);
    } catch (error) {
      // Handle foreign key constraint violations (e.g., referenced by active POS operations)
      if (error?.code === 'ER_ROW_IS_REFERENCED_2' || error?.code === '23503') {
        throw new ConflictException(
          `POS Configuration with ID "${id}" cannot be deleted because it is referenced by active POS operations`,
        );
      }
      throw error;
    }
  }

  /**
   * Validates that a branch exists and belongs to the tenant
   * @param sucursal Branch UUID to validate
   * @param tenantId Tenant ID for validation
   * @throws BadRequestException if branch is not found or doesn't belong to tenant
   */
  private async validateBranch(sucursal: string, tenantId: string): Promise<void> {
    const branch = await this.branchRepo.findOne({
      where: { 
        id: sucursal,
      },
      relations: ['fiscal_configuration'],
    });

    if (!branch) {
      throw new BadRequestException(
        `Invalid branch reference: branch with ID "${sucursal}" does not exist`,
      );
    }

    // Verify the branch belongs to the tenant through fiscal configuration
    if (branch.fiscal_configuration?.tenant_id !== tenantId) {
      throw new BadRequestException(
        `Invalid branch reference: branch with ID "${sucursal}" does not belong to your organization`,
      );
    }
  }
}
