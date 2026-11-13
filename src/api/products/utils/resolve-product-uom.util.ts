import { BadRequestException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export type ResolvedProductUom = {
  id: string;
  factor: number;
  is_base: boolean;
  uom_catalog_id: string;
};

type ProductUomRow = {
  id: string;
  factor: number | string;
  is_base: boolean | number | string;
  uom_catalog_id: string;
};

export async function resolveProductUomForLine(
  qr: QueryRunner,
  productId: string,
  providedUomId: string,
  tenantId: string,
): Promise<ResolvedProductUom> {
  const byId = await findProductUom(
    qr,
    `SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
     FROM product_uoms pu
     WHERE pu.id = ? AND pu.product_id = ?
     LIMIT 1`,
    [providedUomId, productId],
  );
  if (byId) return normalizeProductUomRow(byId);

  const byCatalog = await findProductUom(
    qr,
    `SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
     FROM product_uoms pu
     WHERE pu.product_id = ? AND pu.uom_catalog_id = ?
     LIMIT 1`,
    [productId, providedUomId],
  );
  if (byCatalog) return normalizeProductUomRow(byCatalog);

  const [catalog] = await qr.manager.query(
    `SELECT id FROM uom_catalog WHERE id = ? AND tenant_id = ? LIMIT 1`,
    [providedUomId, tenantId],
  );
  const [product] = catalog
    ? await qr.manager.query(
        `SELECT id FROM products WHERE id = ? AND tenant_id = ? LIMIT 1`,
        [productId, tenantId],
      )
    : [];
  if (!catalog || !product) {
    throw new BadRequestException(`UOM no encontrado: ${providedUomId}`);
  }

  const [baseRow] = await qr.manager.query(
    `SELECT id FROM product_uoms WHERE product_id = ? AND is_base = 1 LIMIT 1`,
    [productId],
  );
  const id = uuidv4();
  const isBase = baseRow ? 0 : 1;

  try {
    await qr.manager.query(
      `INSERT INTO product_uoms
        (id, product_id, uom_catalog_id, factor, is_base, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, NOW(), NOW())`,
      [id, productId, providedUomId, isBase],
    );
  } catch {
    const raced = await findProductUom(
      qr,
      `SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
       FROM product_uoms pu
       WHERE pu.product_id = ? AND pu.uom_catalog_id = ?
       LIMIT 1`,
      [productId, providedUomId],
    );
    if (raced) return normalizeProductUomRow(raced);
    throw new BadRequestException(`UOM no encontrado: ${providedUomId}`);
  }

  return {
    id,
    factor: 1,
    is_base: isBase === 1,
    uom_catalog_id: providedUomId,
  };
}

function normalizeProductUomRow(row: ProductUomRow): ResolvedProductUom {
  const factor = Number(row.factor);
  return {
    id: row.id,
    factor: Number.isFinite(factor) && factor > 0 ? factor : 1,
    is_base: row.is_base === true || row.is_base === 1 || row.is_base === '1',
    uom_catalog_id: row.uom_catalog_id,
  };
}

async function findProductUom(
  qr: QueryRunner,
  sql: string,
  params: unknown[],
): Promise<ProductUomRow | undefined> {
  const [row] = await qr.manager.query(sql, params);
  return row;
}
