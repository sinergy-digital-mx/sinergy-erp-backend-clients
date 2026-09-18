import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateSalesOrderInvoiceEmail1789200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('inv_s_sales_order_invoice_email_templates'))) {
      await queryRunner.createTable(
        new Table({
          name: 'inv_s_sales_order_invoice_email_templates',
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
              name: 'subject',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'body_html',
              type: 'longtext',
              isNullable: false,
            },
            {
              name: 'updated_by',
              type: 'varchar',
              length: '36',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
        }),
      );

      await queryRunner.createIndex(
        'inv_s_sales_order_invoice_email_templates',
        new TableIndex({
          name: 'uq_so_invoice_email_template_tenant',
          columnNames: ['tenant_id'],
          isUnique: true,
        }),
      );

      await queryRunner.createForeignKey(
        'inv_s_sales_order_invoice_email_templates',
        new TableForeignKey({
          name: 'fk_so_invoice_email_template_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'rbac_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'inv_s_sales_order_invoice_email_templates',
        new TableForeignKey({
          name: 'fk_so_invoice_email_template_user',
          columnNames: ['updated_by'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    if (!(await queryRunner.hasTable('inv_s_sales_order_invoice_emails'))) {
      await queryRunner.createTable(
        new Table({
          name: 'inv_s_sales_order_invoice_emails',
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
              name: 'sales_order_id',
              type: 'varchar',
              length: '36',
              isNullable: false,
            },
            {
              name: 'invoice_id',
              type: 'varchar',
              length: '36',
              isNullable: false,
            },
            {
              name: 'to_email',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'cc',
              type: 'json',
              isNullable: true,
            },
            {
              name: 'subject',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'message',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'sent_by',
              type: 'varchar',
              length: '36',
              isNullable: true,
            },
            {
              name: 'sent_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
        }),
      );

      await queryRunner.createIndex(
        'inv_s_sales_order_invoice_emails',
        new TableIndex({
          name: 'idx_so_invoice_email_order',
          columnNames: ['sales_order_id'],
        }),
      );

      await queryRunner.createIndex(
        'inv_s_sales_order_invoice_emails',
        new TableIndex({
          name: 'idx_so_invoice_email_invoice',
          columnNames: ['invoice_id'],
        }),
      );

      await queryRunner.createIndex(
        'inv_s_sales_order_invoice_emails',
        new TableIndex({
          name: 'idx_so_invoice_email_tenant',
          columnNames: ['tenant_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'inv_s_sales_order_invoice_emails',
        new TableForeignKey({
          name: 'fk_so_invoice_email_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'rbac_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'inv_s_sales_order_invoice_emails',
        new TableForeignKey({
          name: 'fk_so_invoice_email_order',
          columnNames: ['sales_order_id'],
          referencedTableName: 'inv_s_sales_orders',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'inv_s_sales_order_invoice_emails',
        new TableForeignKey({
          name: 'fk_so_invoice_email_user',
          columnNames: ['sent_by'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('inv_s_sales_order_invoice_emails')) {
      await queryRunner.dropTable('inv_s_sales_order_invoice_emails');
    }
    if (await queryRunner.hasTable('inv_s_sales_order_invoice_email_templates')) {
      await queryRunner.dropTable('inv_s_sales_order_invoice_email_templates');
    }
  }
}
