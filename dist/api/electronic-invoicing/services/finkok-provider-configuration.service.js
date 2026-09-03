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
exports.FinkokProviderConfigurationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const finkok_provider_configuration_entity_1 = require("../../../entities/electronic-invoicing/finkok-provider-configuration.entity");
const finkok_encryption_service_1 = require("./finkok-encryption.service");
const finkok_soap_client_1 = require("./finkok-soap.client");
let FinkokProviderConfigurationService = class FinkokProviderConfigurationService {
    repo;
    encryptionService;
    finkokClient;
    constructor(repo, encryptionService, finkokClient) {
        this.repo = repo;
        this.encryptionService = encryptionService;
        this.finkokClient = finkokClient;
    }
    async getAllForTenant(tenantId) {
        const rows = await this.repo.find({ where: { tenant_id: tenantId } });
        const demo = rows.find((r) => r.environment === 'demo') ?? null;
        const production = rows.find((r) => r.environment === 'production') ?? null;
        const defaultRow = rows.find((r) => r.is_stamping_default === 1);
        return {
            stamping_environment: defaultRow?.environment ?? demo?.environment ?? production?.environment ?? null,
            environments: {
                demo: demo ? this.toResponse(demo) : null,
                production: production ? this.toResponse(production) : null,
            },
        };
    }
    async getForTenant(tenantId) {
        const bundle = await this.getAllForTenant(tenantId);
        const env = bundle.stamping_environment ?? 'demo';
        return bundle.environments[env];
    }
    async upsert(tenantId, userId, dto) {
        const environment = dto.environment;
        let config = await this.repo.findOne({ where: { tenant_id: tenantId, environment } });
        if (!config && !dto.finkok_password?.trim()) {
            throw new common_1.BadRequestException('La contraseña de Finkok es obligatoria');
        }
        const usernameEncrypted = this.encryptionService.encrypt(dto.finkok_username);
        const passwordEncrypted = dto.finkok_password?.trim()
            ? this.encryptionService.encrypt(dto.finkok_password.trim())
            : null;
        if (!config) {
            config = this.repo.create({
                tenant_id: tenantId,
                environment,
                finkok_username: dto.finkok_username,
                finkok_username_encrypted: usernameEncrypted.encryptedValue,
                finkok_username_iv: usernameEncrypted.iv,
                finkok_password_encrypted: passwordEncrypted.encryptedValue,
                finkok_password_iv: passwordEncrypted.iv,
                is_active: dto.is_active ?? 1,
                is_stamping_default: dto.is_stamping_default ?? 0,
                created_by: userId,
                updated_by: userId,
            });
        }
        else {
            config.finkok_username = dto.finkok_username;
            config.finkok_username_encrypted = usernameEncrypted.encryptedValue;
            config.finkok_username_iv = usernameEncrypted.iv;
            if (passwordEncrypted) {
                config.finkok_password_encrypted = passwordEncrypted.encryptedValue;
                config.finkok_password_iv = passwordEncrypted.iv;
            }
            config.is_active = dto.is_active ?? config.is_active;
            if (dto.is_stamping_default !== undefined) {
                config.is_stamping_default = dto.is_stamping_default;
            }
            config.updated_by = userId;
        }
        if (config.is_stamping_default === 1) {
            await this.clearOtherStampingDefaults(tenantId, environment);
        }
        await this.repo.save(config);
        const existingDefault = await this.repo.findOne({
            where: { tenant_id: tenantId, is_stamping_default: 1 },
        });
        if (!existingDefault) {
            config.is_stamping_default = 1;
            await this.repo.save(config);
        }
        return this.getAllForTenant(tenantId);
    }
    async setStampingEnvironment(tenantId, environment) {
        const config = await this.repo.findOne({
            where: { tenant_id: tenantId, environment, is_active: 1 },
        });
        if (!config) {
            throw new common_1.NotFoundException(`No hay credenciales Finkok activas para el ambiente ${environment}`);
        }
        await this.clearOtherStampingDefaults(tenantId, environment);
        config.is_stamping_default = 1;
        await this.repo.save(config);
        return this.getAllForTenant(tenantId);
    }
    async getCredentials(tenantId, environment) {
        let config = null;
        if (environment) {
            config = await this.repo.findOne({
                where: { tenant_id: tenantId, environment, is_active: 1 },
            });
        }
        else {
            config = await this.repo.findOne({
                where: { tenant_id: tenantId, is_stamping_default: 1, is_active: 1 },
            });
            if (!config) {
                config = await this.repo.findOne({
                    where: { tenant_id: tenantId, is_active: 1 },
                    order: { updated_at: 'DESC' },
                });
            }
        }
        if (!config) {
            throw new common_1.BadRequestException(environment
                ? `No hay credenciales Finkok activas para el ambiente ${environment}. Configúrelas en Configuración Fiscal.`
                : 'No hay credenciales Finkok configuradas para este cliente. Configure usuario y contraseña en Configuración Fiscal.');
        }
        return {
            username: this.encryptionService.decrypt(config.finkok_username_encrypted, config.finkok_username_iv),
            password: this.encryptionService.decrypt(config.finkok_password_encrypted, config.finkok_password_iv),
            environment: config.environment,
        };
    }
    getRegistrationCredentials(environment) {
        const suffix = environment === 'production' ? 'PRODUCTION' : 'DEMO';
        const username = process.env[`FINKOK_RESELLER_${suffix}_USERNAME`]?.trim();
        const password = process.env[`FINKOK_RESELLER_${suffix}_PASSWORD`]?.trim();
        if (!username || !password) {
            throw new common_1.BadRequestException(`Faltan credenciales reseller Finkok de ${environment === 'production' ? 'producción' : 'demo'} en el servidor ` +
                `(FINKOK_RESELLER_${suffix}_USERNAME / FINKOK_RESELLER_${suffix}_PASSWORD). ` +
                `El token de Integración Finkok no sirve para registrar RFCs.`);
        }
        return { username, password, environment };
    }
    async testConnection(tenantId, environment) {
        const env = environment ?? (await this.getCredentials(tenantId)).environment;
        const config = await this.repo.findOne({ where: { tenant_id: tenantId, environment: env } });
        if (!config) {
            throw new common_1.NotFoundException(`Configuración Finkok no encontrada para ambiente ${env}`);
        }
        const credentials = await this.getCredentials(tenantId, env);
        const probeXml = '<?xml version="1.0" encoding="utf-8"?><cfdi:Comprobante Version="4.0"/>';
        try {
            await this.finkokClient.signStamp(credentials, probeXml);
            config.last_connection_test_at = new Date();
            config.last_connection_test_status = 'connected';
            await this.repo.save(config);
            return { ok: true, message: 'Conexión con Finkok establecida correctamente', environment: env };
        }
        catch (error) {
            config.last_connection_test_at = new Date();
            config.last_connection_test_status = 'error';
            await this.repo.save(config);
            throw new common_1.BadRequestException(`No se pudo conectar con Finkok (${env}): ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    async clearOtherStampingDefaults(tenantId, environment) {
        await this.repo
            .createQueryBuilder()
            .update(finkok_provider_configuration_entity_1.FinkokProviderConfiguration)
            .set({ is_stamping_default: 0 })
            .where('tenant_id = :tenantId', { tenantId })
            .andWhere('environment != :environment', { environment })
            .execute();
    }
    toResponse(config) {
        return {
            id: config.id,
            tenant_id: config.tenant_id,
            finkok_username: config.finkok_username,
            environment: config.environment,
            is_active: config.is_active,
            is_stamping_default: config.is_stamping_default,
            last_connection_test_at: config.last_connection_test_at,
            last_connection_test_status: config.last_connection_test_status,
            has_password: Boolean(config.finkok_password_encrypted),
            created_at: config.created_at,
            updated_at: config.updated_at,
        };
    }
};
exports.FinkokProviderConfigurationService = FinkokProviderConfigurationService;
exports.FinkokProviderConfigurationService = FinkokProviderConfigurationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(finkok_provider_configuration_entity_1.FinkokProviderConfiguration)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        finkok_encryption_service_1.FinkokEncryptionService,
        finkok_soap_client_1.FinkokSoapClient])
], FinkokProviderConfigurationService);
//# sourceMappingURL=finkok-provider-configuration.service.js.map