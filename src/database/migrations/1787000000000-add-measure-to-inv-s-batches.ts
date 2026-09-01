import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Medida opcional del lote (p. ej. 8 o 12 en pies).
 * No sustituye la UOM: el stock sigue en ft² / m / etc. y se puede totalizar por medida.
 */
export class AddMeasureToInvSBatches1787000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inv_s_batches',
      new TableColumn({
        name: 'measure',
        type: 'decimal',
        precision: 12,
        scale: 3,
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('inv_s_batches', 'measure');
  }
}
