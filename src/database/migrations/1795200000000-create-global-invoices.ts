import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Factura global mensual: un CFDI vigente por razón social y mes,
 * con las órdenes de venta que aún no tenían factura.
 */
export class CreateGlobalInvoices1795200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS global_invoices (
        id CHAR(36) NOT NULL,
        tenant_id CHAR(36) NOT NULL,
        fiscal_configuration_id CHAR(36) NOT NULL,
        period_year SMALLINT NOT NULL,
        period_month TINYINT NOT NULL,
        status VARCHAR(16) NOT NULL,
        active_key VARCHAR(80) NULL,
        electronic_invoice_id CHAR(36) NULL,
        created_by CHAR(36) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_global_invoice_active (tenant_id, active_key),
        KEY idx_global_invoice_period (tenant_id, fiscal_configuration_id, period_year, period_month),
        CONSTRAINT fk_global_invoice_tenant FOREIGN KEY (tenant_id) REFERENCES rbac_tenants (id) ON DELETE CASCADE,
        CONSTRAINT fk_global_invoice_fiscal FOREIGN KEY (fiscal_configuration_id) REFERENCES fiscal_configurations (id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS global_invoice_orders (
        id CHAR(36) NOT NULL,
        global_invoice_id CHAR(36) NOT NULL,
        sales_order_id CHAR(36) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_global_invoice_order (global_invoice_id, sales_order_id),
        KEY idx_global_invoice_order_sales (sales_order_id),
        CONSTRAINT fk_global_invoice_order_header FOREIGN KEY (global_invoice_id) REFERENCES global_invoices (id) ON DELETE CASCADE,
        CONSTRAINT fk_global_invoice_order_sales FOREIGN KEY (sales_order_id) REFERENCES inv_s_sales_orders (id) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS global_invoice_orders');
    await queryRunner.query('DROP TABLE IF EXISTS global_invoices');
  }
}
