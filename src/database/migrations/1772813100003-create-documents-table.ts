import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateDocumentsTable1772813100003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'documents',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'purchase_order_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'file_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 's3_key',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 's3_url',
            type: 'varchar',
            length: '1000',
            isNullable: false,
          },
          {
            name: 'uploader_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'upload_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create index
    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'purchase_order_index',
        columnNames: ['purchase_order_id'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'documents',
      new TableForeignKey({
        columnNames: ['purchase_order_id'],
        referencedTableName: 'purchase_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('documents');
  }
}
