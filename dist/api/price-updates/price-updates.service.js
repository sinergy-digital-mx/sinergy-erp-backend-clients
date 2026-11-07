"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceUpdatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const unit_amount_util_1 = require("../../common/utils/unit-amount.util");
const fiscal_tax_policy_util_1 = require("../billing/utils/fiscal-tax-policy.util");
const price_update_util_1 = require("./utils/price-update.util");
const UOMS_PER_PRODUCT = 2;
let PriceUpdatesService = class PriceUpdatesService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getSheet(tenantId, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 40;
        const search = query.search?.trim() ?? '';
        const lists = await this.loadLists(tenantId);
        const { rows, total } = await this.loadProducts(tenantId, search, page, limit);
        const data = await this.hydrate(tenantId, rows);
        return { price_lists: lists, data, meta: { page, limit, total } };
    }
    async updateRow(tenantId, productId, dto) {
        const product = await this.findProduct(tenantId, productId);
        const hasAverage = dto.average_cost !== undefined && dto.average_cost !== null;
        const manual = dto.prices ?? [];
        if (!hasAverage && manual.length === 0) {
            throw new common_1.BadRequestException('Indica el costo promedio o al menos un precio.');
        }
        const lists = await this.loadLists(tenantId);
        const iepsEnabled = await (0, fiscal_tax_policy_util_1.loadTenantIepsEnabled)(this.dataSource, tenantId);
        const writes = [];
        if (hasAverage) {
            const uoms = await this.loadUoms([productId]);
            const selected = selectUoms(uoms.get(productId) ?? []);
            const baseFactor = selected[0]?.factor ?? 1;
            for (const list of lists) {
                if (list.margin_percent == null)
                    continue;
                for (const uom of selected) {
                    writes.push({
                        price_list_id: list.id,
                        product_uom_id: uom.id,
                        price: (0, price_update_util_1.priceFromMargin)(dto.average_cost, list.margin_percent, uom.factor, baseFactor),
                    });
                }
            }
        }
        if (manual.length) {
            await this.assertPricesBelong(tenantId, productId, manual, lists);
            for (const price of manual) {
                const index = writes.findIndex((row) => row.price_list_id === price.price_list_id &&
                    row.product_uom_id === price.product_uom_id);
                const next = {
                    price_list_id: price.price_list_id,
                    product_uom_id: price.product_uom_id,
                    price: (0, unit_amount_util_1.roundUnitAmount)(price.price),
                };
                if (index >= 0)
                    writes[index] = next;
                else
                    writes.push(next);
            }
        }
        if (writes.length) {
            await this.upsertPrices(productId, writes, iepsEnabled);
        }
        const [row] = await this.hydrate(tenantId, [product]);
        return row;
    }
    async findProduct(tenantId, productId) {
        const rows = await this.dataSource.query(`SELECT id, sku, external_sku, name
       FROM products
       WHERE id = ? AND tenant_id = ?
       LIMIT 1`, [productId, tenantId]);
        const product = rows[0];
        if (!product) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        return product;
    }
    async assertPricesBelong(tenantId, productId, prices, lists) {
        const listIds = new Set(lists.map((list) => list.id));
        const uomRows = await this.dataSource.query(`SELECT id FROM product_uoms WHERE product_id = ?`, [productId]);
        const uomIds = new Set(uomRows.map((row) => row.id));
        for (const price of prices) {
            if (!listIds.has(price.price_list_id)) {
                const ownsList = await this.dataSource.query(`SELECT id FROM product_price_lists WHERE id = ? AND tenant_id = ? LIMIT 1`, [price.price_list_id, tenantId]);
                if (!ownsList.length) {
                    throw new common_1.BadRequestException('La lista de precio no existe');
                }
            }
            if (!uomIds.has(price.product_uom_id)) {
                throw new common_1.BadRequestException('Esa unidad no pertenece al producto');
            }
        }
    }
    async upsertPrices(productId, writes, iepsEnabled) {
        const iepsFlag = iepsEnabled ? 1 : 0;
        const placeholders = [];
        const params = [];
        for (const row of writes) {
            placeholders.push('(?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?, NOW(), NOW())');
            const subtotal = Number(row.price.toFixed(2));
            params.push(crypto.randomUUID(), productId, row.price_list_id, row.product_uom_id, row.price, subtotal, subtotal);
        }
        params.push(iepsFlag, iepsFlag, iepsFlag);
        await this.dataSource.query(`INSERT INTO product_prices (
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
         updated_at = NOW()`, params);
    }
    async loadLists(tenantId) {
        const rows = (await this.dataSource.query(`SELECT id, name, list_number, margin_percent, is_active
       FROM product_price_lists
       WHERE tenant_id = ? AND is_active = 1`, [tenantId]));
        return rows
            .map((row) => {
            const listNumber = row.list_number == null ? null : Number(row.list_number);
            const margin = row.margin_percent == null ? null : Number(row.margin_percent);
            return {
                id: row.id,
                name: row.name,
                list_number: listNumber,
                margin_percent: margin,
                label: (0, price_update_util_1.priceListLabel)(listNumber, row.name),
            };
        })
            .sort((a, b) => {
            const aNumber = a.list_number == null ? Number.MAX_SAFE_INTEGER : a.list_number;
            const bNumber = b.list_number == null ? Number.MAX_SAFE_INTEGER : b.list_number;
            if (aNumber !== bNumber)
                return aNumber - bNumber;
            return a.name.localeCompare(b.name, 'es');
        });
    }
    async loadProducts(tenantId, search, page, limit) {
        const where = ['tenant_id = ?'];
        const params = [tenantId];
        if (search) {
            const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
            where.push(`(name LIKE ? ESCAPE '\\\\' OR sku LIKE ? ESCAPE '\\\\' OR IFNULL(external_sku, '') LIKE ? ESCAPE '\\\\')`);
            params.push(term, term, term);
        }
        const whereSql = where.join(' AND ');
        const countRows = await this.dataSource.query(`SELECT COUNT(*) AS total FROM products WHERE ${whereSql}`, params);
        const total = Number(countRows[0]?.total ?? 0);
        const rows = (await this.dataSource.query(`SELECT id, sku, external_sku, name
       FROM products
       WHERE ${whereSql}
       ORDER BY name ASC
       LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]));
        return { rows, total };
    }
    async hydrate(tenantId, products) {
        if (!products.length)
            return [];
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
                average_cost: (0, price_update_util_1.meanCost)([cost1, cost2]),
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
    async loadUoms(productIds) {
        const map = new Map();
        if (!productIds.length)
            return map;
        const rows = (await this.dataSource.query(`SELECT pu.id, pu.product_id, pu.factor, pu.is_base, uc.name AS uom_name
       FROM product_uoms pu
       INNER JOIN uom_catalog uc ON uc.id = pu.uom_catalog_id
       WHERE pu.product_id IN (?)
       ORDER BY pu.is_base DESC, pu.factor ASC, uc.name ASC`, [productIds]));
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
    async loadPrices(productIds) {
        const map = new Map();
        if (!productIds.length)
            return map;
        const rows = (await this.dataSource.query(`SELECT product_id, price_list_id, product_uom_id, price
       FROM product_prices
       WHERE product_id IN (?)`, [productIds]));
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
    async loadPurchases(tenantId, productIds) {
        const map = new Map();
        if (!productIds.length)
            return map;
        const rows = (await this.dataSource.query(`SELECT product_id, folio, purchased_at, base_cost, purchase_rank
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
       WHERE purchase_rank <= 2`, [tenantId, productIds]));
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
};
exports.PriceUpdatesService = PriceUpdatesService;
exports.PriceUpdatesService = PriceUpdatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], PriceUpdatesService);
function selectUoms(uoms) {
    return [...uoms]
        .sort((a, b) => {
        if (a.is_base !== b.is_base)
            return a.is_base ? -1 : 1;
        if (a.factor !== b.factor)
            return a.factor - b.factor;
        return a.name.localeCompare(b.name, 'es');
    })
        .slice(0, UOMS_PER_PRODUCT);
}
function asDateText(value) {
    if (value instanceof Date)
        return value.toISOString();
    return String(value);
}
//# sourceMappingURL=price-updates.service.js.map