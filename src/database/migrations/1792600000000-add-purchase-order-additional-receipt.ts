import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Permite reabrir una orden recibida para agregar productos y hacer un segundo ingreso
 * sin sacar el inventario que ya entró.
 */
export class AddPurchaseOrderAdditionalReceipt1792600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_purchase_order_batch');
    if (!table?.findColumnByName('additional_receipt_open')) {
      await queryRunner.addColumn(
        'inv_s_purchase_order_batch',
        new TableColumn({
          name: 'additional_receipt_open',
          type: 'tinyint',
          width: 1,
          default: 0,
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_purchase_order_batch');
    if (table?.findColumnByName('additional_receipt_open')) {
      await queryRunner.dropColumn('inv_s_purchase_order_batch', 'additional_receipt_open');
    }
  }
}
