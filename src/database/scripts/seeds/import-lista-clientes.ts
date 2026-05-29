import * as XLSX from 'xlsx';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../../typeorm.options';

const TENANT_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';
const BATCH_SIZE = 500;

function cleanText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/^"+|"+$/g, '')
    .replace(/""/g, '"');
}

function parsePhones(raw: string): { phone: string | null; additionalPhone: string | null } {
  const t1Match = raw.match(/T1:\s*([^]*?)(?:\s*T2:|$)/i);
  const t2Match = raw.match(/T2:\s*(.*)$/i);
  const digits = (s: string | undefined) => {
    const d = (s ?? '').trim().replace(/\D/g, '');
    return d.length > 0 ? d : null;
  };
  return {
    phone: digits(t1Match?.[1]),
    additionalPhone: digits(t2Match?.[1]),
  };
}

function parseEmails(raw: string): { email: string | null; additionalEmail: string | null } {
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    email: parts[0] ?? null,
    additionalEmail: parts[1] ?? null,
  };
}

async function main() {
  const ds = new DataSource(typeOrmOptions);
  await ds.initialize();

  const filePath = path.join(process.cwd(), 'Lista clientes.csv');
  const workbook = XLSX.readFile(filePath, { type: 'file', raw: false });
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]);

  const existingRows: { legacy_customer_id: number }[] = await ds.query(
    'SELECT legacy_customer_id FROM customers WHERE tenant_id = ? AND legacy_customer_id IS NOT NULL',
    [TENANT_ID],
  );
  const existing = new Set(existingRows.map((r) => r.legacy_customer_id));

  const toInsert: Record<string, unknown>[] = [];

  for (const row of rows) {
    const legacyId = Number(row.CODIGO);
    if (!Number.isFinite(legacyId) || existing.has(legacyId)) continue;

    const nombre = cleanText(row.NOMBRE);
    const atencion = cleanText(row.ATENCION);
    const name = (nombre || atencion || `Cliente ${legacyId}`).slice(0, 255);
    const { email, additionalEmail } = parseEmails(cleanText(row['CORREO ELECTRONICO']));
    const { phone, additionalPhone } = parsePhones(cleanText(row.TELEFONO));

    toInsert.push({
      tenant_id: TENANT_ID,
      status_id: 1,
      legacy_customer_id: legacyId,
      name,
      email: email?.slice(0, 255) ?? null,
      phone: phone?.slice(0, 255) ?? null,
      additional_name: atencion ? atencion.slice(0, 255) : null,
      additional_email: additionalEmail?.slice(0, 255) ?? null,
      additional_phone: additionalPhone?.slice(0, 50) ?? null,
    });
  }

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    await ds
      .createQueryBuilder()
      .insert()
      .into('customers')
      .values(toInsert.slice(i, i + BATCH_SIZE))
      .execute();
  }

  console.log(`OK: ${toInsert.length} customers imported`);
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
