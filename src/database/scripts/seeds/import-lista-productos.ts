import * as XLSX from 'xlsx';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../../typeorm.options';

const TENANT_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';
const UOM_CATALOG_ID = '39656255-872d-48b3-856d-27f2c8c47b28';
const PRICE_LIST_NAME = 'Lista General';

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function cleanOrNull(value: unknown): string | null {
  const s = clean(value);
  return !s || s === '0' ? null : s;
}

function parseMoney(value: unknown): number {
  const n = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

function calcTotals(amount: number) {
  return {
    subtotal: amount,
    iva_percentage: 0,
    ieps_percentage: 0,
    iva_unit_total: 0,
    ieps_unit_total: 0,
    total: amount,
  };
}

async function ensurePriceList(ds: DataSource): Promise<string> {
  const rows: { id: string }[] = await ds.query(
    'SELECT id FROM product_price_lists WHERE tenant_id = ? AND name = ? LIMIT 1',
    [TENANT_ID, PRICE_LIST_NAME],
  );
  if (rows[0]?.id) return rows[0].id;

  const id = randomUUID();
  await ds.query(
    `INSERT INTO product_price_lists (id, tenant_id, name, description, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
    [id, TENANT_ID, PRICE_LIST_NAME, 'Lista de precios importada'],
  );
  return id;
}

async function ensureDefaultVendor(ds: DataSource): Promise<string> {
  const rows: { id: string }[] = await ds.query(
    'SELECT id FROM vendors WHERE tenant_id = ? ORDER BY created_at ASC LIMIT 1',
    [TENANT_ID],
  );
  if (rows[0]?.id) return rows[0].id;

  const id = randomUUID();
  await ds.query(
    `INSERT INTO vendors (
      id, tenant_id, vendor_type, vendor_code, name, company_name, street, city, state, zip_code,
      country, razon_social, rfc, persona_type, status, created_at, updated_at
    ) VALUES (?, ?, 'NATIONAL', 'GEN', ?, ?, '', '', '', '', 'México', ?, '', 'Persona Moral', 'active', NOW(), NOW())`,
    [id, TENANT_ID, 'PROVEEDOR GENERICO', 'PROVEEDOR GENERICO', 'PROVEEDOR GENERICO'],
  );
  return id;
}

async function main() {
  const ds = new DataSource(typeOrmOptions);
  await ds.initialize();

  const uomCheck: { id: string }[] = await ds.query(
    'SELECT id FROM uom_catalog WHERE id = ? AND tenant_id = ?',
    [UOM_CATALOG_ID, TENANT_ID],
  );
  if (!uomCheck[0]) {
    throw new Error(`UoM Pieza (${UOM_CATALOG_ID}) no encontrada en el tenant`);
  }

  const priceListId = await ensurePriceList(ds);
  const vendorId = await ensureDefaultVendor(ds);

  const filePath = path.join(process.cwd(), 'Lista de productos.csv');
  const workbook = XLSX.readFile(filePath);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]);

  const existingRows: { sku: string }[] = await ds.query(
    'SELECT sku FROM products WHERE tenant_id = ?',
    [TENANT_ID],
  );
  const existingSkus = new Set(existingRows.map((r) => r.sku));

  const usedExternalSkus = new Set(
    (
      await ds.query(
        'SELECT external_sku FROM products WHERE tenant_id = ? AND external_sku IS NOT NULL',
        [TENANT_ID],
      )
    ).map((r: { external_sku: string }) => r.external_sku),
  );

  let imported = 0;

  for (const row of rows) {
    const sku = clean(row.CODIGO);
    const description = clean(row.DESCRIPCION);
    if (!sku || !description || existingSkus.has(sku)) continue;

    const alterno = cleanOrNull(row.ALTERNO);
    let externalSku: string | null =
      alterno && alterno !== sku ? alterno.slice(0, 255) : null;
    if (externalSku && usedExternalSkus.has(externalSku)) externalSku = null;
    const price = parseMoney(row.PRECIO1);
    const cost = parseMoney(row['COSTO PROM']);
    const name = description.slice(0, 255);

    const productId = randomUUID();
    const productUomId = randomUUID();
    const priceId = randomUUID();
    const costId = randomUUID();

    const priceTotals = calcTotals(price);
    const costTotals = calcTotals(cost);

    await ds.query(
      `INSERT INTO products (id, tenant_id, sku, external_sku, name, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [productId, TENANT_ID, sku, externalSku, name, description],
    );

    await ds.query(
      `INSERT INTO product_uoms (id, product_id, uom_catalog_id, factor, is_base, parent_uom_id, created_at, updated_at)
       VALUES (?, ?, ?, 1, 1, NULL, NOW(), NOW())`,
      [productUomId, productId, UOM_CATALOG_ID],
    );

    await ds.query(
      `INSERT INTO product_prices (
        id, product_id, price_list_id, product_uom_id, price,
        iva_percentage, ieps_percentage, iva_unit_total, ieps_unit_total, subtotal, total,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        priceId,
        productId,
        priceListId,
        productUomId,
        price,
        priceTotals.iva_percentage,
        priceTotals.ieps_percentage,
        priceTotals.iva_unit_total,
        priceTotals.ieps_unit_total,
        priceTotals.subtotal,
        priceTotals.total,
      ],
    );

    await ds.query(
      `INSERT INTO product_vendor_costs (
        id, product_id, vendor_id, product_uom_id, cost,
        iva_percentage, ieps_percentage, iva_unit_total, ieps_unit_total, subtotal, total,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        costId,
        productId,
        vendorId,
        productUomId,
        cost,
        costTotals.iva_percentage,
        costTotals.ieps_percentage,
        costTotals.iva_unit_total,
        costTotals.ieps_unit_total,
        costTotals.subtotal,
        costTotals.total,
      ],
    );

    existingSkus.add(sku);
    if (externalSku) usedExternalSkus.add(externalSku);
    imported++;
  }

  console.log(`OK: ${imported} products imported`);
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
