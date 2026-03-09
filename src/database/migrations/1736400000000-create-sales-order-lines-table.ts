import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSalesOrderLinesTable1736400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sales_order_lines',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          {
            name: 'sales_order_id',
            type: 'char',
            length: '36',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'char',
            length: '36',
            isNullable: false,
          },
          {
            name: 'uom_id',
            type: 'char',
            length: '36',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'unit_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'iva_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'iva_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'ieps_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'ieps_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'line_total',
            type: 'decimal',
            precision: 10,
            scale: 2,
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

    // Create foreign key to sales_orders
    await queryRunner.createForeignKey(
      'sales_order_lines',
      new TableForeignKey({
        columnNames: ['sales_order_id'],
        referencedTableName: 'sales_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_sales_order_lines_sales_order',
      }),
    );

    // Create foreign key to products
    await queryRunner.createForeignKey(
      'sales_order_lines',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_sales_order_lines_product',
      }),
    );

    // Create foreign key to uoms
    await queryRunner.createForeignKey(
      'sales_order_lines',
      new TableForeignKey({
        columnNames: ['uom_id'],
        referencedTableName: 'uoms',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_sales_order_lines_uom',
      }),
    );

    // Create index on sales_order_id for faster queries
    await queryRunner.createIndex(
      'sales_order_lines',
      new TableIndex({
        name: 'idx_sales_order_lines_sales_order_id',
        columnNames: ['sales_order_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex('sales_order_lines', 'idx_sales_order_lines_sales_order_id');

    // Drop foreign keys
    await queryRunner.dropForeignKey('sales_order_lines', 'fk_sales_order_lines_uom');
    await queryRunner.dropForeignKey('sales_order_lines', 'fk_sales_order_lines_product');
    await queryRunner.dropForeignKey('sales_order_lines', 'fk_sales_order_lines_sales_order');

    // Drop table
    await queryRunner.dropTable('sales_order_lines');
  }
}
