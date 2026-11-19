import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

/**
 * La factura global vigente pasa de razón social a sucursal.
 * Las que ya cubrían una sola sucursal se les asigna esa sucursal.
 */
export class GlobalInvoiceByBranch1795300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('global_invoices');
    if (!table) return;

    if (!table.findColumnByName('billing_branch_id')) {
      await queryRunner.addColumn(
        'global_invoices',
        new TableColumn({
          name: 'billing_branch_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(`
      UPDATE global_invoices gi
      INNER JOIN (
        SELECT gio.global_invoice_id AS id, MIN(so.billing_branch_id) AS billing_branch_id
        FROM global_invoice_orders gio
        INNER JOIN inv_s_sales_orders so ON so.id = gio.sales_order_id
        GROUP BY gio.global_invoice_id
        HAVING COUNT(DISTINCT so.billing_branch_id) = 1
           AND MIN(so.billing_branch_id) IS NOT NULL
      ) src ON src.id = gi.id
      SET gi.billing_branch_id = src.billing_branch_id
      WHERE gi.billing_branch_id IS NULL
    `);

    await queryRunner.query(`
      UPDATE global_invoices
      SET active_key = CONCAT(billing_branch_id, ':', period_year, ':', LPAD(period_month, 2, '0'))
      WHERE billing_branch_id IS NOT NULL
        AND status IN ('pending', 'active')
        AND active_key IS NOT NULL
    `);

    const updated = await queryRunner.getTable('global_invoices');
    const hasIndex = updated?.indices.some((index) => index.name === 'idx_global_invoice_branch');
    if (!hasIndex) {
      await queryRunner.createIndex(
        'global_invoices',
        new TableIndex({
          name: 'idx_global_invoice_branch',
          columnNames: ['tenant_id', 'billing_branch_id', 'period_year', 'period_month'],
        }),
      );
    }

    const hasFk = updated?.foreignKeys.some((fk) => fk.name === 'fk_global_invoice_branch');
    if (!hasFk) {
      await queryRunner.createForeignKey(
        'global_invoices',
        new TableForeignKey({
          name: 'fk_global_invoice_branch',
          columnNames: ['billing_branch_id'],
          referencedTableName: 'billing_branches',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('global_invoices');
    if (!table) return;

    const fk = table.foreignKeys.find((item) => item.name === 'fk_global_invoice_branch');
    if (fk) {
      await queryRunner.dropForeignKey('global_invoices', fk);
    }
    const index = table.indices.find((item) => item.name === 'idx_global_invoice_branch');
    if (index) {
      await queryRunner.dropIndex('global_invoices', index);
    }
    if (table.findColumnByName('billing_branch_id')) {
      await queryRunner.dropColumn('global_invoices', 'billing_branch_id');
    }
  }
}
