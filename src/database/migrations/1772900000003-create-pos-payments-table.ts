import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePosPaymentsTable1772900000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create pos_payments table
    await queryRunner.createTable(
      new Table({
        name: 'pos_payments',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'pos_order_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['cash', 'card', 'transfer', 'mixed'],
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'received_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'change_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'reference',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'cashier_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'cash_shift_id',
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
      true,
    );

    // Create index on pos_order_id
    await queryRunner.createIndex(
      'pos_payments',
      new TableIndex({
        name: 'pos_payments_order_idx',
        columnNames: ['pos_order_id'],
      }),
    );

    // Create index on cashier_id
    await queryRunner.createIndex(
      'pos_payments',
      new TableIndex({
        name: 'pos_payments_cashier_idx',
        columnNames: ['cashier_id'],
      }),
    );

    // Create index on cash_shift_id
    await queryRunner.createIndex(
      'pos_payments',
      new TableIndex({
        name: 'pos_payments_shift_idx',
        columnNames: ['cash_shift_id'],
      }),
    );

    // Create index on payment_method
    await queryRunner.createIndex(
      'pos_payments',
      new TableIndex({
        name: 'pos_payments_method_idx',
        columnNames: ['payment_method'],
      }),
    );

    // Create foreign key to pos_orders
    await queryRunner.createForeignKey(
      'pos_payments',
      new TableForeignKey({
        columnNames: ['pos_order_id'],
        referencedTableName: 'pos_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_pos_payments_order',
      }),
    );

    // Create foreign key to users (cashier)
    await queryRunner.createForeignKey(
      'pos_payments',
      new TableForeignKey({
        columnNames: ['cashier_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_pos_payments_cashier',
      }),
    );

    // Create foreign key to cash_shifts
    await queryRunner.createForeignKey(
      'pos_payments',
      new TableForeignKey({
        columnNames: ['cash_shift_id'],
        referencedTableName: 'cash_shifts',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_pos_payments_shift',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('pos_payments', 'fk_pos_payments_shift');
    await queryRunner.dropForeignKey('pos_payments', 'fk_pos_payments_cashier');
    await queryRunner.dropForeignKey('pos_payments', 'fk_pos_payments_order');

    // Drop indexes
    await queryRunner.dropIndex('pos_payments', 'pos_payments_method_idx');
    await queryRunner.dropIndex('pos_payments', 'pos_payments_shift_idx');
    await queryRunner.dropIndex('pos_payments', 'pos_payments_cashier_idx');
    await queryRunner.dropIndex('pos_payments', 'pos_payments_order_idx');

    // Drop table
    await queryRunner.dropTable('pos_payments');
  }
}
