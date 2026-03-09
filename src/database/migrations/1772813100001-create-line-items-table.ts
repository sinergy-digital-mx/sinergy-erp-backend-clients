import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateLineItemsTable1772813100001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'line_items',
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
            scale: 2,
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
            precision: 12,
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

    // Create indexes
    await queryRunner.createIndex(
      'line_items',
      new TableIndex({
        name: 'purchase_order_index',
        columnNames: ['purchase_order_id'],
      }),
    );

    await queryRunner.createIndex(
      'line_items',
      new TableIndex({
        name: 'product_index',
        columnNames: ['product_id'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'line_items',
      new TableForeignKey({
        columnNames: ['purchase_order_id'],
        referencedTableName: 'purchase_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'line_items',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'line_items',
      new TableForeignKey({
        columnNames: ['uom_id'],
        referencedTableName: 'uoms',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('line_items');
  }
}
