import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Caso del anticipo: unknown (no sabe qué quiere) o products (sí sabe, no hay). */
export class AddQuotationAdvanceCase1796500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_quotations');
    if (table && !table.findColumnByName('advance_case')) {
      await queryRunner.addColumn(
        'inv_s_quotations',
        new TableColumn({
          name: 'advance_case',
          type: 'varchar',
          length: '16',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_quotations');
    if (table?.findColumnByName('advance_case')) {
      await queryRunner.dropColumn('inv_s_quotations', 'advance_case');
    }
  }
}
