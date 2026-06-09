import 'dotenv/config';
import { AppDataSource } from '../../data-source';

async function main() {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('🔄 Recalculando meta y pago mensual para contratos con enganche financiado...\n');

    const hasDownpaymentTable = await queryRunner.hasTable(
      'contract_downpayment_payments',
    );

    if (hasDownpaymentTable) {
      const backfillTarget = await queryRunner.query(`
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
          AND (
            c.down_payment_target IS NULL
            OR c.down_payment_target = 0
          )
          AND (
            COALESCE(c.down_payment, 0) > 0
            OR EXISTS (
              SELECT 1
              FROM contract_downpayment_payments d
              WHERE d.contract_id = c.id
                AND d.status != 'cancelado'
            )
          )
      `);
      console.log(
        `✅ Meta backfill: ${backfillTarget.affectedRows ?? 0} contrato(s)`,
      );
    }

    const monthlyResult = await queryRunner.query(`
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
    console.log(
      `✅ Pago mensual: ${monthlyResult.affectedRows ?? 0} contrato(s) actualizado(s)`,
    );

    const balanceResult = await queryRunner.query(`
      UPDATE contracts c
      SET remaining_balance = GREATEST(
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
      )
      WHERE c.down_payment_financed = 1
        AND c.status != 'completado'
    `);
    console.log(
      `✅ Saldo pendiente: ${balanceResult.affectedRows ?? 0} contrato(s) activo(s)`,
    );

    const completedResult = await queryRunner.query(`
      UPDATE contracts
      SET remaining_balance = 0
      WHERE down_payment_financed = 1
        AND status = 'completado'
        AND remaining_balance != 0
    `);
    console.log(
      `✅ Completados a saldo 0: ${completedResult.affectedRows ?? 0} contrato(s)`,
    );

    const sample: Array<{
      contract_number: string;
      total_price: string;
      down_payment_target: string;
      down_payment: string;
      payment_months: number;
      monthly_payment: string;
      remaining_balance: string;
      status: string;
    }> = await queryRunner.query(`
      SELECT
        contract_number,
        total_price,
        down_payment_target,
        down_payment,
        payment_months,
        monthly_payment,
        remaining_balance,
        status
      FROM contracts
      WHERE down_payment_financed = 1
      ORDER BY contract_number
      LIMIT 15
    `);

    console.log('\n📋 Muestra (máx 15 contratos financiados):');
    for (const row of sample) {
      const target = Number(row.down_payment_target || 0);
      const months = Number(row.payment_months || 0);
      const expected =
        target > 0 && months > 0
          ? Math.round((target / months) * 100) / 100
          : 0;
      console.log(
        `  ${row.contract_number} | meta $${target.toFixed(2)} | mensual $${Number(row.monthly_payment).toFixed(2)} (esp. $${expected.toFixed(2)}) | saldo $${Number(row.remaining_balance).toFixed(2)} | ${row.status}`,
      );
    }

    const missingTarget = await queryRunner.query(`
      SELECT COUNT(*) AS cnt
      FROM contracts
      WHERE down_payment_financed = 1
        AND (down_payment_target IS NULL OR down_payment_target = 0)
    `);
    console.log(
      `\n⚠️  Sin meta definida: ${missingTarget[0]?.cnt ?? 0} contrato(s) (requieren configuración manual o generar cuotas de enganche)`,
    );

    await queryRunner.commitTransaction();
    console.log('\n🎉 Actualización masiva completada.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
