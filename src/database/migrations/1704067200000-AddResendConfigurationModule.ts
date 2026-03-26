import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResendConfigurationModule1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get or create the entity registry entry for resend_configurations
    const registryResult = await queryRunner.query(
      `SELECT id FROM entity_registry WHERE code = 'resend_configurations' LIMIT 1`
    );
    let registryId = registryResult[0]?.id;

    if (!registryId) {
      await queryRunner.query(`
        INSERT INTO entity_registry (code, name) 
        VALUES ('resend_configurations', 'Resend Configurations')
      `);
      const newRegistry = await queryRunner.query(
        `SELECT id FROM entity_registry WHERE code = 'resend_configurations' LIMIT 1`
      );
      registryId = newRegistry[0]?.id;
    }

    // Insert Resend Configuration Module
    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description) 
      VALUES (
        UUID(),
        'Resend Configuration',
        'resend_configuration',
        'Manage Resend email service provider configurations'
      )
    `);

    // Get the module ID
    const moduleResult = await queryRunner.query(
      `SELECT id FROM modules WHERE code = 'resend_configuration'`
    );
    const moduleId = moduleResult[0]?.id;

    if (moduleId) {
      // Add module to all existing tenants
      await queryRunner.query(`
        INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled)
        SELECT UUID(), id, '${moduleId}', 1 FROM rbac_tenants
      `);

      // Create permissions for the module
      const permissions = [
        { action: 'Create', description: 'Create new Resend configurations' },
        { action: 'Read', description: 'Read Resend configurations' },
        { action: 'Update', description: 'Update Resend configurations' },
        { action: 'Delete', description: 'Delete Resend configurations' },
        { action: 'Test', description: 'Test Resend configuration connections' },
      ];

      for (const perm of permissions) {
        await queryRunner.query(`
          INSERT INTO rbac_permissions (id, module_id, entity_registry_id, action, description) 
          VALUES (UUID(), '${moduleId}', ${registryId}, '${perm.action}', '${perm.description}')
        `);
      }

      // Get admin role ID
      const adminRoleResult = await queryRunner.query(
        `SELECT id FROM rbac_roles WHERE is_admin = 1 LIMIT 1`
      );
      const adminRoleId = adminRoleResult[0]?.id;

      if (adminRoleId) {
        // Assign all permissions to admin role
        await queryRunner.query(`
          INSERT INTO rbac_role_permissions (id, role_id, permission_id)
          SELECT UUID(), '${adminRoleId}', id
          FROM rbac_permissions 
          WHERE module_id = '${moduleId}'
          AND id NOT IN (
            SELECT permission_id FROM rbac_role_permissions 
            WHERE role_id = '${adminRoleId}'
          )
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const moduleResult = await queryRunner.query(
      `SELECT id FROM modules WHERE code = 'resend_configuration'`
    );
    const moduleId = moduleResult[0]?.id;

    if (moduleId) {
      // Remove permissions
      await queryRunner.query(`
        DELETE FROM rbac_role_permissions 
        WHERE permission_id IN (
          SELECT id FROM rbac_permissions 
          WHERE module_id = '${moduleId}'
        )
      `);

      await queryRunner.query(`
        DELETE FROM rbac_permissions 
        WHERE module_id = '${moduleId}'
      `);

      // Remove module from tenants
      await queryRunner.query(`
        DELETE FROM tenant_modules 
        WHERE module_id = '${moduleId}'
      `);

      // Remove module
      await queryRunner.query(`
        DELETE FROM modules WHERE id = '${moduleId}'
      `);
    }

    // Remove entity registry entry
    await queryRunner.query(`
      DELETE FROM entity_registry WHERE code = 'resend_configurations'
    `);
  }
}
