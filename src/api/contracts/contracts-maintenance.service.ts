import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class ContractsMaintenanceService {
  private readonly logger = new Logger(ContractsMaintenanceService.name);

  constructor(private dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateOverdueAndBalance() {
    this.logger.log('Starting daily maintenance: updating overdue payments and balances');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Step 1: Mark payments as overdue if payment_date < today and status != 'pagado'
      const overdueResult = await queryRunner.query(
        `UPDATE contract_payments p
         SET is_overdue = 1
         WHERE p.payment_date < CURDATE()
           AND p.status != 'pagado'
           AND p.is_overdue = 0`
      );

      this.logger.log(`✅ Marked ${overdueResult.affectedRows} payments as overdue`);

      // Step 2: Recalculate remaining_balance for all active contracts
      // Formula: (total_price - down_payment) - SUM(amount_paid from all payments)
      const balanceResult = await queryRunner.query(
        `UPDATE contracts c
         SET remaining_balance = GREATEST(
           0,
           (c.total_price - c.down_payment) - COALESCE((
             SELECT SUM(p.amount_paid)
             FROM contract_payments p
             WHERE p.contract_id = c.id
           ), 0)
         )
         WHERE c.status = 'activo'`
      );

      this.logger.log(`✅ Updated remaining_balance for ${balanceResult.affectedRows} contracts`);

      // Step 3: Log summary
      const summary = await queryRunner.query(
        `SELECT 
           COUNT(DISTINCT c.id) as total_active_contracts,
           (SELECT COUNT(*) FROM contract_payments WHERE is_overdue = 1) as total_overdue_payments,
           (SELECT SUM(remaining_balance) FROM contracts WHERE status = 'activo') as total_remaining_balance
         FROM contracts c
         WHERE c.status = 'activo'`
      );

      this.logger.log(`📊 Summary: ${JSON.stringify(summary[0])}`);

    } catch (error) {
      this.logger.error('❌ Error during maintenance:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
