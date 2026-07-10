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
    const credentials = await this.finkokConfigService.getCredentials(tenantId, env);

    const remote = await this.finkokClient.registrationGet(credentials, fiscal.rfc);
    const match = remote.users[0];

    if (match) {
      fiscal.finkok_remote_status = match.status ?? null;
      fiscal.finkok_stamps_counter = match.counter ?? null;
      fiscal.finkok_stamps_credit = match.credit ?? null;
      fiscal.last_finkok_sync_at = new Date();
      await this.fiscalRepo.save(fiscal);
    }

    return this.toStatusResponse(fiscal, env, remote.found, remote.message);
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
      return this.markRegistered(fiscal, env, 'Vinculación manual sin consulta Finkok');
    }

    const credentials = await this.finkokConfigService.getCredentials(tenantId, env);
    const remote = await this.finkokClient.registrationGet(credentials, fiscal.rfc);
    const match = remote.users.find(
      (u) => u.taxpayer_id?.toUpperCase() === fiscal.rfc.toUpperCase(),
    );

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
      fiscal.finkok_registration_error =
        remote.message ??
        `El RFC ${fiscal.rfc} no está registrado en Finkok (${env}). Use mode=add para intentar alta.`;
      fiscal.last_finkok_sync_at = new Date();
      await this.fiscalRepo.save(fiscal);
      return this.toStatusResponse(fiscal, env, false, fiscal.finkok_registration_error ?? undefined);
    }

    if (!dto.add_if_missing && mode !== 'add') {
      throw new BadRequestException(
        'El RFC no existe en Finkok. Envíe mode=add o add_if_missing=true para intentar el alta.',
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

    const typeUser = fiscal.persona_type === 'Persona Moral' ? 'M' : 'F';
    const addResult = await this.finkokClient.registrationAdd(credentials, {
      taxpayerId: fiscal.rfc,
      cerBase64: this.normalizeBase64(fiscal.digital_seal),
      keyBase64: this.normalizeBase64(fiscal.private_key),
      passphrase: fiscal.digital_seal_password,
      typeUser,
    });

    if (!addResult.success) {
      await this.failRegistration(fiscal, addResult.message ?? 'Error al registrar en Finkok');
      throw new BadRequestException(addResult.message ?? 'Finkok rechazó el alta del emisor');
    }

    const afterAdd = await this.finkokClient.registrationGet(credentials, fiscal.rfc);
    const afterMatch = afterAdd.users[0];
    return this.markRegistered(
      fiscal,
      env,
      addResult.message ?? 'Emisor registrado en Finkok',
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

  private normalizeBase64(value: string): string {
    const trimmed = value.trim();
    if (trimmed.includes('-----BEGIN')) {
      return Buffer.from(trimmed, 'utf8').toString('base64');
    }
    return trimmed.replace(/\s/g, '');
  }

  private async getByIdOrFail(id: string, tenantId: string): Promise<FiscalConfiguration> {
    const fiscal = await this.fiscalRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!fiscal) {
      throw new NotFoundException('Razón emisora no encontrada');
    }
    return fiscal;
  }
}
