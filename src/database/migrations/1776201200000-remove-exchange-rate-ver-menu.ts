import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveExchangeRateVerMenu1776201200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'exchange-rate'
        AND p.action = 'Ver_Menu';
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'exchange-rate'
        AND p.action = 'Ver_Menu';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, 'Ver_Menu', 'Show Exchange Rate module in sidebar', 1, NOW(), NOW()
      FROM modules m
      JOIN entity_registry er ON er.code = 'exchange-rate'
      WHERE m.code = 'exchange-rate'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND p.action = 'Ver_Menu'
        );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN modules m ON m.code = 'exchange-rate'
      JOIN rbac_permissions p ON p.module_id = m.id AND p.action = 'Ver_Menu'
      WHERE r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id
            AND rp.permission_id = p.id
        );
    `);
  }
}
