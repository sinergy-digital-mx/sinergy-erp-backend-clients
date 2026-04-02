import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTotalsToPurchaseOrderBatch1743667300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'requested_subtotal',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'requested_iva_total',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'requested_ieps_total',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'requested_total',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'received_subtotal',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'received_iva_total',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'received_ieps_total',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'received_total',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'received_total');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'received_ieps_total');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'received_iva_total');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'received_subtotal');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'requested_total');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'requested_ieps_total');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'requested_iva_total');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'requested_subtotal');
  }
}
