import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class QuotationExpirationService {
  private readonly logger = new Logger(QuotationExpirationService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyExpiration() {
    const cancelled = await this.cancelExpiredQuotations();
    this.logger.log(`Cotizaciones vencidas canceladas: ${cancelled}`);
  }

  async cancelExpiredQuotations(): Promise<number> {
    const result = await this.dataSource.query(
      `UPDATE inv_s_quotations q
       INNER JOIN fiscal_configurations f ON f.id = q.fiscal_configuration_id
       SET q.general_status = 'Cancelada',
           q.updated_at = NOW()
       WHERE q.general_status = 'Creada'
         AND f.quotation_expiration_days IS NOT NULL
         AND f.quotation_expiration_days > 0
         AND DATE_ADD(DATE(q.created_at), INTERVAL f.quotation_expiration_days DAY) <= CURDATE()`,
    );
    return Number(result?.affectedRows ?? 0);
  }
}
