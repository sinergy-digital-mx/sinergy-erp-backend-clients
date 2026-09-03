import { MailerConfigurationService } from '../services/mailer-configuration.service';
import { CreateMailerConfigurationDto } from '../dto/create-mailer-configuration.dto';
import { UpdateMailerConfigurationDto } from '../dto/update-mailer-configuration.dto';
import { QueryMailerConfigurationDto } from '../dto/query-mailer-configuration.dto';
import { MailerConfigurationDto } from '../dto/mailer-configuration.dto';
import { TenantContextService } from '../../rbac/services/tenant-context.service';
export declare class MailerConfigurationController {
    private readonly service;
    private readonly tenantContext;
    constructor(service: MailerConfigurationService, tenantContext: TenantContextService);
    create(dto: CreateMailerConfigurationDto): Promise<MailerConfigurationDto>;
    findAll(query: QueryMailerConfigurationDto): Promise<{
        data: MailerConfigurationDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    getActive(): Promise<MailerConfigurationDto>;
    findOne(id: string): Promise<MailerConfigurationDto>;
    update(id: string, dto: UpdateMailerConfigurationDto): Promise<MailerConfigurationDto>;
    remove(id: string): Promise<void>;
    activate(id: string): Promise<MailerConfigurationDto>;
}
