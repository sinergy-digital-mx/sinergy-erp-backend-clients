import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Los lotes dejan de colgar de property_groups (el dropdown "Proyecto")
 * y usan el mismo catálogo que clientes/contratos: customer_groups.
 *
 * Mapeo por nombre (misma organización, case-insensitive). Si no hay grupo
 * de cliente con ese nombre, se crea uno. Los UUID de customer_groups
 * existentes (p. ej. Divino) no se tocan.
 */
export class PointPropertiesGroupToCustomerGroups1786900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const propertyGroups: Array<{
      id: string;
      tenant_id: string;
      name: string;
      description: string | null;
    }> = await queryRunner.query(
      `SELECT id, tenant_id, name, description FROM property_groups`,
    );

    const pgIdToCgId = new Map<string, string>();

    for (const pg of propertyGroups) {
      const existing: Array<{ id: string }> = await queryRunner.query(
        `
        SELECT id FROM customer_groups
        WHERE tenant_id = ?
          AND LOWER(TRIM(REPLACE(REPLACE(name, CHAR(13), ''), CHAR(10), '')))
            = LOWER(TRIM(REPLACE(REPLACE(?, CHAR(13), ''), CHAR(10), '')))
        LIMIT 1
        `,
        [pg.tenant_id, pg.name],
      );

      let customerGroupId: string;
      if (existing.length) {
        customerGroupId = existing[0].id;
      } else {
        customerGroupId = randomUUID();
        await queryRunner.query(
          `
          INSERT INTO customer_groups
            (id, tenant_id, name, description, is_system, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, NOW(), NOW())
          `,
          [customerGroupId, pg.tenant_id, pg.name, pg.description],
        );
      }
      pgIdToCgId.set(pg.id, customerGroupId);
    }

    const fks: Array<{ CONSTRAINT_NAME: string }> = await queryRunner.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'properties'
        AND COLUMN_NAME = 'group_id'
        AND REFERENCED_TABLE_NAME = 'property_groups'
    `);

    for (const fk of fks) {
      await queryRunner.query(
        `ALTER TABLE properties DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``,
      );
    }

    for (const [propertyGroupId, customerGroupId] of pgIdToCgId) {
      await queryRunner.query(
        `UPDATE properties SET group_id = ? WHERE group_id = ?`,
        [customerGroupId, propertyGroupId],
      );
    }

    await queryRunner.query(`
      ALTER TABLE properties
      ADD CONSTRAINT FK_properties_customer_group
      FOREIGN KEY (group_id) REFERENCES customer_groups(id)
      ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE properties DROP FOREIGN KEY FK_properties_customer_group
    `);

    await queryRunner.query(`
      UPDATE properties p
      INNER JOIN customer_groups cg ON cg.id = p.group_id
      INNER JOIN property_groups pg
        ON pg.tenant_id = p.tenant_id
       AND LOWER(TRIM(pg.name)) = LOWER(TRIM(cg.name))
      SET p.group_id = pg.id
    `);

    await queryRunner.query(`
      ALTER TABLE properties
      ADD CONSTRAINT FK_properties_property_group
      FOREIGN KEY (group_id) REFERENCES property_groups(id)
      ON DELETE CASCADE
    `);
  }
}
