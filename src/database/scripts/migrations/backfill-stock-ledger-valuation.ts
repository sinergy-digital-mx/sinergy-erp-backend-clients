/**
 * Rellena unit_cost_mxn / unit_sale_price_mxn / cost_balance_after_mxn
 * en filas existentes del kardex (sin regenerar movimientos).
 *
 * Uso:
 *   npm run backfill:stock-ledger-valuation
 *   npm run backfill:stock-ledger-valuation -- --tenant=<uuid>
 */
import 'dotenv/config';
import { AppDataSource } from '../../data-source';
import { resolveUnitCostMxn } from '../../../api/inventory/utils/stock-ledger-valuation.util';

function roundMoney(value: number): number {
  return parseFloat(value.toFixed(4));
}

function roundQty(value: number): number {
  return parseFloat(value.toFixed(3));
}

async function main() {
  const tenantArg = process.argv.find((a) => a.startsWith('--tenant='));
  const tenantFilter = tenantArg ? tenantArg.split('=')[1] : null;

  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();

  try {
    if (!(await qr.hasColumn('inv_s_stock_ledger', 'unit_cost_mxn'))) {
      throw new Error(
        'Falta la columna unit_cost_mxn. Corre migraciones primero.',
      );
    }

    const tenants: Array<{ id: string }> = tenantFilter
      ? [{ id: tenantFilter }]
      : await qr.query(
          `SELECT DISTINCT tenant_id AS id FROM inv_s_stock_ledger`,
        );

    for (const tenant of tenants) {
      const tenantId = tenant.id;
      console.log(`→ Tenant ${tenantId}: valuando kardex…`);

      const batchCosts: Array<Record<string, unknown>> = await qr.query(
        `
        SELECT
          b.id AS batch_id,
          pod.unit_total,
          pod.received_original_unit_total,
          pod.received_original_quantity,
          pod.received_converted_quantity,
          pod.real_unit_cost_mxn,
          pob.payment_currency,
          pob.customs_exchange_rate,
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
        WHERE b.tenant_id = ?
        `,
        [tenantId],
      );

      const costByBatch = new Map<
        string,
        { unitCostMxn: number | null; unitSalePriceMxn: number | null }
      >();
      for (const row of batchCosts) {
        const unitCost =
          row.received_original_unit_total != null
            ? row.received_original_unit_total
            : row.unit_total;
        let uomScale = 1;
        const orig = parseFloat(String(row.received_original_quantity ?? 0));
        const conv = parseFloat(String(row.received_converted_quantity ?? 0));
        if (orig > 0 && conv > 0) uomScale = orig / conv;

        const unitCostMxn = resolveUnitCostMxn({
          real_unit_cost_mxn: row.real_unit_cost_mxn as any,
          unit_cost: unitCost as any,
          uom_scale: uomScale,
          payment_currency: row.payment_currency as any,
          customs_exchange_rate: row.customs_exchange_rate as any,
        });
        const list = parseFloat(String(row.list_price ?? ''));
        costByBatch.set(String(row.batch_id), {
          unitCostMxn,
          unitSalePriceMxn: Number.isFinite(list) ? roundMoney(list) : null,
        });
      }

      const salePrices: Array<Record<string, unknown>> = await qr.query(
        `
        SELECT
          alloc.id AS alloc_id,
          GREATEST(
            0,
            COALESCE(sod.unit_price, 0) - COALESCE(sod.discount_unit, 0)
          ) AS sale_unit
        FROM inv_s_sales_order_batch_allocations alloc
        INNER JOIN inv_s_sales_order_details sod
          ON sod.id = alloc.sales_order_detail_id
        INNER JOIN inv_s_sales_orders so ON so.id = sod.sales_order_id
        WHERE so.tenant_id = ?
        `,
        [tenantId],
      );
      const saleByAlloc = new Map<string, number>();
      for (const row of salePrices) {
        const n = parseFloat(String(row.sale_unit ?? 0));
        if (Number.isFinite(n)) {
          saleByAlloc.set(String(row.alloc_id), roundMoney(n));
        }
      }

      const rows: Array<Record<string, unknown>> = await qr.query(
        `
        SELECT
          id,
          product_id,
          warehouse_id,
          uom_id,
          inventory_batch_id,
          movement_type,
          quantity_delta,
          balance_after,
          reference_type,
          reference_id,
          occurred_at,
          created_at
        FROM inv_s_stock_ledger
        WHERE tenant_id = ?
        ORDER BY product_id, warehouse_id, uom_id, occurred_at ASC, created_at ASC, id ASC
        `,
        [tenantId],
      );

      const costBalances = new Map<string, number>();
      let updated = 0;

      for (const row of rows) {
        const key = `${row.product_id}|${row.warehouse_id}|${row.uom_id}`;
        const prevCost = costBalances.get(key) ?? 0;
        const prevQty = roundQty(
          parseFloat(String(row.balance_after ?? 0)) -
            parseFloat(String(row.quantity_delta ?? 0)),
        );
        const delta = roundQty(parseFloat(String(row.quantity_delta ?? 0)));
        const batchId = row.inventory_batch_id
          ? String(row.inventory_batch_id)
          : null;
        const fromBatch = batchId ? costByBatch.get(batchId) : undefined;

        let unitCost = fromBatch?.unitCostMxn ?? null;
        let unitSale = fromBatch?.unitSalePriceMxn ?? null;

        if (
          (row.movement_type === 'sale' || row.movement_type === 'sale_reversal') &&
          row.reference_type === 'sales_order'
        ) {
          // Precio OV no está ligado al alloc id en ledger; conservar lista o null.
          // Si hay unit_price en notas no aplica — usamos lista del lote.
        }

        if (unitCost == null && delta < 0 && prevQty > 0 && prevCost !== 0) {
          unitCost = roundMoney(prevCost / prevQty);
        }

        let costBalance: number | null = null;
        if (unitCost != null) {
          costBalance = roundMoney(prevCost + delta * unitCost);
          if (roundQty(parseFloat(String(row.balance_after ?? 0))) === 0) {
            costBalance = 0;
          }
          costBalances.set(key, costBalance);
        } else {
          costBalances.set(key, prevCost);
          costBalance = prevCost;
        }

        await qr.query(
          `
          UPDATE inv_s_stock_ledger
          SET unit_cost_mxn = ?,
              unit_sale_price_mxn = ?,
              cost_balance_after_mxn = ?
          WHERE id = ?
          `,
          [unitCost, unitSale, costBalance, row.id],
        );
        updated += 1;
      }

      // Segunda pasada: precios de venta desde allocations por batch+tiempo aproximado
      await qr.query(
        `
        UPDATE inv_s_stock_ledger l
        INNER JOIN inv_s_sales_order_batch_allocations alloc
          ON alloc.inventory_batch_id = l.inventory_batch_id
         AND ABS(TIMESTAMPDIFF(SECOND, alloc.created_at, l.occurred_at)) < 5
         AND ABS(alloc.quantity_allocated - ABS(l.quantity_delta)) < 0.001
        INNER JOIN inv_s_sales_order_details sod
          ON sod.id = alloc.sales_order_detail_id
        SET l.unit_sale_price_mxn = GREATEST(
          0,
          COALESCE(sod.unit_price, 0) - COALESCE(sod.discount_unit, 0)
        )
        WHERE l.tenant_id = ?
          AND l.movement_type IN ('sale', 'sale_reversal')
        `,
        [tenantId],
      );

      console.log(`✓ Tenant ${tenantId}: ${updated} filas valuadas`);
    }
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
