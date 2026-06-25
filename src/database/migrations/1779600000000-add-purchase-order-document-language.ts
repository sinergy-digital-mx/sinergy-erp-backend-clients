import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPurchaseOrderDocumentLanguage1779600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inv_s_purchase_order_documents',
      new TableColumn({
        name: 'document_language',
        type: 'enum',
        enum: ['es', 'en'],
        default: "'es'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('inv_s_purchase_order_documents', 'document_language');
  }
}
