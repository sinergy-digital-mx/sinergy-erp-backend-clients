import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePurchaseOrderActivities1787200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_purchase_order_activities',
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
            name: 'purchase_order_batch_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'actor_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'occurred_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'changes',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_activities',
      new TableIndex({
        name: 'idx_po_activity_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_activities',
      new TableIndex({
        name: 'idx_po_activity_order',
        columnNames: ['purchase_order_batch_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_activities',
      new TableIndex({
        name: 'idx_po_activity_occurred',
        columnNames: ['purchase_order_batch_id', 'occurred_at'],
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_purchase_order_activities',
      new TableForeignKey({
        name: 'fk_po_activity_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_purchase_order_activities',
      new TableForeignKey({
        name: 'fk_po_activity_order',
        columnNames: ['purchase_order_batch_id'],
        referencedTableName: 'inv_s_purchase_order_batch',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_purchase_order_activities',
      new TableForeignKey({
        name: 'fk_po_activity_actor',
        columnNames: ['actor_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inv_s_purchase_order_activities');
  }
}
