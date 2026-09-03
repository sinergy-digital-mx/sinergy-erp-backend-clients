import { DataSource, Repository } from 'typeorm';
import { MailerConfiguration } from '../../../entities/mailer-configuration/mailer-configuration.entity';
export declare class MailerConfigurationRepository extends Repository<MailerConfiguration> {
    private dataSource;
    constructor(dataSource: DataSource);
    findByTenantAndId(tenantId: string, configId: string): Promise<MailerConfiguration | null>;
    findActiveByTenant(tenantId: string): Promise<MailerConfiguration | null>;
    findByTenant(tenantId: string): Promise<MailerConfiguration[]>;
    findByTenantAndName(tenantId: string, name: string): Promise<MailerConfiguration | null>;
    deactivateAllByTenant(tenantId: string): Promise<number>;
}
