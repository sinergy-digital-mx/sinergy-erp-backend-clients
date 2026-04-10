import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { CreateBillingBranchDto } from './dto/create-billing-branch.dto';
import { UpdateBillingBranchDto } from './dto/update-billing-branch.dto';

@Injectable()
export class BillingBranchService {
  constructor(
    @InjectRepository(BillingBranch)
    private branchRepository: Repository<BillingBranch>,
    @InjectRepository(FiscalConfiguration)
    private fiscalConfigRepository: Repository<FiscalConfiguration>,
  ) {}

  async create(
    fiscalConfigId: string,
    tenantId: string,
    dto: CreateBillingBranchDto,
  ): Promise<BillingBranch> {
    // Verify fiscal configuration exists and belongs to tenant
    const fiscalConfig = await this.fiscalConfigRepository.findOne({
      where: { id: fiscalConfigId, tenant_id: tenantId },
    });

    if (!fiscalConfig) {
      throw new NotFoundException(
        `Fiscal configuration ${fiscalConfigId} not found for tenant ${tenantId}`,
      );
    }

    // Check if branch code already exists for this fiscal configuration
    const existingBranch = await this.branchRepository.findOne({
      where: {
        fiscal_configuration_id: fiscalConfigId,
        code: dto.code,
      },
    });

    if (existingBranch) {
      throw new ConflictException(
        `Branch with code '${dto.code}' already exists for this fiscal configuration`,
      );
    }

    const branch = this.branchRepository.create({
      ...dto,
      fiscal_configuration_id: fiscalConfigId,
      status: dto.status ?? 1,
    });

    return await this.branchRepository.save(branch);
  }

  async findAll(fiscalConfigId: string, tenantId: string): Promise<BillingBranch[]> {
    // Verify fiscal configuration belongs to tenant
    const fiscalConfig = await this.fiscalConfigRepository.findOne({
      where: { id: fiscalConfigId, tenant_id: tenantId },
    });

    if (!fiscalConfig) {
      throw new NotFoundException(
        `Fiscal configuration ${fiscalConfigId} not found for tenant ${tenantId}`,
      );
    }

    return await this.branchRepository.find({
      where: { fiscal_configuration_id: fiscalConfigId },
      order: { code: 'ASC' },
    });
  }

  async findOne(
    id: string,
    fiscalConfigId: string,
    tenantId: string,
  ): Promise<BillingBranch> {
    // Verify fiscal configuration belongs to tenant
    const fiscalConfig = await this.fiscalConfigRepository.findOne({
      where: { id: fiscalConfigId, tenant_id: tenantId },
    });

    if (!fiscalConfig) {
      throw new NotFoundException(
        `Fiscal configuration ${fiscalConfigId} not found for tenant ${tenantId}`,
      );
    }

    const branch = await this.branchRepository.findOne({
      where: { id, fiscal_configuration_id: fiscalConfigId },
    });

    if (!branch) {
      throw new NotFoundException(`Branch ${id} not found`);
    }

    return branch;
  }

  async update(
    id: string,
    fiscalConfigId: string,
    tenantId: string,
    dto: UpdateBillingBranchDto,
  ): Promise<BillingBranch> {
    const branch = await this.findOne(id, fiscalConfigId, tenantId);

    // If updating code, check for conflicts
    if (dto.code && dto.code !== branch.code) {
      const existingBranch = await this.branchRepository.findOne({
        where: {
          fiscal_configuration_id: fiscalConfigId,
          code: dto.code,
        },
      });

      if (existingBranch) {
        throw new ConflictException(
          `Branch with code '${dto.code}' already exists for this fiscal configuration`,
        );
      }
    }

    Object.assign(branch, dto);
    return await this.branchRepository.save(branch);
  }

  async remove(id: string, fiscalConfigId: string, tenantId: string): Promise<void> {
    const branch = await this.findOne(id, fiscalConfigId, tenantId);
    await this.branchRepository.remove(branch);
  }

  async findAllByTenant(tenantId: string): Promise<(BillingBranch & { display_name: string })[]> {
    const branches = await this.branchRepository
      .createQueryBuilder('branch')
      .innerJoinAndSelect('branch.fiscal_configuration', 'fc')
      .where('fc.tenant_id = :tenantId', { tenantId })
      .orderBy('branch.code', 'ASC')
      .getMany();

    return branches.map((branch) => ({
      ...branch,
      display_name: `${branch.fiscal_configuration.rfc} - ${branch.code}`,
    }));
  }
}
