import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePurchaseOrderDocuments1743668100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_purchase_order_documents',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'purchase_order_batch_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'document_type_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'uploaded_by',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'inv_s_purchase_order_documents',
      new TableForeignKey({
        columnNames: ['purchase_order_batch_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'inv_s_purchase_order_batch',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_purchase_order_documents',
      new TableForeignKey({
        columnNames: ['document_type_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'inv_s_purchase_order_document_types',
        onDelete: 'RESTRICT',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'inv_s_purchase_order_documents',
      new TableIndex({
        name: 'idx_po_batch_id',
        columnNames: ['purchase_order_batch_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_documents',
      new TableIndex({
        name: 'idx_doc_type_id',
        columnNames: ['document_type_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inv_s_purchase_order_documents');
  }
}
