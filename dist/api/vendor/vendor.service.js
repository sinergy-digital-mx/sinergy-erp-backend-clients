"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vendor_entity_1 = require("../../entities/vendor/vendor.entity");
const vendor_type_enum_1 = require("../../entities/vendor/vendor-type.enum");
const vendor_profile_util_1 = require("./utils/vendor-profile.util");
const COPY_IF_EMPTY = [
    'company_name',
    'street',
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
let VendorService = class VendorService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto, tenantId) {
        const payload = this.buildPayload(dto, dto.vendor_type ?? vendor_type_enum_1.VendorType.NATIONAL);
        const vendor = this.repo.create({
            ...payload,
            tenant_id: tenantId,
            status: dto.status || 'active',
        });
        return this.saveVendor(vendor);
    }
    async findAll(tenantId, query) {
        let page = Number(query?.page) || 1;
        let limit = Number(query?.limit) || 20;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 100)
            limit = 100;
        const skip = (page - 1) * limit;
        const queryBuilder = this.repo
            .createQueryBuilder('vendor')
            .where('vendor.tenant_id = :tenantId', { tenantId });
        if (query?.search) {
            queryBuilder.andWhere(`(LOWER(vendor.name) LIKE LOWER(:search)
          OR LOWER(vendor.company_name) LIKE LOWER(:search)
          OR LOWER(vendor.rfc) LIKE LOWER(:search)
          OR LOWER(vendor.tax_id) LIKE LOWER(:search)
          OR LOWER(vendor.legal_name) LIKE LOWER(:search))`, { search: `%${query.search}%` });
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
    async findOne(id, tenantId) {
        const vendor = await this.findEntity(id, tenantId);
        const catalog = await this.loadCatalog(tenantId);
        return this.toVendorView(vendor, catalog);
    }
    async findDuplicates(dto, tenantId) {
        const catalog = await this.loadCatalog(tenantId);
        const matches = (0, vendor_profile_util_1.findSimilarVendors)(dto, catalog);
        return { found: matches.length > 0, matches };
    }
    async update(id, dto, tenantId) {
        const vendor = await this.findEntity(id, tenantId);
        const vendorType = dto.vendor_type ?? vendor.vendor_type ?? vendor_type_enum_1.VendorType.NATIONAL;
        this.assertTypeSwitchValid(vendor, vendorType, dto);
        const payload = this.buildPayload(dto, vendorType, vendor);
        Object.assign(vendor, payload);
        return this.saveVendor(vendor);
    }
    async remove(id, tenantId) {
        const vendor = await this.findEntity(id, tenantId);
        const catalog = await this.loadCatalog(tenantId);
        const matches = (0, vendor_profile_util_1.findSimilarVendors)(vendor, catalog);
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
                message: 'No se eliminó: tiene compras y no hay otro proveedor parecido. Se desactivó para conservar el historial.',
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
    async findEntity(id, tenantId) {
        const vendor = await this.repo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!vendor) {
            throw new common_1.NotFoundException(`Vendor with ID ${id} not found`);
        }
        return vendor;
    }
    async loadCatalog(tenantId) {
        if (typeof this.repo.find !== 'function') {
            return [];
        }
        return this.repo.find({ where: { tenant_id: tenantId } });
    }
    toVendorView(vendor, catalog) {
        const similar_vendors = (0, vendor_profile_util_1.findSimilarVendors)(vendor, catalog);
        return Object.assign(vendor, {
            profile_completeness: (0, vendor_profile_util_1.computeVendorCompleteness)(vendor),
            looks_similar: similar_vendors.length > 0,
            similar_vendors,
        });
    }
    async resolveMergeTarget(vendor, matches, catalog) {
        if (!matches.length) {
            return null;
        }
        const purchaseCounts = await this.countPurchaseOrdersByVendor(matches.map((item) => item.id));
        const completeness = new Map(catalog.map((item) => [item.id, (0, vendor_profile_util_1.computeVendorCompleteness)(item)]));
        return (0, vendor_profile_util_1.pickBestSimilarVendor)(matches, catalog, purchaseCounts, completeness);
    }
    async mergeAndDelete(source, target, purchaseCount) {
        await this.repo.manager.transaction(async (manager) => {
            await this.fillTargetGaps(manager, source, target);
            await this.reassignVendorReferences(manager, source.id, target.id);
            await manager.delete(vendor_entity_1.Vendor, { id: source.id, tenant_id: source.tenant_id });
        });
        const message = purchaseCount > 0
            ? `Proveedor eliminado. Las compras se conservaron en ${target.name}.`
            : `Proveedor eliminado. Los datos se consolidaron en ${target.name}.`;
        return {
            action: 'merged',
            vendor_id: source.id,
            merged_into: { id: target.id, name: target.name },
            purchase_orders_reassigned: purchaseCount,
            message,
        };
    }
    async fillTargetGaps(manager, source, target) {
        const patch = {};
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
        if ((target.credit_limit === null ||
            target.credit_limit === undefined ||
            String(target.credit_limit).trim() === '' ||
            Number(target.credit_limit) === 0) &&
            source.credit_limit &&
            Number(source.credit_limit) > 0) {
            patch.credit_limit = source.credit_limit;
        }
        if (Object.keys(patch).length === 0) {
            return;
        }
        await manager.update(vendor_entity_1.Vendor, { id: target.id, tenant_id: target.tenant_id }, patch);
    }
    async reassignVendorReferences(manager, sourceId, targetId) {
        if (await this.tableExists(manager, 'inv_s_purchase_order_batch')) {
            await manager.query('UPDATE inv_s_purchase_order_batch SET vendor_id = ? WHERE vendor_id = ?', [targetId, sourceId]);
        }
        if (await this.tableExists(manager, 'purchase_orders')) {
            await manager.query('UPDATE purchase_orders SET vendor_id = ? WHERE vendor_id = ?', [
                targetId,
                sourceId,
            ]);
        }
        if (await this.tableExists(manager, 'product_vendor_costs')) {
            await manager.query(`DELETE pvc FROM product_vendor_costs pvc
         INNER JOIN product_vendor_costs keep
           ON keep.product_id = pvc.product_id
          AND keep.product_uom_id = pvc.product_uom_id
          AND keep.vendor_id = ?
         WHERE pvc.vendor_id = ?`, [targetId, sourceId]);
            await manager.query('UPDATE product_vendor_costs SET vendor_id = ? WHERE vendor_id = ?', [
                targetId,
                sourceId,
            ]);
        }
        if (await this.tableExists(manager, 'vendor_product_prices')) {
            await manager.query(`DELETE src FROM vendor_product_prices src
         INNER JOIN vendor_product_prices keep
           ON keep.product_id = src.product_id
          AND keep.uom_id = src.uom_id
          AND keep.vendor_id = ?
         WHERE src.vendor_id = ?`, [targetId, sourceId]);
            await manager.query('UPDATE vendor_product_prices SET vendor_id = ? WHERE vendor_id = ?', [
                targetId,
                sourceId,
            ]);
        }
    }
    async countPurchaseOrders(vendorId) {
        const counts = await this.countPurchaseOrdersByVendor([vendorId]);
        return counts.get(vendorId) ?? 0;
    }
    async countPurchaseOrdersByVendor(vendorIds) {
        const counts = new Map();
        if (!vendorIds.length || typeof this.repo.manager?.query !== 'function') {
            return counts;
        }
        try {
            const placeholders = vendorIds.map(() => '?').join(', ');
            const rows = (await this.repo.manager.query(`SELECT vendor_id, COUNT(*) AS cnt
         FROM inv_s_purchase_order_batch
         WHERE vendor_id IN (${placeholders})
         GROUP BY vendor_id`, vendorIds));
            for (const row of rows ?? []) {
                counts.set(row.vendor_id, Number(row.cnt) || 0);
            }
        }
        catch {
            return counts;
        }
        return counts;
    }
    async tableExists(manager, tableName) {
        try {
            const rows = (await manager.query(`SELECT 1 AS ok
         FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?
         LIMIT 1`, [tableName]));
            return Array.isArray(rows) && rows.length > 0;
        }
        catch {
            return false;
        }
    }
    assertTypeSwitchValid(existing, nextType, dto) {
        if (existing.vendor_type === nextType)
            return;
        if (nextType === vendor_type_enum_1.VendorType.INTERNATIONAL) {
            const legalName = dto.legal_name ?? existing.legal_name;
            const country = dto.country ?? existing.country;
            if (!legalName?.trim() || !country?.trim()) {
                throw new common_1.BadRequestException('Nombre legal y país son requeridos al cambiar el proveedor a internacional');
            }
        }
    }
    buildPayload(dto, vendorType, existing) {
        const base = { ...dto, vendor_type: vendorType };
        if (vendorType === vendor_type_enum_1.VendorType.NATIONAL) {
            return {
                ...base,
                vendor_type: vendor_type_enum_1.VendorType.NATIONAL,
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
            throw new common_1.BadRequestException('Nombre legal es requerido para proveedores internacionales');
        }
        return {
            ...base,
            vendor_type: vendor_type_enum_1.VendorType.INTERNATIONAL,
            name: name || existing?.name || razonSocial,
            company_name: dto.company_name || existing?.company_name || razonSocial,
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
    async saveVendor(vendor) {
        try {
            return await this.repo.save(vendor);
        }
        catch (error) {
            this.rethrowIfNullConstraint(error);
            throw error;
        }
    }
    rethrowIfNullConstraint(error) {
        if (!(error instanceof typeorm_2.QueryFailedError)) {
            return;
        }
        const driver = error.driverError;
        const sqlMessage = driver?.sqlMessage ?? error.message;
        if (driver?.errno !== 1048 && !/cannot be null/i.test(sqlMessage)) {
            return;
        }
        const column = sqlMessage.match(/Column '([^']+)'/)?.[1];
        throw new common_1.BadRequestException(column
            ? `El campo ${column} es obligatorio`
            : 'Faltan datos obligatorios del proveedor');
    }
};
exports.VendorService = VendorService;
exports.VendorService = VendorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], VendorService);
//# sourceMappingURL=vendor.service.js.map