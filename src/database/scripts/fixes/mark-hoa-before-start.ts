import 'dotenv/config';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { DataSource } from 'typeorm';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';
const MONTHLY_AMOUNT = 50;

const ds = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  dateStrings: true,
});

type UpdatedRow = {
  Contrato: string;
  Codigo_Lote: string;
  Nombre_Sistema: string;
  Inicio: string;
  Pagada: string;
  No: string;
};

async function main() {
  const apply = process.argv.includes('--apply');
  const wb = XLSX.readFile(path.join(process.cwd(), 'RELACION_HOA_DIVINO_RESULTADO.xlsx'));
  const updated = XLSX.utils.sheet_to_json(wb.Sheets['Actualizados'], {
    defval: '',
  }) as UpdatedRow[];

  await ds.initialize();

  const findings: Array<Record<string, unknown>> = [];
  let totalMark = 0;

  for (const row of updated) {
    const start = String(row.Inicio || '').trim();
    if (!start || !row.Contrato) continue;

    const before = await ds.query(
      `
      SELECT h.id, h.due_date, h.status, h.amount, h.currency
      FROM contract_hoa_payments h
      JOIN contracts c ON c.id = h.contract_id
      WHERE h.tenant_id = ?
        AND c.contract_number = ?
        AND h.status IN ('pendiente', 'parcial')
        AND h.due_date < ?
      ORDER BY h.due_date
      `,
      [TENANT_ID, row.Contrato, start],
    );

    if (!before.length) continue;

    findings.push({
      no: row.No,
      contrato: row.Contrato,
      lote: row.Codigo_Lote,
      owner: row.Nombre_Sistema,
      inicio: start,
      count: before.length,
      min: before[0].due_date,
      max: before[before.length - 1].due_date,
      statuses: before.map((p: any) => `${p.due_date}:${p.status}`).join(', '),
    });

    if (apply) {
      for (const payment of before) {
        await ds.query(
          `
          UPDATE contract_hoa_payments
          SET amount = ?,
              amount_paid = ?,
              amount_pending = 0,
              currency = 'USD',
              status = 'pagado',
              paid_date = COALESCE(paid_date, due_date),
              is_overdue = 0,
              notes = CONCAT(IFNULL(notes, ''), IF(notes IS NULL OR notes = '', '', '\n'),
                'Marcado pagado: anterior a FECHA INICIO ', ?),
              updated_at = NOW()
          WHERE id = ? AND tenant_id = ?
          `,
          [MONTHLY_AMOUNT, MONTHLY_AMOUNT, start, payment.id, TENANT_ID],
        );
        totalMark += 1;
      }
    } else {
      totalMark += before.length;
    }
  }

  console.log(JSON.stringify(findings, null, 2));
  console.log(`\nModo: ${apply ? 'APPLY' : 'DRY-RUN'} | pagos a marcar: ${totalMark} | contratos: ${findings.length}`);
  await ds.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
