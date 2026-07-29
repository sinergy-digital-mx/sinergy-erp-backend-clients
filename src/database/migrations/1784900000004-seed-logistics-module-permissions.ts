import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds Trucks + Shippings as separate modules (RBAC unique is module_id + action).
 * Enables both on every organization and assigns Admin role permissions.
 */
export class SeedLogisticsModulePermissions1784900000004
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Limpiar intento previo con módulo único "logistics" (si quedó a medias)
    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'logistics';
    `);
    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE module_id IN (SELECT id FROM modules WHERE code = 'logistics');
    `);
    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'logistics';
    `);
    await queryRunner.query(`DELETE FROM modules WHERE code = 'logistics';`);

    await this.seedModule(queryRunner, {
      code: 'trucks',
      name: 'Camiones',
      description: 'Catálogo de camiones / flota de entrega',
      entityCode: 'Truck',
      entityName: 'Camiones',
      actions: [
        ['ViewMenu', 'Ver módulo Camiones en menú'],
        ['Create', 'Crear camiones'],
        ['Read', 'Consultar camiones'],
        ['Update', 'Actualizar camiones'],
        ['Delete', 'Desactivar camiones'],
      ],
    });

    await this.seedModule(queryRunner, {
      code: 'shippings',
      name: 'Envíos',
      description: 'Envíos y rutas de entrega',
      entityCode: 'Shipping',
      entityName: 'Envíos',
      actions: [
        ['ViewMenu', 'Ver módulo Envíos en menú'],
        ['Create', 'Crear envíos y agregar paradas'],
        ['Read', 'Consultar envíos y preview de ruta'],
        ['Update', 'Actualizar estado y recalcular distancia'],
        ['Delete', 'Cancelar envíos'],
      ],
    });
  }

  private async seedModule(
    queryRunner: QueryRunner,
    cfg: {
      code: string;
      name: string;
      description: string;
      entityCode: string;
      entityName: string;
      actions: string[][];
    },
  ): Promise<void> {
    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, created_at)
      SELECT UUID(), '${cfg.name}', '${cfg.code}',
        '${cfg.description}', NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM modules WHERE code = '${cfg.code}'
      );
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${cfg.entityCode}', '${cfg.entityName}'
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_registry WHERE code = '${cfg.entityCode}'
      );
    `);

    const actionUnions = cfg.actions
      .map(
        ([action, description], i) =>
          `${i === 0 ? '' : 'UNION ALL '}SELECT '${action}' AS action, '${description}' AS description`,
      )
      .join('\n        ');

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${cfg.code}'
      JOIN (
        ${actionUnions}
      ) a
      WHERE er.code = '${cfg.entityCode}'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND p.action = a.action
        );
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), t.id, m.id, 1, NOW()
      FROM rbac_tenants t
      JOIN modules m ON m.code = '${cfg.code}'
      WHERE NOT EXISTS (
        SELECT 1
        FROM tenant_modules tm
        WHERE tm.tenant_id = t.id
          AND tm.module_id = m.id
      );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = '${cfg.code}' LIMIT 1
      )
      WHERE r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id
            AND rp.permission_id = p.id
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const code of ['trucks', 'shippings', 'logistics']) {
      await queryRunner.query(`
        DELETE rp
        FROM rbac_role_permissions rp
        INNER JOIN rbac_permissions p ON p.id = rp.permission_id
        INNER JOIN modules m ON m.id = p.module_id
        WHERE m.code = '${code}';
      `);
      await queryRunner.query(`
        DELETE FROM tenant_modules
        WHERE module_id = (SELECT id FROM modules WHERE code = '${code}' LIMIT 1);
      `);
      await queryRunner.query(`
        DELETE p
        FROM rbac_permissions p
        INNER JOIN modules m ON m.id = p.module_id
        WHERE m.code = '${code}';
      `);
      await queryRunner.query(`DELETE FROM modules WHERE code = '${code}';`);
    }

    await queryRunner.query(`
      DELETE FROM entity_registry WHERE code IN ('Truck', 'Shipping');
    `);
  }
}
