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
exports.ThirdPartyConfigService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const third_party_config_entity_1 = require("../../../entities/integrations/third-party-config.entity");
const encryption_service_1 = require("./encryption.service");
let ThirdPartyConfigService = class ThirdPartyConfigService {
    configRepo;
    encryptionService;
    constructor(configRepo, encryptionService) {
        this.configRepo = configRepo;
        this.encryptionService = encryptionService;
    }
    async create(tenantId, dto, userId) {
        const existing = await this.configRepo.findOne({
            where: { tenant_id: tenantId, provider: dto.provider },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Configuration for provider "${dto.provider}" already exists for this tenant`);
        }
        const config = this.configRepo.create({
            tenant_id: tenantId,
            provider: dto.provider,
            name: dto.name,
            encrypted_api_key: this.encryptionService.encrypt(dto.api_key),
            encrypted_api_secret: dto.api_secret
                ? this.encryptionService.encrypt(dto.api_secret)
                : null,
            encrypted_webhook_secret: dto.webhook_secret
                ? this.encryptionService.encrypt(dto.webhook_secret)
                : null,
            metadata: dto.metadata || {},
            is_enabled: dto.is_enabled ?? true,
            is_test_mode: dto.is_test_mode ?? false,
            created_by: userId,
            updated_by: userId,
        });
        return this.configRepo.save(config);
    }
    async getById(configId, tenantId) {
        const config = await this.configRepo.findOne({
            where: { id: configId, tenant_id: tenantId },
        });
        if (!config) {
            throw new common_1.NotFoundException('Configuration not found');
        }
        return this.decryptConfig(config);
    }
    async getByProvider(tenantId, provider) {
        const config = await this.configRepo.findOne({
            where: { tenant_id: tenantId, provider },
        });
        if (!config) {
            throw new common_1.NotFoundException(`Configuration for provider "${provider}" not found`);
        }
        return this.decryptConfig(config);
    }
    async listByTenant(tenantId) {
        return this.configRepo.find({
            where: { tenant_id: tenantId },
            order: { created_at: 'DESC' },
        });
    }
    async update(configId, tenantId, dto, userId) {
        const config = await this.configRepo.findOne({
            where: { id: configId, tenant_id: tenantId },
        });
        if (!config) {
            throw new common_1.NotFoundException('Configuration not found');
        }
        if (dto.name)
            config.name = dto.name;
        if (dto.api_key) {
            config.encrypted_api_key = this.encryptionService.encrypt(dto.api_key);
        }
        if (dto.api_secret !== undefined) {
            config.encrypted_api_secret = dto.api_secret
                ? this.encryptionService.encrypt(dto.api_secret)
                : null;
        }
        if (dto.webhook_secret !== undefined) {
            config.encrypted_webhook_secret = dto.webhook_secret
                ? this.encryptionService.encrypt(dto.webhook_secret)
                : null;
        }
        if (dto.metadata)
            config.metadata = dto.metadata;
        if (dto.is_enabled !== undefined)
            config.is_enabled = dto.is_enabled;
        if (dto.is_test_mode !== undefined)
            config.is_test_mode = dto.is_test_mode;
        config.updated_by = userId;
        config.updated_at = new Date();
        return this.configRepo.save(config);
    }
    async delete(configId, tenantId) {
        const result = await this.configRepo.delete({
            id: configId,
            tenant_id: tenantId,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Configuration not found');
        }
    }
    async testConfig(configId, tenantId) {
        const config = await this.configRepo.findOne({
            where: { id: configId, tenant_id: tenantId },
        });
        if (!config) {
            throw new common_1.NotFoundException('Configuration not found');
        }
        try {
            this.encryptionService.decrypt(config.encrypted_api_key);
            config.last_tested_at = new Date();
            await this.configRepo.save(config);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getDecryptedApiKey(configId, tenantId) {
        const config = await this.getById(configId, tenantId);
        return this.encryptionService.decrypt(config.encrypted_api_key);
    }
    async getDecryptedApiSecret(configId, tenantId) {
        const config = await this.getById(configId, tenantId);
        if (!config.encrypted_api_secret)
            return null;
        return this.encryptionService.decrypt(config.encrypted_api_secret);
    }
    async getDecryptedWebhookSecret(configId, tenantId) {
        const config = await this.getById(configId, tenantId);
        if (!config.encrypted_webhook_secret)
            return null;
        return this.encryptionService.decrypt(config.encrypted_webhook_secret);
    }
    decryptConfig(config) {
        return {
            ...config,
            encrypted_api_key: this.encryptionService.decrypt(config.encrypted_api_key),
            encrypted_api_secret: config.encrypted_api_secret
                ? this.encryptionService.decrypt(config.encrypted_api_secret)
                : null,
            encrypted_webhook_secret: config.encrypted_webhook_secret
                ? this.encryptionService.decrypt(config.encrypted_webhook_secret)
                : null,
        };
    }
};
exports.ThirdPartyConfigService = ThirdPartyConfigService;
exports.ThirdPartyConfigService = ThirdPartyConfigService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(third_party_config_entity_1.ThirdPartyConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        encryption_service_1.EncryptionService])
], ThirdPartyConfigService);
//# sourceMappingURL=third-party-config.service.js.map