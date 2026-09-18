import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  resolveUnitCostMxn,
  roundStockMoney,
} from '../utils/stock-ledger-valuation.util';

type BatchValuationRow = {
  unit_total: number | string | null;
  received_original_unit_total: number | string | null;
  received_original_quantity: number | string | null;
  received_converted_quantity: number | string | null;
  real_unit_cost_mxn: number | string | null;
  payment_currency: string | null;
  customs_exchange_rate: number | string | null;
  list_price: number | string | null;
};

/**
 * Resuelve costo/precio MXN desde lote → línea OC / lista de precios.
 */
@Injectable()
export class InventoryStockLedgerValuationService {
  async resolveFromBatchId(
    tenantId: string,
    batchId: string,
    manager: EntityManager,
  ): Promise<{ unitCostMxn: number | null; unitSalePriceMxn: number | null }> {
    const rows: BatchValuationRow[] = await manager.query(
      `
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
      `,
      [batchId, tenantId],
    );

    const row = rows[0];
    if (!row) {
      return { unitCostMxn: null, unitSalePriceMxn: null };
    }

    return this.mapRow(row);
  }

  mapFromImport(cost: number | null | undefined, price: number | null | undefined): {
    unitCostMxn: number | null;
    unitSalePriceMxn: number | null;
  } {
    const unitCostMxn =
      cost != null && Number.isFinite(cost) && cost > 0
        ? roundStockMoney(cost)
        : null;
    const unitSalePriceMxn =
      price != null && Number.isFinite(price) && price > 0
        ? roundStockMoney(price)
        : null;
    return { unitCostMxn, unitSalePriceMxn };
  }

  private mapRow(row: BatchValuationRow): {
    unitCostMxn: number | null;
    unitSalePriceMxn: number | null;
  } {
    const unitCost =
      row.received_original_unit_total != null
        ? row.received_original_unit_total
        : row.unit_total;

    let uomScale = 1;
    const orig = parseFloat(String(row.received_original_quantity ?? 0));
    const conv = parseFloat(String(row.received_converted_quantity ?? 0));
    if (orig > 0 && conv > 0) {
      uomScale = orig / conv;
    }

    const unitCostMxn = resolveUnitCostMxn({
      real_unit_cost_mxn: row.real_unit_cost_mxn,
      unit_cost: unitCost,
      uom_scale: uomScale,
      payment_currency: row.payment_currency,
      customs_exchange_rate: row.customs_exchange_rate,
    });

    const list = parseFloat(String(row.list_price ?? ''));
    const unitSalePriceMxn = Number.isFinite(list)
      ? roundStockMoney(list)
      : null;

    return { unitCostMxn, unitSalePriceMxn };
  }
}
