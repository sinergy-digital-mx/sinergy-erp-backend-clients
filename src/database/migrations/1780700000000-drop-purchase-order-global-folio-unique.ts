import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La migración 177930 debía dejar solo uq_po_batch_tenant_folio (tenant_id, folio).
 * Quedó un UNIQUE residual solo en `folio` (nombre auto TypeORM), causando
 * ER_DUP_ENTRY / 500 al crear ODC cuando otro cliente ya usa ese folio.
 */
export class DropPurchaseOrderGlobalFolioUnique1780700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const indexes: Array<{ INDEX_NAME: string }> = await queryRunner.query(
      `
      SELECT DISTINCT s.INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS s
      WHERE s.TABLE_SCHEMA = DATABASE()
        AND s.TABLE_NAME = 'inv_s_purchase_order_batch'
        AND s.NON_UNIQUE = 0
        AND s.INDEX_NAME != 'PRIMARY'
        AND s.INDEX_NAME != 'uq_po_batch_tenant_folio'
        AND s.COLUMN_NAME = 'folio'
        AND NOT EXISTS (
          SELECT 1
          FROM INFORMATION_SCHEMA.STATISTICS s2
          WHERE s2.TABLE_SCHEMA = s.TABLE_SCHEMA
            AND s2.TABLE_NAME = s.TABLE_NAME
            AND s2.INDEX_NAME = s.INDEX_NAME
            AND s2.COLUMN_NAME != 'folio'
        )
      `,
    );

    for (const row of indexes) {
      await queryRunner.query(
        `ALTER TABLE \`inv_s_purchase_order_batch\` DROP INDEX \`${row.INDEX_NAME}\``,
      );
    }

    const hasTenantFolio = await queryRunner.query(
      `
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'inv_s_purchase_order_batch'
        AND INDEX_NAME = 'uq_po_batch_tenant_folio'
      LIMIT 1
      `,
    );

    if (!hasTenantFolio.length) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`uq_po_batch_tenant_folio\`
        ON \`inv_s_purchase_order_batch\` (\`tenant_id\`, \`folio\`)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No recrear el UNIQUE global en folio: era el bug.
  }
}
