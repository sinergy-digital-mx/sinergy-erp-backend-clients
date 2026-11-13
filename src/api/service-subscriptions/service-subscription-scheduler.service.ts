import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ServiceSubscriptionBillingService } from './service-subscription-billing.service';

@Injectable()
export class ServiceSubscriptionScheduler {
  private readonly logger = new Logger(ServiceSubscriptionScheduler.name);

  constructor(private readonly billing: ServiceSubscriptionBillingService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async billDueMonths(): Promise<void> {
    this.logger.log('Revisando suscripciones de servicio del mes');
    await this.billing.billDuePeriods();
  }
}
