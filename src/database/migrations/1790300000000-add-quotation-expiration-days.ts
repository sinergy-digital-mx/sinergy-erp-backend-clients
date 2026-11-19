import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Días de vigencia de cotizaciones por razón social.
 * Vacío / 0 = no se cancelan solas. El cron diario cancela las Creada que ya cumplieron esos días.
 */
export class AddQuotationExpirationDays1790300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('fiscal_configurations');
    if (!table?.findColumnByName('quotation_expiration_days')) {
      await queryRunner.addColumn(
        'fiscal_configurations',
        new TableColumn({
          name: 'quotation_expiration_days',
          type: 'int',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('fiscal_configurations');
    if (table?.findColumnByName('quotation_expiration_days')) {
      await queryRunner.dropColumn('fiscal_configurations', 'quotation_expiration_days');
    }
  }
}
