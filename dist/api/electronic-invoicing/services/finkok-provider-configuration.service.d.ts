import { Repository } from 'typeorm';
import { FinkokEnvironment, FinkokProviderConfiguration } from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';
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
export declare class FinkokProviderConfigurationService {
    private readonly repo;
    private readonly encryptionService;
    private readonly finkokClient;
    constructor(repo: Repository<FinkokProviderConfiguration>, encryptionService: FinkokEncryptionService, finkokClient: FinkokSoapClient);
    getAllForTenant(tenantId: string): Promise<FinkokProviderConfigurationsBundle>;
    getForTenant(tenantId: string): Promise<FinkokProviderConfigurationResponse | null>;
    upsert(tenantId: string, userId: string, dto: UpsertFinkokProviderConfigurationDto): Promise<FinkokProviderConfigurationsBundle>;
    setStampingEnvironment(tenantId: string, environment: FinkokEnvironment): Promise<FinkokProviderConfigurationsBundle>;
    getCredentials(tenantId: string, environment?: FinkokEnvironment): Promise<{
        username: string;
        password: string;
        environment: FinkokEnvironment;
    }>;
    getRegistrationCredentials(environment: FinkokEnvironment): {
        username: string;
        password: string;
        environment: FinkokEnvironment;
    };
    testConnection(tenantId: string, environment?: FinkokEnvironment): Promise<{
        ok: boolean;
        message: string;
        environment: FinkokEnvironment;
    }>;
    private clearOtherStampingDefaults;
    private toResponse;
}
