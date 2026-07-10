import 'dotenv/config';
import { AppDataSource } from '../../data-source';
import { randomUUID } from 'crypto';

const WRONG_WAREHOUSE_ID = '87d51981-5697-4dc5-99e8-5149f8fbffe7';
const CORRECT_WAREHOUSE_ID = 'f5940299-edb7-4227-9e6b-fb6c34cda8fe';
const FOLIOS = ['OSV-000013', 'OSV-000014'];

async function main() {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    const [correctWarehouse] = await qr.query(
      `SELECT id, name, fiscal_configuration_id FROM warehouses WHERE id = ?`,
      [CORRECT_WAREHOUSE_ID],
    );
    if (!correctWarehouse) {
      throw new Error('Almacén Zona Norte Tijuana no encontrado');
    }

    for (const folio of FOLIOS) {
      const [order] = await qr.query(
        `SELECT id, folio, warehouse_id, created_by, fiscal_configuration_id
         FROM inv_s_sales_orders WHERE folio = ? FOR UPDATE`,
        [folio],
      );
      if (!order) {
        throw new Error(`Orden ${folio} no encontrada`);
      }
      if (order.warehouse_id === CORRECT_WAREHOUSE_ID) {
        console.log(`✓ ${folio} ya tiene el almacén correcto`);
        continue;
      }

      const details = await qr.query(
        `SELECT id, product_id, quantity_base_uom
         FROM inv_s_sales_order_details WHERE sales_order_id = ?`,
        [order.id],
      );

      for (const detail of details) {
        const allocations = await qr.query(
          `SELECT a.id, a.quantity_allocated, a.inventory_batch_id, a.created_by
           FROM inv_s_sales_order_batch_allocations a
           WHERE a.sales_order_detail_id = ?`,
          [detail.id],
        );

        for (const alloc of allocations) {
          const [batch] = await qr.query(
            `SELECT id, available_quantity FROM inv_s_batches WHERE id = ? FOR UPDATE`,
            [alloc.inventory_batch_id],
          );
          const restored = Number(batch.available_quantity) + Number(alloc.quantity_allocated);
          await qr.query(
            `UPDATE inv_s_batches SET available_quantity = ? WHERE id = ?`,
            [restored.toFixed(3), batch.id],
          );
          await qr.query(
            `DELETE FROM inv_s_sales_order_batch_allocations WHERE id = ?`,
            [alloc.id],
          );
          console.log(`  ${folio}: liberado ${alloc.quantity_allocated} del lote ${batch.id}`);
        }

        const needed = Number(detail.quantity_base_uom);
        const batches = await qr.query(
          `SELECT id, batch_number, available_quantity
           FROM inv_s_batches
           WHERE product_id = ? AND warehouse_id = ? AND available_quantity > 0
           ORDER BY created_at ASC
           FOR UPDATE`,
          [detail.product_id, CORRECT_WAREHOUSE_ID],
        );

        const totalAvailable = batches.reduce(
          (sum: number, b: { available_quantity: string }) =>
            sum + Number(b.available_quantity),
          0,
        );
        if (totalAvailable < needed) {
          throw new Error(
            `Stock insuficiente en Zona Norte para ${folio}: requerido ${needed}, disponible ${totalAvailable}`,
          );
        }

        let remaining = needed;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const available = Number(batch.available_quantity);
          const take = Math.min(available, remaining);
          const newAvailable = available - take;

          await qr.query(
            `UPDATE inv_s_batches SET available_quantity = ? WHERE id = ?`,
            [newAvailable.toFixed(3), batch.id],
          );

          const allocId = randomUUID();
          await qr.query(
            `INSERT INTO inv_s_sales_order_batch_allocations
             (id, sales_order_detail_id, inventory_batch_id, quantity_allocated, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [allocId, detail.id, batch.id, take.toFixed(3), order.created_by],
          );
          console.log(`  ${folio}: asignado ${take} del lote ${batch.batch_number}`);
          remaining = Number((remaining - take).toFixed(3));
        }
      }

      await qr.query(
        `UPDATE inv_s_sales_orders
         SET warehouse_id = ?, fiscal_configuration_id = ?
         WHERE id = ?`,
        [CORRECT_WAREHOUSE_ID, correctWarehouse.fiscal_configuration_id, order.id],
      );
      console.log(`✓ ${folio}: warehouse_id → ${correctWarehouse.name}`);
    }

    await qr.commitTransaction();
    console.log('\nCorrección completada.');
  } catch (error) {
    await qr.rollbackTransaction();
    throw error;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
