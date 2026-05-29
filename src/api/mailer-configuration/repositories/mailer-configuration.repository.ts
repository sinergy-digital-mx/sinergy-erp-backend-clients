import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, Repository } from 'typeorm';
import { MailerConfiguration } from '../../../entities/mailer-configuration/mailer-configuration.entity';

/**
 * MailerConfigurationRepository
 * Custom repository for mailer configurations with tenant-scoped queries.
 */
@Injectable()
export class MailerConfigurationRepository extends Repository<MailerConfiguration> {
  constructor(private dataSource: DataSource) {
    super(MailerConfiguration, dataSource.createEntityManager());
  }

  async findByTenantAndId(tenantId: string, configId: string): Promise<MailerConfiguration | null> {
    return this.findOne({
      where: {
        id: configId,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });
  }

  async findActiveByTenant(tenantId: string): Promise<MailerConfiguration | null> {
    return this.findOne({
      where: {
        tenant_id: tenantId,
        is_active: true,
        deleted_at: IsNull(),
      },
    });
  }

  async findByTenant(tenantId: string): Promise<MailerConfiguration[]> {
    return this.find({
      where: {
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findByTenantAndName(tenantId: string, name: string): Promise<MailerConfiguration | null> {
    return this.findOne({
      where: {
        tenant_id: tenantId,
        name,
        deleted_at: IsNull(),
      },
    });
  }

  async deactivateAllByTenant(tenantId: string): Promise<number> {
    const result = await this.update(
      {
        tenant_id: tenantId,
        is_active: true,
      },
      {
        is_active: false,
      },
    );
    return result.affected || 0;
  }
}
