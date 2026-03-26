import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ResendConfiguration } from '../../../entities/mailer-configuration/resend-configuration.entity';

/**
 * MailerConfigurationRepository
 * Custom repository for ResendConfiguration entity with tenant-scoped queries
 */
@Injectable()
export class MailerConfigurationRepository extends Repository<ResendConfiguration> {
  constructor(private dataSource: DataSource) {
    super(ResendConfiguration, dataSource.createEntityManager());
  }

  async findByTenantAndId(tenantId: string, configId: string): Promise<ResendConfiguration | null> {
    return this.findOne({
      where: {
        id: configId,
        tenant_id: tenantId,
      },
    });
  }

  async findActiveByTenant(tenantId: string): Promise<ResendConfiguration | null> {
    return this.findOne({
      where: {
        tenant_id: tenantId,
        is_active: true,
      },
    });
  }

  async findByTenant(tenantId: string): Promise<ResendConfiguration[]> {
    return this.find({
      where: {
        tenant_id: tenantId,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findByTenantAndName(tenantId: string, name: string): Promise<ResendConfiguration | null> {
    return this.findOne({
      where: {
        tenant_id: tenantId,
        name,
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
