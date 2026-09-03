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
    async findOne(id, tenantId) {
        const vendor = await this.repo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!vendor) {
            throw new common_1.NotFoundException(`Vendor with ID ${id} not found`);
        }
        return vendor;
    }
    async update(id, dto, tenantId) {
        const vendor = await this.findOne(id, tenantId);
        const vendorType = dto.vendor_type ?? vendor.vendor_type ?? vendor_type_enum_1.VendorType.NATIONAL;
        this.assertTypeSwitchValid(vendor, vendorType, dto);
        const payload = this.buildPayload(dto, vendorType, vendor);
        Object.assign(vendor, payload);
        return this.saveVendor(vendor);
    }
    async remove(id, tenantId) {
        const vendor = await this.findOne(id, tenantId);
        await this.repo.remove(vendor);
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