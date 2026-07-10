import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddElectronicInvoicePdfS3Key1780400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('electronic_invoices');
    if (!table?.findColumnByName('pdf_stamped_s3_key')) {
      await queryRunner.addColumn(
        'electronic_invoices',
        new TableColumn({
          name: 'pdf_stamped_s3_key',
          type: 'varchar',
          length: '500',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('electronic_invoices');
    if (table?.findColumnByName('pdf_stamped_s3_key')) {
      await queryRunner.dropColumn('electronic_invoices', 'pdf_stamped_s3_key');
    }
  }
}
