import 'dotenv/config';
import { AppDataSource } from '../../data-source';

async function main() {
  await AppDataSource.initialize();

  const contracts = await AppDataSource.query(
    `
    SELECT id, contract_number, currency, total_price, status
    FROM contracts
    WHERE contract_number IN ('CONT-5-6', 'CONT-5-06')
       OR contract_number LIKE 'CONT-5-6%'
    ORDER BY contract_number
    `,
  );

  console.log('\n=== Contratos encontrados ===');
  console.log(JSON.stringify(contracts, null, 2));

  for (const contract of contracts) {
    let hoaRows: Array<Record<string, unknown>> = [];
    try {
      hoaRows = await AppDataSource.query(
        `
        SELECT payment_number, amount, due_date, status
        FROM contract_hoa_payments
        WHERE contract_id = ?
        ORDER BY CAST(payment_number AS UNSIGNED)
        `,
        [contract.id],
      );
    } catch (error: any) {
      console.log(`\nHOA table error for ${contract.contract_number}:`, error.message);
      continue;
    }

    try {
      const byCurrency = await AppDataSource.query(
        `
        SELECT COALESCE(currency, '(sin columna)') AS currency, COUNT(*) AS cnt
        FROM contract_hoa_payments
        WHERE contract_id = ?
        GROUP BY currency
        `,
        [contract.id],
      );
      console.log('Por moneda:', JSON.stringify(byCurrency, null, 2));
    } catch {
      console.log('Columna currency aun no existe en contract_hoa_payments (correr migracion)');
    }

    console.log(`\n=== HOA ${contract.contract_number} (${hoaRows.length} pagos) ===`);
    if (hoaRows.length > 0) {
      console.log('Primer pago:', hoaRows[0]);
      console.log('Ultimo pago:', hoaRows[hoaRows.length - 1]);
    }
  }

  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
