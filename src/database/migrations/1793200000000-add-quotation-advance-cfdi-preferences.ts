import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Uso CFDI y método de pago que caja usa al timbrar el anticipo de la cotización. */
export class AddQuotationAdvanceCfdiPreferences1793200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_quotations');
    if (table && !table.findColumnByName('advance_uso_cfdi')) {
      await queryRunner.addColumn(
        'inv_s_quotations',
        new TableColumn({ name: 'advance_uso_cfdi', type: 'varchar', length: '4', isNullable: true }),
      );
    }
    if (table && !table.findColumnByName('advance_metodo_pago')) {
      await queryRunner.addColumn(
        'inv_s_quotations',
        new TableColumn({ name: 'advance_metodo_pago', type: 'varchar', length: '3', isNullable: true }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_quotations');
    if (table?.findColumnByName('advance_metodo_pago')) {
      await queryRunner.dropColumn('inv_s_quotations', 'advance_metodo_pago');
    }
    if (table?.findColumnByName('advance_uso_cfdi')) {
      await queryRunner.dropColumn('inv_s_quotations', 'advance_uso_cfdi');
    }
  }
}
