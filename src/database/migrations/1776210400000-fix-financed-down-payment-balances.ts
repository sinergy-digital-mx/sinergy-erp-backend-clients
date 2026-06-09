import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFinancedDownPaymentBalances1776210400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasDownpaymentTable = await queryRunner.hasTable(
      'contract_downpayment_payments',
    );

    if (hasDownpaymentTable) {
      await queryRunner.query(`
        UPDATE contracts c
        SET down_payment_target = GREATEST(
          COALESCE(c.down_payment, 0),
          COALESCE((
            SELECT SUM(d.amount)
            FROM contract_downpayment_payments d
            WHERE d.contract_id = c.id
              AND d.status != 'cancelado'
          ), 0)
        )
        WHERE c.down_payment_financed = 1
          AND (c.down_payment_target IS NULL OR c.down_payment_target = 0)
      `);
    } else {
      await queryRunner.query(`
        UPDATE contracts
        SET down_payment_target = down_payment
        WHERE down_payment_financed = 1
          AND down_payment > 0
          AND (down_payment_target IS NULL OR down_payment_target = 0)
      `);
    }

    await queryRunner.query(`
      UPDATE contracts
      SET remaining_balance = 0
      WHERE status = 'completado'
    `);

    await queryRunner.query(`
      UPDATE contracts c
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
          WHEN c.payment_months > 0 THEN ROUND(
            (
              c.total_price - CASE
                WHEN c.down_payment_financed = 1 THEN COALESCE(c.down_payment_target, 0)
                ELSE c.down_payment
              END
            ) / c.payment_months,
            2
          )
          ELSE monthly_payment
        END
      WHERE c.status = 'activo'
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Data correction migration; no rollback.
  }
}
