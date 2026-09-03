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
export declare class FiscalConfigurationFinkokService {
    private readonly fiscalRepo;
    private readonly finkokConfigService;
    private readonly finkokClient;
    constructor(fiscalRepo: Repository<FiscalConfiguration>, finkokConfigService: FinkokProviderConfigurationService, finkokClient: FinkokSoapClient);
    getFinkokStatus(fiscalConfigurationId: string, tenantId: string, environment?: FinkokEnvironment): Promise<FinkokIssuerStatusResponse>;
    registerIssuer(fiscalConfigurationId: string, tenantId: string, userId: string, dto?: RegisterFiscalConfigurationFinkokDto): Promise<FinkokIssuerStatusResponse>;
    markRegistrationFailed(fiscalConfigurationId: string, tenantId: string, errorMessage: string): Promise<FiscalConfiguration>;
    private markRegistered;
    private failRegistration;
    private toStatusResponse;
    private findMatchingUser;
    private normalizeBase64;
    private getByIdOrFail;
}
