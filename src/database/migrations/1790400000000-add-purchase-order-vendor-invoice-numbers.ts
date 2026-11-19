import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Una OC puede tener varias facturas de proveedor.
 * Se copia el número suelto actual al arreglo JSON.
 */
export class AddPurchaseOrderVendorInvoiceNumbers1790400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_purchase_order_batch');
    if (!table?.findColumnByName('vendor_invoice_numbers')) {
      await queryRunner.addColumn(
        'inv_s_purchase_order_batch',
        new TableColumn({
          name: 'vendor_invoice_numbers',
          type: 'json',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(`
      UPDATE inv_s_purchase_order_batch
      SET vendor_invoice_numbers = JSON_ARRAY(vendor_invoice_number)
      WHERE vendor_invoice_number IS NOT NULL
        AND TRIM(vendor_invoice_number) <> ''
        AND (vendor_invoice_numbers IS NULL OR JSON_LENGTH(vendor_invoice_numbers) = 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_purchase_order_batch');
    if (table?.findColumnByName('vendor_invoice_numbers')) {
      await queryRunner.dropColumn('inv_s_purchase_order_batch', 'vendor_invoice_numbers');
    }
  }
}
