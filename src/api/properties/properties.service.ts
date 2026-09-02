import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Property } from '../../entities/properties/property.entity';
import { MeasurementUnit } from '../../entities/properties/measurement-unit.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CustomerGroupsService } from '../customers/customer-groups.service';
import {
  derivePricePerM2,
  PropertyPricingError,
  resolvePropertyPricing,
  roundMoney,
} from './utils/property-pricing.util';
import {
  DEFAULT_CONTRACT_CURRENCY,
  normalizeContractCurrency,
  resolveStoredContractCurrency,
} from '../contracts/contract-currency.util';

export type PropertyListFilters = {
  group_id?: string;
  search?: string;
  status?: string;
};

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private propertyRepo: Repository<Property>,
    @InjectRepository(MeasurementUnit)
    private measurementUnitRepo: Repository<MeasurementUnit>,
    private readonly customerGroupsService: CustomerGroupsService,
  ) {}

  async create(tenantId: string, dto: CreatePropertyDto): Promise<Property> {
    await this.assertPropertyCodeAvailable(tenantId, dto.code);
    const groupId = await this.customerGroupsService.assertBelongsToOrganization(
      dto.group_id,
      tenantId,
    );
    if (!groupId) {
      throw new BadRequestException('group_id es obligatorio');
    }

    const pricing = this.resolvePricing({
      totalArea: dto.total_area,
      totalPrice: dto.total_price,
      pricePerM2: dto.price_per_m2,
      isCreate: true,
    });

    const property = this.propertyRepo.create({
      ...dto,
      group_id: groupId,
      tenant_id: tenantId,
      currency: normalizeContractCurrency(dto.currency, DEFAULT_CONTRACT_CURRENCY),
      cadastral_key: this.normalizeOptionalText(dto.cadastral_key),
      total_price: pricing.total_price,
      price_per_m2: pricing.price_per_m2,
    });

    let saved: Property;
    try {
      saved = await this.propertyRepo.save(property);
    } catch (err) {
      this.rethrowIfDuplicatePropertyCode(err, dto.code);
      throw err;
    }

    return this.presentProperty(saved);
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
        contracts: property.contracts,
        ...this.pricingFields(property),
        currency: resolveStoredContractCurrency(property.currency),
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
    const property = await this.propertyRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.group', 'g')
      .leftJoinAndSelect('p.measurement_unit', 'mu')
      .leftJoinAndSelect('p.contracts', 'contracts', 'contracts.status = :contractStatus', { contractStatus: 'activo' })
      .leftJoinAndSelect('contracts.customer', 'customer')
      .where('p.id = :id', { id })
      .andWhere('p.tenant_id = :tenantId', { tenantId })
      .getOne();
    return property ? this.presentProperty(property) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<Property | null> {
    const property = await this.propertyRepo.findOne({
      where: { code, tenant_id: tenantId },
      relations: ['group', 'measurement_unit'],
    });
    return property ? this.presentProperty(property) : null;
  }

  async update(tenantId: string, id: string, dto: UpdatePropertyDto): Promise<Property> {
    const property = await this.findOne(tenantId, id);
    if (!property) {
      throw new Error('Property not found');
    }

    if (dto.code !== undefined && dto.code !== property.code) {
      await this.assertPropertyCodeAvailable(tenantId, dto.code, property.id);
    }

    if (dto.group_id !== undefined) {
      const groupId = await this.customerGroupsService.assertBelongsToOrganization(
        dto.group_id,
        tenantId,
      );
      if (!groupId) {
        throw new BadRequestException('group_id es obligatorio');
      }
      dto = { ...dto, group_id: groupId };
    }

    const existingTotalPrice = Number(property.total_price);
    const existingPricePerM2 =
      property.price_per_m2 != null ? Number(property.price_per_m2) : null;
    const pricingTouched =
      dto.total_area !== undefined ||
      dto.total_price !== undefined ||
      dto.price_per_m2 !== undefined;

    Object.assign(property, dto);
    if (dto.cadastral_key !== undefined) {
      property.cadastral_key = this.normalizeOptionalText(dto.cadastral_key);
    }
    if (dto.currency !== undefined) {
      property.currency = normalizeContractCurrency(dto.currency);
    }

    if (pricingTouched) {
      const pricing = this.resolvePricing({
        totalArea: dto.total_area ?? Number(property.total_area),
        totalPrice: dto.total_price,
        pricePerM2: dto.price_per_m2,
        existingTotalPrice,
        existingPricePerM2,
      });
      property.total_price = pricing.total_price;
      property.price_per_m2 = pricing.price_per_m2;
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

    return this.presentProperty(updated);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const property = await this.findOne(tenantId, id);
    if (!property) {
      throw new Error('Property not found');
    }

    await this.propertyRepo.remove(property);
  }

  /**
   * KPIs del listado de lotes. Mismos filtros que GET /properties (grupo de cliente, estatus, search).
   */
  async getListStats(
    tenantId: string,
    filters: PropertyListFilters = {},
  ): Promise<{
    currency: string | null;
    currencies: string[];
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

    const area = roundMoney(parseFloat(totals?.area) || 0);
    const value = roundMoney(parseFloat(totals?.value) || 0);

    const currencyQuery = this.propertyRepo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId });
    this.applyPropertyListFilters(currencyQuery, filters);
    const currencyRows = await currencyQuery
      .select('UPPER(TRIM(p.currency))', 'currency')
      .distinct(true)
      .getRawMany();
    const currencies = Array.from(
      new Set(
        currencyRows
          .map((row) => resolveStoredContractCurrency(row.currency))
          .filter(Boolean),
      ),
    );
    const displayCurrencies =
      currencies.length > 0 ? currencies : [DEFAULT_CONTRACT_CURRENCY];

    return {
      currency: displayCurrencies.length === 1 ? displayCurrencies[0] : null,
      currencies: displayCurrencies,
      total: {
        count: parseInt(totals?.count, 10) || 0,
        area,
        value,
      },
      available: {
        count: parseInt(totals?.available_count, 10) || 0,
        area: roundMoney(parseFloat(totals?.available_area) || 0),
        value: roundMoney(parseFloat(totals?.available_value) || 0),
      },
      active_in_payment: {
        count: parseInt(active?.count, 10) || 0,
        remaining_balance: roundMoney(parseFloat(active?.remaining_balance) || 0),
      },
      reserved: {
        count: parseInt(totals?.reserved_count, 10) || 0,
      },
      sold: {
        count: parseInt(totals?.sold_count, 10) || 0,
      },
      avg_price_per_m2: area > 0 ? roundMoney(value / area) : 0,
    };
  }

  private applyPropertyListFilters(
    query: ReturnType<Repository<Property>['createQueryBuilder']>,
    filters: PropertyListFilters,
  ): void {
    if (filters.group_id) {
      query.andWhere('p.group_id = :group_id', { group_id: filters.group_id });
    }

    if (filters.status) {
      query.andWhere('p.status = :status', { status: filters.status });
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

  private resolvePricing(
    params: Parameters<typeof resolvePropertyPricing>[0],
  ): ReturnType<typeof resolvePropertyPricing> {
    try {
      return resolvePropertyPricing(params);
    } catch (err) {
      if (err instanceof PropertyPricingError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  private pricingFields(property: Property): {
    total_price: number;
    price_per_m2: number | null;
  } {
    const totalPrice = Number(property.total_price);
    const storedUnit =
      property.price_per_m2 != null ? Number(property.price_per_m2) : null;
    return {
      total_price: Number.isFinite(totalPrice) ? totalPrice : 0,
      price_per_m2:
        storedUnit != null && Number.isFinite(storedUnit)
          ? storedUnit
          : derivePricePerM2(property.total_price, property.total_area),
    };
  }

  private presentProperty(property: Property): Property {
    const pricing = this.pricingFields(property);
    property.total_price = pricing.total_price;
    property.price_per_m2 = pricing.price_per_m2;
    property.currency = resolveStoredContractCurrency(property.currency);
    return property;
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
