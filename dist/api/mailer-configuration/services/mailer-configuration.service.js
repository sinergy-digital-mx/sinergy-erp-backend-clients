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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerConfigurationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const mailer_configuration_repository_1 = require("../repositories/mailer-configuration.repository");
const encryption_service_1 = require("./encryption.service");
const mailer_vendor_enum_1 = require("../enums/mailer-vendor.enum");
let MailerConfigurationService = class MailerConfigurationService {
    configRepository;
    encryptionService;
    constructor(configRepository, encryptionService) {
        this.configRepository = configRepository;
        this.encryptionService = encryptionService;
    }
    async create(tenantId, dto, userId) {
        const existing = await this.configRepository.findByTenantAndName(tenantId, dto.name);
        if (existing) {
            throw new common_1.BadRequestException(`Configuration with name "${dto.name}" already exists for this tenant`);
        }
        const vendor = dto.vendor || mailer_vendor_enum_1.MailerVendor.RESEND;
        const vendorConfig = this.prepareVendorConfig(vendor, dto.vendorConfig, dto.apiKey);
        const config = this.configRepository.create({
            tenant_id: tenantId,
            name: dto.name,
            vendor,
            vendor_config: vendorConfig,
            is_active: false,
            is_fallback: dto.isFallback ?? false,
            is_valid: true,
            created_by: userId,
            updated_by: userId,
        });
        const saved = await this.configRepository.save(config);
        if (dto.isActive) {
            return this.activate(tenantId, saved.id, userId);
        }
        return this.toSafeConfiguration(saved);
    }
    async findById(tenantId, configId) {
        const config = await this.findByIdInternal(tenantId, configId);
        return this.toSafeConfiguration(config);
    }
    async findByIdInternal(tenantId, configId) {
        const config = await this.configRepository.findByTenantAndId(tenantId, configId);
        if (!config) {
            throw new common_1.NotFoundException(`Configuration not found`);
        }
        return config;
    }
    async list(tenantId, query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const [data, total] = await this.configRepository.findAndCount({
            where: { tenant_id: tenantId, deleted_at: (0, typeorm_1.IsNull)() },
            order: { created_at: 'DESC' },
            skip,
            take: limit,
        });
        return {
            data: data.map((config) => this.toSafeConfiguration(config)),
            total,
            page,
            limit,
        };
    }
    async findActive(tenantId) {
        const config = await this.findActiveInternal(tenantId);
        return this.toSafeConfiguration(config);
    }
    async findActiveInternal(tenantId) {
        const config = await this.configRepository.findActiveByTenant(tenantId);
        if (!config) {
            throw new common_1.NotFoundException(`No active mailer configuration found for this tenant`);
        }
        return config;
    }
    async update(tenantId, configId, dto, userId) {
        const config = await this.findByIdInternal(tenantId, configId);
        if (dto.name !== undefined && dto.name !== config.name) {
            const existing = await this.configRepository.findByTenantAndName(tenantId, dto.name);
            if (existing && existing.id !== configId) {
                throw new common_1.BadRequestException(`Configuration with name "${dto.name}" already exists for this tenant`);
            }
            config.name = dto.name;
        }
        if (dto.vendorConfig !== undefined || dto.apiKey !== undefined) {
            config.vendor_config = this.prepareVendorConfig(config.vendor, dto.vendorConfig, dto.apiKey, config.vendor_config);
            config.is_valid = true;
        }
        if (dto.isFallback !== undefined) {
            config.is_fallback = dto.isFallback;
        }
        config.updated_by = userId;
        config.updated_at = new Date();
        const saved = await this.configRepository.save(config);
        return this.toSafeConfiguration(saved);
    }
    async delete(tenantId, configId, userId) {
        const config = await this.findByIdInternal(tenantId, configId);
        config.deleted_at = new Date();
        config.deleted_by = userId;
        await this.configRepository.save(config);
    }
    async activate(tenantId, configId, userId) {
        const config = await this.findByIdInternal(tenantId, configId);
        if (!config.is_valid) {
            throw new common_1.BadRequestException(`Cannot activate invalid configuration`);
        }
        this.validateStoredVendorConfig(config);
        await this.configRepository.deactivateAllByTenant(tenantId);
        config.is_active = true;
        config.updated_by = userId;
        config.updated_at = new Date();
        const saved = await this.configRepository.save(config);
        return this.toSafeConfiguration(saved);
    }
    decryptVendorConfig(config) {
        if (config.vendor === mailer_vendor_enum_1.MailerVendor.RESEND) {
            const stored = config.vendor_config;
            if (!stored.apiKeyEncrypted || !stored.apiKeyIv) {
                throw new common_1.BadRequestException('Resend configuration is missing encrypted api key');
            }
            return {
                apiKey: this.encryptionService.decryptSecret(stored.apiKeyEncrypted, stored.apiKeyIv),
                fromEmail: stored.fromEmail,
                fromName: stored.fromName,
                replyTo: stored.replyTo,
                publicKey: stored.publicKey,
            };
        }
        throw new common_1.BadRequestException(`Mailer vendor "${config.vendor}" is not supported yet`);
    }
    prepareVendorConfig(vendor, vendorConfig, legacyApiKey, existingConfig = {}) {
        if (vendor !== mailer_vendor_enum_1.MailerVendor.RESEND) {
            throw new common_1.BadRequestException(`Mailer vendor "${vendor}" is not supported yet`);
        }
        const resendConfig = (vendorConfig || {});
        const apiKey = legacyApiKey || resendConfig.apiKey;
        const fromEmail = resendConfig.fromEmail || existingConfig.fromEmail;
        const fromName = resendConfig.fromName ?? existingConfig.fromName;
        const replyTo = resendConfig.replyTo ?? existingConfig.replyTo;
        const publicKey = resendConfig.publicKey ?? existingConfig.publicKey;
        if (!apiKey && !existingConfig.apiKeyEncrypted) {
            throw new common_1.BadRequestException('Valid Resend apiKey is required');
        }
        if (apiKey && (typeof apiKey !== 'string' || apiKey.trim().length < 10)) {
            throw new common_1.BadRequestException('Valid Resend apiKey is required');
        }
        if (!fromEmail || typeof fromEmail !== 'string' || !this.isValidEmail(fromEmail)) {
            throw new common_1.BadRequestException('Valid Resend fromEmail is required');
        }
        if (replyTo && !this.isValidEmail(replyTo)) {
            throw new common_1.BadRequestException('Valid Resend replyTo is required');
        }
        const encrypted = apiKey
            ? this.encryptionService.encryptSecret(apiKey.trim())
            : {
                encryptedValue: existingConfig.apiKeyEncrypted,
                iv: existingConfig.apiKeyIv,
            };
        return {
            apiKeyEncrypted: encrypted.encryptedValue,
            apiKeyIv: encrypted.iv,
            fromEmail: fromEmail.trim(),
            fromName: fromName?.trim(),
            replyTo: replyTo?.trim(),
            publicKey,
        };
    }
    toSafeConfiguration(config) {
        return {
            ...config,
            vendor_config: this.maskVendorConfig(config),
        };
    }
    maskVendorConfig(config) {
        if (config.vendor === mailer_vendor_enum_1.MailerVendor.RESEND) {
            return {
                apiKey: '********',
                fromEmail: config.vendor_config?.fromEmail,
                fromName: config.vendor_config?.fromName,
                replyTo: config.vendor_config?.replyTo,
                publicKey: config.vendor_config?.publicKey,
            };
        }
        return {};
    }
    validateStoredVendorConfig(config) {
        if (config.vendor === mailer_vendor_enum_1.MailerVendor.RESEND) {
            const stored = config.vendor_config;
            if (!stored.apiKeyEncrypted || !stored.apiKeyIv) {
                throw new common_1.BadRequestException('Resend configuration is missing apiKey');
            }
            if (!stored.fromEmail || typeof stored.fromEmail !== 'string' || !this.isValidEmail(stored.fromEmail)) {
                throw new common_1.BadRequestException('Resend configuration is missing a valid fromEmail');
            }
            return;
        }
        throw new common_1.BadRequestException(`Mailer vendor "${config.vendor}" is not supported yet`);
    }
    isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
};
exports.MailerConfigurationService = MailerConfigurationService;
exports.MailerConfigurationService = MailerConfigurationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_configuration_repository_1.MailerConfigurationRepository,
        encryption_service_1.MailerConfigurationEncryptionService])
], MailerConfigurationService);
//# sourceMappingURL=mailer-configuration.service.js.map