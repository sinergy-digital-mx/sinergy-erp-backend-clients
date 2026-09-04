"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryStockLedgerValuationService = void 0;
const common_1 = require("@nestjs/common");
const stock_ledger_valuation_util_1 = require("../utils/stock-ledger-valuation.util");
let InventoryStockLedgerValuationService = class InventoryStockLedgerValuationService {
    async resolveFromBatchId(tenantId, batchId, manager) {
        const rows = await manager.query(`
      SELECT
        pod.unit_total AS unit_total,
        pod.received_original_unit_total AS received_original_unit_total,
        pod.received_original_quantity AS received_original_quantity,
        pod.received_converted_quantity AS received_converted_quantity,
        pod.real_unit_cost_mxn AS real_unit_cost_mxn,
        pob.payment_currency AS payment_currency,
        pob.customs_exchange_rate AS customs_exchange_rate,
        (
          SELECT pp.price
          FROM product_prices pp
          INNER JOIN product_price_lists plist ON plist.id = pp.price_list_id
          INNER JOIN product_uoms pu ON pu.id = pp.product_uom_id
          WHERE pp.product_id = b.product_id
            AND pu.uom_catalog_id = b.uom_id
            AND plist.tenant_id = b.tenant_id
            AND plist.is_active = 1
          ORDER BY plist.created_at ASC, pp.created_at ASC
          LIMIT 1
        ) AS list_price
      FROM inv_s_batches b
      LEFT JOIN inv_s_purchase_order_batch_detail pod
        ON pod.id = b.purchase_order_detail_id
      LEFT JOIN inv_s_purchase_order_batch pob
        ON pob.id = b.purchase_order_batch_id
      WHERE b.id = ?
        AND b.tenant_id = ?
      LIMIT 1
      `, [batchId, tenantId]);
        const row = rows[0];
        if (!row) {
            return { unitCostMxn: null, unitSalePriceMxn: null };
        }
        return this.mapRow(row);
    }
    mapFromImport(cost, price) {
        const unitCostMxn = cost != null && Number.isFinite(cost) && cost > 0
            ? (0, stock_ledger_valuation_util_1.roundStockMoney)(cost)
            : null;
        const unitSalePriceMxn = price != null && Number.isFinite(price) && price > 0
            ? (0, stock_ledger_valuation_util_1.roundStockMoney)(price)
            : null;
        return { unitCostMxn, unitSalePriceMxn };
    }
    mapRow(row) {
        const unitCost = row.received_original_unit_total != null
            ? row.received_original_unit_total
            : row.unit_total;
        let uomScale = 1;
        const orig = parseFloat(String(row.received_original_quantity ?? 0));
        const conv = parseFloat(String(row.received_converted_quantity ?? 0));
        if (orig > 0 && conv > 0) {
            uomScale = orig / conv;
        }
        const unitCostMxn = (0, stock_ledger_valuation_util_1.resolveUnitCostMxn)({
            real_unit_cost_mxn: row.real_unit_cost_mxn,
            unit_cost: unitCost,
            uom_scale: uomScale,
            payment_currency: row.payment_currency,
            customs_exchange_rate: row.customs_exchange_rate,
        });
        const list = parseFloat(String(row.list_price ?? ''));
        const unitSalePriceMxn = Number.isFinite(list)
            ? (0, stock_ledger_valuation_util_1.roundStockMoney)(list)
            : null;
        return { unitCostMxn, unitSalePriceMxn };
    }
};
exports.InventoryStockLedgerValuationService = InventoryStockLedgerValuationService;
exports.InventoryStockLedgerValuationService = InventoryStockLedgerValuationService = __decorate([
    (0, common_1.Injectable)()
], InventoryStockLedgerValuationService);
//# sourceMappingURL=inventory-stock-ledger-valuation.service.js.map