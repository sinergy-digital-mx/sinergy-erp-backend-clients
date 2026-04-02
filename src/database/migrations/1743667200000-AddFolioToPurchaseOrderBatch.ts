import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddFolioToPurchaseOrderBatch1743667200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'folio',
        type: 'varchar',
        length: '20',
        isUnique: true,
        isNullable: false,
        default: "'ODC-000001'",
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_batch',
      new TableIndex({
        name: 'idx_folio',
        columnNames: ['folio'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('inv_s_purchase_order_batch', 'idx_folio');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'folio');
  }
}
