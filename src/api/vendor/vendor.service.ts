import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { VendorType } from '../../entities/vendor/vendor-type.enum';
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
    const payload = this.buildPayload(dto, dto.vendor_type ?? VendorType.NATIONAL);
    const vendor = this.repo.create({
      ...payload,
      tenant_id: tenantId,
      status: dto.status || 'active',
    });
    return this.saveVendor(vendor);
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
        `(LOWER(vendor.name) LIKE LOWER(:search)
          OR LOWER(vendor.company_name) LIKE LOWER(:search)
          OR LOWER(vendor.rfc) LIKE LOWER(:search)
          OR LOWER(vendor.tax_id) LIKE LOWER(:search)
          OR LOWER(vendor.legal_name) LIKE LOWER(:search))`,
        { search: `%${query.search}%` },
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

    if (query?.vendor_type) {
      queryBuilder.andWhere('vendor.vendor_type = :vendor_type', {
        vendor_type: query.vendor_type,
      });
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
    const vendorType = dto.vendor_type ?? vendor.vendor_type ?? VendorType.NATIONAL;
    this.assertTypeSwitchValid(vendor, vendorType, dto);
    const payload = this.buildPayload(dto, vendorType, vendor);
    Object.assign(vendor, payload);
    return this.saveVendor(vendor);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const vendor = await this.findOne(id, tenantId);
    await this.repo.remove(vendor);
  }

  private assertTypeSwitchValid(
    existing: Vendor,
    nextType: VendorType,
    dto: UpdateVendorDto,
  ): void {
    if (existing.vendor_type === nextType) return;

    if (nextType === VendorType.INTERNATIONAL) {
      const taxId = dto.tax_id ?? existing.tax_id;
      const legalName = dto.legal_name ?? existing.legal_name;
      const country = dto.country ?? existing.country;
      if (!taxId?.trim() || !legalName?.trim() || !country?.trim()) {
        throw new BadRequestException(
          'ID fiscal, nombre legal y país son requeridos al cambiar el proveedor a internacional',
        );
      }
    }
  }

  private buildPayload(
    dto: CreateVendorDto | UpdateVendorDto,
    vendorType: VendorType,
    existing?: Vendor,
  ): Partial<Vendor> {
    const base = { ...dto, vendor_type: vendorType };

    if (vendorType === VendorType.NATIONAL) {
      return {
        ...base,
        vendor_type: VendorType.NATIONAL,
        country: base.country || existing?.country || 'México',
        persona_type: base.persona_type || existing?.persona_type || 'Persona Moral',
        tax_id: null,
        legal_name: null,
        bank_swift_bic: null,
        bank_iban: null,
      };
    }

    const legalName = (dto.legal_name ?? existing?.legal_name ?? '').trim();
    const name = (dto.name ?? existing?.name ?? '').trim();
    const razonSocial = legalName || name;
    if (!razonSocial) {
      throw new BadRequestException(
        'Nombre legal es requerido para proveedores internacionales',
      );
    }

    return {
      ...base,
      vendor_type: VendorType.INTERNATIONAL,
      name: name || existing?.name || razonSocial,
      company_name: dto.company_name || existing?.company_name || razonSocial,
      street: dto.street || existing?.street || '',
      city: dto.city || existing?.city || '',
      state: dto.state || existing?.state || '',
      zip_code: dto.zip_code || existing?.zip_code || '',
      country: dto.country || existing?.country || '',
      rfc: existing?.rfc || '',
      razon_social: razonSocial,
      persona_type: existing?.persona_type || 'Persona Moral',
      bank_clabe: null,
      bank_currency: base.bank_currency || existing?.bank_currency || 'USD',
    };
  }

  private async saveVendor(vendor: Vendor): Promise<Vendor> {
    try {
      return await this.repo.save(vendor);
    } catch (error) {
      this.rethrowIfNullConstraint(error);
      throw error;
    }
  }

  private rethrowIfNullConstraint(error: unknown): void {
    if (!(error instanceof QueryFailedError)) {
      return;
    }
    const driver = error.driverError as { errno?: number; sqlMessage?: string } | undefined;
    const sqlMessage = driver?.sqlMessage ?? error.message;
    if (driver?.errno !== 1048 && !/cannot be null/i.test(sqlMessage)) {
      return;
    }
    const column = sqlMessage.match(/Column '([^']+)'/)?.[1];
    throw new BadRequestException(
      column
        ? `El campo ${column} es obligatorio`
        : 'Faltan datos obligatorios del proveedor',
    );
  }
}
