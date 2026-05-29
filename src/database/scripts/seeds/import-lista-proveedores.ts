import * as XLSX from 'xlsx';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../../typeorm.options';
import { VendorType } from '../../../entities/vendor/vendor-type.enum';

const TENANT_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';
const BATCH_SIZE = 100;

function clean(value: unknown): string | null {
  const s = String(value ?? '').trim();
  if (!s || s === '0') return null;
  return s;
}

function isNationalCountry(country: string | null): boolean {
  if (!country) return true;
  const n = country
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  return n === 'MEXICO' || n === 'MX';
}

function inferPersonaType(rfc: string | null): string | null {
  if (!rfc) return null;
  const len = rfc.replace(/\s/g, '').length;
  if (len === 13) return 'Persona Física';
  if (len === 12) return 'Persona Moral';
  return 'Persona Moral';
}

function buildStreet(
  calle: string | null,
  noExterior: string | null,
  noInterior: string | null,
  colonia: string | null,
): string | null {
  const parts: string[] = [];
  if (calle) parts.push(calle);
  if (noExterior) parts.push(`#${noExterior}`);
  if (noInterior) parts.push(`Int. ${noInterior}`);
  if (colonia) parts.push(colonia);
  return parts.length > 0 ? parts.join(', ').slice(0, 255) : null;
}

function valOrEmpty(value: string | null): string {
  return value ?? '';
}

async function main() {
  const ds = new DataSource(typeOrmOptions);
  await ds.initialize();

  const filePath = path.join(process.cwd(), 'LISTADO_PROVEEDORES_MZN.xlsx');
  const workbook = XLSX.readFile(filePath);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]);

  const existingRows: { vendor_code: string }[] = await ds.query(
    'SELECT vendor_code FROM vendors WHERE tenant_id = ? AND vendor_code IS NOT NULL',
    [TENANT_ID],
  );
  const existing = new Set(existingRows.map((r) => r.vendor_code));

  const toInsert: Record<string, unknown>[] = [];

  for (const row of rows) {
    const vendorCode = clean(row.CLAVE_ID);
    const name = clean(row.NOMBRE);
    if (!vendorCode || vendorCode === '0' || !name) continue;
    if (existing.has(vendorCode)) continue;

    const countryRaw = clean(row.PAIS);
    const national = isNationalCountry(countryRaw);
    const rfc = national ? clean(row.RFC)?.toUpperCase() ?? null : null;
    const streetValue = buildStreet(
      clean(row.CALLE),
      clean(row.NOEXTERIOR),
      clean(row.NOINTERIOR),
      clean(row.COLONIA),
    );

    const base = {
      tenant_id: TENANT_ID,
      vendor_code: vendorCode,
      name: name.slice(0, 255),
      company_name: name.slice(0, 255),
      street: valOrEmpty(streetValue),
      city: valOrEmpty(clean(row.CIUDAD)?.slice(0, 255) ?? null),
      state: valOrEmpty(clean(row.ESTADO)?.slice(0, 255) ?? null),
      zip_code: valOrEmpty(clean(row['CODIGO Postal'])?.slice(0, 255) ?? null),
      status: 'active',
    };

    if (national) {
      toInsert.push({
        ...base,
        vendor_type: VendorType.NATIONAL,
        country: 'México',
        rfc: valOrEmpty(rfc),
        razon_social: name.slice(0, 255),
        persona_type: inferPersonaType(rfc) ?? 'Persona Moral',
        tax_id: null,
        legal_name: null,
      });
    } else {
      toInsert.push({
        ...base,
        vendor_type: VendorType.INTERNATIONAL,
        country: valOrEmpty(countryRaw?.slice(0, 255) ?? null),
        rfc: valOrEmpty(clean(row.RFC)?.toUpperCase() ?? null),
        razon_social: name.slice(0, 255),
        persona_type: 'Persona Moral',
        tax_id: valOrEmpty(clean(row.RFC)?.toUpperCase() ?? null) || null,
        legal_name: name.slice(0, 255),
        bank_currency: 'USD',
      });
    }
  }

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    await ds
      .createQueryBuilder()
      .insert()
      .into('vendors')
      .values(toInsert.slice(i, i + BATCH_SIZE))
      .execute();
  }

  console.log(`OK: ${toInsert.length} vendors imported`);
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
