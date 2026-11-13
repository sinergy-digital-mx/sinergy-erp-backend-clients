import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { extractSatCsfTextItems } from '../customers/utils/sat-csf-pdf.util';
import { parseSatCsfTextItems, SatCsfParseError } from '../customers/utils/sat-csf.util';
import {
  assertSatConstanciaPdf,
  toVendorSatConstancia,
  VendorSatConstanciaPreview,
} from './utils/vendor-sat-constancia.util';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { VendorType } from '../../entities/vendor/vendor-type.enum';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { PaginatedVendorDto } from './dto/paginated-vendor.dto';
import { CheckVendorDuplicatesDto } from './dto/check-vendor-duplicates.dto';
import { DeleteVendorResultDto, VendorView } from './dto/vendor-view.dto';
import {
  computeVendorCompleteness,
  findSimilarVendors,
  pickBestSimilarVendor,
  vendorCompanyName,
  VendorSimilarMatch,
} from './utils/vendor-profile.util';

const COPY_IF_EMPTY: Array<keyof Vendor> = [
  'company_name',
  'street',
  'exterior_number',
  'interior_number',
  'colonia',
  'localidad',
  'city',
  'state',
  'zip_code',
  'country',
  'razon_social',
  'rfc',
  'tax_id',
  'legal_name',
  'persona_type',
  'bank_name',
  'bank_account_holder',
  'bank_account_number',
  'bank_clabe',
  'bank_swift_bic',
  'bank_iban',
  'bank_currency',
  'vendor_code',
];

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

    const catalog = await this.loadCatalog(tenantId);

    if (query?.similar_only) {
      const rows = await queryBuilder.getMany();
      const similar = rows
        .map((vendor) => this.toVendorView(vendor, catalog))
        .filter((vendor) => vendor.looks_similar);
      const total = similar.length;
      const totalPages = Math.ceil(total / limit) || 0;
      return {
        data: similar.slice(skip, skip + limit),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((vendor) => this.toVendorView(vendor, catalog)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async findOne(id: string, tenantId: string): Promise<VendorView> {
    const vendor = await this.findEntity(id, tenantId);
    const catalog = await this.loadCatalog(tenantId);
    return this.toVendorView(vendor, catalog);
  }

  async readSatConstancia(file: {
    buffer?: Buffer;
    mimetype?: string;
    originalname?: string;
    size?: number;
  }): Promise<VendorSatConstanciaPreview> {
    try {
      assertSatConstanciaPdf(file);
      const items = await extractSatCsfTextItems(file.buffer as Buffer);
      return toVendorSatConstancia(parseSatCsfTextItems(items));
    } catch (error) {
      if (error instanceof SatCsfParseError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async findDuplicates(
    dto: CheckVendorDuplicatesDto,
    tenantId: string,
  ): Promise<{ found: boolean; matches: VendorSimilarMatch[] }> {
    const catalog = await this.loadCatalog(tenantId);
    const matches = findSimilarVendors(dto, catalog);
    return { found: matches.length > 0, matches };
  }

  async update(
    id: string,
    dto: UpdateVendorDto,
    tenantId: string,
  ): Promise<Vendor> {
    const vendor = await this.findEntity(id, tenantId);
    const vendorType = dto.vendor_type ?? vendor.vendor_type ?? VendorType.NATIONAL;
    this.assertTypeSwitchValid(vendor, vendorType, dto);
    const payload = this.buildPayload(dto, vendorType, vendor);
    Object.assign(vendor, payload);
    return this.saveVendor(vendor);
  }

  async remove(id: string, tenantId: string): Promise<DeleteVendorResultDto> {
    const vendor = await this.findEntity(id, tenantId);
    const catalog = await this.loadCatalog(tenantId);
    const matches = findSimilarVendors(vendor, catalog);
    const purchaseCount = await this.countPurchaseOrders(vendor.id);
    const target = await this.resolveMergeTarget(vendor, matches, catalog);

    if (target) {
      return this.mergeAndDelete(vendor, target, purchaseCount);
    }

    if (purchaseCount > 0) {
      vendor.status = 'inactive';
      await this.saveVendor(vendor);
      return {
        action: 'deactivated',
        vendor_id: vendor.id,
        purchase_orders_reassigned: 0,
        message:
          'No se eliminó: tiene compras y no hay otro proveedor parecido. Se desactivó para conservar el historial.',
      };
    }

    await this.repo.remove(vendor);
    return {
      action: 'deleted',
      vendor_id: id,
      purchase_orders_reassigned: 0,
      message: 'Proveedor eliminado',
    };
  }

  private async findEntity(id: string, tenantId: string): Promise<Vendor> {
    const vendor = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  private async loadCatalog(tenantId: string): Promise<Vendor[]> {
    if (typeof this.repo.find !== 'function') {
      return [];
    }
    return this.repo.find({ where: { tenant_id: tenantId } });
  }

  private toVendorView(vendor: Vendor, catalog: Vendor[]): VendorView {
    const similar_vendors = findSimilarVendors(vendor, catalog);
    return Object.assign(vendor, {
      profile_completeness: computeVendorCompleteness(vendor),
      looks_similar: similar_vendors.length > 0,
      similar_vendors,
    });
  }

  private async resolveMergeTarget(
    vendor: Vendor,
    matches: VendorSimilarMatch[],
    catalog: Vendor[],
  ): Promise<Vendor | null> {
    if (!matches.length) {
      return null;
    }
    const purchaseCounts = await this.countPurchaseOrdersByVendor(matches.map((item) => item.id));
    const completeness = new Map(
      catalog.map((item) => [item.id, computeVendorCompleteness(item)] as [string, number]),
    );
    return pickBestSimilarVendor(matches, catalog, purchaseCounts, completeness);
  }

  private async mergeAndDelete(
    source: Vendor,
    target: Vendor,
    purchaseCount: number,
  ): Promise<DeleteVendorResultDto> {
    await this.repo.manager.transaction(async (manager) => {
      await this.fillTargetGaps(manager, source, target);
      await this.reassignVendorReferences(manager, source.id, target.id);
      await manager.delete(Vendor, { id: source.id, tenant_id: source.tenant_id });
    });

    const keptName = vendorCompanyName(target) || 'el proveedor parecido';
    const message =
      purchaseCount > 0
        ? `Proveedor eliminado. Las compras se conservaron en ${keptName}.`
        : `Proveedor eliminado. Los datos se consolidaron en ${keptName}.`;
    return {
      action: 'merged',
      vendor_id: source.id,
      merged_into: { id: target.id, name: keptName },
      purchase_orders_reassigned: purchaseCount,
      message,
    };
  }

  private async fillTargetGaps(
    manager: EntityManager,
    source: Vendor,
    target: Vendor,
  ): Promise<void> {
    const patch: Record<string, unknown> = {};
    for (const field of COPY_IF_EMPTY) {
      const current = target[field];
      const incoming = source[field];
      const currentEmpty = current === null || current === undefined || String(current).trim() === '';
      const incomingFilled = incoming !== null && incoming !== undefined && String(incoming).trim() !== '';
      if (currentEmpty && incomingFilled) {
        patch[field] = incoming;
      }
    }

    if ((target.credit_days === null || target.credit_days === undefined) && source.credit_days) {
      patch.credit_days = source.credit_days;
    }
    if (
      (target.credit_limit === null ||
        target.credit_limit === undefined ||
        String(target.credit_limit).trim() === '' ||
        Number(target.credit_limit) === 0) &&
      source.credit_limit &&
      Number(source.credit_limit) > 0
    ) {
      patch.credit_limit = source.credit_limit;
    }

    const company =
      String(patch.company_name ?? target.company_name ?? '').trim() ||
      String(target.name ?? '').trim();
    if (company) {
      if (!String(target.company_name ?? '').trim()) {
        patch.company_name = company;
      }
      if (target.name !== company) {
        patch.name = company;
      }
    }

    if (Object.keys(patch).length === 0) {
      return;
    }
    await manager.update(
      Vendor,
      { id: target.id, tenant_id: target.tenant_id },
      patch as Partial<Vendor>,
    );
  }

  private async reassignVendorReferences(
    manager: EntityManager,
    sourceId: string,
    targetId: string,
  ): Promise<void> {
    if (await this.tableExists(manager, 'inv_s_purchase_order_batch')) {
      await manager.query(
        'UPDATE inv_s_purchase_order_batch SET vendor_id = ? WHERE vendor_id = ?',
        [targetId, sourceId],
      );
    }
    if (await this.tableExists(manager, 'purchase_orders')) {
      await manager.query('UPDATE purchase_orders SET vendor_id = ? WHERE vendor_id = ?', [
        targetId,
        sourceId,
      ]);
    }
    if (await this.tableExists(manager, 'product_vendor_costs')) {
      await manager.query(
        `DELETE pvc FROM product_vendor_costs pvc
         INNER JOIN product_vendor_costs keep
           ON keep.product_id = pvc.product_id
          AND keep.product_uom_id = pvc.product_uom_id
          AND keep.vendor_id = ?
         WHERE pvc.vendor_id = ?`,
        [targetId, sourceId],
      );
      await manager.query('UPDATE product_vendor_costs SET vendor_id = ? WHERE vendor_id = ?', [
        targetId,
        sourceId,
      ]);
    }
    if (await this.tableExists(manager, 'vendor_product_prices')) {
      await manager.query(
        `DELETE src FROM vendor_product_prices src
         INNER JOIN vendor_product_prices keep
           ON keep.product_id = src.product_id
          AND keep.uom_id = src.uom_id
          AND keep.vendor_id = ?
         WHERE src.vendor_id = ?`,
        [targetId, sourceId],
      );
      await manager.query('UPDATE vendor_product_prices SET vendor_id = ? WHERE vendor_id = ?', [
        targetId,
        sourceId,
      ]);
    }
  }

  private async countPurchaseOrders(vendorId: string): Promise<number> {
    const counts = await this.countPurchaseOrdersByVendor([vendorId]);
    return counts.get(vendorId) ?? 0;
  }

  private async countPurchaseOrdersByVendor(vendorIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (!vendorIds.length || typeof this.repo.manager?.query !== 'function') {
      return counts;
    }
    try {
      const placeholders = vendorIds.map(() => '?').join(', ');
      const rows = (await this.repo.manager.query(
        `SELECT vendor_id, COUNT(*) AS cnt
         FROM inv_s_purchase_order_batch
         WHERE vendor_id IN (${placeholders})
         GROUP BY vendor_id`,
        vendorIds,
      )) as Array<{ vendor_id: string; cnt: string | number }>;
      for (const row of rows ?? []) {
        counts.set(row.vendor_id, Number(row.cnt) || 0);
      }
    } catch {
      return counts;
    }
    return counts;
  }

  private async tableExists(manager: EntityManager, tableName: string): Promise<boolean> {
    try {
      const rows = (await manager.query(
        `SELECT 1 AS ok
         FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?
         LIMIT 1`,
        [tableName],
      )) as unknown[];
      return Array.isArray(rows) && rows.length > 0;
    } catch {
      return false;
    }
  }

  private assertTypeSwitchValid(
    existing: Vendor,
    nextType: VendorType,
    dto: UpdateVendorDto,
  ): void {
    if (existing.vendor_type === nextType) return;

    if (nextType === VendorType.INTERNATIONAL) {
      const legalName = dto.legal_name ?? existing.legal_name;
      const country = dto.country ?? existing.country;
      if (!legalName?.trim() || !country?.trim()) {
        throw new BadRequestException(
          'Nombre legal y país son requeridos al cambiar el proveedor a internacional',
        );
      }
    }
  }

  private resolveCompanyName(
    dto: CreateVendorDto | UpdateVendorDto,
    existing?: Vendor,
  ): string {
    const provided = [dto.company_name, dto.name]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .find((value) => value.length > 0);
    const resolved =
      provided ||
      existing?.company_name?.trim() ||
      existing?.name?.trim() ||
      '';
    if (!resolved) {
      throw new BadRequestException('El nombre de empresa es obligatorio');
    }
    return resolved;
  }

  private buildPayload(
    dto: CreateVendorDto | UpdateVendorDto,
    vendorType: VendorType,
    existing?: Vendor,
  ): Partial<Vendor> {
    const companyName = this.resolveCompanyName(dto, existing);
    const base = {
      ...dto,
      vendor_type: vendorType,
      name: companyName,
      company_name: companyName,
    };

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
        exterior_number: this.blankToStored(dto.exterior_number, existing?.exterior_number),
        interior_number: this.blankToStored(dto.interior_number, existing?.interior_number),
        colonia: this.blankToStored(dto.colonia, existing?.colonia),
        localidad: this.blankToStored(dto.localidad, existing?.localidad),
      };
    }

    const legalName = (dto.legal_name ?? existing?.legal_name ?? '').trim();
    const razonSocial = legalName || companyName;
    if (!razonSocial) {
      throw new BadRequestException(
        'Nombre legal es requerido para proveedores internacionales',
      );
    }

    return {
      ...base,
      vendor_type: VendorType.INTERNATIONAL,
      name: companyName,
      company_name: companyName,
      street: dto.street || existing?.street || '',
      city: dto.city || existing?.city || '',
      state: dto.state || existing?.state || '',
      zip_code: dto.zip_code || existing?.zip_code || '',
      country: dto.country || existing?.country || '',
      tax_id: (dto.tax_id ?? existing?.tax_id)?.trim() || null,
      rfc: existing?.rfc || '',
      razon_social: razonSocial,
      persona_type: existing?.persona_type || 'Persona Moral',
      bank_clabe: null,
      bank_currency: base.bank_currency || existing?.bank_currency || 'USD',
    };
  }

  private blankToStored(
    value: string | null | undefined,
    existing: string | null | undefined,
  ): string | null | undefined {
    if (value === undefined) {
      return existing;
    }
    const trimmed = value?.trim() ?? '';
    return trimmed || null;
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
