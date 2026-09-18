/**
 * Backfill del kardex inv_s_stock_ledger desde fuentes históricas.
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register src/database/scripts/migrations/backfill-stock-ledger.ts
 *   npx ts-node -r tsconfig-paths/register src/database/scripts/migrations/backfill-stock-ledger.ts --force
 *   npx ts-node -r tsconfig-paths/register src/database/scripts/migrations/backfill-stock-ledger.ts --tenant=<uuid>
 *
 * Limitación: ventas canceladas antes del deploy no dejan rastro (allocations borradas).
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { AppDataSource } from '../../data-source';

type LedgerEvent = {
  tenant_id: string;
  product_id: string;
  warehouse_id: string;
  uom_id: string;
  inventory_batch_id: string | null;
  movement_type: string;
  quantity_delta: number;
  occurred_at: Date;
  reference_type: string | null;
  reference_id: string | null;
  reference_folio: string | null;
  created_by: string | null;
  notes: string | null;
  sort_key: string;
};

function roundQty(value: number): number {
  return parseFloat(value.toFixed(3));
}

function balanceKey(e: Pick<LedgerEvent, 'tenant_id' | 'product_id' | 'warehouse_id' | 'uom_id'>): string {
  return `${e.tenant_id}|${e.product_id}|${e.warehouse_id}|${e.uom_id}`;
}

async function main() {
  const force = process.argv.includes('--force');
  const tenantArg = process.argv.find((a) => a.startsWith('--tenant='));
  const tenantFilter = tenantArg ? tenantArg.split('=')[1] : null;

  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();

  try {
    const tableExists = await qr.hasTable('inv_s_stock_ledger');
    if (!tableExists) {
      throw new Error(
        'La tabla inv_s_stock_ledger no existe. Corre las migraciones primero.',
      );
    }

    const tenants: Array<{ id: string }> = tenantFilter
      ? [{ id: tenantFilter }]
      : await qr.query(`SELECT DISTINCT tenant_id AS id FROM inv_s_batches`);

    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const [{ cnt }] = await qr.query(
        `SELECT COUNT(*) AS cnt FROM inv_s_stock_ledger WHERE tenant_id = ?`,
        [tenantId],
      );
      const existing = Number(cnt);
      if (existing > 0 && !force) {
        console.log(
          `⏭  Tenant ${tenantId}: ya tiene ${existing} filas (usa --force para regenerar)`,
        );
        continue;
      }

      await qr.startTransaction();
      try {
        if (existing > 0 && force) {
          await qr.query(`DELETE FROM inv_s_stock_ledger WHERE tenant_id = ?`, [
            tenantId,
          ]);
          console.log(`🗑  Tenant ${tenantId}: borradas ${existing} filas previas`);
        }

        const events: LedgerEvent[] = [];

        // 1) Creación de lotes (compra / importación). Transferencias se saltan.
        const batches = await qr.query(
          `
          SELECT
            b.id,
            b.tenant_id,
            b.product_id,
            b.warehouse_id,
            b.uom_id,
            b.initial_quantity,
            b.created_at,
            b.created_by,
            b.source_tag_identifier,
            b.transferred_from_batch_id,
            b.purchase_order_batch_id,
            b.batch_number,
            po.folio AS po_folio
          FROM inv_s_batches b
          LEFT JOIN inv_s_purchase_order_batch po ON po.id = b.purchase_order_batch_id
          WHERE b.tenant_id = ?
          `,
          [tenantId],
        );

        for (const b of batches) {
          if (b.transferred_from_batch_id) continue;
          const qty = roundQty(parseFloat(String(b.initial_quantity ?? 0)));
          if (qty === 0) continue;

          const isImport =
            String(b.source_tag_identifier || '').toUpperCase() === 'IMPORTACION';
          const movement_type = isImport
            ? 'import'
            : b.purchase_order_batch_id
              ? 'purchase_receipt'
              : 'opening_balance';

          events.push({
            tenant_id: tenantId,
            product_id: b.product_id,
            warehouse_id: b.warehouse_id,
            uom_id: b.uom_id,
            inventory_batch_id: b.id,
            movement_type,
            quantity_delta: qty,
            occurred_at: new Date(b.created_at),
            reference_type: isImport
              ? 'inventory_batch'
              : b.purchase_order_batch_id
                ? 'purchase_order'
                : 'inventory_batch',
            reference_id: isImport
              ? b.id
              : b.purchase_order_batch_id || b.id,
            reference_folio: isImport
              ? b.batch_number
              : b.po_folio || b.batch_number,
            created_by: b.created_by,
            notes: null,
            sort_key: `0:${b.created_at}:${b.id}`,
          });
        }

        // 2) Transferencias
        const transferLines = await qr.query(
          `
          SELECT
            line.id AS line_id,
            line.quantity,
            line.created_at,
            line.source_inventory_batch_id,
            line.destination_inventory_batch_id,
            t.id AS transfer_id,
            t.folio,
            t.created_by,
            src.tenant_id,
            src.product_id,
            src.warehouse_id AS source_warehouse_id,
            src.uom_id,
            dest.warehouse_id AS dest_warehouse_id
          FROM inv_s_inventory_transfer_lines line
          INNER JOIN inv_s_inventory_transfers t ON t.id = line.inventory_transfer_id
          INNER JOIN inv_s_batches src ON src.id = line.source_inventory_batch_id
          INNER JOIN inv_s_batches dest ON dest.id = line.destination_inventory_batch_id
          WHERE t.tenant_id = ?
          `,
          [tenantId],
        );

        for (const line of transferLines) {
          const qty = roundQty(parseFloat(String(line.quantity ?? 0)));
          if (qty === 0) continue;
          const occurred = new Date(line.created_at);
          events.push({
            tenant_id: tenantId,
            product_id: line.product_id,
            warehouse_id: line.source_warehouse_id,
            uom_id: line.uom_id,
            inventory_batch_id: line.source_inventory_batch_id,
            movement_type: 'transfer_out',
            quantity_delta: -qty,
            occurred_at: occurred,
            reference_type: 'inventory_transfer',
            reference_id: line.transfer_id,
            reference_folio: line.folio,
            created_by: line.created_by,
            notes: null,
            sort_key: `1:${line.created_at}:${line.line_id}:out`,
          });
          events.push({
            tenant_id: tenantId,
            product_id: line.product_id,
            warehouse_id: line.dest_warehouse_id,
            uom_id: line.uom_id,
            inventory_batch_id: line.destination_inventory_batch_id,
            movement_type: 'transfer_in',
            quantity_delta: qty,
            occurred_at: occurred,
            reference_type: 'inventory_transfer',
            reference_id: line.transfer_id,
            reference_folio: line.folio,
            created_by: line.created_by,
            notes: null,
            sort_key: `1:${line.created_at}:${line.line_id}:in`,
          });
        }

        // 3) Ventas (allocations vigentes)
        const sales = await qr.query(
          `
          SELECT
            alloc.id AS alloc_id,
            alloc.quantity_allocated,
            alloc.created_at,
            alloc.created_by,
            alloc.inventory_batch_id,
            b.tenant_id,
            b.product_id,
            b.warehouse_id,
            b.uom_id,
            so.id AS sales_order_id,
            so.folio
          FROM inv_s_sales_order_batch_allocations alloc
          INNER JOIN inv_s_batches b ON b.id = alloc.inventory_batch_id
          INNER JOIN inv_s_sales_order_details d ON d.id = alloc.sales_order_detail_id
          INNER JOIN inv_s_sales_orders so ON so.id = d.sales_order_id
          WHERE b.tenant_id = ?
          `,
          [tenantId],
        );

        for (const s of sales) {
          const qty = roundQty(parseFloat(String(s.quantity_allocated ?? 0)));
          if (qty === 0) continue;
          events.push({
            tenant_id: tenantId,
            product_id: s.product_id,
            warehouse_id: s.warehouse_id,
            uom_id: s.uom_id,
            inventory_batch_id: s.inventory_batch_id,
            movement_type: 'sale',
            quantity_delta: -qty,
            occurred_at: new Date(s.created_at),
            reference_type: 'sales_order',
            reference_id: s.sales_order_id,
            reference_folio: s.folio,
            created_by: s.created_by,
            notes: null,
            sort_key: `2:${s.created_at}:${s.alloc_id}`,
          });
        }

        // 4) Auditorías POSTED
        const audits = await qr.query(
          `
          SELECT
            line.id AS line_id,
            line.inventory_batch_id,
            line.quantity_before_post,
            line.quantity_after_post,
            line.reason,
            a.id AS audit_id,
            a.folio,
            a.authorized_at,
            a.authorized_by,
            b.tenant_id,
            b.product_id,
            b.warehouse_id,
            b.uom_id
          FROM inv_s_inventory_audit_lines line
          INNER JOIN inv_s_inventory_audits a ON a.id = line.inventory_audit_id
          INNER JOIN inv_s_batches b ON b.id = line.inventory_batch_id
          WHERE a.tenant_id = ?
            AND a.status = 'posted'
            AND line.quantity_before_post IS NOT NULL
            AND line.quantity_after_post IS NOT NULL
          `,
          [tenantId],
        );

        for (const a of audits) {
          const before = roundQty(parseFloat(String(a.quantity_before_post)));
          const after = roundQty(parseFloat(String(a.quantity_after_post)));
          const delta = roundQty(after - before);
          if (delta === 0) continue;
          events.push({
            tenant_id: tenantId,
            product_id: a.product_id,
            warehouse_id: a.warehouse_id,
            uom_id: a.uom_id,
            inventory_batch_id: a.inventory_batch_id,
            movement_type: 'audit_adjustment',
            quantity_delta: delta,
            occurred_at: new Date(a.authorized_at),
            reference_type: 'inventory_audit',
            reference_id: a.audit_id,
            reference_folio: a.folio,
            created_by: a.authorized_by,
            notes: a.reason,
            sort_key: `3:${a.authorized_at}:${a.line_id}`,
          });
        }

        events.sort((x, y) => {
          const t = x.occurred_at.getTime() - y.occurred_at.getTime();
          if (t !== 0) return t;
          return x.sort_key.localeCompare(y.sort_key);
        });

        const balances = new Map<string, number>();
        let inserted = 0;

        for (const e of events) {
          const key = balanceKey(e);
          const prev = balances.get(key) ?? 0;
          const next = roundQty(prev + e.quantity_delta);
          balances.set(key, next);

          await qr.query(
            `
            INSERT INTO inv_s_stock_ledger (
              id, tenant_id, product_id, warehouse_id, uom_id, inventory_batch_id,
              movement_type, quantity_delta, balance_after, occurred_at,
              reference_type, reference_id, reference_folio, created_by, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `,
            [
              randomUUID(),
              e.tenant_id,
              e.product_id,
              e.warehouse_id,
              e.uom_id,
              e.inventory_batch_id,
              e.movement_type,
              e.quantity_delta,
              next,
              e.occurred_at,
              e.reference_type,
              e.reference_id,
              e.reference_folio,
              e.created_by,
              e.notes,
            ],
          );
          inserted += 1;
        }

        // Validación vs available_quantity
        const mismatches = await qr.query(
          `
          SELECT
            b.product_id,
            b.warehouse_id,
            b.uom_id,
            SUM(b.available_quantity) AS batch_qty,
            (
              SELECT l.balance_after
              FROM inv_s_stock_ledger l
              WHERE l.tenant_id = b.tenant_id
                AND l.product_id = b.product_id
                AND l.warehouse_id = b.warehouse_id
                AND l.uom_id = b.uom_id
              ORDER BY l.occurred_at DESC, l.created_at DESC, l.id DESC
              LIMIT 1
            ) AS ledger_qty
          FROM inv_s_batches b
          WHERE b.tenant_id = ?
          GROUP BY b.tenant_id, b.product_id, b.warehouse_id, b.uom_id
          HAVING ABS(COALESCE(batch_qty, 0) - COALESCE(ledger_qty, 0)) > 0.001
          `,
          [tenantId],
        );

        await qr.commitTransaction();
        console.log(
          `✓ Tenant ${tenantId}: ${inserted} movimientos insertados` +
            (mismatches.length
              ? ` · ⚠ ${mismatches.length} descuadres vs lotes`
              : ' · saldos OK vs lotes'),
        );
        if (mismatches.length) {
          console.log(mismatches.slice(0, 10));
        }
      } catch (err) {
        await qr.rollbackTransaction();
        throw err;
      }
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
