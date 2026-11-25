import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CustomerListSettings as CustomerListSettingsRow } from '../../../entities/customers/customer-list-settings.entity';
import {
  CustomerListSettings,
  normalizeCustomerListSettings,
} from '../utils/customer-list-settings.util';

const MISSING_TABLE_MESSAGE =
  'Falta aplicar la actualización de base de datos del listado de clientes.';

@Injectable()
export class CustomerListSettingsService {
  constructor(
    @InjectRepository(CustomerListSettingsRow)
    private readonly repo: Repository<CustomerListSettingsRow>,
  ) {}

  async get(tenantId: string): Promise<CustomerListSettings> {
    try {
      const row = await this.repo.findOne({ where: { tenant_id: tenantId } });
      return normalizeCustomerListSettings(row ?? undefined);
    } catch (error) {
      if (this.isMissingTable(error)) {
        return normalizeCustomerListSettings(undefined);
      }
      throw error;
    }
  }

  async update(
    tenantId: string,
    userId: string,
    raw: unknown,
  ): Promise<CustomerListSettings> {
    const settings = normalizeCustomerListSettings(raw);
    try {
      const existing = await this.repo.findOne({ where: { tenant_id: tenantId } });
      if (existing) {
        existing.prefilter = settings.prefilter;
        existing.updated_by = userId;
        await this.repo.save(existing);
      } else {
        await this.repo.save(
          this.repo.create({
            tenant_id: tenantId,
            prefilter: settings.prefilter,
            updated_by: userId,
          }),
        );
      }
      return settings;
    } catch (error) {
      if (this.isMissingTable(error)) {
        throw new BadRequestException(MISSING_TABLE_MESSAGE);
      }
      throw error;
    }
  }

  private isMissingTable(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driver = error.driverError as { code?: string; message?: string } | undefined;
    return (
      driver?.code === 'ER_NO_SUCH_TABLE' ||
      String(driver?.message || error.message).includes("doesn't exist")
    );
  }
}
