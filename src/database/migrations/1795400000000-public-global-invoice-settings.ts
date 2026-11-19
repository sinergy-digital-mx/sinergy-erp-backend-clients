import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Cierre de factura a público en general por razón social:
 * hora, zona horaria, bloqueo después del mes y folio del proceso automático.
 */
export class PublicGlobalInvoiceSettings1795400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const fiscal = await queryRunner.getTable('fiscal_configurations');
    if (fiscal) {
      await this.addColumn(queryRunner, fiscal, 'fiscal_configurations', {
        name: 'global_invoice_auto_enabled',
        type: 'tinyint',
        width: 1,
        default: 0,
        isNullable: false,
      });
      await this.addColumn(queryRunner, fiscal, 'fiscal_configurations', {
        name: 'global_invoice_block_after_month',
        type: 'tinyint',
        width: 1,
        default: 0,
        isNullable: false,
      });
      await this.addColumn(queryRunner, fiscal, 'fiscal_configurations', {
        name: 'global_invoice_hour',
        type: 'tinyint',
        isNullable: true,
      });
      await this.addColumn(queryRunner, fiscal, 'fiscal_configurations', {
        name: 'global_invoice_timezone',
        type: 'varchar',
        length: '64',
        isNullable: true,
      });
    }

    const invoices = await queryRunner.getTable('global_invoices');
    if (invoices && !invoices.findColumnByName('process_folio')) {
      await queryRunner.addColumn(
        'global_invoices',
        new TableColumn({
          name: 'process_folio',
          type: 'varchar',
          length: '32',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS global_invoice_auto_runs (
        id CHAR(36) NOT NULL,
        tenant_id CHAR(36) NOT NULL,
        fiscal_configuration_id CHAR(36) NOT NULL,
        billing_branch_id CHAR(36) NOT NULL,
        period_year SMALLINT NOT NULL,
        period_month TINYINT NOT NULL,
        folio VARCHAR(32) NOT NULL,
        status VARCHAR(16) NOT NULL,
        message TEXT NULL,
        global_invoice_id CHAR(36) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_global_invoice_auto_run (billing_branch_id, period_year, period_month),
        KEY idx_global_invoice_auto_run_tenant (tenant_id, period_year, period_month)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS global_invoice_auto_runs');
    for (const column of ['process_folio']) {
      await this.dropColumn(queryRunner, 'global_invoices', column);
    }
    for (const column of [
      'global_invoice_timezone',
      'global_invoice_hour',
      'global_invoice_block_after_month',
      'global_invoice_auto_enabled',
    ]) {
      await this.dropColumn(queryRunner, 'fiscal_configurations', column);
    }
  }

  private async addColumn(
    queryRunner: QueryRunner,
    table: { findColumnByName(name: string): unknown },
    tableName: string,
    column: {
      name: string;
      type: string;
      width?: number;
      length?: string;
      default?: number;
      isNullable?: boolean;
    },
  ): Promise<void> {
    if (table.findColumnByName(column.name)) return;
    await queryRunner.addColumn(tableName, new TableColumn(column));
  }

  private async dropColumn(
    queryRunner: QueryRunner,
    tableName: string,
    column: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(column)) return;
    await queryRunner.dropColumn(tableName, column);
  }
}
