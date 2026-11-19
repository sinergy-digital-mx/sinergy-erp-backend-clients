import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Factura de anticipo opcional por razón social, y el vínculo con la orden. */
export class AddAdvanceInvoicing1790700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const fiscal = await queryRunner.getTable('fiscal_configurations');
    if (fiscal && !fiscal.findColumnByName('advance_invoicing_enabled')) {
      await queryRunner.addColumn(
        'fiscal_configurations',
        new TableColumn({
          name: 'advance_invoicing_enabled',
          type: 'tinyint',
          width: 1,
          default: 0,
          isNullable: false,
        }),
      );
    }

    const invoices = await queryRunner.getTable('electronic_invoices');
    if (invoices && !invoices.findColumnByName('invoice_role')) {
      await queryRunner.addColumn(
        'electronic_invoices',
        new TableColumn({
          name: 'invoice_role',
          type: 'varchar',
          length: '32',
          default: "'standard'",
          isNullable: false,
        }),
      );
    }
    if (invoices && !invoices.findColumnByName('related_advance_invoice_id')) {
      await queryRunner.addColumn(
        'electronic_invoices',
        new TableColumn({
          name: 'related_advance_invoice_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }

    const orders = await queryRunner.getTable('inv_s_sales_orders');
    if (orders && !orders.findColumnByName('advance_invoice_id')) {
      await queryRunner.addColumn(
        'inv_s_sales_orders',
        new TableColumn({
          name: 'advance_invoice_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const orders = await queryRunner.getTable('inv_s_sales_orders');
    if (orders?.findColumnByName('advance_invoice_id')) {
      await queryRunner.dropColumn('inv_s_sales_orders', 'advance_invoice_id');
    }
    const invoices = await queryRunner.getTable('electronic_invoices');
    if (invoices?.findColumnByName('related_advance_invoice_id')) {
      await queryRunner.dropColumn('electronic_invoices', 'related_advance_invoice_id');
    }
    if (invoices?.findColumnByName('invoice_role')) {
      await queryRunner.dropColumn('electronic_invoices', 'invoice_role');
    }
    const fiscal = await queryRunner.getTable('fiscal_configurations');
    if (fiscal?.findColumnByName('advance_invoicing_enabled')) {
      await queryRunner.dropColumn('fiscal_configurations', 'advance_invoicing_enabled');
    }
  }
}
