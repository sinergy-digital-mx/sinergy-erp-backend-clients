import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddLegacyCustomerId1779201600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customers');
    if (!table?.findColumnByName('legacy_customer_id')) {
      await queryRunner.addColumn(
        'customers',
        new TableColumn({
          name: 'legacy_customer_id',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    const updated = await queryRunner.getTable('customers');
    const hasIndex = updated?.indices.some((i) => i.name === 'IDX_customers_tenant_legacy_customer_id');
    if (!hasIndex) {
      await queryRunner.createIndex(
        'customers',
        new TableIndex({
          name: 'IDX_customers_tenant_legacy_customer_id',
          columnNames: ['tenant_id', 'legacy_customer_id'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customers');
    if (table?.indices.some((i) => i.name === 'IDX_customers_tenant_legacy_customer_id')) {
      await queryRunner.dropIndex('customers', 'IDX_customers_tenant_legacy_customer_id');
    }
    if (table?.findColumnByName('legacy_customer_id')) {
      await queryRunner.dropColumn('customers', 'legacy_customer_id');
    }
  }
}
