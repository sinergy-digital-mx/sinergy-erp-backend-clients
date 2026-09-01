import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 178690 no matcheó "Campestre Divino" porque el grupo de sistema
 * tenía un salto de línea al final. Une duplicados por nombre
 * normalizado y limpia los nombres. Conserva el UUID del grupo
 * de sistema (Divino: 9917f55f-c03d-4436-83be-95b03360794c).
 */
export class MergeDuplicateCustomerGroupsFromPropertyMap1786910000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE customer_groups
      SET name = TRIM(REPLACE(REPLACE(name, CHAR(13), ''), CHAR(10), ''))
      WHERE name <> TRIM(REPLACE(REPLACE(name, CHAR(13), ''), CHAR(10), ''))
    `);

    const groups: Array<{
      id: string;
      tenant_id: string;
      name: string;
      is_system: number;
      created_at: Date;
    }> = await queryRunner.query(`
      SELECT id, tenant_id, name, is_system, created_at
      FROM customer_groups
      ORDER BY tenant_id, name, is_system DESC, created_at ASC
    `);

    const buckets = new Map<string, typeof groups>();
    for (const g of groups) {
      const key = `${g.tenant_id}:${g.name.trim().toLowerCase()}`;
      const list = buckets.get(key) ?? [];
      list.push(g);
      buckets.set(key, list);
    }

    for (const list of buckets.values()) {
      if (list.length < 2) {
        continue;
      }

      list.sort((a, b) => {
        if (a.is_system !== b.is_system) {
          return b.is_system - a.is_system;
        }
        return String(a.created_at).localeCompare(String(b.created_at));
      });

      const keeper = list[0];
      for (const extra of list.slice(1)) {
        await queryRunner.query(
          `UPDATE properties SET group_id = ? WHERE group_id = ?`,
          [keeper.id, extra.id],
        );
        await queryRunner.query(
          `UPDATE customers SET group_id = ? WHERE group_id = ?`,
          [keeper.id, extra.id],
        );

        const leftover: Array<{ lots: string; customers: string }> =
          await queryRunner.query(
            `
            SELECT
              (SELECT COUNT(*) FROM properties WHERE group_id = ?) AS lots,
              (SELECT COUNT(*) FROM customers WHERE group_id = ?) AS customers
            `,
            [extra.id, extra.id],
          );

        if (
          Number(leftover[0]?.lots ?? 1) === 0 &&
          Number(leftover[0]?.customers ?? 1) === 0
        ) {
          await queryRunner.query(`DELETE FROM customer_groups WHERE id = ?`, [
            extra.id,
          ]);
        }
      }
    }
  }

  public async down(): Promise<void> {
    // Irreversible: merge de duplicados.
  }
}
