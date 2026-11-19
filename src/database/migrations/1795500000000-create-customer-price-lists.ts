import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCustomerPriceLists1795500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('customer_price_lists')) return;

    await queryRunner.createTable(
      new Table({
        name: 'customer_price_lists',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'customer_id', type: 'int', isNullable: false },
          { name: 'price_list_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'is_default', type: 'boolean', default: false, isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'customer_price_lists',
      new TableIndex({
        name: 'customer_price_list_unique',
        columnNames: ['tenant_id', 'customer_id', 'price_list_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'customer_price_lists',
      new TableIndex({
        name: 'customer_price_list_customer_index',
        columnNames: ['tenant_id', 'customer_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'customer_price_lists',
      new TableForeignKey({
        name: 'fk_customer_price_lists_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'customer_price_lists',
      new TableForeignKey({
        name: 'fk_customer_price_lists_price_list',
        columnNames: ['price_list_id'],
        referencedTableName: 'product_price_lists',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('customer_price_lists')) {
      await queryRunner.dropTable('customer_price_lists');
    }
  }
}
