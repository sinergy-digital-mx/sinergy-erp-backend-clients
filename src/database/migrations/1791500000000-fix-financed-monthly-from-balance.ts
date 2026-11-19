import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Las mensualidades cubren el saldo después del enganche:
 * (precio − meta) / meses. La fórmula anterior usaba la meta / meses.
 */
export class FixFinancedMonthlyFromBalance1791500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE contracts c
      SET monthly_payment = CASE
        WHEN COALESCE(c.down_payment_target, 0) <= 0 THEN 0
        ELSE ROUND(
          GREATEST(0, c.total_price - COALESCE(c.down_payment_target, 0)) / c.payment_months,
          2
        )
      END
      WHERE c.down_payment_financed = 1
        AND c.payment_months > 0
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Corrección de datos; no hay rollback.
  }
}
