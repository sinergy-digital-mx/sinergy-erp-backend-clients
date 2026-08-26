import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddInventoryBatchListIndexes1786500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'inv_s_batches',
      new TableIndex({
        name: 'idx_inv_s_batches_tenant_created',
        columnNames: ['tenant_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_batches',
      new TableIndex({
        name: 'idx_inv_s_batches_tenant_product_warehouse',
        columnNames: ['tenant_id', 'product_id', 'warehouse_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('inv_s_batches', 'idx_inv_s_batches_tenant_product_warehouse');
    await queryRunner.dropIndex('inv_s_batches', 'idx_inv_s_batches_tenant_created');
  }
}
