import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { CreateBillingBranchDto } from './dto/create-billing-branch.dto';
import { UpdateBillingBranchDto } from './dto/update-billing-branch.dto';
import { BranchWarehouseDto } from './dto/branch-warehouse.dto';
import { normalizeDocumentPrefix } from '../../common/utils/document-prefix.util';
import { randomUUID } from 'crypto';

type BranchWarehouseResponse = {
  id: string;
  name: string;
  code: string | null;
  prefix: string | null;
  description: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  metadata: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
};

type BillingBranchDetail = BillingBranch & {
  name: string;
  warehouses_count: number;
  warehouses: BranchWarehouseResponse[];
};

@Injectable()
export class BillingBranchService {
  constructor(
    @InjectRepository(BillingBranch)
    private branchRepository: Repository<BillingBranch>,
    @InjectRepository(FiscalConfiguration)
    private fiscalConfigRepository: Repository<FiscalConfiguration>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  async create(
    fiscalConfigId: string,
    tenantId: string,
    dto: CreateBillingBranchDto,
  ): Promise<BillingBranchDetail> {
    const name = this.resolveBranchName(dto);
    await this.assertFiscalConfiguration(fiscalConfigId, tenantId);

    const existingBranch = await this.branchRepository
      .createQueryBuilder('branch')
      .where('branch.fiscal_configuration_id = :fiscalConfigId', { fiscalConfigId })
      .andWhere('LOWER(branch.code) = LOWER(:name)', { name })
      .getOne();

    if (existingBranch) {
      throw new ConflictException(
        'Ya existe una sucursal con ese nombre',
      );
    }

    const { warehouses, name: _name, code: _code, ...branchData } = dto;

    const branch = this.branchRepository.create({
      ...branchData,
      code: name,
      prefix: normalizeDocumentPrefix(dto.prefix),
      fiscal_configuration_id: fiscalConfigId,
      status: dto.status ?? 1,
    });

    const savedBranch = await this.branchRepository.save(branch);

    if (warehouses?.length) {
      await this.syncWarehouses(savedBranch.id, tenantId, warehouses);
    }

    return this.findOne(savedBranch.id, fiscalConfigId, tenantId);
  }

  async findAll(
    fiscalConfigId: string,
    tenantId: string,
  ): Promise<(BillingBranch & { name: string; warehouses_count: number })[]> {
    await this.assertFiscalConfiguration(fiscalConfigId, tenantId);

    const branches = await this.branchRepository
      .createQueryBuilder('branch')
      .where('branch.fiscal_configuration_id = :fiscalConfigId', { fiscalConfigId })
      .loadRelationCountAndMap('branch.warehousesCount', 'branch.warehouses')
      .orderBy('branch.code', 'ASC')
      .getMany();

    return branches.map((branch) => {
      const { warehousesCount, ...rest } = branch as BillingBranch & {
        warehousesCount?: number;
      };

      return {
        ...rest,
        name: rest.code,
        warehouses_count: warehousesCount ?? 0,
      };
    });
  }

  async findOne(
    id: string,
    fiscalConfigId: string,
    tenantId: string,
  ): Promise<BillingBranchDetail> {
    await this.assertFiscalConfiguration(fiscalConfigId, tenantId);

    const branch = await this.branchRepository.findOne({
      where: { id, fiscal_configuration_id: fiscalConfigId },
    });

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    const warehouses = await this.warehouseRepository.find({
      where: { billing_branch_id: id, tenant_id: tenantId },
      order: { name: 'ASC' },
    });

    return this.toBranchDetailResponse(branch, warehouses);
  }

  async update(
    id: string,
    fiscalConfigId: string,
    tenantId: string,
    dto: UpdateBillingBranchDto,
  ): Promise<BillingBranchDetail> {
    const branch = await this.branchRepository.findOne({
      where: { id, fiscal_configuration_id: fiscalConfigId },
    });

    if (!branch) {
      await this.assertFiscalConfiguration(fiscalConfigId, tenantId);
      throw new NotFoundException('Sucursal no encontrada');
    }

    await this.assertFiscalConfiguration(fiscalConfigId, tenantId);

    const { warehouses, name: incomingName, ...branchData } = dto;

    if (branchData.prefix !== undefined) {
      branchData.prefix = normalizeDocumentPrefix(branchData.prefix);
    }

    if (incomingName !== undefined || branchData.code !== undefined) {
      const name = this.resolveBranchName({ name: incomingName, code: branchData.code });
      const existingBranch = await this.branchRepository
        .createQueryBuilder('branch')
        .where('branch.fiscal_configuration_id = :fiscalConfigId', { fiscalConfigId })
        .andWhere('LOWER(branch.code) = LOWER(:name)', { name })
        .andWhere('branch.id != :id', { id })
        .getOne();

      if (existingBranch) {
        throw new ConflictException('Ya existe una sucursal con ese nombre');
      }
      branchData.code = name;
    }

    Object.assign(branch, branchData);
    await this.branchRepository.save(branch);

    if (warehouses !== undefined) {
      await this.syncWarehouses(id, tenantId, warehouses);
    }

    return this.findOne(id, fiscalConfigId, tenantId);
  }

  async remove(id: string, fiscalConfigId: string, tenantId: string): Promise<void> {
    await this.assertFiscalConfiguration(fiscalConfigId, tenantId);

    const branch = await this.branchRepository.findOne({
      where: { id, fiscal_configuration_id: fiscalConfigId },
    });

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    await this.warehouseRepository.delete({ billing_branch_id: id, tenant_id: tenantId });
    await this.branchRepository.remove(branch);
  }

  async findAllByTenant(tenantId: string): Promise<(BillingBranch & { name: string; display_name: string })[]> {
    const branches = await this.branchRepository
      .createQueryBuilder('branch')
      .innerJoinAndSelect('branch.fiscal_configuration', 'fc')
      .where('fc.tenant_id = :tenantId', { tenantId })
      .orderBy('branch.code', 'ASC')
      .getMany();

    return branches.map((branch) => ({
      ...branch,
      name: branch.code,
      display_name: `${branch.fiscal_configuration.rfc} - ${branch.code}`,
    }));
  }

  private resolveBranchName(dto: { name?: string; code?: string }): string {
    const name = (dto.name ?? dto.code ?? '').trim();
    if (!name) {
      throw new BadRequestException('El nombre de la sucursal es obligatorio');
    }
    return name;
  }

  private async assertFiscalConfiguration(
    fiscalConfigId: string,
    tenantId: string,
  ): Promise<FiscalConfiguration> {
    const fiscalConfig = await this.fiscalConfigRepository.findOne({
      where: { id: fiscalConfigId, tenant_id: tenantId },
    });

    if (!fiscalConfig) {
      throw new NotFoundException('Razón social no encontrada');
    }

    return fiscalConfig;
  }

  private async syncWarehouses(
    branchId: string,
    tenantId: string,
    warehouses: BranchWarehouseDto[],
  ): Promise<void> {
    const existing = await this.warehouseRepository.find({
      where: { billing_branch_id: branchId, tenant_id: tenantId },
    });

    const incomingIds = new Set(
      warehouses.filter((warehouse) => warehouse.id).map((warehouse) => warehouse.id!),
    );

    const toDelete = existing.filter((warehouse) => !incomingIds.has(warehouse.id));
    if (toDelete.length) {
      await this.warehouseRepository.remove(toDelete);
    }

    for (const item of warehouses) {
      if (item.id) {
        const warehouse = existing.find((existingWarehouse) => existingWarehouse.id === item.id);

        if (!warehouse) {
          throw new BadRequestException(
            'El almacén no pertenece a esta sucursal',
          );
        }

        Object.assign(warehouse, this.toWarehouseUpdatePayload(item, branchId));
        await this.warehouseRepository.save(warehouse);
        continue;
      }

      if (!item.name?.trim()) {
        throw new BadRequestException('El nombre del almacén es obligatorio');
      }

      const created = this.warehouseRepository.create({
        ...this.toWarehouseCreatePayload(item, branchId),
        tenant_id: tenantId,
        name: item.name.trim(),
        status: item.status ?? 'active',
      });
      created.code = created.id || randomUUID();

      await this.warehouseRepository.save(created);
    }
  }

  private toWarehouseCreatePayload(
    item: BranchWarehouseDto,
    branchId: string,
  ): Partial<Warehouse> {
    const prefix =
      item.prefix !== undefined ? normalizeDocumentPrefix(item.prefix) : undefined;
    return {
      billing_branch_id: branchId,
      prefix,
      description: item.description,
      street: item.street,
      city: item.city,
      state: item.state,
      zip_code: item.zip_code,
      country: item.country,
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      metadata: item.metadata,
    };
  }

  private toWarehouseUpdatePayload(
    item: BranchWarehouseDto,
    branchId: string,
  ): Partial<Warehouse> {
    const payload: Partial<Warehouse> = {
      billing_branch_id: branchId,
    };

    if (item.name !== undefined) payload.name = item.name.trim();
    if (item.prefix !== undefined) {
      payload.prefix = normalizeDocumentPrefix(item.prefix);
    }
    if (item.description !== undefined) payload.description = item.description;
    if (item.street !== undefined) payload.street = item.street;
    if (item.city !== undefined) payload.city = item.city;
    if (item.state !== undefined) payload.state = item.state;
    if (item.zip_code !== undefined) payload.zip_code = item.zip_code;
    if (item.country !== undefined) payload.country = item.country;
    if (item.latitude !== undefined) payload.latitude = item.latitude;
    if (item.longitude !== undefined) payload.longitude = item.longitude;
    if (item.status !== undefined) payload.status = item.status;
    if (item.metadata !== undefined) payload.metadata = item.metadata;

    return payload;
  }

  private toWarehouseResponse(warehouse: Warehouse): BranchWarehouseResponse {
    return {
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      prefix: warehouse.prefix,
      description: warehouse.description,
      street: warehouse.street,
      city: warehouse.city,
      state: warehouse.state,
      zip_code: warehouse.zip_code,
      country: warehouse.country,
      latitude: warehouse.latitude != null ? Number(warehouse.latitude) : null,
      longitude: warehouse.longitude != null ? Number(warehouse.longitude) : null,
      status: warehouse.status,
      metadata: warehouse.metadata,
      created_at: warehouse.created_at,
      updated_at: warehouse.updated_at,
    };
  }

  private toBranchDetailResponse(branch: BillingBranch, warehouses: Warehouse[]): BillingBranchDetail {
    const mappedWarehouses = warehouses.map((warehouse) => this.toWarehouseResponse(warehouse));

    return {
      ...branch,
      name: branch.code,
      warehouses: mappedWarehouses,
      warehouses_count: mappedWarehouses.length,
    };
  }
}
