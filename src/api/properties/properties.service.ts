import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Property } from '../../entities/properties/property.entity';
import { PropertyGroup } from '../../entities/properties/property-group.entity';
import { MeasurementUnit } from '../../entities/properties/measurement-unit.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

export type PropertyListFilters = {
  groupId?: string;
  customer_group_id?: string;
  search?: string;
  status?: string;
};

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
    filters: PropertyListFilters = {},
    page: number = 1,
    limit: number = 20,
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
      .leftJoinAndSelect('customer.group', 'customerGroup')
      .where('p.tenant_id = :tenantId', { tenantId });

    this.applyPropertyListFilters(query, filters);

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
          fullName: `${customer.name} ${customer.lastname}`.trim(),
          group_id: customer.group_id ?? null,
          group: customer.group
            ? { id: customer.group.id, name: customer.group.name }
            : null,
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

  /**
   * KPIs del listado de lotes. Mismos filtros que GET /properties (proyecto, grupo de cliente, estatus, search).
   */
  async getListStats(
    tenantId: string,
    filters: PropertyListFilters = {},
  ): Promise<{
    total: { count: number; area: number; value: number };
    available: { count: number; area: number; value: number };
    active_in_payment: { count: number; remaining_balance: number };
    reserved: { count: number };
    sold: { count: number };
    avg_price_per_m2: number;
  }> {
    const totalsQuery = this.propertyRepo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId });
    this.applyPropertyListFilters(totalsQuery, filters);

    const totals = await totalsQuery
      .select('COUNT(DISTINCT p.id)', 'count')
      .addSelect('COALESCE(SUM(p.total_area), 0)', 'area')
      .addSelect('COALESCE(SUM(p.total_price), 0)', 'value')
      .addSelect(
        "COALESCE(SUM(CASE WHEN p.status = 'disponible' THEN 1 ELSE 0 END), 0)",
        'available_count',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN p.status = 'disponible' THEN p.total_area ELSE 0 END), 0)",
        'available_area',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN p.status = 'disponible' THEN p.total_price ELSE 0 END), 0)",
        'available_value',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN p.status = 'reservado' THEN 1 ELSE 0 END), 0)",
        'reserved_count',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN p.status = 'vendido' THEN 1 ELSE 0 END), 0)",
        'sold_count',
      )
      .getRawOne();

    const activeQuery = this.propertyRepo
      .createQueryBuilder('p')
      .innerJoin('p.contracts', 'ac', "ac.status = 'activo'")
      .where('p.tenant_id = :tenantId', { tenantId });
    this.applyPropertyListFilters(activeQuery, filters);

    const active = await activeQuery
      .select('COUNT(DISTINCT p.id)', 'count')
      .addSelect('COALESCE(SUM(ac.remaining_balance), 0)', 'remaining_balance')
      .getRawOne();

    const area = this.roundMoney(parseFloat(totals?.area) || 0);
    const value = this.roundMoney(parseFloat(totals?.value) || 0);

    return {
      total: {
        count: parseInt(totals?.count, 10) || 0,
        area,
        value,
      },
      available: {
        count: parseInt(totals?.available_count, 10) || 0,
        area: this.roundMoney(parseFloat(totals?.available_area) || 0),
        value: this.roundMoney(parseFloat(totals?.available_value) || 0),
      },
      active_in_payment: {
        count: parseInt(active?.count, 10) || 0,
        remaining_balance: this.roundMoney(parseFloat(active?.remaining_balance) || 0),
      },
      reserved: {
        count: parseInt(totals?.reserved_count, 10) || 0,
      },
      sold: {
        count: parseInt(totals?.sold_count, 10) || 0,
      },
      avg_price_per_m2: area > 0 ? this.roundMoney(value / area) : 0,
    };
  }

  private applyPropertyListFilters(
    query: ReturnType<Repository<Property>['createQueryBuilder']>,
    filters: PropertyListFilters,
  ): void {
    if (filters.groupId) {
      query.andWhere('p.group_id = :groupId', { groupId: filters.groupId });
    }

    if (filters.status) {
      query.andWhere('p.status = :status', { status: filters.status });
    }

    if (filters.customer_group_id) {
      query.andWhere(
        `EXISTS (
          SELECT 1 FROM contracts cg_c
          INNER JOIN customers cg_cust ON cg_cust.id = cg_c.customer_id
          WHERE cg_c.property_id = p.id
            AND cg_cust.group_id = :customerGroupId
        )`,
        { customerGroupId: filters.customer_group_id },
      );
    }

    if (filters.search) {
      query.andWhere(
        `(
          LOWER(p.code) LIKE LOWER(:search)
          OR LOWER(p.name) LIKE LOWER(:search)
          OR LOWER(p.block) LIKE LOWER(:search)
          OR LOWER(p.lot_number) LIKE LOWER(:search)
          OR LOWER(p.cadastral_key) LIKE LOWER(:search)
          OR LOWER(p.location) LIKE LOWER(:search)
          OR LOWER(p.description) LIKE LOWER(:search)
          OR EXISTS (
            SELECT 1 FROM contracts s_c
            INNER JOIN customers s_cust ON s_cust.id = s_c.customer_id
            WHERE s_c.property_id = p.id
              AND (
                LOWER(s_cust.name) LIKE LOWER(:search)
                OR LOWER(s_cust.lastname) LIKE LOWER(:search)
                OR LOWER(CONCAT(s_cust.name, ' ', s_cust.lastname)) LIKE LOWER(:search)
              )
          )
        )`,
        { search: `%${filters.search}%` },
      );
    }
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
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
