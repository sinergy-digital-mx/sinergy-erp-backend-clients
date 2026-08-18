import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSatFiscalDomicileToCustomers1785600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customers
        ADD COLUMN fiscal_street VARCHAR(255) NULL,
        ADD COLUMN fiscal_exterior_number VARCHAR(20) NULL,
        ADD COLUMN fiscal_interior_number VARCHAR(20) NULL,
        ADD COLUMN fiscal_colonia VARCHAR(120) NULL,
        ADD COLUMN fiscal_localidad VARCHAR(120) NULL,
        ADD COLUMN fiscal_municipio VARCHAR(120) NULL,
        ADD COLUMN fiscal_country VARCHAR(3) NULL
    `);

    await queryRunner.query(`
      UPDATE customers
      SET fiscal_municipio = fiscal_city
      WHERE fiscal_municipio IS NULL
        AND fiscal_city IS NOT NULL
        AND TRIM(fiscal_city) <> ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customers
        DROP COLUMN fiscal_street,
        DROP COLUMN fiscal_exterior_number,
        DROP COLUMN fiscal_interior_number,
        DROP COLUMN fiscal_colonia,
        DROP COLUMN fiscal_localidad,
        DROP COLUMN fiscal_municipio,
        DROP COLUMN fiscal_country
    `);
  }
}
