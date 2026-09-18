import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Escenario POS (caja vs ventas) y permiso para reintegrar un ticket a ventas.
 */
export class AddPosStageAndReturnToSales1789900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE inv_s_sales_orders
      ADD COLUMN pos_stage ENUM('caja', 'ventas') NULL
      COMMENT 'Solo POS: caja = pendiente de cobro; ventas = reintegrado para editar'
      AFTER pos_daily_shift_id
    `);

    await queryRunner.query(`
      UPDATE inv_s_sales_orders
      SET pos_stage = 'caja'
      WHERE sales_order_type = 'POS'
        AND pos_stage IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_so_pos_stage
      ON inv_s_sales_orders (tenant_id, sales_order_type, pos_stage)
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT
        UUID(),
        COALESCE(
          (
            SELECT p.entity_registry_id
            FROM rbac_permissions p
            WHERE p.module_id = m.id
            ORDER BY
              CASE WHEN LOWER(p.action) IN ('create', 'read', 'viewmenu') THEN 0 ELSE 1 END,
              p.created_at
            LIMIT 1
          ),
          (
            SELECT er.id
            FROM entity_registry er
            WHERE LOWER(er.code) = 'pos'
            LIMIT 1
          )
        ),
        m.id,
        'ReturnToSales',
        'Permitir revertir o regresar un ticket emitido hacia el flujo activo de ventas.',
        1,
        NOW(),
        NOW()
      FROM modules m
      WHERE m.code = 'pos'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND LOWER(p.action) = 'returntosales'
        )
        AND COALESCE(
          (
            SELECT p.entity_registry_id
            FROM rbac_permissions p
            WHERE p.module_id = m.id
            ORDER BY
              CASE WHEN LOWER(p.action) IN ('create', 'read', 'viewmenu') THEN 0 ELSE 1 END,
              p.created_at
            LIMIT 1
          ),
          (
            SELECT er.id
            FROM entity_registry er
            WHERE LOWER(er.code) = 'pos'
            LIMIT 1
          )
        ) IS NOT NULL
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, perm.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions perm
        ON perm.module_id = (SELECT id FROM modules WHERE code = 'pos' LIMIT 1)
       AND LOWER(perm.action) = 'returntosales'
      WHERE (
        r.is_admin = 1
        OR r.name = 'Admin'
        OR EXISTS (
          SELECT 1
          FROM rbac_role_permissions rp
          INNER JOIN rbac_permissions p ON p.id = rp.permission_id
          INNER JOIN entity_registry er ON er.id = p.entity_registry_id
          WHERE rp.role_id = r.id
            AND er.code = 'PosShift'
            AND LOWER(p.action) = 'update'
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM rbac_role_permissions rp
        WHERE rp.role_id = r.id
          AND rp.permission_id = perm.id
      )
    `);

    await queryRunner.query(`
      UPDATE users
      SET permissions_version = COALESCE(permissions_version, 0) + 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'pos'
        AND LOWER(p.action) = 'returntosales'
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'pos'
        AND LOWER(p.action) = 'returntosales'
    `);

    await queryRunner.query(`
      DROP INDEX idx_so_pos_stage ON inv_s_sales_orders
    `);

    await queryRunner.query(`
      ALTER TABLE inv_s_sales_orders
      DROP COLUMN pos_stage
    `);
  }
}
