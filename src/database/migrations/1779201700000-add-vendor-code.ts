import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddVendorCode1779201700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('vendors');
    if (!table?.findColumnByName('vendor_code')) {
      await queryRunner.addColumn(
        'vendors',
        new TableColumn({
          name: 'vendor_code',
          type: 'varchar',
          length: '32',
          isNullable: true,
        }),
      );
    }

    const updated = await queryRunner.getTable('vendors');
    const hasIndex = updated?.indices.some((i) => i.name === 'IDX_vendors_tenant_vendor_code');
    if (!hasIndex) {
      await queryRunner.createIndex(
        'vendors',
        new TableIndex({
          name: 'IDX_vendors_tenant_vendor_code',
          columnNames: ['tenant_id', 'vendor_code'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('vendors');
    if (table?.indices.some((i) => i.name === 'IDX_vendors_tenant_vendor_code')) {
      await queryRunner.dropIndex('vendors', 'IDX_vendors_tenant_vendor_code');
    }
    if (table?.findColumnByName('vendor_code')) {
      await queryRunner.dropColumn('vendors', 'vendor_code');
    }
  }
}
