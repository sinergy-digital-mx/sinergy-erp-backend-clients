import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSalesOrderPayments1779940000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_sales_order_payments',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'sales_order_id',
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
            name: 'amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'enum',
            enum: ['MXN', 'USD'],
            default: "'MXN'",
            isNullable: false,
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['cash', 'card', 'transfer', 'mixed'],
            isNullable: false,
          },
          {
            name: 'reference_number',
            type: 'varchar',
            length: '120',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'source',
            type: 'varchar',
            length: '20',
            default: "'manual'",
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
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
      'inv_s_sales_order_payments',
      new TableIndex({
        name: 'idx_so_payments_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_sales_order_payments',
      new TableIndex({
        name: 'idx_so_payments_order_id',
        columnNames: ['sales_order_id'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_sales_order_payments',
      new TableIndex({
        name: 'idx_so_payments_date',
        columnNames: ['payment_date'],
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_sales_order_payments',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_sales_order_payments',
      new TableForeignKey({
        columnNames: ['sales_order_id'],
        referencedTableName: 'inv_s_sales_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_sales_order_payments',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'inv_s_sales_order_payment_documents',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'payment_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 's3_key',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'uploaded_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
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
      'inv_s_sales_order_payment_documents',
      new TableIndex({
        name: 'idx_so_pay_doc_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_sales_order_payment_documents',
      new TableIndex({
        name: 'idx_so_pay_doc_payment',
        columnNames: ['payment_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_sales_order_payment_documents',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_sales_order_payment_documents',
      new TableForeignKey({
        columnNames: ['payment_id'],
        referencedTableName: 'inv_s_sales_order_payments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_sales_order_payment_documents',
      new TableForeignKey({
        columnNames: ['uploaded_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inv_s_sales_order_payment_documents', true);
    await queryRunner.dropTable('inv_s_sales_order_payments', true);
  }
}
