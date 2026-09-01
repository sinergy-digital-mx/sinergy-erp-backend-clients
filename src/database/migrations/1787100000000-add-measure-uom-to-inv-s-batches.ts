import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Unidad del tamaño (Foot, PIES, …), independiente de la UOM de inventario / OC (PT, ft²).
 */
export class AddMeasureUomToInvSBatches1787100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inv_s_batches',
      new TableColumn({
        name: 'measure_uom_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_batches',
      new TableForeignKey({
        name: 'fk_batch_measure_uom',
        columnNames: ['measure_uom_id'],
        referencedTableName: 'uom_catalog',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('inv_s_batches', 'fk_batch_measure_uom');
    await queryRunner.dropColumn('inv_s_batches', 'measure_uom_id');
  }
}
