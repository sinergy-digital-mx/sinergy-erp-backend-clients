import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { SalesOrderCreationSettings } from '../../../entities/sales-orders/sales-order-creation-settings.entity';
import {
  normalizeSalesOrderCreationFields,
  SalesOrderCreationFields,
} from '../utils/sales-order-creation-settings.util';

const MISSING_TABLE_MESSAGE =
  'Falta aplicar la actualización de base de datos de la configuración de órdenes de venta.';

@Injectable()
export class SalesOrderCreationSettingsService {
  constructor(
    @InjectRepository(SalesOrderCreationSettings)
    private readonly repo: Repository<SalesOrderCreationSettings>,
  ) {}

  async get(tenantId: string): Promise<{ fields: SalesOrderCreationFields }> {
    try {
      const row = await this.repo.findOne({ where: { tenant_id: tenantId } });
      return { fields: normalizeSalesOrderCreationFields(row?.fields) };
    } catch (error) {
      if (this.isMissingTable(error)) {
        return { fields: normalizeSalesOrderCreationFields(undefined) };
      }
      throw error;
    }
  }

  async update(
    tenantId: string,
    userId: string,
    rawFields: unknown,
  ): Promise<{ fields: SalesOrderCreationFields }> {
    const fields = normalizeSalesOrderCreationFields(rawFields);
    try {
      const existing = await this.repo.findOne({ where: { tenant_id: tenantId } });
      if (existing) {
        existing.fields = fields;
        existing.updated_by = userId;
        await this.repo.save(existing);
      } else {
        await this.repo.save(
          this.repo.create({
            tenant_id: tenantId,
            fields,
            updated_by: userId,
          }),
        );
      }
      return { fields };
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
    return driver?.code === 'ER_NO_SUCH_TABLE' || String(driver?.message || error.message).includes("doesn't exist");
  }
}
