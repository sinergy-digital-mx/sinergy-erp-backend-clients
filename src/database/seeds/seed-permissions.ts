// src/database/seeds/seed-permissions.ts
import { DataSource } from 'typeorm';
import { Permission } from '../../entities/rbac/permission.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';

/**
 * Seed script to create initial permissions for the RBAC system
 * This creates comprehensive permissions for all entities in the system
 */
export async function seedPermissions(dataSource: DataSource): Promise<void> {
  const permissionRepository = dataSource.getRepository(Permission);
  const entityRegistryRepository = dataSource.getRepository(EntityRegistry);

  // First, ensure entity registry has all our entities
  const entities = [
    { code: 'Customer', name: 'Customer Management' },
    { code: 'Lead', name: 'Lead Management' },
    { code: 'User', name: 'User Management' },
    { code: 'Role', name: 'Role Management' },
    { code: 'Permission', name: 'Permission Management' },
    { code: 'Tenant', name: 'Tenant Management' },
    { code: 'Report', name: 'Report Management' },
    { code: 'AuditLog', name: 'Audit Log Management' },
  ];

  for (const entity of entities) {
    const existing = await entityRegistryRepository.findOne({
      where: { code: entity.code }
    });
    
    if (!existing) {
      const newEntity = entityRegistryRepository.create(entity);
      await entityRegistryRepository.save(newEntity);
      console.log(`✅ Created entity registry entry: ${entity.code}`);
    }
  }

  // Define comprehensive permissions for each entity
  const permissionsToCreate = [
    // Customer permissions
    { entity_type: 'Customer', action: 'Create', description: 'Create new customers', is_system_permission: true },
    { entity_type: 'Customer', action: 'Read', description: 'View customer information', is_system_permission: true },
    { entity_type: 'Customer', action: 'Update', description: 'Edit customer information', is_system_permission: true },
    { entity_type: 'Customer', action: 'Delete', description: 'Delete customers', is_system_permission: true },
    { entity_type: 'Customer', action: 'Export', description: 'Export customer data', is_system_permission: true },
    { entity_type: 'Customer', action: 'Import', description: 'Import customer data', is_system_permission: true },
    { entity_type: 'Customer', action: 'Bulk_Update', description: 'Update multiple customers at once', is_system_permission: true },
    { entity_type: 'Customer', action: 'Download_Report', description: 'Download customer reports', is_system_permission: true },

    // Lead permissions
    { entity_type: 'Lead', action: 'Create', description: 'Create new leads', is_system_permission: true },
    { entity_type: 'Lead', action: 'Read', description: 'View lead information', is_system_permission: true },
    { entity_type: 'Lead', action: 'Update', description: 'Edit lead information', is_system_permission: true },
    { entity_type: 'Lead', action: 'Delete', description: 'Delete leads', is_system_permission: true },
    { entity_type: 'Lead', action: 'Export', description: 'Export lead data', is_system_permission: true },
    { entity_type: 'Lead', action: 'Import', description: 'Import lead data', is_system_permission: true },
    { entity_type: 'Lead', action: 'Convert', description: 'Convert leads to customers', is_system_permission: true },
    { entity_type: 'Lead', action: 'Assign', description: 'Assign leads to users', is_system_permission: true },
    { entity_type: 'Lead', action: 'Download_Report', description: 'Download lead reports', is_system_permission: true },

    // User permissions
    { entity_type: 'User', action: 'Create', description: 'Create new users', is_system_permission: true },
    { entity_type: 'User', action: 'Read', description: 'View user information', is_system_permission: true },
    { entity_type: 'User', action: 'Update', description: 'Edit user information', is_system_permission: true },
    { entity_type: 'User', action: 'Delete', description: 'Delete users', is_system_permission: true },
    { entity_type: 'User', action: 'Activate', description: 'Activate user accounts', is_system_permission: true },
    { entity_type: 'User', action: 'Deactivate', description: 'Deactivate user accounts', is_system_permission: true },
    { entity_type: 'User', action: 'Reset_Password', description: 'Reset user passwords', is_system_permission: true },

    // Role permissions
    { entity_type: 'Role', action: 'Create', description: 'Create new roles', is_system_permission: true },
    { entity_type: 'Role', action: 'Read', description: 'View role information', is_system_permission: true },
    { entity_type: 'Role', action: 'Update', description: 'Edit role information', is_system_permission: true },
    { entity_type: 'Role', action: 'Delete', description: 'Delete roles', is_system_permission: true },
    { entity_type: 'Role', action: 'Assign', description: 'Assign roles to users', is_system_permission: true },
    { entity_type: 'Role', action: 'Revoke', description: 'Revoke roles from users', is_system_permission: true },

    // Permission permissions
    { entity_type: 'Permission', action: 'Read', description: 'View permission information', is_system_permission: true },
    { entity_type: 'Permission', action: 'Assign', description: 'Assign permissions to roles', is_system_permission: true },
    { entity_type: 'Permission', action: 'Revoke', description: 'Revoke permissions from roles', is_system_permission: true },

    // Tenant permissions
    { entity_type: 'Tenant', action: 'Create', description: 'Create new tenants', is_system_permission: true },
    { entity_type: 'Tenant', action: 'Read', description: 'View tenant information', is_system_permission: true },
    { entity_type: 'Tenant', action: 'Update', description: 'Edit tenant information', is_system_permission: true },
    { entity_type: 'Tenant', action: 'Delete', description: 'Delete tenants', is_system_permission: true },
    { entity_type: 'Tenant', action: 'Configure', description: 'Configure tenant settings', is_system_permission: true },

    // Report permissions
    { entity_type: 'Report', action: 'Create', description: 'Create custom reports', is_system_permission: true },
    { entity_type: 'Report', action: 'Read', description: 'View reports', is_system_permission: true },
    { entity_type: 'Report', action: 'Update', description: 'Edit reports', is_system_permission: true },
    { entity_type: 'Report', action: 'Delete', description: 'Delete reports', is_system_permission: true },
    { entity_type: 'Report', action: 'Export', description: 'Export reports', is_system_permission: true },
    { entity_type: 'Report', action: 'Schedule', description: 'Schedule automated reports', is_system_permission: true },

    // Audit Log permissions
    { entity_type: 'AuditLog', action: 'Read', description: 'View audit logs', is_system_permission: true },
    { entity_type: 'AuditLog', action: 'Export', description: 'Export audit logs', is_system_permission: true },
    { entity_type: 'AuditLog', action: 'Delete', description: 'Delete old audit logs', is_system_permission: true },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const permissionData of permissionsToCreate) {
    const existing = await permissionRepository.findOne({
      where: {
        entity_type: permissionData.entity_type,
        action: permissionData.action,
      }
    });

    if (!existing) {
      const permission = permissionRepository.create(permissionData);
      await permissionRepository.save(permission);
      createdCount++;
      console.log(`✅ Created permission: ${permissionData.entity_type}.${permissionData.action}`);
    } else {
      skippedCount++;
    }
  }

  console.log(`\n🎉 Permission seeding completed!`);
  console.log(`✅ Created: ${createdCount} permissions`);
  console.log(`⏭️  Skipped: ${skippedCount} permissions (already exist)`);
  console.log(`📊 Total: ${permissionsToCreate.length} permissions processed`);
}

/**
 * Run the seed script
 */
export async function runPermissionSeed(): Promise<void> {
  const { AppDataSource } = await import('../data-source.js');
  
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedPermissions(AppDataSource);
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Allow running this script directly
if (require.main === module) {
  runPermissionSeed()
    .then(() => {
      console.log('✅ Permission seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Permission seeding failed:', error);
      process.exit(1);
    });
}