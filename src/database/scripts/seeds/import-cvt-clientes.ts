/**
 * Importa clientes CVT desde Catálago CVT.xlsx (hoja Clientes CVT).
 * Omite: Lista de precios, Forma de pago (pendiente mapeo global).
 * Código cliente → website (campo libre searchable hasta tener customer_code).
 * Ruta / Empaque → notes de la dirección.
 */
import * as XLSX from 'xlsx';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../../typeorm.options';

const TENANT_ID = 'a9c67ebf-715f-4cec-9af5-ba233e9f8e05';
const STATUS_ID = 1;
const BATCH_SIZE = 100;
const FILE_NAME = 'Catálago CVT.xlsx';
const SHEET_NAME = 'Clientes CVT';

function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s || s.toLowerCase() === 'null' || s === '(Pendiente)') return null;
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

function buildNotes(code: string | null, ruta: string | null, empaque: string | null): string | null {
  const parts: string[] = [];
  if (code) parts.push(`Código: ${code}`);
  if (ruta) parts.push(`Ruta: ${ruta}`);
  if (empaque) parts.push(`Empaque: ${empaque}`);
  return parts.length ? parts.join(' | ') : null;
}

async function main() {
  const ds = new DataSource({ ...typeOrmOptions, logging: false });
  await ds.initialize();

  const filePath = path.join(process.cwd(), FILE_NAME);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    throw new Error(`Hoja no encontrada: ${SHEET_NAME}`);
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  const existing: { website: string | null; fiscal_rfc: string | null; name: string }[] =
    await ds.query(
      'SELECT website, fiscal_rfc, name FROM customers WHERE tenant_id = ?',
      [TENANT_ID],
    );
  const existingCodes = new Set(
    existing.map((r) => (r.website ?? '').trim().toUpperCase()).filter(Boolean),
  );
  const existingRfcs = new Set(
    existing.map((r) => (r.fiscal_rfc ?? '').trim().toUpperCase()).filter(Boolean),
  );

  type CustomerRow = Record<string, unknown>;
  type AddressRow = Record<string, unknown>;

  const customersToInsert: CustomerRow[] = [];
  const addressPayloads: {
    code: string;
    street: string;
    city: string;
    state: string;
    postal: string;
    notes: string | null;
  }[] = [];

  let skipped = 0;
  let skippedDup = 0;

  for (const row of rows) {
    const code = clean(row['Código Cliente']);
    const razon = clean(row['Razón Social']);
    if (!code && !razon) {
      skipped++;
      continue;
    }

    const codeKey = (code ?? '').toUpperCase();
    if (codeKey && existingCodes.has(codeKey)) {
      skippedDup++;
      continue;
    }

    const rfc = clean(row['R.F.C.'])?.toUpperCase().replace(/\s/g, '') ?? null;
    if (rfc && existingRfcs.has(rfc) && !codeKey) {
      skippedDup++;
      continue;
    }

    // Nombre visible = Código Cliente; razón social queda en fiscal_razon_social / company_name
    const name = (code || razon || 'Cliente').slice(0, 255);
    const street = clean(row['Calle']) ?? 'SIN CALLE';
    const city = clean(row['Ciudad']) ?? 'SIN CIUDAD';
    const state = clean(row['Estado']) ?? 'SIN ESTADO';
    const postal = cleanPostal(row['Código Postal']) ?? '00000';
    const email = cleanEmail(row['Correo electronico']);
    const phone = cleanPhone(row['Télefono 1']);
    const ruta = clean(row['Ruta']);
    const empaque = clean(row['Empaque']);
    const personType = inferPersonType(rfc);

    if (codeKey) existingCodes.add(codeKey);
    if (rfc) existingRfcs.add(rfc);

    customersToInsert.push({
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
      fiscal_person_type: personType,
      fiscal_address: street !== 'SIN CALLE' ? street.slice(0, 255) : null,
      fiscal_city: city !== 'SIN CIUDAD' ? city.slice(0, 255) : null,
      fiscal_state: state !== 'SIN ESTADO' ? state.slice(0, 255) : null,
      fiscal_postal_code: postal !== '00000' ? postal : null,
    });

    addressPayloads.push({
      code: code ?? name,
      street: street.slice(0, 255),
      city: city.slice(0, 255),
      state: state.slice(0, 255),
      postal: postal.slice(0, 20),
      notes: buildNotes(code, ruta, empaque),
    });
  }

  console.log(
    `Filas Excel: ${rows.length} | a insertar: ${customersToInsert.length} | skip vacíos: ${skipped} | skip dup: ${skippedDup}`,
  );

  for (let i = 0; i < customersToInsert.length; i += BATCH_SIZE) {
    const batch = customersToInsert.slice(i, i + BATCH_SIZE);
    const addrBatch = addressPayloads.slice(i, i + BATCH_SIZE);

    const result = await ds
      .createQueryBuilder()
      .insert()
      .into('customers')
      .values(batch)
      .execute();

    const raw = result.raw as { insertId?: number };
    const firstId = Number(raw?.insertId);
    if (!Number.isFinite(firstId) || firstId <= 0) {
      throw new Error(`No se obtuvo insertId en batch offset ${i}`);
    }

    const addresses: AddressRow[] = addrBatch.map((a, idx) => ({
      customer_id: firstId + idx,
      tenant_id: TENANT_ID,
      type: 'primary',
      street_address: a.street,
      city: a.city,
      state: a.state,
      postal_code: a.postal,
      country: 'México',
      is_primary: 1,
      has_gps: 0,
      address_source: 'without_location',
      status: 1,
      notes: a.notes,
    }));

    await ds
      .createQueryBuilder()
      .insert()
      .into('customer_addresses')
      .values(addresses)
      .execute();

    console.log(`Batch ${i / BATCH_SIZE + 1}: ${batch.length} clientes + direcciones`);
  }

  const [{ n }] = await ds.query(
    'SELECT COUNT(*) AS n FROM customers WHERE tenant_id = ?',
    [TENANT_ID],
  );
  console.log(`OK. Total clientes tenant: ${n}`);
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
