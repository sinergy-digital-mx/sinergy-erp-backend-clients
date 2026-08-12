/**
 * Importa productos VTI desde Catálago VTI.xlsx (hoja Productos VTI).
 * Sin precios. Crea categorías por Clasificación y UoM base (mapeo por sufijo SKU).
 */
import * as XLSX from 'xlsx';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../../typeorm.options';

const TENANT_ID = 'a9c67ebf-715f-4cec-9af5-ba233e9f8e05';
const FILE_NAME = 'Catálago VTI.xlsx';
const SHEET_NAME = 'Productos VTI';
const BATCH_SIZE = 100;

const UOM_ALIAS: Record<string, string> = {
  KILO: 'Kilo',
  KG: 'Kilo',
  MAZO: 'Mazo',
  MZ: 'Mazo',
  CAJA: 'Caja',
  CANASTA: 'Canasta',
  CANASTAS: 'Canasta',
  SACO: 'Saco',
  PIEZA: 'Pieza',
  PZA: 'Pieza',
};

function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function inferUomName(sku: string): string {
  const m = sku.match(/([A-Za-zÁÉÍÓÚÑáéíóúñ]+)$/);
  if (!m) return 'Pieza';
  const key = m[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return UOM_ALIAS[key] ?? 'Pieza';
}

async function ensureCategories(
  ds: DataSource,
  names: string[],
): Promise<Map<string, string>> {
  const existing: { id: string; name: string }[] = await ds.query(
    'SELECT id, name FROM categories WHERE tenant_id = ?',
    [TENANT_ID],
  );
  const map = new Map<string, string>();
  for (const row of existing) {
    map.set(row.name.trim().toUpperCase(), row.id);
  }

  for (const name of names) {
    const key = name.trim().toUpperCase();
    if (map.has(key)) continue;
    const id = randomUUID();
    await ds.query(
      `INSERT INTO categories (id, tenant_id, name, description, status, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', 0, NOW(), NOW())`,
      [id, TENANT_ID, name.trim(), `Importado VTI: ${name.trim()}`],
    );
    map.set(key, id);
  }
  return map;
}

async function loadUomMap(ds: DataSource): Promise<Map<string, string>> {
  const rows: { id: string; name: string }[] = await ds.query(
    'SELECT id, name FROM uom_catalog WHERE tenant_id = ?',
    [TENANT_ID],
  );
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.name.trim().toUpperCase(), row.id);
  }
  if (!map.has('PIEZA')) {
    throw new Error('UoM Pieza no encontrada en el tenant');
  }
  return map;
}

async function main() {
  const ds = new DataSource({ ...typeOrmOptions, logging: false });
  await ds.initialize();

  const workbook = XLSX.readFile(path.join(process.cwd(), FILE_NAME));
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) throw new Error(`Hoja no encontrada: ${SHEET_NAME}`);

  const raw = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
  });

  const rows = raw
    .slice(2)
    .map((r) => ({
      sku: clean(r[0]),
      sat: clean(r[1]),
      name: clean(r[2]),
      classification: clean(r[3]),
    }))
    .filter((r) => r.sku && r.sku.toUpperCase() !== 'SKU' && r.name);

  const classNames = [
    ...new Set(rows.map((r) => r.classification).filter((x): x is string => !!x)),
  ];
  const categoryMap = await ensureCategories(ds, classNames);
  const uomMap = await loadUomMap(ds);
  const defaultUomId = uomMap.get('PIEZA')!;

  const existingSkus = new Set(
    (
      await ds.query('SELECT sku FROM products WHERE tenant_id = ?', [TENANT_ID])
    ).map((r: { sku: string }) => r.sku.trim().toUpperCase()),
  );

  const products: Record<string, unknown>[] = [];
  const uoms: Record<string, unknown>[] = [];
  let skippedDup = 0;

  for (const row of rows) {
    const sku = row.sku!;
    if (existingSkus.has(sku.toUpperCase())) {
      skippedDup++;
      continue;
    }
    existingSkus.add(sku.toUpperCase());

    const productId = randomUUID();
    const productUomId = randomUUID();
    const uomName = inferUomName(sku);
    const uomCatalogId = uomMap.get(uomName.toUpperCase()) ?? defaultUomId;
    const categoryId = row.classification
      ? categoryMap.get(row.classification.trim().toUpperCase()) ?? null
      : null;
    const sat =
      row.sat && /^\d{1,8}$/.test(row.sat) ? row.sat.padStart(8, '0').slice(0, 8) : null;

    products.push({
      id: productId,
      tenant_id: TENANT_ID,
      sku: sku.slice(0, 255),
      external_sku: null,
      name: row.name!.slice(0, 255),
      description: row.name,
      is_active: 1,
      category_id: categoryId,
      subcategory_id: null,
      sat_clave: sat,
    });

    uoms.push({
      id: productUomId,
      product_id: productId,
      uom_catalog_id: uomCatalogId,
      factor: 1,
      is_base: true,
      parent_uom_id: null,
    });
  }

  console.log(
    `Excel: ${rows.length} | insertar: ${products.length} | dup: ${skippedDup} | categorías: ${classNames.length}`,
  );

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const pBatch = products.slice(i, i + BATCH_SIZE);
    const uBatch = uoms.slice(i, i + BATCH_SIZE);

    await ds
      .createQueryBuilder()
      .insert()
      .into('products')
      .values(pBatch)
      .execute();

    await ds
      .createQueryBuilder()
      .insert()
      .into('product_uoms')
      .values(uBatch)
      .execute();

    console.log(`Batch ${i / BATCH_SIZE + 1}: ${pBatch.length} productos`);
  }

  const [{ n }] = await ds.query(
    'SELECT COUNT(*) AS n FROM products WHERE tenant_id = ?',
    [TENANT_ID],
  );
  console.log(`OK. Total productos tenant: ${n}`);
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
