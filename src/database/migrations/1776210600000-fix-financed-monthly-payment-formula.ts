import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFinancedMonthlyPaymentFormula1776210600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE contracts c
      SET monthly_payment = ROUND(
        COALESCE(c.down_payment_target, 0) / c.payment_months,
        2
      )
      WHERE c.down_payment_financed = 1
        AND c.down_payment_target IS NOT NULL
        AND c.down_payment_target > 0
        AND c.payment_months > 0
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Data correction migration; no rollback.
  }
}
