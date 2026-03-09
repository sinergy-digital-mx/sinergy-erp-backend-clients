import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePaymentsTable1772813100002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payments',
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
            name: 'payment_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'payment_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'payment_method',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'reference_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
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
      'payments',
      new TableIndex({
        name: 'purchase_order_index',
        columnNames: ['purchase_order_id'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['purchase_order_id'],
        referencedTableName: 'purchase_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payments');
  }
}
