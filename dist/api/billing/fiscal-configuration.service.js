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
exports.FiscalConfigurationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const fiscal_configuration_entity_1 = require("../../entities/billing/fiscal-configuration.entity");
const s3_service_1 = require("../../common/services/s3.service");
const document_prefix_util_1 = require("../../common/utils/document-prefix.util");
let FiscalConfigurationService = class FiscalConfigurationService {
    repo;
    s3Service;
    constructor(repo, s3Service) {
        this.repo = repo;
        this.s3Service = s3Service;
    }
    async create(dto, tenantId, userId) {
        const config = this.repo.create({
            ...dto,
            prefix: (0, document_prefix_util_1.normalizeDocumentPrefix)(dto.prefix),
            tenant_id: tenantId,
            status: dto.status || 'active',
            created_by: userId ?? null,
        });
        const saved = await this.repo.save(config);
        const created = Array.isArray(saved) ? saved[0] : saved;
        await this.persistPrefix(created.id, tenantId, (0, document_prefix_util_1.normalizeDocumentPrefix)(dto.prefix));
        return this.findOne(created.id, tenantId);
    }
    async findAll(tenantId, query, options) {
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
            .createQueryBuilder('config')
            .where('config.tenant_id = :tenantId', { tenantId });
        if (query?.search) {
            queryBuilder.andWhere('(LOWER(config.razon_social) LIKE LOWER(:search) OR LOWER(config.rfc) LIKE LOWER(:search) OR LOWER(`config`.`prefix`) LIKE LOWER(:search))', { search: `%${query.search}%` });
        }
        if (query?.status) {
            queryBuilder.andWhere('config.status = :status', { status: query.status });
        }
        queryBuilder.orderBy('config.created_at', 'ASC');
        const total = await queryBuilder.getCount();
        const data = await queryBuilder.skip(skip).take(limit).getMany();
        const withPrefix = await this.attachPrefixes(data);
        const dataWithLogoUrls = await Promise.all(withPrefix.map(async (config) => {
            const response = await this.toResponseWithLogoUrl(config);
            return options?.includeSecrets === false
                ? this.withoutSealSecrets(response)
                : response;
        }));
        const totalPages = Math.ceil(total / limit);
        return {
            data: dataWithLogoUrls,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }
    async findOne(id, tenantId) {
        const config = await this.getByIdOrFail(id, tenantId);
        return this.toResponseWithLogoUrl(config);
    }
    async update(id, dto, tenantId) {
        const current = await this.getByIdOrFail(id, tenantId);
        const patch = {};
        if (dto.razon_social !== undefined)
            patch.razon_social = dto.razon_social;
        if (dto.rfc !== undefined)
            patch.rfc = dto.rfc;
        if (dto.persona_type !== undefined)
            patch.persona_type = dto.persona_type;
        if (dto.fiscal_regime !== undefined)
            patch.fiscal_regime = dto.fiscal_regime;
        if (dto.digital_seal !== undefined)
            patch.digital_seal = dto.digital_seal;
        if (dto.digital_seal_password !== undefined)
            patch.digital_seal_password = dto.digital_seal_password;
        if (dto.private_key !== undefined)
            patch.private_key = dto.private_key;
        if (dto.logo !== undefined)
            patch.logo = dto.logo;
        if (dto.status !== undefined)
            patch.status = dto.status;
        if (dto.quotation_expiration_days !== undefined) {
            patch.quotation_expiration_days = dto.quotation_expiration_days;
        }
        if (dto.advance_invoicing_enabled !== undefined) {
            patch.advance_invoicing_enabled = dto.advance_invoicing_enabled;
        }
        if (dto.use_as_system_logo !== undefined) {
            if (dto.use_as_system_logo && !current.logo) {
                throw new common_1.BadRequestException('Sube un logo antes de usarlo como logo del sistema.');
            }
            if (dto.use_as_system_logo) {
                await this.repo.update({ tenant_id: tenantId }, { use_as_system_logo: false });
            }
            patch.use_as_system_logo = dto.use_as_system_logo;
        }
        if (Object.keys(patch).length) {
            await this.repo.update({ id, tenant_id: tenantId }, patch);
        }
        if (dto.prefix !== undefined) {
            await this.persistPrefix(id, tenantId, (0, document_prefix_util_1.normalizeDocumentPrefix)(dto.prefix));
        }
        return this.findOne(id, tenantId);
    }
    async remove(id, tenantId) {
        const config = await this.getByIdOrFail(id, tenantId);
        await this.repo.remove(config);
    }
    async uploadLogo(id, tenantId, file) {
        const config = await this.getByIdOrFail(id, tenantId);
        if (config.logo) {
            await this.s3Service.deleteFile(config.logo).catch(() => undefined);
        }
        const s3Key = await this.s3Service.uploadEntityFile(tenantId, 'fiscal_configurations', id, 'logo', file.buffer, file.originalname, file.mimetype);
        config.logo = s3Key;
        const saved = await this.repo.save(config);
        return this.toResponseWithLogoUrl(saved);
    }
    async getSystemLogoMeta(tenantId) {
        const config = await this.findSystemLogo(tenantId);
        if (!config?.logo) {
            return { enabled: false, cache_key: null };
        }
        return {
            enabled: true,
            cache_key: (0, crypto_1.createHash)('sha256').update(config.logo).digest('hex').slice(0, 24),
        };
    }
    async getSystemLogoFile(tenantId) {
        const config = await this.findSystemLogo(tenantId);
        if (!config?.logo) {
            throw new common_1.NotFoundException('No hay logo del sistema');
        }
        return this.s3Service.getFile(config.logo);
    }
    async findSystemLogo(tenantId) {
        return this.repo
            .createQueryBuilder('config')
            .where('config.tenant_id = :tenantId', { tenantId })
            .andWhere('config.use_as_system_logo = 1')
            .andWhere('config.status = :status', { status: 'active' })
            .andWhere('config.logo IS NOT NULL')
            .andWhere("config.logo <> ''")
            .orderBy('config.updated_at', 'DESC')
            .getOne();
    }
    async getByIdOrFail(id, tenantId) {
        if (!id || id === 'undefined' || id === 'null') {
            throw new common_1.BadRequestException('Falta el identificador de la razón social. Guárdela antes de continuar.');
        }
        const config = await this.repo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!config) {
            throw new common_1.NotFoundException('Razón social no encontrada');
        }
        const [withPrefix] = await this.attachPrefixes([config]);
        return withPrefix;
    }
    async persistPrefix(id, tenantId, prefix) {
        await this.repo.query('UPDATE fiscal_configurations SET prefix = ? WHERE id = ? AND tenant_id = ?', [prefix, id, tenantId]);
    }
    async attachPrefixes(configs) {
        if (!configs.length) {
            return configs;
        }
        const ids = configs.map((config) => config.id);
        const placeholders = ids.map(() => '?').join(',');
        const rows = await this.repo.query(`SELECT id, prefix FROM fiscal_configurations WHERE id IN (${placeholders})`, ids);
        const prefixById = new Map(rows.map((row) => [row.id, row.prefix ?? null]));
        return configs.map((config) => {
            config.prefix = prefixById.get(config.id) ?? null;
            return config;
        });
    }
    withoutSealSecrets(config) {
        const { digital_seal: _digitalSeal, digital_seal_password: _digitalSealPassword, private_key: _privateKey, ...safe } = config;
        return safe;
    }
    async toResponseWithLogoUrl(config) {
        const prefix = config.prefix ?? null;
        if (!config.logo) {
            return { ...config, prefix };
        }
        const logoUrl = await this.s3Service
            .getSignedUrl(config.logo, 900)
            .catch(() => config.logo);
        return {
            ...config,
            prefix,
            logo: logoUrl,
        };
    }
};
exports.FiscalConfigurationService = FiscalConfigurationService;
exports.FiscalConfigurationService = FiscalConfigurationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        s3_service_1.S3Service])
], FiscalConfigurationService);
//# sourceMappingURL=fiscal-configuration.service.js.map