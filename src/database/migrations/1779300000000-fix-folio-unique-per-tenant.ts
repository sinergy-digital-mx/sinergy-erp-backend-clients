import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFolioUniquePerTenant1779300000000 implements MigrationInterface {
  private async hasIndex(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1
      `,
      [tableName, indexName],
    );
    return result.length > 0;
  }

  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<void> {
    if (await this.hasIndex(queryRunner, tableName, indexName)) {
      await queryRunner.query(
        `ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``,
      );
    }
  }

  private async createTenantFolioUnique(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<void> {
    if (!(await this.hasIndex(queryRunner, tableName, indexName))) {
      await queryRunner.query(
        `CREATE UNIQUE INDEX \`${indexName}\` ON \`${tableName}\` (\`tenant_id\`, \`folio\`)`,
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.dropIndexIfExists(
      queryRunner,
      'inv_s_purchase_order_batch',
      'idx_folio',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'inv_s_purchase_order_batch',
      'folio',
    );
    await this.createTenantFolioUnique(
      queryRunner,
      'inv_s_purchase_order_batch',
      'uq_po_batch_tenant_folio',
    );

    await this.dropIndexIfExists(queryRunner, 'inv_s_sales_orders', 'folio');
    await this.dropIndexIfExists(
      queryRunner,
      'inv_s_sales_orders',
      'idx_folio',
    );
    await this.createTenantFolioUnique(
      queryRunner,
      'inv_s_sales_orders',
      'uq_so_tenant_folio',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropIndexIfExists(
      queryRunner,
      'inv_s_purchase_order_batch',
      'uq_po_batch_tenant_folio',
    );
    if (!(await this.hasIndex(queryRunner, 'inv_s_purchase_order_batch', 'idx_folio'))) {
      await queryRunner.query(
        `CREATE UNIQUE INDEX \`idx_folio\` ON \`inv_s_purchase_order_batch\` (\`folio\`)`,
      );
    }

    await this.dropIndexIfExists(
      queryRunner,
      'inv_s_sales_orders',
      'uq_so_tenant_folio',
    );
    if (!(await this.hasIndex(queryRunner, 'inv_s_sales_orders', 'folio'))) {
      await queryRunner.query(
        `CREATE UNIQUE INDEX \`folio\` ON \`inv_s_sales_orders\` (\`folio\`)`,
      );
    }
  }
}
