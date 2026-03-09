import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePosOrderLinesTable1772900000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create pos_order_lines table
    await queryRunner.createTable(
      new Table({
        name: 'pos_order_lines',
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
            name: 'product_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'uom_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'unit_price',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'discount_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'discount_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'line_total',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'preparing', 'ready', 'delivered'],
            default: "'pending'",
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
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create index on pos_order_id
    await queryRunner.createIndex(
      'pos_order_lines',
      new TableIndex({
        name: 'pos_order_lines_order_idx',
        columnNames: ['pos_order_id'],
      }),
    );

    // Create index on product_id
    await queryRunner.createIndex(
      'pos_order_lines',
      new TableIndex({
        name: 'pos_order_lines_product_idx',
        columnNames: ['product_id'],
      }),
    );

    // Create index on status
    await queryRunner.createIndex(
      'pos_order_lines',
      new TableIndex({
        name: 'pos_order_lines_status_idx',
        columnNames: ['status'],
      }),
    );

    // Create foreign key to pos_orders
    await queryRunner.createForeignKey(
      'pos_order_lines',
      new TableForeignKey({
        columnNames: ['pos_order_id'],
        referencedTableName: 'pos_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_pos_order_lines_order',
      }),
    );

    // Create foreign key to products
    await queryRunner.createForeignKey(
      'pos_order_lines',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_pos_order_lines_product',
      }),
    );

    // Create foreign key to uoms
    await queryRunner.createForeignKey(
      'pos_order_lines',
      new TableForeignKey({
        columnNames: ['uom_id'],
        referencedTableName: 'uoms',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_pos_order_lines_uom',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey(
      'pos_order_lines',
      'fk_pos_order_lines_uom',
    );
    await queryRunner.dropForeignKey(
      'pos_order_lines',
      'fk_pos_order_lines_product',
    );
    await queryRunner.dropForeignKey(
      'pos_order_lines',
      'fk_pos_order_lines_order',
    );

    // Drop indexes
    await queryRunner.dropIndex('pos_order_lines', 'pos_order_lines_status_idx');
    await queryRunner.dropIndex('pos_order_lines', 'pos_order_lines_product_idx');
    await queryRunner.dropIndex('pos_order_lines', 'pos_order_lines_order_idx');

    // Drop table
    await queryRunner.dropTable('pos_order_lines');
  }
}
