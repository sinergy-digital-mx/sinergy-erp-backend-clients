import { TenantContextService } from '../../rbac/services/tenant-context.service';
import { ThirdPartyConfigService } from '../services/third-party-config.service';
import { CreateThirdPartyConfigDto } from '../dto/create-third-party-config.dto';
import { UpdateThirdPartyConfigDto } from '../dto/update-third-party-config.dto';
export declare class ThirdPartyConfigController {
    private configService;
    private tenantContextService;
    constructor(configService: ThirdPartyConfigService, tenantContextService: TenantContextService);
    create(dto: CreateThirdPartyConfigDto): Promise<any>;
    list(): Promise<{
        configs: any[];
    }>;
    getById(configId: string): Promise<import("../../../entities/integrations/third-party-config.entity").ThirdPartyConfig>;
    update(configId: string, dto: UpdateThirdPartyConfigDto): Promise<any>;
    delete(configId: string): Promise<{
        message: string;
    }>;
    test(configId: string): Promise<{
        is_valid: boolean;
        message: string;
    }>;
    private maskSensitiveData;
    private maskSecret;
}
