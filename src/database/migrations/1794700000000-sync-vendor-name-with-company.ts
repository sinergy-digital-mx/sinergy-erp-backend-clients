import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncVendorNameWithCompany1794700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('vendors');
    if (!table?.findColumnByName('name') || !table.findColumnByName('company_name')) {
      return;
    }

    await queryRunner.query(`
      UPDATE vendors
      SET company_name = TRIM(name)
      WHERE company_name IS NULL OR TRIM(company_name) = ''
    `);

    await queryRunner.query(`
      UPDATE vendors
      SET name = TRIM(company_name)
      WHERE company_name IS NOT NULL
        AND TRIM(company_name) <> ''
        AND name <> TRIM(company_name)
    `);
  }

  public async down(): Promise<void> {
    // El nombre suelto ya no se distingue de la empresa.
  }
}
