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

      // Step 1.1: Mark HOA payments as overdue (if table exists)
      const hasHoaPaymentsTable = await queryRunner.hasTable('contract_hoa_payments');
      if (hasHoaPaymentsTable) {
        const hoaOverdueResult = await queryRunner.query(
          `UPDATE contract_hoa_payments p
           SET is_overdue = 1
           WHERE p.due_date < CURDATE()
             AND p.status IN ('pendiente', 'parcial')
             AND p.is_overdue = 0`,
        );
        this.logger.log(
          `✅ Marked ${hoaOverdueResult.affectedRows || 0} HOA payments as overdue`,
        );
      }

      // Step 1.2: Mark downpayment payments as overdue (if table exists)
      const hasDownpaymentPaymentsTable = await queryRunner.hasTable(
        'contract_downpayment_payments',
      );
      if (hasDownpaymentPaymentsTable) {
        const downpaymentOverdueResult = await queryRunner.query(
          `UPDATE contract_downpayment_payments p
           SET is_overdue = 1
           WHERE p.due_date < CURDATE()
             AND p.status IN ('pendiente', 'parcial')
             AND p.is_overdue = 0`,
        );
        this.logger.log(
          `✅ Marked ${downpaymentOverdueResult.affectedRows || 0} downpayment payments as overdue`,
        );
      }

      // Step 2: Recalculate remaining_balance and monthly_payment for active contracts
      const balanceResult = await queryRunner.query(
        `UPDATE contracts c
         SET
           remaining_balance = GREATEST(
             0,
             c.total_price - c.down_payment - COALESCE((
               SELECT SUM(
                 CASE
                   WHEN p.status = 'pagado' THEN p.amount
                   WHEN p.status = 'parcial' THEN p.amount_paid
                   ELSE 0
                 END
               )
               FROM contract_payments p
               WHERE p.contract_id = c.id
             ), 0)
           ),
           monthly_payment = CASE
             WHEN c.down_payment_financed = 1 AND c.payment_months > 0 THEN ROUND(
               COALESCE(c.down_payment_target, 0) / c.payment_months,
               2
             )
             WHEN c.payment_months > 0 THEN ROUND(
               (c.total_price - c.down_payment) / c.payment_months,
               2
             )
             ELSE c.monthly_payment
           END
         WHERE c.status = 'activo'`,
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
