import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Pedimento del reporte de inventario Madereria (sin orden de compra).
 * El de la OC sigue en inv_s_purchase_order_batch.pedimento_number.
 */
export class AddPedimentoToInventoryBatches1792200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = 'inv_s_batches';
    if (!(await queryRunner.hasTable(table))) {
      return;
    }

    if (!(await queryRunner.hasColumn(table, 'pedimento_number'))) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'pedimento_number',
          type: 'varchar',
          length: '30',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn(table, 'pedimento_entries'))) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'pedimento_entries',
          type: 'json',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = 'inv_s_batches';
    if (!(await queryRunner.hasTable(table))) {
      return;
    }
    if (await queryRunner.hasColumn(table, 'pedimento_entries')) {
      await queryRunner.dropColumn(table, 'pedimento_entries');
    }
    if (await queryRunner.hasColumn(table, 'pedimento_number')) {
      await queryRunner.dropColumn(table, 'pedimento_number');
    }
  }
}
