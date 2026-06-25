import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSalesOrderDocuments1779700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_sales_order_document_types',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.query(
      `INSERT INTO inv_s_sales_order_document_types (name, description) VALUES
       ('DOCUMENTO_ORIGINAL', 'Documento original de la orden de venta')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'inv_s_sales_order_documents',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'sales_order_id',
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
            name: 'document_language',
            type: 'enum',
            enum: ['es', 'en'],
            default: "'es'",
            isNullable: false,
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

    await queryRunner.createForeignKey(
      'inv_s_sales_order_documents',
      new TableForeignKey({
        columnNames: ['sales_order_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'inv_s_sales_orders',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_sales_order_documents',
      new TableForeignKey({
        columnNames: ['document_type_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'inv_s_sales_order_document_types',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createIndex(
      'inv_s_sales_order_documents',
      new TableIndex({
        name: 'idx_so_doc_order_id',
        columnNames: ['sales_order_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_sales_order_documents',
      new TableIndex({
        name: 'idx_so_doc_type_id',
        columnNames: ['document_type_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inv_s_sales_order_documents');
    await queryRunner.dropTable('inv_s_sales_order_document_types');
  }
}
