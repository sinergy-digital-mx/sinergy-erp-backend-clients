import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceSubscriptions1792000000000 implements MigrationInterface {
  name = 'CreateServiceSubscriptions1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_subscriptions (
        id varchar(36) NOT NULL,
        tenant_id varchar(36) NOT NULL,
        customer_id int NOT NULL,
        title varchar(160) NOT NULL,
        monthly_amount decimal(12,2) NOT NULL,
        iva_percentage decimal(5,2) NOT NULL DEFAULT 16.00,
        fiscal_configuration_id varchar(36) NOT NULL,
        billing_branch_id varchar(36) NOT NULL,
        product_id varchar(36) NOT NULL,
        product_uom_id varchar(36) NOT NULL,
        start_month date NOT NULL,
        end_month date NOT NULL,
        billing_day tinyint NOT NULL DEFAULT 1,
        status varchar(20) NOT NULL DEFAULT 'active',
        uso_cfdi varchar(3) NOT NULL DEFAULT 'G03',
        forma_pago varchar(2) NOT NULL DEFAULT '99',
        metodo_pago varchar(3) NOT NULL DEFAULT 'PPD',
        regimen_fiscal_receptor varchar(3) NOT NULL DEFAULT '601',
        notes text NULL,
        renewed_from_id varchar(36) NULL,
        created_by varchar(36) NOT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_svc_sub_tenant (tenant_id),
        KEY idx_svc_sub_customer (customer_id),
        KEY idx_svc_sub_status (status)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_subscription_periods (
        id varchar(36) NOT NULL,
        tenant_id varchar(36) NOT NULL,
        subscription_id varchar(36) NOT NULL,
        period_month date NOT NULL,
        amount decimal(12,2) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'pending',
        sales_order_id varchar(36) NULL,
        electronic_invoice_id varchar(36) NULL,
        linked_manually tinyint(1) NOT NULL DEFAULT 0,
        invoice_error text NULL,
        generated_at timestamp NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_svc_period_month (subscription_id, period_month),
        UNIQUE KEY uq_svc_period_order (sales_order_id),
        KEY idx_svc_period_subscription (subscription_id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS service_subscription_periods');
    await queryRunner.query('DROP TABLE IF EXISTS service_subscriptions');
  }
}
