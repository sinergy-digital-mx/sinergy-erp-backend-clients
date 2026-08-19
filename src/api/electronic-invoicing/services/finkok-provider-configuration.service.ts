import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FinkokEnvironment,
  FinkokProviderConfiguration,
} from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';
import { UpsertFinkokProviderConfigurationDto } from '../dto/upsert-finkok-provider-configuration.dto';
import { FinkokEncryptionService } from './finkok-encryption.service';
import { FinkokSoapClient } from './finkok-soap.client';

export interface FinkokProviderConfigurationResponse {
  id: string;
  tenant_id: string;
  finkok_username: string;
  environment: FinkokEnvironment;
  is_active: number;
  is_stamping_default: number;
  last_connection_test_at: Date | null;
  last_connection_test_status: string | null;
  has_password: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FinkokProviderConfigurationsBundle {
  stamping_environment: FinkokEnvironment | null;
  environments: {
    demo: FinkokProviderConfigurationResponse | null;
    production: FinkokProviderConfigurationResponse | null;
  };
}

@Injectable()
export class FinkokProviderConfigurationService {
  constructor(
    @InjectRepository(FinkokProviderConfiguration)
    private readonly repo: Repository<FinkokProviderConfiguration>,
    private readonly encryptionService: FinkokEncryptionService,
    private readonly finkokClient: FinkokSoapClient,
  ) {}

  async getAllForTenant(tenantId: string): Promise<FinkokProviderConfigurationsBundle> {
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

  /** @deprecated Usar getAllForTenant — mantiene compatibilidad con UI antigua */
  async getForTenant(tenantId: string): Promise<FinkokProviderConfigurationResponse | null> {
    const bundle = await this.getAllForTenant(tenantId);
    const env = bundle.stamping_environment ?? 'demo';
    return bundle.environments[env];
  }

  async upsert(
    tenantId: string,
    userId: string,
    dto: UpsertFinkokProviderConfigurationDto,
  ): Promise<FinkokProviderConfigurationsBundle> {
    const environment = dto.environment;
    let config = await this.repo.findOne({ where: { tenant_id: tenantId, environment } });

    if (!config && !dto.finkok_password?.trim()) {
      throw new BadRequestException('La contraseña de Finkok es obligatoria');
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
        finkok_password_encrypted: passwordEncrypted!.encryptedValue,
        finkok_password_iv: passwordEncrypted!.iv,
        is_active: dto.is_active ?? 1,
        is_stamping_default: dto.is_stamping_default ?? 0,
        created_by: userId,
        updated_by: userId,
      });
    } else {
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

  async setStampingEnvironment(
    tenantId: string,
    environment: FinkokEnvironment,
  ): Promise<FinkokProviderConfigurationsBundle> {
    const config = await this.repo.findOne({
      where: { tenant_id: tenantId, environment, is_active: 1 },
    });
    if (!config) {
      throw new NotFoundException(
        `No hay credenciales Finkok activas para el ambiente ${environment}`,
      );
    }

    await this.clearOtherStampingDefaults(tenantId, environment);
    config.is_stamping_default = 1;
    await this.repo.save(config);

    return this.getAllForTenant(tenantId);
  }

  async getCredentials(
    tenantId: string,
    environment?: FinkokEnvironment,
  ): Promise<{
    username: string;
    password: string;
    environment: FinkokEnvironment;
  }> {
    let config: FinkokProviderConfiguration | null = null;

    if (environment) {
      config = await this.repo.findOne({
        where: { tenant_id: tenantId, environment, is_active: 1 },
      });
    } else {
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
      throw new BadRequestException(
        environment
          ? `No hay credenciales Finkok activas para el ambiente ${environment}. Configúrelas en Configuración Fiscal.`
          : 'No hay credenciales Finkok configuradas para este cliente. Configure usuario y contraseña en Configuración Fiscal.',
      );
    }

    return {
      username: this.encryptionService.decrypt(
        config.finkok_username_encrypted,
        config.finkok_username_iv,
      ),
      password: this.encryptionService.decrypt(
        config.finkok_password_encrypted,
        config.finkok_password_iv,
      ),
      environment: config.environment,
    };
  }

  /**
   * Credenciales reseller para WS de registration (alta/consulta de RFC).
   * Vienen de .env; no usar el token SOAP de Integración Finkok (ese es solo timbrado).
   */
  getRegistrationCredentials(environment: FinkokEnvironment): {
    username: string;
    password: string;
    environment: FinkokEnvironment;
  } {
    const suffix = environment === 'production' ? 'PRODUCTION' : 'DEMO';
    const username = process.env[`FINKOK_RESELLER_${suffix}_USERNAME`]?.trim();
    const password = process.env[`FINKOK_RESELLER_${suffix}_PASSWORD`]?.trim();

    if (!username || !password) {
      throw new BadRequestException(
        `Faltan credenciales reseller Finkok de ${environment === 'production' ? 'producción' : 'demo'} en el servidor ` +
          `(FINKOK_RESELLER_${suffix}_USERNAME / FINKOK_RESELLER_${suffix}_PASSWORD). ` +
          `El token de Integración Finkok no sirve para registrar RFCs.`,
      );
    }

    return { username, password, environment };
  }

  async testConnection(
    tenantId: string,
    environment?: FinkokEnvironment,
  ): Promise<{ ok: boolean; message: string; environment: FinkokEnvironment }> {
    const env = environment ?? (await this.getCredentials(tenantId)).environment;
    const config = await this.repo.findOne({ where: { tenant_id: tenantId, environment: env } });
    if (!config) {
      throw new NotFoundException(`Configuración Finkok no encontrada para ambiente ${env}`);
    }

    const credentials = await this.getCredentials(tenantId, env);
    const probeXml = '<?xml version="1.0" encoding="utf-8"?><cfdi:Comprobante Version="4.0"/>';

    try {
      await this.finkokClient.signStamp(credentials, probeXml);
      config.last_connection_test_at = new Date();
      config.last_connection_test_status = 'connected';
      await this.repo.save(config);
      return { ok: true, message: 'Conexión con Finkok establecida correctamente', environment: env };
    } catch (error) {
      config.last_connection_test_at = new Date();
      config.last_connection_test_status = 'error';
      await this.repo.save(config);
      throw new BadRequestException(
        `No se pudo conectar con Finkok (${env}): ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  private async clearOtherStampingDefaults(
    tenantId: string,
    environment: FinkokEnvironment,
  ): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(FinkokProviderConfiguration)
      .set({ is_stamping_default: 0 })
      .where('tenant_id = :tenantId', { tenantId })
      .andWhere('environment != :environment', { environment })
      .execute();
  }

  private toResponse(config: FinkokProviderConfiguration): FinkokProviderConfigurationResponse {
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
}

