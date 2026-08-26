import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Property } from '../../entities/properties/property.entity';
import { PropertyGroup } from '../../entities/properties/property-group.entity';
import { MeasurementUnit } from '../../entities/properties/measurement-unit.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private propertyRepo: Repository<Property>,
    @InjectRepository(PropertyGroup)
    private groupRepo: Repository<PropertyGroup>,
    @InjectRepository(MeasurementUnit)
    private measurementUnitRepo: Repository<MeasurementUnit>,
  ) {}

  async create(tenantId: string, dto: CreatePropertyDto): Promise<Property> {
    await this.assertPropertyCodeAvailable(tenantId, dto.code);

    const property = this.propertyRepo.create({
      ...dto,
      tenant_id: tenantId,
      cadastral_key: this.normalizeOptionalText(dto.cadastral_key),
    });

    let saved: Property;
    try {
      saved = await this.propertyRepo.save(property);
    } catch (err) {
      this.rethrowIfDuplicatePropertyCode(err, dto.code);
      throw err;
    }

    // Update group stats
    await this.updateGroupStats(tenantId, dto.group_id);

    return saved;
  }

  async findAll(
    tenantId: string, 
    groupId?: string, 
    search?: string, 
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;
    
    const skip = (page - 1) * limit;

    const query = this.propertyRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.group', 'g')
      .leftJoinAndSelect('p.measurement_unit', 'mu')
      .leftJoinAndSelect('p.contracts', 'contracts')
      .leftJoinAndSelect('contracts.customer', 'customer')
      .where('p.tenant_id = :tenantId', { tenantId });

    if (groupId) {
      query.andWhere('p.group_id = :groupId', { groupId });
    }

    if (status) {
      query.andWhere('p.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(LOWER(p.code) LIKE LOWER(:search) OR LOWER(p.name) LIKE LOWER(:search) OR LOWER(p.block) LIKE LOWER(:search) OR LOWER(p.lot_number) LIKE LOWER(:search) OR LOWER(p.cadastral_key) LIKE LOWER(:search) OR LOWER(p.location) LIKE LOWER(:search) OR LOWER(p.description) LIKE LOWER(:search) OR LOWER(customer.name) LIKE LOWER(:search) OR LOWER(customer.lastname) LIKE LOWER(:search) OR LOWER(CONCAT(customer.name, " ", customer.lastname)) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const properties = await query
      .orderBy('p.code', 'ASC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Transform the response to include customer info at the property level
    const data = properties.map(property => {
      // Find the most relevant contract: prioritize 'activo', then 'completado', then any other
      let relevantContract = property.contracts && property.contracts.length > 0
        ? (property.contracts.find(c => c.status === 'activo') ||
           property.contracts.find(c => c.status === 'completado') ||
           property.contracts[0])
        : null;
      
      const customer = relevantContract?.customer;

      return {
        ...property,
        customer: customer ? {
          id: customer.id,
          name: customer.name,
          lastname: customer.lastname,
          fullName: `${customer.name} ${customer.lastname}`.trim()
        } : null,
        // Keep the original contracts array for backward compatibility
        contracts: property.contracts
      };
    });

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

  async findOne(tenantId: string, id: string): Promise<Property | null> {
    return this.propertyRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.group', 'g')
      .leftJoinAndSelect('p.measurement_unit', 'mu')
      .leftJoinAndSelect('p.contracts', 'contracts', 'contracts.status = :contractStatus', { contractStatus: 'activo' })
      .leftJoinAndSelect('contracts.customer', 'customer')
      .where('p.id = :id', { id })
      .andWhere('p.tenant_id = :tenantId', { tenantId })
      .getOne();
  }

  async findByCode(tenantId: string, code: string): Promise<Property | null> {
    return this.propertyRepo.findOne({
      where: { code, tenant_id: tenantId },
      relations: ['group', 'measurement_unit'],
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePropertyDto): Promise<Property> {
    const property = await this.findOne(tenantId, id);
    if (!property) {
      throw new Error('Property not found');
    }

    if (dto.code !== undefined && dto.code !== property.code) {
      await this.assertPropertyCodeAvailable(tenantId, dto.code, property.id);
    }

    Object.assign(property, dto);
    if (dto.cadastral_key !== undefined) {
      property.cadastral_key = this.normalizeOptionalText(dto.cadastral_key);
    }

    let updated: Property;
    try {
      updated = await this.propertyRepo.save(property);
    } catch (err) {
      if (dto.code !== undefined) {
        this.rethrowIfDuplicatePropertyCode(err, dto.code);
      }
      throw err;
    }

    // Update group stats
    await this.updateGroupStats(tenantId, property.group_id);

    return updated;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const property = await this.findOne(tenantId, id);
    if (!property) {
      throw new Error('Property not found');
    }

    await this.propertyRepo.remove(property);
    await this.updateGroupStats(tenantId, property.group_id);
  }

  async getPropertyStats(tenantId: string, groupId: string): Promise<any> {
    const stats = await this.propertyRepo
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN p.status = 'disponible' THEN 1 ELSE 0 END)", 'available')
      .addSelect("SUM(CASE WHEN p.status = 'vendido' THEN 1 ELSE 0 END)", 'sold')
      .addSelect("SUM(CASE WHEN p.status = 'reservado' THEN 1 ELSE 0 END)", 'reserved')
      .addSelect('SUM(p.total_price)', 'total_value')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.group_id = :groupId', { groupId })
      .getRawOne();

    return {
      total: parseInt(stats.total) || 0,
      available: parseInt(stats.available) || 0,
      sold: parseInt(stats.sold) || 0,
      reserved: parseInt(stats.reserved) || 0,
      total_value: parseFloat(stats.total_value) || 0,
    };
  }

  private async updateGroupStats(tenantId: string, groupId: string): Promise<void> {
    const stats = await this.getPropertyStats(tenantId, groupId);

    await this.groupRepo.update(
      { id: groupId, tenant_id: tenantId },
      {
        total_properties: stats.total,
        available_properties: stats.available,
        sold_properties: stats.sold,
      },
    );
  }

  async getMeasurementUnits(): Promise<MeasurementUnit[]> {
    return this.measurementUnitRepo.find({
      order: { system: 'ASC', name: 'ASC' },
    });
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  private async assertPropertyCodeAvailable(
    tenantId: string,
    code: string,
    excludePropertyId?: string,
  ): Promise<void> {
    const existing = await this.propertyRepo.findOne({
      where: { tenant_id: tenantId, code },
    });
    if (existing && existing.id !== excludePropertyId) {
      throw new ConflictException(
        `Ya existe una propiedad con el código "${code}".`,
      );
    }
  }

  private rethrowIfDuplicatePropertyCode(err: unknown, code: string): void {
    if (!(err instanceof QueryFailedError)) {
      return;
    }
    const driverErr = err.driverError as { code?: string; errno?: number; sqlMessage?: string } | undefined;
    const isDup =
      driverErr?.code === 'ER_DUP_ENTRY' ||
      driverErr?.errno === 1062 ||
      /Duplicate entry/i.test(err.message);
    if (!isDup) {
      return;
    }
    const detail = driverErr?.sqlMessage ?? err.message;
    throw new ConflictException({
      statusCode: 409,
      message: `Ya existe una propiedad con el código "${code}".`,
      error: 'Conflict',
      detail,
    });
  }
}
