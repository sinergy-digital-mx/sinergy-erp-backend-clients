import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { roundUnitAmount } from '../../common/utils/unit-amount.util';
import { loadTenantIepsEnabled } from '../billing/utils/fiscal-tax-policy.util';
import { UpdatePriceUpdateRowDto, PriceUpdatePriceDto } from './dto/update-price-update-row.dto';
import { QueryPriceUpdateDto } from './dto/query-price-update.dto';
import { meanCost, priceFromMargin, priceListLabel } from './utils/price-update.util';

const UOMS_PER_PRODUCT = 2;

export interface PriceUpdateListView {
  id: string;
  name: string;
  list_number: number | null;
  margin_percent: number | null;
  label: string;
}

export interface PriceUpdateUomView {
  id: string;
  name: string;
  factor: number;
  is_base: boolean;
}

export interface PriceUpdatePriceView {
  price_list_id: string;
  product_uom_id: string;
  price: number;
}

export interface PriceUpdateRowView {
  id: string;
  sku: string;
  code: string;
  name: string;
  uoms: PriceUpdateUomView[];
  cost_1: number | null;
  cost_2: number | null;
  average_cost: number | null;
  purchase_1: { folio: string; purchased_at: string } | null;
  purchase_2: { folio: string; purchased_at: string } | null;
  prices: PriceUpdatePriceView[];
}

export interface PriceUpdateSheet {
  price_lists: PriceUpdateListView[];
  data: PriceUpdateRowView[];
  meta: { page: number; limit: number; total: number };
}

type ProductRow = {
  id: string;
  sku: string;
  external_sku: string | null;
  name: string;
};

type PurchaseRow = {
  product_id: string;
  folio: string;
  purchased_at: Date | string;
  base_cost: string | number;
  purchase_rank: string | number;
};

type PriceWrite = {
  price_list_id: string;
  product_uom_id: string;
  price: number;
};

@Injectable()
export class PriceUpdatesService {
  constructor(private readonly dataSource: DataSource) {}

  async getSheet(tenantId: string, query: QueryPriceUpdateDto): Promise<PriceUpdateSheet> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 40;
    const search = query.search?.trim() ?? '';

    const lists = await this.loadLists(tenantId);
    const { rows, total } = await this.loadProducts(tenantId, search, page, limit);
    const data = await this.hydrate(tenantId, rows);

    return { price_lists: lists, data, meta: { page, limit, total } };
  }

  async updateRow(
    tenantId: string,
    productId: string,
    dto: UpdatePriceUpdateRowDto,
  ): Promise<PriceUpdateRowView> {
    const product = await this.findProduct(tenantId, productId);
    const hasAverage = dto.average_cost !== undefined && dto.average_cost !== null;
    const manual = dto.prices ?? [];
    if (!hasAverage && manual.length === 0) {
      throw new BadRequestException('Indica el costo promedio o al menos un precio.');
    }

    const lists = await this.loadLists(tenantId);
    const iepsEnabled = await loadTenantIepsEnabled(this.dataSource, tenantId);
    const writes: PriceWrite[] = [];

    if (hasAverage) {
      const uoms = await this.loadUoms([productId]);
      const selected = selectUoms(uoms.get(productId) ?? []);
      const baseFactor = selected[0]?.factor ?? 1;
      for (const list of lists) {
        if (list.margin_percent == null) continue;
        for (const uom of selected) {
          writes.push({
            price_list_id: list.id,
            product_uom_id: uom.id,
            price: priceFromMargin(
              dto.average_cost as number,
              list.margin_percent,
              uom.factor,
              baseFactor,
            ),
          });
        }
      }
    }

    if (manual.length) {
      await this.assertPricesBelong(tenantId, productId, manual, lists);
      for (const price of manual) {
        const index = writes.findIndex(
          (row) =>
            row.price_list_id === price.price_list_id &&
            row.product_uom_id === price.product_uom_id,
        );
        const next = {
          price_list_id: price.price_list_id,
          product_uom_id: price.product_uom_id,
          price: roundUnitAmount(price.price),
        };
        if (index >= 0) writes[index] = next;
        else writes.push(next);
      }
    }

    if (writes.length) {
      await this.upsertPrices(productId, writes, iepsEnabled);
    }

    const [row] = await this.hydrate(tenantId, [product]);
    return row;
  }

  private async findProduct(tenantId: string, productId: string): Promise<ProductRow> {
    const rows: ProductRow[] = await this.dataSource.query(
      `SELECT id, sku, external_sku, name
       FROM products
       WHERE id = ? AND tenant_id = ?
       LIMIT 1`,
      [productId, tenantId],
    );
    const product = rows[0];
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  private async assertPricesBelong(
    tenantId: string,
    productId: string,
    prices: PriceUpdatePriceDto[],
    lists: PriceUpdateListView[],
  ): Promise<void> {
    const listIds = new Set(lists.map((list) => list.id));
    const uomRows: Array<{ id: string }> = await this.dataSource.query(
      `SELECT id FROM product_uoms WHERE product_id = ?`,
      [productId],
    );
    const uomIds = new Set(uomRows.map((row) => row.id));

    for (const price of prices) {
      if (!listIds.has(price.price_list_id)) {
        const ownsList: Array<{ id: string }> = await this.dataSource.query(
          `SELECT id FROM product_price_lists WHERE id = ? AND tenant_id = ? LIMIT 1`,
          [price.price_list_id, tenantId],
        );
        if (!ownsList.length) {
          throw new BadRequestException('La lista de precio no existe');
        }
      }
      if (!uomIds.has(price.product_uom_id)) {
        throw new BadRequestException('Esa unidad no pertenece al producto');
      }
    }
  }

  private async upsertPrices(
    productId: string,
    writes: PriceWrite[],
    iepsEnabled: boolean,
  ): Promise<void> {
    const iepsFlag = iepsEnabled ? 1 : 0;
    const placeholders: string[] = [];
    const params: Array<string | number> = [];
    for (const row of writes) {
      placeholders.push('(?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?, NOW(), NOW())');
      const subtotal = Number(row.price.toFixed(2));
      params.push(
        crypto.randomUUID(),
        productId,
        row.price_list_id,
        row.product_uom_id,
        row.price,
        subtotal,
        subtotal,
      );
    }
    params.push(iepsFlag, iepsFlag, iepsFlag);

    await this.dataSource.query(
      `INSERT INTO product_prices (
         id, product_id, price_list_id, product_uom_id, price,
         iva_percentage, ieps_percentage, iva_unit_total, ieps_unit_total,
         subtotal, total, created_at, updated_at
       ) VALUES ${placeholders.join(', ')}
       ON DUPLICATE KEY UPDATE
         price = VALUES(price),
         ieps_percentage = IF(? = 0, 0, ieps_percentage),
         iva_unit_total = ROUND(VALUES(price) * iva_percentage / 100, 2),
         ieps_unit_total = ROUND(VALUES(price) * IF(? = 0, 0, ieps_percentage) / 100, 2),
         subtotal = ROUND(VALUES(price), 2),
         total = ROUND(
           VALUES(price)
           + (VALUES(price) * iva_percentage / 100)
           + (VALUES(price) * IF(? = 0, 0, ieps_percentage) / 100)
         , 2),
         updated_at = NOW()`,
      params,
    );
  }

  private async loadLists(tenantId: string): Promise<PriceUpdateListView[]> {
    const rows = (await this.dataSource.query(
      `SELECT id, name, list_number, margin_percent, is_active
       FROM product_price_lists
       WHERE tenant_id = ? AND is_active = 1`,
      [tenantId],
    )) as Array<{
      id: string;
      name: string;
      list_number: number | string | null;
      margin_percent: number | string | null;
      is_active: number | boolean;
    }>;

    return rows
      .map((row) => {
        const listNumber = row.list_number == null ? null : Number(row.list_number);
        const margin = row.margin_percent == null ? null : Number(row.margin_percent);
        return {
          id: row.id,
          name: row.name,
          list_number: listNumber,
          margin_percent: margin,
          label: priceListLabel(listNumber, row.name),
        };
      })
      .sort((a, b) => {
        const aNumber = a.list_number == null ? Number.MAX_SAFE_INTEGER : a.list_number;
        const bNumber = b.list_number == null ? Number.MAX_SAFE_INTEGER : b.list_number;
        if (aNumber !== bNumber) return aNumber - bNumber;
        return a.name.localeCompare(b.name, 'es');
      });
  }

  private async loadProducts(
    tenantId: string,
    search: string,
    page: number,
    limit: number,
  ): Promise<{ rows: ProductRow[]; total: number }> {
    const where = ['tenant_id = ?'];
    const params: Array<string | number> = [tenantId];
    if (search) {
      const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      where.push(
        `(name LIKE ? ESCAPE '\\\\' OR sku LIKE ? ESCAPE '\\\\' OR IFNULL(external_sku, '') LIKE ? ESCAPE '\\\\')`,
      );
      params.push(term, term, term);
    }
    const whereSql = where.join(' AND ');

    const countRows: Array<{ total: number | string }> = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM products WHERE ${whereSql}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const rows = (await this.dataSource.query(
      `SELECT id, sku, external_sku, name
       FROM products
       WHERE ${whereSql}
       ORDER BY name ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit],
    )) as ProductRow[];

    return { rows, total };
  }

  private async hydrate(tenantId: string, products: ProductRow[]): Promise<PriceUpdateRowView[]> {
    if (!products.length) return [];
    const ids = products.map((product) => product.id);
    const [uoms, prices, purchases] = await Promise.all([
      this.loadUoms(ids),
      this.loadPrices(ids),
      this.loadPurchases(tenantId, ids),
    ]);

    return products.map((product) => {
      const selected = selectUoms(uoms.get(product.id) ?? []);
      const purchase = purchases.get(product.id) ?? [];
      const first = purchase[0] ?? null;
      const second = purchase[1] ?? null;
      const cost1 = first ? Number(first.base_cost) : null;
      const cost2 = second ? Number(second.base_cost) : null;
      const saved = prices.get(product.id) ?? [];

      return {
        id: product.id,
        sku: product.sku,
        code: product.external_sku?.trim() || product.sku,
        name: product.name,
        uoms: selected,
        cost_1: cost1,
        cost_2: cost2,
        average_cost: meanCost([cost1, cost2]),
        purchase_1: first
          ? { folio: first.folio, purchased_at: asDateText(first.purchased_at) }
          : null,
        purchase_2: second
          ? { folio: second.folio, purchased_at: asDateText(second.purchased_at) }
          : null,
        prices: saved,
      };
    });
  }

  private async loadUoms(productIds: string[]): Promise<Map<string, PriceUpdateUomView[]>> {
    const map = new Map<string, PriceUpdateUomView[]>();
    if (!productIds.length) return map;
    const rows = (await this.dataSource.query(
      `SELECT pu.id, pu.product_id, pu.factor, pu.is_base, uc.name AS uom_name
       FROM product_uoms pu
       INNER JOIN uom_catalog uc ON uc.id = pu.uom_catalog_id
       WHERE pu.product_id IN (?)
       ORDER BY pu.is_base DESC, pu.factor ASC, uc.name ASC`,
      [productIds],
    )) as Array<{
      id: string;
      product_id: string;
      factor: number | string;
      is_base: boolean | number;
      uom_name: string;
    }>;

    for (const row of rows) {
      const list = map.get(row.product_id) ?? [];
      list.push({
        id: row.id,
        name: row.uom_name,
        factor: Number(row.factor) || 1,
        is_base: row.is_base === true || row.is_base === 1,
      });
      map.set(row.product_id, list);
    }
    return map;
  }

  private async loadPrices(productIds: string[]): Promise<Map<string, PriceUpdatePriceView[]>> {
    const map = new Map<string, PriceUpdatePriceView[]>();
    if (!productIds.length) return map;
    const rows = (await this.dataSource.query(
      `SELECT product_id, price_list_id, product_uom_id, price
       FROM product_prices
       WHERE product_id IN (?)`,
      [productIds],
    )) as Array<{
      product_id: string;
      price_list_id: string;
      product_uom_id: string;
      price: number | string;
    }>;

    for (const row of rows) {
      const list = map.get(row.product_id) ?? [];
      list.push({
        price_list_id: row.price_list_id,
        product_uom_id: row.product_uom_id,
        price: Number(row.price),
      });
      map.set(row.product_id, list);
    }
    return map;
  }

  private async loadPurchases(
    tenantId: string,
    productIds: string[],
  ): Promise<Map<string, PurchaseRow[]>> {
    const map = new Map<string, PurchaseRow[]>();
    if (!productIds.length) return map;
    const rows = (await this.dataSource.query(
      `SELECT product_id, folio, purchased_at, base_cost, purchase_rank
       FROM (
         SELECT
           product_id,
           folio,
           purchased_at,
           base_cost,
           ROW_NUMBER() OVER (
             PARTITION BY product_id
             ORDER BY purchased_at DESC, purchase_id DESC
           ) AS purchase_rank
         FROM (
           SELECT
             d.product_id,
             b.id AS purchase_id,
             b.folio,
             COALESCE(b.updated_at, b.created_at) AS purchased_at,
             ROUND(
               CASE
                 WHEN d.received_original_unit_total IS NOT NULL
                   AND ru.factor IS NOT NULL AND ru.factor > 0
                   THEN d.received_original_unit_total / ru.factor
                 WHEN pu.factor IS NOT NULL AND pu.factor > 0
                   THEN COALESCE(d.received_original_unit_total, d.unit_total) / pu.factor
                 ELSE NULL
               END
             , 4) AS base_cost,
             ROW_NUMBER() OVER (
               PARTITION BY d.product_id, b.id
               ORDER BY d.updated_at DESC, d.id DESC
             ) AS line_rank
           FROM inv_s_purchase_order_batch_detail d
           INNER JOIN inv_s_purchase_order_batch b ON b.id = d.purchase_order_batch_id
           INNER JOIN product_uoms pu ON pu.id = d.product_uom_id
           LEFT JOIN product_uoms ru
             ON ru.product_id = d.product_id
            AND ru.uom_catalog_id = d.received_original_uom_id
           WHERE b.tenant_id = ?
             AND b.general_status = 'Recibida'
             AND d.product_id IN (?)
         ) purchase_lines
         WHERE line_rank = 1 AND base_cost IS NOT NULL
       ) purchases
       WHERE purchase_rank <= 2`,
      [tenantId, productIds],
    )) as PurchaseRow[];

    for (const row of rows) {
      const list = map.get(row.product_id) ?? [];
      list.push(row);
      map.set(row.product_id, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => Number(a.purchase_rank) - Number(b.purchase_rank));
    }
    return map;
  }
}

function selectUoms(uoms: PriceUpdateUomView[]): PriceUpdateUomView[] {
  return [...uoms]
    .sort((a, b) => {
      if (a.is_base !== b.is_base) return a.is_base ? -1 : 1;
      if (a.factor !== b.factor) return a.factor - b.factor;
      return a.name.localeCompare(b.name, 'es');
    })
    .slice(0, UOMS_PER_PRODUCT);
}

function asDateText(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
