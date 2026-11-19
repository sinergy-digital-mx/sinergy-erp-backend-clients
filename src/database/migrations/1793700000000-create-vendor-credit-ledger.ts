import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/** Kardex de saldo a favor del proveedor. El excedente de un pago no se infla en la OC. */
export class CreateVendorCreditLedger1793700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('vendor_credit_ledger');
    if (hasTable) return;

    await queryRunner.createTable(
      new Table({
        name: 'vendor_credit_ledger',
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
          { name: 'vendor_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'currency', type: 'enum', enum: ['MXN', 'USD'], isNullable: false },
          {
            name: 'entry_type',
            type: 'enum',
            enum: ['credit', 'debit', 'void'],
            isNullable: false,
          },
          { name: 'amount', type: 'decimal', precision: 12, scale: 2, isNullable: false },
          { name: 'purchase_order_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'purchase_order_payment_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'source_entry_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        foreignKeys: [
          {
            columnNames: ['vendor_id'],
            referencedTableName: 'vendors',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'vendor_credit_ledger',
      new TableIndex({
        name: 'idx_vendor_credit_ledger_tenant_vendor',
        columnNames: ['tenant_id', 'vendor_id'],
      }),
    );
    await queryRunner.createIndex(
      'vendor_credit_ledger',
      new TableIndex({
        name: 'idx_vendor_credit_ledger_payment',
        columnNames: ['purchase_order_payment_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('vendor_credit_ledger'))) return;
    await queryRunner.dropTable('vendor_credit_ledger');
  }
}
