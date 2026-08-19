import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { FinkokEnvironment } from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';
import { RegisterFiscalConfigurationFinkokDto } from '../dto/register-fiscal-configuration-finkok.dto';
import {
  isFinkokAuthenticationFailed,
  translateFinkokRegistrationError,
} from '../utils/finkok-registration-error';
import { FinkokProviderConfigurationService } from './finkok-provider-configuration.service';
import { FinkokSoapClient } from './finkok-soap.client';

export interface FinkokIssuerStatusResponse {
  fiscal_configuration_id: string;
  rfc: string;
  finkok_registration_status: string;
  finkok_remote_status: string | null;
  finkok_stamps_counter: number | null;
  finkok_stamps_credit: number | null;
  last_finkok_sync_at: Date | null;
  finkok_registered_at: Date | null;
  finkok_registration_error: string | null;
  exists_in_finkok: boolean;
  environment: FinkokEnvironment;
  message?: string;
}

@Injectable()
export class FiscalConfigurationFinkokService {
  constructor(
    @InjectRepository(FiscalConfiguration)
    private readonly fiscalRepo: Repository<FiscalConfiguration>,
    private readonly finkokConfigService: FinkokProviderConfigurationService,
    private readonly finkokClient: FinkokSoapClient,
  ) {}

  async getFinkokStatus(
    fiscalConfigurationId: string,
    tenantId: string,
    environment?: FinkokEnvironment,
  ): Promise<FinkokIssuerStatusResponse> {
    const fiscal = await this.getByIdOrFail(fiscalConfigurationId, tenantId);
    const env = environment ?? (await this.finkokConfigService.getCredentials(tenantId)).environment;
    const credentials = this.finkokConfigService.getRegistrationCredentials(env);

    const remote = await this.finkokClient.registrationGet(credentials, fiscal.rfc);

    if (isFinkokAuthenticationFailed(remote.message)) {
      const authError = translateFinkokRegistrationError(remote.message, env);
      await this.failRegistration(fiscal, authError);
      return this.toStatusResponse(fiscal, env, false, authError);
    }

    const match = this.findMatchingUser(remote.users, fiscal.rfc);
    if (match) {
      return this.markRegistered(
        fiscal,
        env,
        remote.message ?? `RFC ${fiscal.rfc} encontrado en Finkok (${env})`,
        match,
      );
    }

    fiscal.finkok_registration_status = 'pending';
    fiscal.finkok_registration_error =
      remote.message && !isFinkokAuthenticationFailed(remote.message)
        ? translateFinkokRegistrationError(remote.message, env)
        : `El RFC ${fiscal.rfc} no está registrado en Finkok (${env}).`;
    fiscal.finkok_remote_status = null;
    fiscal.last_finkok_sync_at = new Date();
    const saved = await this.fiscalRepo.save(fiscal);
    return this.toStatusResponse(
      saved,
      env,
      false,
      fiscal.finkok_registration_error ?? undefined,
    );
  }

  async registerIssuer(
    fiscalConfigurationId: string,
    tenantId: string,
    userId: string,
    dto: RegisterFiscalConfigurationFinkokDto = {},
  ): Promise<FinkokIssuerStatusResponse> {
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
      return this.toStatusResponse(
        saved,
        env,
        false,
        fiscal.finkok_registration_error,
      );
    }

    const credentials = this.finkokConfigService.getRegistrationCredentials(env);
    const remote = await this.finkokClient.registrationGet(credentials, fiscal.rfc);
    if (isFinkokAuthenticationFailed(remote.message)) {
      const authError = translateFinkokRegistrationError(remote.message, env);
      await this.failRegistration(fiscal, authError);
      throw new BadRequestException(authError);
    }

    const match = this.findMatchingUser(remote.users, fiscal.rfc);

    if (match) {
      return this.markRegistered(
        fiscal,
        env,
        remote.message ?? 'RFC ya registrado en Finkok — vinculado por RFC',
        match,
      );
    }

    if (mode === 'verify') {
      fiscal.finkok_registration_status = 'pending';
      fiscal.finkok_registration_error = remote.message
        ? translateFinkokRegistrationError(remote.message, env)
        : `El RFC ${fiscal.rfc} no está registrado en Finkok (${env}). Use Registrar en Finkok para darlo de alta.`;
      fiscal.last_finkok_sync_at = new Date();
      await this.fiscalRepo.save(fiscal);
      return this.toStatusResponse(fiscal, env, false, fiscal.finkok_registration_error ?? undefined);
    }

    if (!dto.add_if_missing && mode !== 'add') {
      throw new BadRequestException(
        'El RFC no existe en Finkok. Use Registrar en Finkok para intentar el alta.',
      );
    }

    if (!fiscal.digital_seal || !fiscal.private_key) {
      throw new BadRequestException(
        'Se requiere certificado (.cer) y llave (.key) en la razón emisora para dar de alta en Finkok.',
      );
    }

    if (!fiscal.digital_seal_password) {
      throw new BadRequestException('Se requiere la contraseña del CSD para registrar en Finkok.');
    }

    // Finkok type_user: O = OnDemand, P = Prepago (no es Persona Moral/Física).
    const addResult = await this.finkokClient.registrationAdd(credentials, {
      taxpayerId: fiscal.rfc,
      cerBase64: this.normalizeBase64(fiscal.digital_seal),
      keyBase64: this.normalizeBase64(fiscal.private_key),
      passphrase: fiscal.digital_seal_password,
      typeUser: 'O',
    });

    if (!addResult.success) {
      const addError = translateFinkokRegistrationError(
        addResult.message ?? 'Finkok rechazó el alta del emisor',
        env,
      );
      await this.failRegistration(fiscal, addError);
      throw new BadRequestException(addError);
    }

    const afterAdd = await this.finkokClient.registrationGet(credentials, fiscal.rfc);
    if (isFinkokAuthenticationFailed(afterAdd.message)) {
      const authError = translateFinkokRegistrationError(afterAdd.message, env);
      await this.failRegistration(fiscal, authError);
      throw new BadRequestException(authError);
    }

    const afterMatch = this.findMatchingUser(afterAdd.users, fiscal.rfc);
    if (!afterAdd.found || !afterMatch) {
      const confirmError =
        `Finkok no confirmó el RFC ${fiscal.rfc} en ${env} después del alta. ` +
        `El RFC no aparece en el listado de clientes de ese ambiente.`;
      await this.failRegistration(fiscal, confirmError);
      throw new BadRequestException(confirmError);
    }

    return this.markRegistered(
      fiscal,
      env,
      addResult.message ?? `Emisor ${fiscal.rfc} registrado en Finkok (${env})`,
      afterMatch,
    );
  }

  async markRegistrationFailed(
    fiscalConfigurationId: string,
    tenantId: string,
    errorMessage: string,
  ): Promise<FiscalConfiguration> {
    const fiscal = await this.getByIdOrFail(fiscalConfigurationId, tenantId);
    await this.failRegistration(fiscal, errorMessage);
    return fiscal;
  }

  private async markRegistered(
    fiscal: FiscalConfiguration,
    environment: FinkokEnvironment,
    message: string,
    remoteUser?: {
      status?: string;
      counter?: number;
      taxpayer_id?: string;
      credit?: number;
    },
  ): Promise<FinkokIssuerStatusResponse> {
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

  private async failRegistration(
    fiscal: FiscalConfiguration,
    errorMessage: string,
  ): Promise<void> {
    fiscal.finkok_registration_status = 'failed';
    fiscal.finkok_registration_error = errorMessage;
    fiscal.last_finkok_sync_at = new Date();
    await this.fiscalRepo.save(fiscal);
  }

  private toStatusResponse(
    fiscal: FiscalConfiguration,
    environment: FinkokEnvironment,
    existsInFinkok: boolean,
    message?: string,
  ): FinkokIssuerStatusResponse {
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

  private findMatchingUser(
    users: Array<{
      status?: string;
      counter?: number;
      taxpayer_id?: string;
      credit?: number;
    }>,
    rfc: string,
  ) {
    return users.find((u) => u.taxpayer_id?.toUpperCase() === rfc.toUpperCase());
  }

  private normalizeBase64(value: string): string {
    const trimmed = value.trim();
    const withoutDataUri = trimmed.replace(/^data:[^;]+;base64,/i, '');
    if (withoutDataUri.includes('-----BEGIN')) {
      return Buffer.from(withoutDataUri, 'utf8').toString('base64');
    }
    return withoutDataUri.replace(/\s/g, '');
  }

  private async getByIdOrFail(id: string, tenantId: string): Promise<FiscalConfiguration> {
    if (!id || id === 'undefined' || id === 'null') {
      throw new BadRequestException(
        'Falta el identificador de la razón social. Guárdela antes de registrar en Finkok.',
      );
    }

    const fiscal = await this.fiscalRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!fiscal) {
      throw new NotFoundException('Razón social no encontrada');
    }
    return fiscal;
  }
}
