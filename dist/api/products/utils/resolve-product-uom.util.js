"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProductUomForLine = resolveProductUomForLine;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
async function resolveProductUomForLine(qr, productId, providedUomId, tenantId) {
    const byId = await findProductUom(qr, `SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
     FROM product_uoms pu
     WHERE pu.id = ? AND pu.product_id = ?
     LIMIT 1`, [providedUomId, productId]);
    if (byId)
        return normalizeProductUomRow(byId);
    const byCatalog = await findProductUom(qr, `SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
     FROM product_uoms pu
     WHERE pu.product_id = ? AND pu.uom_catalog_id = ?
     LIMIT 1`, [productId, providedUomId]);
    if (byCatalog)
        return normalizeProductUomRow(byCatalog);
    const [catalog] = await qr.manager.query(`SELECT id FROM uom_catalog WHERE id = ? AND tenant_id = ? LIMIT 1`, [providedUomId, tenantId]);
    const [product] = catalog
        ? await qr.manager.query(`SELECT id FROM products WHERE id = ? AND tenant_id = ? LIMIT 1`, [productId, tenantId])
        : [];
    if (!catalog || !product) {
        throw new common_1.BadRequestException(`UOM no encontrado: ${providedUomId}`);
    }
    const [baseRow] = await qr.manager.query(`SELECT id FROM product_uoms WHERE product_id = ? AND is_base = 1 LIMIT 1`, [productId]);
    const id = (0, uuid_1.v4)();
    const isBase = baseRow ? 0 : 1;
    try {
        await qr.manager.query(`INSERT INTO product_uoms
        (id, product_id, uom_catalog_id, factor, is_base, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, NOW(), NOW())`, [id, productId, providedUomId, isBase]);
    }
    catch {
        const raced = await findProductUom(qr, `SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
       FROM product_uoms pu
       WHERE pu.product_id = ? AND pu.uom_catalog_id = ?
       LIMIT 1`, [productId, providedUomId]);
        if (raced)
            return normalizeProductUomRow(raced);
        throw new common_1.BadRequestException(`UOM no encontrado: ${providedUomId}`);
    }
    return {
        id,
        factor: 1,
        is_base: isBase === 1,
        uom_catalog_id: providedUomId,
    };
}
function normalizeProductUomRow(row) {
    const factor = Number(row.factor);
    return {
        id: row.id,
        factor: Number.isFinite(factor) && factor > 0 ? factor : 1,
        is_base: row.is_base === true || row.is_base === 1 || row.is_base === '1',
        uom_catalog_id: row.uom_catalog_id,
    };
}
async function findProductUom(qr, sql, params) {
    const [row] = await qr.manager.query(sql, params);
    return row;
}
//# sourceMappingURL=resolve-product-uom.util.js.map