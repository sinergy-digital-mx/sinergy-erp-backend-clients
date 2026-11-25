import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Ambiente Finkok con el que caja timbra el anticipo: demo o production. */
export class AddQuotationAdvanceStampEnvironment1797000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_quotations');
    if (table && !table.findColumnByName('advance_stamp_environment')) {
      await queryRunner.addColumn(
        'inv_s_quotations',
        new TableColumn({
          name: 'advance_stamp_environment',
          type: 'varchar',
          length: '16',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_quotations');
    if (table?.findColumnByName('advance_stamp_environment')) {
      await queryRunner.dropColumn('inv_s_quotations', 'advance_stamp_environment');
    }
  }
}
