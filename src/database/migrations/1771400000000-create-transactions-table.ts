import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTransactionsTable1771400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'entity_type_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'entity_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'transaction_number',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'transaction_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'payment_method',
            type: 'varchar',
            length: '50',
            default: "'transferencia'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pagado', 'pendiente', 'atrasado', 'cancelado'],
            default: "'pendiente'",
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_tenant_entity',
        columnNames: ['tenant_id', 'entity_type_id', 'entity_id'],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_tenant_status',
        columnNames: ['tenant_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_entity_type_id',
        columnNames: ['entity_type_id', 'entity_id'],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['entity_type_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'entity_registry',
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transactions', true);
  }
}
