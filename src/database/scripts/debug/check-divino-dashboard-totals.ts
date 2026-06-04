import 'dotenv/config';
import { AppDataSource } from '../../data-source';

const TENANT = '54481b63-5516-458d-9bb3-d4e5cb028864';

async function main() {
  await AppDataSource.initialize();

  const byYear = await AppDataSource.query(
    `
    SELECT YEAR(c.contract_date) AS y, COUNT(*) AS cnt, SUM(c.total_price) AS total
    FROM contracts c
    WHERE c.tenant_id = ?
      AND c.status IN ('activo', 'completado')
    GROUP BY YEAR(c.contract_date)
    ORDER BY y
    `,
    [TENANT],
  );
  console.log('By contract_date year:', byYear);

  const y2026 = await AppDataSource.query(
    `
    SELECT COUNT(*) AS cnt, SUM(total_price) AS total
    FROM contracts
    WHERE tenant_id = ?
      AND status IN ('activo', 'completado')
      AND contract_date >= '2026-01-01'
      AND contract_date <= '2026-12-31'
    `,
    [TENANT],
  );
  console.log('2026 (dashboard):', y2026[0]);

  const all = await AppDataSource.query(
    `
    SELECT COUNT(*) AS cnt, SUM(total_price) AS total
    FROM contracts
    WHERE tenant_id = ?
      AND status IN ('activo', 'completado')
    `,
    [TENANT],
  );
  console.log('All (contracts module TOTAL):', all[0]);

  const otherYears = await AppDataSource.query(
    `
    SELECT COUNT(*) AS cnt, SUM(total_price) AS total
    FROM contracts
    WHERE tenant_id = ?
      AND status IN ('activo', 'completado')
      AND (contract_date < '2026-01-01' OR contract_date > '2026-12-31')
    `,
    [TENANT],
  );
  console.log('Outside 2026:', otherYears[0]);

  const byFirstPayment2026 = await AppDataSource.query(
    `
    SELECT COUNT(*) AS cnt, SUM(total_price) AS total
    FROM contracts
    WHERE tenant_id = ?
      AND status IN ('activo', 'completado')
      AND YEAR(first_payment_date) = 2026
    `,
    [TENANT],
  );
  console.log('If filtered by first_payment_date 2026:', byFirstPayment2026[0]);

  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
