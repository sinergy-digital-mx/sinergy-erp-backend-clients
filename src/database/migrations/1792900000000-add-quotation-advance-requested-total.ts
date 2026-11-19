import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Monto del anticipo que caja cobra antes de convertir la cotización. */
export class AddQuotationAdvanceRequestedTotal1792900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_quotations');
    if (table && !table.findColumnByName('advance_requested_total')) {
      await queryRunner.addColumn(
        'inv_s_quotations',
        new TableColumn({
          name: 'advance_requested_total',
          type: 'decimal',
          precision: 12,
          scale: 2,
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_quotations');
    if (table?.findColumnByName('advance_requested_total')) {
      await queryRunner.dropColumn('inv_s_quotations', 'advance_requested_total');
    }
  }
}
