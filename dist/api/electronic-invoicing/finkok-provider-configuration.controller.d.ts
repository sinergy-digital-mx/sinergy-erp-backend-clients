import { FinkokProviderConfigurationService } from './services/finkok-provider-configuration.service';
import { UpsertFinkokProviderConfigurationDto } from './dto/upsert-finkok-provider-configuration.dto';
import { SetFinkokStampingEnvironmentDto } from './dto/set-finkok-stamping-environment.dto';
import type { FinkokEnvironment } from '../../entities/electronic-invoicing/finkok-provider-configuration.entity';
export declare class FinkokProviderConfigurationController {
    private readonly service;
    constructor(service: FinkokProviderConfigurationService);
    get(req: {
        user: {
            tenantId: string;
        };
    }): Promise<import("./services/finkok-provider-configuration.service").FinkokProviderConfigurationsBundle>;
    upsert(dto: UpsertFinkokProviderConfigurationDto, req: {
        user: {
            tenantId: string;
            id: string;
        };
    }): Promise<import("./services/finkok-provider-configuration.service").FinkokProviderConfigurationsBundle>;
    setStampingEnvironment(dto: SetFinkokStampingEnvironmentDto, req: {
        user: {
            tenantId: string;
        };
    }): Promise<import("./services/finkok-provider-configuration.service").FinkokProviderConfigurationsBundle>;
    testConnection(req: {
        user: {
            tenantId: string;
        };
    }, environment?: FinkokEnvironment): Promise<{
        ok: boolean;
        message: string;
        environment: FinkokEnvironment;
    }>;
}
