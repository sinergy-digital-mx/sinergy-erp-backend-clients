import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

/** Nota de crédito de la OV: vínculo al CFDI de ingreso y saldo a favor del cliente. */
export class AddSalesOrderCreditNotes1794200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const invoices = await queryRunner.getTable('electronic_invoices');
    if (invoices && !invoices.findColumnByName('related_invoice_id')) {
      await queryRunner.addColumn(
        'electronic_invoices',
        new TableColumn({
          name: 'related_invoice_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }
    if (invoices && !invoices.findColumnByName('relation_type')) {
      await queryRunner.addColumn(
        'electronic_invoices',
        new TableColumn({
          name: 'relation_type',
          type: 'varchar',
          length: '2',
          isNullable: true,
        }),
      );
    }
    const refreshed = await queryRunner.getTable('electronic_invoices');
    if (refreshed && !refreshed.indices.find((index) => index.name === 'idx_ei_related_invoice')) {
      await queryRunner.createIndex(
        'electronic_invoices',
        new TableIndex({
          name: 'idx_ei_related_invoice',
          columnNames: ['related_invoice_id'],
        }),
      );
    }

    if (await queryRunner.hasTable('acc_customer_debt_ledger')) {
      await queryRunner.query(`
        ALTER TABLE acc_customer_debt_ledger
        MODIFY COLUMN movement_type ENUM(
          'charge',
          'payment',
          'charge_reversal',
          'payment_reversal',
          'credit_note',
          'credit_note_reversal'
        ) NOT NULL
      `);
    }

    if (await queryRunner.hasTable('customer_credit_ledger')) return;

    await queryRunner.createTable(
      new Table({
        name: 'customer_credit_ledger',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'customer_id', type: 'int', isNullable: false },
          { name: 'fiscal_configuration_id', type: 'varchar', length: '36', isNullable: false },
          {
            name: 'currency',
            type: 'enum',
            enum: ['MXN', 'USD'],
            isNullable: false,
          },
          {
            name: 'entry_type',
            type: 'enum',
            enum: ['credit', 'reversal'],
            isNullable: false,
          },
          { name: 'amount', type: 'decimal', precision: 14, scale: 2, isNullable: false },
          { name: 'sales_order_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'electronic_invoice_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'notes', type: 'varchar', length: '255', isNullable: true },
          { name: 'created_by', type: 'varchar', length: '36', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'customer_credit_ledger',
      new TableIndex({
        name: 'uq_customer_credit_ledger_invoice',
        columnNames: ['tenant_id', 'electronic_invoice_id', 'entry_type'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'customer_credit_ledger',
      new TableIndex({
        name: 'idx_customer_credit_ledger_customer',
        columnNames: ['tenant_id', 'customer_id', 'fiscal_configuration_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('customer_credit_ledger')) {
      await queryRunner.dropTable('customer_credit_ledger');
    }
    if (await queryRunner.hasTable('acc_customer_debt_ledger')) {
      await queryRunner.query(`
        ALTER TABLE acc_customer_debt_ledger
        MODIFY COLUMN movement_type ENUM(
          'charge',
          'payment',
          'charge_reversal',
          'payment_reversal'
        ) NOT NULL
      `);
    }
    const invoices = await queryRunner.getTable('electronic_invoices');
    if (invoices?.indices.find((index) => index.name === 'idx_ei_related_invoice')) {
      await queryRunner.dropIndex('electronic_invoices', 'idx_ei_related_invoice');
    }
    if (invoices?.findColumnByName('relation_type')) {
      await queryRunner.dropColumn('electronic_invoices', 'relation_type');
    }
    if (invoices?.findColumnByName('related_invoice_id')) {
      await queryRunner.dropColumn('electronic_invoices', 'related_invoice_id');
    }
  }
}
