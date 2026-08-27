import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLineBreakdownToPurchaseOrderDetail1786600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const requested = [
      'line_subtotal',
      'line_iva',
      'line_ieps',
      'line_total',
    ];
    for (const name of requested) {
      await queryRunner.addColumn(
        'inv_s_purchase_order_batch_detail',
        new TableColumn({
          name,
          type: 'decimal',
          precision: 12,
          scale: 2,
          default: 0,
          isNullable: false,
        }),
      );
    }

    const received = [
      'received_line_subtotal',
      'received_line_iva',
      'received_line_ieps',
      'received_line_total',
    ];
    for (const name of received) {
      await queryRunner.addColumn(
        'inv_s_purchase_order_batch_detail',
        new TableColumn({
          name,
          type: 'decimal',
          precision: 12,
          scale: 2,
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(`
      UPDATE inv_s_purchase_order_batch_detail
      SET
        line_subtotal = ROUND(quantity * unit_total, 2),
        line_iva = ROUND(quantity * unit_total * iva_percentage / 100, 2),
        line_ieps = ROUND(quantity * unit_total * ieps_percentage / 100, 2),
        line_total = ROUND(
          quantity * unit_total
          + quantity * unit_total * iva_percentage / 100
          + quantity * unit_total * ieps_percentage / 100,
          2
        )
    `);

    await queryRunner.query(`
      UPDATE inv_s_purchase_order_batch_detail
      SET
        received_line_subtotal = ROUND(received_original_quantity * received_original_unit_total, 2),
        received_line_iva = ROUND(
          received_original_quantity * received_original_unit_total
          * COALESCE(received_original_iva_percentage, 0) / 100,
          2
        ),
        received_line_ieps = ROUND(
          received_original_quantity * received_original_unit_total
          * COALESCE(received_original_ieps_percentage, 0) / 100,
          2
        ),
        received_line_total = ROUND(
          received_original_quantity * received_original_unit_total
          + received_original_quantity * received_original_unit_total
            * COALESCE(received_original_iva_percentage, 0) / 100
          + received_original_quantity * received_original_unit_total
            * COALESCE(received_original_ieps_percentage, 0) / 100,
          2
        )
      WHERE received_original_quantity IS NOT NULL
        AND received_original_unit_total IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'inv_s_purchase_order_batch_detail',
      'received_line_total',
    );
    await queryRunner.dropColumn(
      'inv_s_purchase_order_batch_detail',
      'received_line_ieps',
    );
    await queryRunner.dropColumn(
      'inv_s_purchase_order_batch_detail',
      'received_line_iva',
    );
    await queryRunner.dropColumn(
      'inv_s_purchase_order_batch_detail',
      'received_line_subtotal',
    );
    await queryRunner.dropColumn('inv_s_purchase_order_batch_detail', 'line_total');
    await queryRunner.dropColumn('inv_s_purchase_order_batch_detail', 'line_ieps');
    await queryRunner.dropColumn('inv_s_purchase_order_batch_detail', 'line_iva');
    await queryRunner.dropColumn(
      'inv_s_purchase_order_batch_detail',
      'line_subtotal',
    );
  }
}
