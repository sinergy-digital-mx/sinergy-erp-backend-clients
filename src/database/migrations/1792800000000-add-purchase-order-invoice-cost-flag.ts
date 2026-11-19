import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Marca qué gastos de la OC entran al total de factura del proveedor
 * y guarda su suma en MXN para el desglose contratado / factura / costo final.
 */
export class AddPurchaseOrderInvoiceCostFlag1792800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const lines = await queryRunner.getTable('inv_s_purchase_order_landed_cost_line');
    if (lines && !lines.findColumnByName('include_in_invoice')) {
      await queryRunner.addColumn(
        'inv_s_purchase_order_landed_cost_line',
        new TableColumn({
          name: 'include_in_invoice',
          type: 'tinyint',
          width: 1,
          default: 0,
          isNullable: false,
        }),
      );
    }

    const orders = await queryRunner.getTable('inv_s_purchase_order_batch');
    if (orders && !orders.findColumnByName('landed_invoice_extras_mxn')) {
      await queryRunner.addColumn(
        'inv_s_purchase_order_batch',
        new TableColumn({
          name: 'landed_invoice_extras_mxn',
          type: 'decimal',
          precision: 14,
          scale: 2,
          default: 0,
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const lines = await queryRunner.getTable('inv_s_purchase_order_landed_cost_line');
    if (lines?.findColumnByName('include_in_invoice')) {
      await queryRunner.dropColumn('inv_s_purchase_order_landed_cost_line', 'include_in_invoice');
    }

    const orders = await queryRunner.getTable('inv_s_purchase_order_batch');
    if (orders?.findColumnByName('landed_invoice_extras_mxn')) {
      await queryRunner.dropColumn('inv_s_purchase_order_batch', 'landed_invoice_extras_mxn');
    }
  }
}
