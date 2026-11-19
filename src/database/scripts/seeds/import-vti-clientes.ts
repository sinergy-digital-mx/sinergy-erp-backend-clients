/**
 * Importa clientes de La Verdulería (hoja Clientes VTI).
 * Los de Central (hoja Clientes CVT) ya estaban cargados.
 * Código cliente → name y website. Lista y forma de pago van en notes:
 * los números 1–10 del Excel no coinciden con las listas del sistema.
 * Crédito solo contra la razón social de La Verdulería, si hay límite.
 */
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../../typeorm.options';

const TENANT_ID = 'a9c67ebf-715f-4cec-9af5-ba233e9f8e05';
const STATUS_ID = 1;
const FISCAL_VERDULERIA = '008ca9b9-cd03-44f8-97fc-2830b8f5ec04';
const FISCAL_CENTRAL = '667fc2a2-9136-4760-8c80-7d7c54d7cba2';
const GENERIC_RFC = 'XAXX010101000';

const VTI_CANDIDATES = [
  process.argv[2],
  'C:/Users/rrrod/Downloads/Catálago VTI (3).xlsx',
  path.join(process.cwd(), 'Catálago VTI.xlsx'),
].filter((value): value is string => Boolean(value));

function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === '(pendiente)') return null;
  return s;
}

function cleanEmail(value: unknown): string | null {
  const s = clean(value);
  if (!s) return null;
  const first = s.split(/[,;]/)[0]?.trim() ?? '';
  if (!first.includes('@')) return null;
  return first.slice(0, 255);
}

function cleanPhone(value: unknown): string | null {
  const s = clean(value);
  if (!s) return null;
  const digits = s.replace(/\D/g, '');
  return digits.length > 0 ? digits.slice(0, 30) : null;
}

function cleanPostal(value: unknown): string | null {
  const s = clean(value);
  if (!s) return null;
  return s.replace(/\D/g, '').slice(0, 20) || null;
}

function inferPersonType(rfc: string | null): 'fisica' | 'moral' | null {
  if (!rfc) return null;
  const len = rfc.replace(/\s/g, '').length;
  if (len === 13) return 'fisica';
  if (len === 12) return 'moral';
  return null;
}

function cell(row: Record<string, unknown>, label: string): unknown {
  const target = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  for (const key of Object.keys(row)) {
    const current = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    if (current === target) return row[key];
  }
  return null;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function buildNotes(parts: Array<[string, string | null]>): string | null {
  const lines = parts.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`);
  return lines.length ? lines.join(' | ') : null;
}

function loadSheet(filePath: string, sheetName: string): Record<string, unknown>[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Hoja no encontrada: ${sheetName} en ${filePath}`);
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
}

async function main() {
  const vtiPath = VTI_CANDIDATES.find((filePath) => fs.existsSync(filePath));
  if (!vtiPath) throw new Error('No se encontró Catálago VTI.xlsx');
  const cvtPath = path.join(process.cwd(), 'Catálago CVT.xlsx');

  const vtiRows = loadSheet(vtiPath, 'Clientes VTI');
  const cvtRows = loadSheet(cvtPath, 'Clientes CVT');
  const cvtCodes = new Set(
    cvtRows
      .map((row) => clean(cell(row, 'Código Cliente'))?.toUpperCase())
      .filter((code): code is string => Boolean(code)),
  );

  const ds = new DataSource({ ...typeOrmOptions, logging: false });
  await ds.initialize();

  const existing: { id: number; website: string | null; fiscal_rfc: string | null }[] = await ds.query(
    'SELECT id, website, fiscal_rfc FROM customers WHERE tenant_id = ?',
    [TENANT_ID],
  );
  const byCode = new Map<string, { id: number; rfc: string | null }[]>();
  for (const row of existing) {
    const code = (row.website ?? '').trim().toUpperCase();
    if (!code) continue;
    const list = byCode.get(code) ?? [];
    list.push({ id: row.id, rfc: (row.fiscal_rfc ?? '').trim().toUpperCase() || null });
    byCode.set(code, list);
  }

  let inserted = 0;
  let skippedSame = 0;
  let insertedOtherCompany = 0;
  let credits = 0;

  await ds.transaction(async (manager) => {
    for (const row of vtiRows) {
      const code = clean(cell(row, 'Código Cliente'));
      const razon = clean(cell(row, 'Razón Social'));
      if (!code && !razon) continue;

      const codeKey = (code ?? '').toUpperCase();
      const rfc = clean(cell(row, 'R.F.C.'))?.toUpperCase().replace(/\s/g, '') ?? null;
      const sameCode = codeKey ? byCode.get(codeKey) ?? [] : [];
      const sameCompany = !rfc || sameCode.some((item) => item.rfc === rfc);
      if (sameCode.length > 0 && sameCompany) {
        skippedSame++;
        continue;
      }

      const isOtherCompany = sameCode.length > 0;
      const name = (code || razon || 'Cliente').slice(0, 255);
      const street = clean(cell(row, 'Calle')) ?? 'SIN CALLE';
      const city = clean(cell(row, 'Ciudad')) ?? 'SIN CIUDAD';
      const state = clean(cell(row, 'Estado')) ?? 'SIN ESTADO';
      const postal = cleanPostal(cell(row, 'Código Postal')) ?? '00000';
      const email = cleanEmail(cell(row, 'Correo electronico'));
      const phone = cleanPhone(cell(row, 'Télefono 1'));
      const lista = clean(cell(row, 'Lista de precios'));
      const forma = clean(cell(row, 'Forma de pago'));
      const days = numberOrNull(cell(row, 'Días de crédito'));
      const amount = numberOrNull(cell(row, 'Límite de crédito'));
      const creditEnabled =
        Boolean(forma && /CREDITO/i.test(forma)) &&
        Number(amount ?? 0) > 0 &&
        rfc !== GENERIC_RFC;

      const result = await manager
        .createQueryBuilder()
        .insert()
        .into('customers')
        .values({
          tenant_id: TENANT_ID,
          status_id: STATUS_ID,
          name,
          company_name: razon ? razon.slice(0, 255) : name,
          website: code ? code.slice(0, 255) : null,
          email,
          phone,
          phone_country: phone ? 'MX' : null,
          phone_code: phone ? '+52' : null,
          country: 'México',
          fiscal_rfc: rfc ? rfc.slice(0, 20) : null,
          fiscal_razon_social: razon ? razon.slice(0, 255) : null,
          fiscal_person_type: inferPersonType(rfc),
          fiscal_address: street !== 'SIN CALLE' ? street.slice(0, 255) : null,
          fiscal_city: city !== 'SIN CIUDAD' ? city.slice(0, 255) : null,
          fiscal_state: state !== 'SIN ESTADO' ? state.slice(0, 255) : null,
          fiscal_postal_code: postal !== '00000' ? postal : null,
          fiscal_country: 'MEX',
          registered_fiscal_configuration_id: FISCAL_VERDULERIA,
          credit_enabled: creditEnabled ? 1 : 0,
          credit_days: days,
          credit_amount: amount,
        })
        .execute();

      const customerId = Number(result.raw?.insertId);
      if (!Number.isFinite(customerId) || customerId <= 0) {
        throw new Error(`No se obtuvo id al insertar ${code ?? razon}`);
      }

      await manager
        .createQueryBuilder()
        .insert()
        .into('customer_addresses')
        .values({
          customer_id: customerId,
          tenant_id: TENANT_ID,
          type: 'primary',
          street_address: street.slice(0, 255),
          city: city.slice(0, 255),
          state: state.slice(0, 255),
          postal_code: postal.slice(0, 20),
          country: 'México',
          is_primary: true,
          has_gps: 0,
          address_source: 'without_location',
          status: 1,
          notes: buildNotes([
            ['Código', code],
            ['Ruta', clean(cell(row, 'Ruta'))],
            ['Empaque', clean(cell(row, 'Empaque'))],
            ['Lista', lista],
            ['Forma de pago', forma],
          ]),
        })
        .execute();

      if (days || amount) {
        await manager.query(
          `INSERT INTO customer_credits
            (id, tenant_id, customer_id, fiscal_configuration_id, credit_enabled, allow_credit_exceed, credit_days, credit_amount, credit_currency, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'MXN', NOW(), NOW())`,
          [
            randomUUID(),
            TENANT_ID,
            customerId,
            FISCAL_VERDULERIA,
            creditEnabled ? 1 : 0,
            days,
            amount,
          ],
        );
        credits++;
      }

      const list = byCode.get(codeKey) ?? [];
      list.push({ id: customerId, rfc });
      if (codeKey) byCode.set(codeKey, list);
      inserted++;
      if (isOtherCompany) insertedOtherCompany++;
    }

    const centralCodes = [...cvtCodes];
    if (centralCodes.length) {
      const placeholders = centralCodes.map(() => '?').join(',');
      await manager.query(
        `UPDATE customers
         SET registered_fiscal_configuration_id = ?
         WHERE tenant_id = ?
           AND registered_fiscal_configuration_id IS NULL
           AND UPPER(website) IN (${placeholders})`,
        [FISCAL_CENTRAL, TENANT_ID, ...centralCodes],
      );
    }
  });

  const [totals] = await ds.query(
    `SELECT
       COUNT(*) AS total,
       SUM(registered_fiscal_configuration_id = ?) AS verduleria,
       SUM(registered_fiscal_configuration_id = ?) AS central
     FROM customers
     WHERE tenant_id = ?`,
    [FISCAL_VERDULERIA, FISCAL_CENTRAL, TENANT_ID],
  );

  console.log(
    `Archivo: ${vtiPath} | insertados: ${inserted} | misma razón social ya existente: ${skippedSame} | otro RFC con el mismo código: ${insertedOtherCompany} | créditos: ${credits}`,
  );
  console.log(
    `Tenant Verdulería: ${totals.total} clientes | razón Verdulería: ${totals.verduleria} | razón Central: ${totals.central}`,
  );
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
