import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Madereria Zona Norte: sin IEPS y sin transferencias entre razones sociales. */
const MADERERIA_ORGANIZATION_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';

/**
 * IVA, IEPS y transferencias multi razón social por razón social.
 * El resto de organizaciones conserva IVA, IEPS y el cruce de razones que ya tenían.
 */
export class AddFiscalTaxAndTransferFlags1792500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('fiscal_configurations');
    if (!table) {
      return;
    }

    if (!table.findColumnByName('iva_enabled')) {
      await queryRunner.addColumn(
        'fiscal_configurations',
        new TableColumn({
          name: 'iva_enabled',
          type: 'tinyint',
          width: 1,
          default: 1,
          isNullable: false,
        }),
      );
    }

    if (!table.findColumnByName('ieps_enabled')) {
      await queryRunner.addColumn(
        'fiscal_configurations',
        new TableColumn({
          name: 'ieps_enabled',
          type: 'tinyint',
          width: 1,
          default: 1,
          isNullable: false,
        }),
      );
    }

    if (!table.findColumnByName('multi_fiscal_transfers_enabled')) {
      await queryRunner.addColumn(
        'fiscal_configurations',
        new TableColumn({
          name: 'multi_fiscal_transfers_enabled',
          type: 'tinyint',
          width: 1,
          default: 1,
          isNullable: false,
        }),
      );
    }

    await queryRunner.query(`
      UPDATE fiscal_configurations
      SET ieps_enabled = 0,
          multi_fiscal_transfers_enabled = 0
      WHERE tenant_id = '${MADERERIA_ORGANIZATION_ID}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('fiscal_configurations');
    if (!table) {
      return;
    }
    for (const column of ['multi_fiscal_transfers_enabled', 'ieps_enabled', 'iva_enabled']) {
      if (table.findColumnByName(column)) {
        await queryRunner.dropColumn('fiscal_configurations', column);
      }
    }
  }
}
