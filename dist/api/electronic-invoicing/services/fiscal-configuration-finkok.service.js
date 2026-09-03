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
exports.FiscalConfigurationFinkokService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fiscal_configuration_entity_1 = require("../../../entities/billing/fiscal-configuration.entity");
const finkok_registration_error_1 = require("../utils/finkok-registration-error");
const finkok_provider_configuration_service_1 = require("./finkok-provider-configuration.service");
const finkok_soap_client_1 = require("./finkok-soap.client");
let FiscalConfigurationFinkokService = class FiscalConfigurationFinkokService {
    fiscalRepo;
    finkokConfigService;
    finkokClient;
    constructor(fiscalRepo, finkokConfigService, finkokClient) {
        this.fiscalRepo = fiscalRepo;
        this.finkokConfigService = finkokConfigService;
        this.finkokClient = finkokClient;
    }
    async getFinkokStatus(fiscalConfigurationId, tenantId, environment) {
        const fiscal = await this.getByIdOrFail(fiscalConfigurationId, tenantId);
        const env = environment ?? (await this.finkokConfigService.getCredentials(tenantId)).environment;
        const credentials = this.finkokConfigService.getRegistrationCredentials(env);
        const remote = await this.finkokClient.registrationGet(credentials, fiscal.rfc);
        if ((0, finkok_registration_error_1.isFinkokAuthenticationFailed)(remote.message)) {
            const authError = (0, finkok_registration_error_1.translateFinkokRegistrationError)(remote.message, env);
            await this.failRegistration(fiscal, authError);
            return this.toStatusResponse(fiscal, env, false, authError);
        }
        const match = this.findMatchingUser(remote.users, fiscal.rfc);
        if (match) {
            return this.markRegistered(fiscal, env, remote.message ?? `RFC ${fiscal.rfc} encontrado en Finkok (${env})`, match);
        }
        fiscal.finkok_registration_status = 'pending';
        fiscal.finkok_registration_error =
            remote.message && !(0, finkok_registration_error_1.isFinkokAuthenticationFailed)(remote.message)
                ? (0, finkok_registration_error_1.translateFinkokRegistrationError)(remote.message, env)
                : `El RFC ${fiscal.rfc} no está registrado en Finkok (${env}).`;
        fiscal.finkok_remote_status = null;
        fiscal.last_finkok_sync_at = new Date();
        const saved = await this.fiscalRepo.save(fiscal);
        return this.toStatusResponse(saved, env, false, fiscal.finkok_registration_error ?? undefined);
    }
    async registerIssuer(fiscalConfigurationId, tenantId, userId, dto = {}) {
        const fiscal = await this.getByIdOrFail(fiscalConfigurationId, tenantId);
        const mode = dto.mode ?? 'verify';
        const env = dto.environment ?? (await this.finkokConfigService.getCredentials(tenantId)).environment;
        if (!fiscal.created_by) {
            fiscal.created_by = userId;
        }
        if (mode === 'link_only') {
            fiscal.finkok_registration_status = 'pending';
            fiscal.finkok_registration_error =
                'La vinculación local no confirma el RFC en Finkok. Use Verificar o Registrar.';
            fiscal.last_finkok_sync_at = new Date();
            const saved = await this.fiscalRepo.save(fiscal);
            return this.toStatusResponse(saved, env, false, fiscal.finkok_registration_error);
        }
        const credentials = this.finkokConfigService.getRegistrationCredentials(env);
        const remote = await this.finkokClient.registrationGet(credentials, fiscal.rfc);
        if ((0, finkok_registration_error_1.isFinkokAuthenticationFailed)(remote.message)) {
            const authError = (0, finkok_registration_error_1.translateFinkokRegistrationError)(remote.message, env);
            await this.failRegistration(fiscal, authError);
            throw new common_1.BadRequestException(authError);
        }
        const match = this.findMatchingUser(remote.users, fiscal.rfc);
        if (match) {
            return this.markRegistered(fiscal, env, remote.message ?? 'RFC ya registrado en Finkok — vinculado por RFC', match);
        }
        if (mode === 'verify') {
            fiscal.finkok_registration_status = 'pending';
            fiscal.finkok_registration_error = remote.message
                ? (0, finkok_registration_error_1.translateFinkokRegistrationError)(remote.message, env)
                : `El RFC ${fiscal.rfc} no está registrado en Finkok (${env}). Use Registrar en Finkok para darlo de alta.`;
            fiscal.last_finkok_sync_at = new Date();
            await this.fiscalRepo.save(fiscal);
            return this.toStatusResponse(fiscal, env, false, fiscal.finkok_registration_error ?? undefined);
        }
        if (!dto.add_if_missing && mode !== 'add') {
            throw new common_1.BadRequestException('El RFC no existe en Finkok. Use Registrar en Finkok para intentar el alta.');
        }
        if (!fiscal.digital_seal || !fiscal.private_key) {
            throw new common_1.BadRequestException('Se requiere certificado (.cer) y llave (.key) en la razón emisora para dar de alta en Finkok.');
        }
        if (!fiscal.digital_seal_password) {
            throw new common_1.BadRequestException('Se requiere la contraseña del CSD para registrar en Finkok.');
        }
        const addResult = await this.finkokClient.registrationAdd(credentials, {
            taxpayerId: fiscal.rfc,
            cerBase64: this.normalizeBase64(fiscal.digital_seal),
            keyBase64: this.normalizeBase64(fiscal.private_key),
            passphrase: fiscal.digital_seal_password,
            typeUser: 'O',
        });
        if (!addResult.success) {
            const addError = (0, finkok_registration_error_1.translateFinkokRegistrationError)(addResult.message ?? 'Finkok rechazó el alta del emisor', env);
            await this.failRegistration(fiscal, addError);
            throw new common_1.BadRequestException(addError);
        }
        const afterAdd = await this.finkokClient.registrationGet(credentials, fiscal.rfc);
        if ((0, finkok_registration_error_1.isFinkokAuthenticationFailed)(afterAdd.message)) {
            const authError = (0, finkok_registration_error_1.translateFinkokRegistrationError)(afterAdd.message, env);
            await this.failRegistration(fiscal, authError);
            throw new common_1.BadRequestException(authError);
        }
        const afterMatch = this.findMatchingUser(afterAdd.users, fiscal.rfc);
        if (!afterAdd.found || !afterMatch) {
            const confirmError = `Finkok no confirmó el RFC ${fiscal.rfc} en ${env} después del alta. ` +
                `El RFC no aparece en el listado de clientes de ese ambiente.`;
            await this.failRegistration(fiscal, confirmError);
            throw new common_1.BadRequestException(confirmError);
        }
        return this.markRegistered(fiscal, env, addResult.message ?? `Emisor ${fiscal.rfc} registrado en Finkok (${env})`, afterMatch);
    }
    async markRegistrationFailed(fiscalConfigurationId, tenantId, errorMessage) {
        const fiscal = await this.getByIdOrFail(fiscalConfigurationId, tenantId);
        await this.failRegistration(fiscal, errorMessage);
        return fiscal;
    }
    async markRegistered(fiscal, environment, message, remoteUser) {
        fiscal.finkok_registration_status = 'registered';
        fiscal.finkok_registered_at = new Date();
        fiscal.finkok_registration_error = null;
        fiscal.finkok_remote_status = remoteUser?.status ?? fiscal.finkok_remote_status;
        fiscal.finkok_stamps_counter = remoteUser?.counter ?? fiscal.finkok_stamps_counter;
        fiscal.finkok_stamps_credit = remoteUser?.credit ?? fiscal.finkok_stamps_credit;
        fiscal.last_finkok_sync_at = new Date();
        const saved = await this.fiscalRepo.save(fiscal);
        return this.toStatusResponse(saved, environment, true, message);
    }
    async failRegistration(fiscal, errorMessage) {
        fiscal.finkok_registration_status = 'failed';
        fiscal.finkok_registration_error = errorMessage;
        fiscal.last_finkok_sync_at = new Date();
        await this.fiscalRepo.save(fiscal);
    }
    toStatusResponse(fiscal, environment, existsInFinkok, message) {
        return {
            fiscal_configuration_id: fiscal.id,
            rfc: fiscal.rfc,
            finkok_registration_status: fiscal.finkok_registration_status,
            finkok_remote_status: fiscal.finkok_remote_status,
            finkok_stamps_counter: fiscal.finkok_stamps_counter,
            finkok_stamps_credit: fiscal.finkok_stamps_credit,
            last_finkok_sync_at: fiscal.last_finkok_sync_at,
            finkok_registered_at: fiscal.finkok_registered_at,
            finkok_registration_error: fiscal.finkok_registration_error,
            exists_in_finkok: existsInFinkok,
            environment,
            message,
        };
    }
    findMatchingUser(users, rfc) {
        return users.find((u) => u.taxpayer_id?.toUpperCase() === rfc.toUpperCase());
    }
    normalizeBase64(value) {
        const trimmed = value.trim();
        const withoutDataUri = trimmed.replace(/^data:[^;]+;base64,/i, '');
        if (withoutDataUri.includes('-----BEGIN')) {
            return Buffer.from(withoutDataUri, 'utf8').toString('base64');
        }
        return withoutDataUri.replace(/\s/g, '');
    }
    async getByIdOrFail(id, tenantId) {
        if (!id || id === 'undefined' || id === 'null') {
            throw new common_1.BadRequestException('Falta el identificador de la razón social. Guárdela antes de registrar en Finkok.');
        }
        const fiscal = await this.fiscalRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!fiscal) {
            throw new common_1.NotFoundException('Razón social no encontrada');
        }
        return fiscal;
    }
};
exports.FiscalConfigurationFinkokService = FiscalConfigurationFinkokService;
exports.FiscalConfigurationFinkokService = FiscalConfigurationFinkokService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        finkok_provider_configuration_service_1.FinkokProviderConfigurationService,
        finkok_soap_client_1.FinkokSoapClient])
], FiscalConfigurationFinkokService);
//# sourceMappingURL=fiscal-configuration-finkok.service.js.map