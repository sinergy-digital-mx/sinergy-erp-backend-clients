import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePosSaleCollections1779600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pos_sale_collections',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          { name: 'tenant_id', type: 'varchar', length: '36' },
          { name: 'sales_order_id', type: 'varchar', length: '36' },
          { name: 'pos_daily_shift_id', type: 'varchar', length: '36' },
          { name: 'customer_id', type: 'int' },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['cash', 'card', 'transfer', 'mixed'],
          },
          {
            name: 'order_total_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'amount_cash_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'amount_cash_usd',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'usd_exchange_rate',
            type: 'decimal',
            precision: 12,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'amount_transfer_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'transfer_reference',
            type: 'varchar',
            length: '120',
            isNullable: true,
          },
          {
            name: 'amount_card_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'card_reference',
            type: 'varchar',
            length: '120',
            isNullable: true,
          },
          {
            name: 'received_cash_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'received_cash_usd',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'change_cash_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'change_cash_usd',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          { name: 'collected_by_user_id', type: 'varchar', length: '36' },
          { name: 'notes', type: 'text', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'pos_sale_collections',
      new TableIndex({
        name: 'uq_pos_sale_collection_order',
        columnNames: ['sales_order_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'pos_sale_collections',
      new TableIndex({
        name: 'idx_pos_sale_collection_shift',
        columnNames: ['pos_daily_shift_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'pos_sale_collections',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_pos_sale_collection_tenant',
      }),
    );

    await queryRunner.createForeignKey(
      'pos_sale_collections',
      new TableForeignKey({
        columnNames: ['sales_order_id'],
        referencedTableName: 'inv_s_sales_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_pos_sale_collection_order',
      }),
    );

    await queryRunner.createForeignKey(
      'pos_sale_collections',
      new TableForeignKey({
        columnNames: ['pos_daily_shift_id'],
        referencedTableName: 'pos_daily_shifts',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_pos_sale_collection_shift',
      }),
    );

    await queryRunner.createForeignKey(
      'pos_sale_collections',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_pos_sale_collection_customer',
      }),
    );

    await queryRunner.createForeignKey(
      'pos_sale_collections',
      new TableForeignKey({
        columnNames: ['collected_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_pos_sale_collection_collector',
      }),
    );

    await queryRunner.query(`
      ALTER TABLE inv_s_sales_orders
      MODIFY COLUMN general_status ENUM('Creada', 'Surtida', 'Cancelada', 'En cola') NOT NULL DEFAULT 'Creada'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE inv_s_sales_orders
      MODIFY COLUMN general_status ENUM('Creada', 'Surtida', 'Cancelada') NOT NULL DEFAULT 'Creada'
    `);

    const table = await queryRunner.getTable('pos_sale_collections');
    for (const fk of table?.foreignKeys ?? []) {
      await queryRunner.dropForeignKey('pos_sale_collections', fk);
    }
    await queryRunner.dropTable('pos_sale_collections');
  }
}
