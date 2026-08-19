import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCustomerCreditsPerFiscal1786000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer_credits');
    if (!table) {
      await queryRunner.createTable(
        new Table({
          name: 'customer_credits',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
            },
            { name: 'tenant_id', type: 'varchar', length: '36' },
            { name: 'customer_id', type: 'int' },
            { name: 'fiscal_configuration_id', type: 'varchar', length: '36' },
            {
              name: 'credit_enabled',
              type: 'boolean',
              default: false,
              isNullable: false,
            },
            { name: 'credit_days', type: 'int', isNullable: true },
            {
              name: 'credit_amount',
              type: 'decimal',
              precision: 14,
              scale: 2,
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

      await queryRunner.createIndex(
        'customer_credits',
        new TableIndex({
          name: 'idx_customer_credits_tenant',
          columnNames: ['tenant_id'],
        }),
      );

      await queryRunner.createIndex(
        'customer_credits',
        new TableIndex({
          name: 'uq_customer_credit_fiscal',
          columnNames: ['tenant_id', 'customer_id', 'fiscal_configuration_id'],
          isUnique: true,
        }),
      );

      await queryRunner.createForeignKey(
        'customer_credits',
        new TableForeignKey({
          name: 'fk_customer_credits_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'rbac_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'customer_credits',
        new TableForeignKey({
          name: 'fk_customer_credits_customer',
          columnNames: ['customer_id'],
          referencedTableName: 'customers',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'customer_credits',
        new TableForeignKey({
          name: 'fk_customer_credits_fiscal',
          columnNames: ['fiscal_configuration_id'],
          referencedTableName: 'fiscal_configurations',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    await queryRunner.query(`
      INSERT INTO customer_credits (
        id, tenant_id, customer_id, fiscal_configuration_id,
        credit_enabled, credit_days, credit_amount, created_at, updated_at
      )
      SELECT
        UUID(),
        c.tenant_id,
        c.id,
        fc.id,
        c.credit_enabled,
        c.credit_days,
        c.credit_amount,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM customers c
      INNER JOIN fiscal_configurations fc
        ON fc.tenant_id = c.tenant_id
        AND fc.status = 'active'
      WHERE (c.credit_enabled = 1 OR (c.credit_amount IS NOT NULL AND c.credit_amount > 0))
        AND NOT EXISTS (
          SELECT 1 FROM customer_credits cc
          WHERE cc.tenant_id = c.tenant_id
            AND cc.customer_id = c.id
            AND cc.fiscal_configuration_id = fc.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer_credits');
    if (!table) {
      return;
    }
    for (const fk of table.foreignKeys) {
      await queryRunner.dropForeignKey('customer_credits', fk);
    }
    await queryRunner.dropTable('customer_credits');
  }
}
