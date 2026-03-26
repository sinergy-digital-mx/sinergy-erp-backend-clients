import { DataSource } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function seedResendConfigurationModule(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Check if module already exists
    const existingModule = await queryRunner.query(
      `SELECT id FROM modules WHERE code = 'resend_configuration'`
    );

    if (existingModule.length > 0) {
      console.log('Resend Configuration module already exists. Skipping seed.');
      return;
    }

    // Insert Resend Configuration Module
    const moduleId = uuid();
    await queryRunner.query(
      `INSERT INTO modules (id, name, code, description) VALUES (?, ?, ?, ?)`,
      [
        moduleId,
        'Resend Configuration',
        'resend_configuration',
        'Manage Resend email service provider configurations',
      ]
    );

    console.log('✓ Created Resend Configuration module');

    // Add module to all existing tenants
    const tenants = await queryRunner.query(`SELECT id FROM rbac_tenants`);

    for (const tenant of tenants) {
      await queryRunner.query(
        `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled) VALUES (?, ?, ?, ?)`,
        [uuid(), tenant.id, moduleId, 1]
      );
    }

    console.log(`✓ Added module to ${tenants.length} tenants`);

    // Create permissions
    const permissions = [
      { entity_type: 'resend_configurations', action: 'Create', description: 'Create new Resend configurations' },
      { entity_type: 'resend_configurations', action: 'Read', description: 'Read Resend configurations' },
      { entity_type: 'resend_configurations', action: 'Update', description: 'Update Resend configurations' },
      { entity_type: 'resend_configurations', action: 'Delete', description: 'Delete Resend configurations' },
      { entity_type: 'resend_configurations', action: 'Test', description: 'Test Resend configuration connections' },
    ];

    const permissionIds: string[] = [];

    for (const perm of permissions) {
      const permId = uuid();
      await queryRunner.query(
        `INSERT INTO rbac_permissions (id, entity_type, action, description) VALUES (?, ?, ?, ?)`,
        [permId, perm.entity_type, perm.action, perm.description]
      );
      permissionIds.push(permId);
    }

    console.log(`✓ Created ${permissions.length} permissions`);

    // Get admin role
    const adminRole = await queryRunner.query(
      `SELECT id FROM rbac_roles WHERE code = 'admin' LIMIT 1`
    );

    if (adminRole.length > 0) {
      const adminRoleId = adminRole[0].id;

      // Assign permissions to admin role
      for (const permId of permissionIds) {
        await queryRunner.query(
          `INSERT INTO rbac_role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)`,
          [uuid(), adminRoleId, permId]
        );
      }

      console.log(`✓ Assigned ${permissionIds.length} permissions to admin role`);
    }

    await queryRunner.commitTransaction();
    console.log('✓ Resend Configuration module seed completed successfully');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('✗ Error seeding Resend Configuration module:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
