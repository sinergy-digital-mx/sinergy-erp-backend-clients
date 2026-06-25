/**
 * Importa claves SAT y categorías (FAMILIA) desde MZN_ART_MAESTRO_CATSAT.xlsx
 *
 * - ARTICULO_ID → products.sku (trim)
 * - CLAVE_SAT   → products.sat_clave
 * - FAMILIA     → categories.name (reemplaza categorías actuales del tenant)
 *
 * Uso:
 *   npm run seed:import-mzn-catsat
 *   npm run seed:import-mzn-catsat -- <tenant_id>
 */
import * as path from 'path';
import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

const DEFAULT_TENANT_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';
const EXCEL_FILE = 'MZN_ART_MAESTRO_CATSAT.xlsx';

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeSatClave(value: unknown): string | null {
  const digits = clean(value).replace(/\D/g, '');
  if (!digits) return null;
  return digits.slice(0, 8).padStart(8, '0');
}

interface ExcelRow {
  sku: string;
  satClave: string | null;
  familia: string;
}

async function main() {
  const tenantId = process.argv[2]?.trim() || process.env.PRODUCT_IMPORT_TENANT_ID || DEFAULT_TENANT_ID;
  const filePath = path.join(process.cwd(), EXCEL_FILE);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);

  const excelBySku = new Map<string, ExcelRow>();
  const familiaNames = new Set<string>();

  for (const row of rawRows) {
    const sku = clean(row.ARTICULO_ID);
    if (!sku) continue;

    const familia = clean(row.FAMILIA) || 'Sin categoría';
    const satClave = normalizeSatClave(row.CLAVE_SAT);

    excelBySku.set(sku, { sku, satClave, familia });
    familiaNames.add(familia);
  }

  const ds = new DataSource(typeOrmOptions);
  await ds.initialize();

  try {
    await ds.query('START TRANSACTION');

    await ds.query(
      `UPDATE products SET category_id = NULL, subcategory_id = NULL WHERE tenant_id = ?`,
      [tenantId],
    );
    await ds.query(`DELETE FROM subcategories WHERE tenant_id = ?`, [tenantId]);
    await ds.query(`DELETE FROM categories WHERE tenant_id = ?`, [tenantId]);

    const familiaToCategoryId = new Map<string, string>();
    const sortedFamilias = Array.from(familiaNames).sort((a, b) => a.localeCompare(b, 'es'));

    for (let i = 0; i < sortedFamilias.length; i++) {
      const name = sortedFamilias[i];
      const id = randomUUID();
      await ds.query(
        `INSERT INTO categories (id, tenant_id, name, description, status, display_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
        [id, tenantId, name.slice(0, 255), `Importada desde ${EXCEL_FILE}`, i],
      );
      familiaToCategoryId.set(name, id);
    }

    const products: { id: string; sku: string }[] = await ds.query(
      `SELECT id, sku FROM products WHERE tenant_id = ?`,
      [tenantId],
    );

    let updatedSat = 0;
    let updatedCategory = 0;
    let matched = 0;
    let unmatchedProducts = 0;
    let unmatchedExcel = 0;

    const productSkuSet = new Set<string>();

    for (const product of products) {
      productSkuSet.add(product.sku);
      const excelRow = excelBySku.get(product.sku);
      if (!excelRow) {
        unmatchedProducts++;
        continue;
      }

      matched++;
      const categoryId = familiaToCategoryId.get(excelRow.familia) ?? null;

      await ds.query(
        `UPDATE products
         SET sat_clave = ?, category_id = ?, subcategory_id = NULL, updated_at = NOW()
         WHERE id = ? AND tenant_id = ?`,
        [excelRow.satClave, categoryId, product.id, tenantId],
      );

      if (excelRow.satClave) updatedSat++;
      if (categoryId) updatedCategory++;
    }

    for (const sku of excelBySku.keys()) {
      if (!productSkuSet.has(sku)) unmatchedExcel++;
    }

    await ds.query('COMMIT');

    console.log('Import MZN_ART_MAESTRO_CATSAT completado');
    console.log(`  Tenant:              ${tenantId}`);
    console.log(`  Filas Excel:         ${rawRows.length}`);
    console.log(`  SKUs en Excel:       ${excelBySku.size}`);
    console.log(`  Categorías creadas:  ${sortedFamilias.length}`);
    console.log(`  Productos en BD:     ${products.length}`);
    console.log(`  Productos actualiz.: ${matched}`);
    console.log(`  Con sat_clave:       ${updatedSat}`);
    console.log(`  Con categoría:       ${updatedCategory}`);
    console.log(`  Productos sin fila:  ${unmatchedProducts}`);
    console.log(`  SKUs Excel sin BD:   ${unmatchedExcel}`);
  } catch (error) {
    await ds.query('ROLLBACK');
    throw error;
  } finally {
    await ds.destroy();
  }
}

main().catch((error) => {
  console.error('Error en import MZN_ART_MAESTRO_CATSAT:', error);
  process.exit(1);
});
