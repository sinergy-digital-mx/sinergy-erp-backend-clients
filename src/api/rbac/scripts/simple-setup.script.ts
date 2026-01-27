#!/usr/bin/env ts-node

/**
 * Simple setup script to initialize RBAC permissions
 * This is a simplified version that focuses on just creating permissions
 */

import 'reflect-metadata';
import { AppDataSource } from '../../../database/data-source';
import { Permission } from '../../../entities/rbac/permission.entity';
import { EntityRegistry } from '../../../entities/entity-registry/entity-registry.entity';

/**
 * Create all permissions and entity registry entries
 */
async function setupPermissions(): Promise<void> {
  console.log('🚀 Starting RBAC Permission Setup...\n');

  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established');
    }

    const permissionRepository = AppDataSource.getRepository(Permission);
    const entityRegistryRepository = AppDataSource.getRepository(EntityRegistry);

    // Step 1: Create entity registry entries
    console.log('\n📋 Step 1: Creating entity registry entries...');
    const entities = [
      { code: 'Customer', name: 'Customer Management' },
      { code: 'Lead', name: 'Lead Management' },
      { code: 'Activity', name: 'Activity Management' },
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
        console.log(`   ✅ Created entity: ${entity.code}`);
      } else {
        console.log(`   ⏭️  Entity already exists: ${entity.code}`);
      }
    }

    // Step 2: Create permissions
    console.log('\n🔐 Step 2: Creating permissions...');
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

      // Activity permissions
      { entity_type: 'Activity', action: 'Create', description: 'Create new activities', is_system_permission: true },
      { entity_type: 'Activity', action: 'Read', description: 'View activity information', is_system_permission: true },
      { entity_type: 'Activity', action: 'Update', description: 'Edit activity information', is_system_permission: true },
      { entity_type: 'Activity', action: 'Delete', description: 'Delete activities', is_system_permission: true },
      { entity_type: 'Activity', action: 'Export', description: 'Export activity data', is_system_permission: true },
      { entity_type: 'Activity', action: 'View_All', description: 'View all activities (not just own)', is_system_permission: true },

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
        console.log(`   ✅ Created: ${permissionData.entity_type}.${permissionData.action}`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\n🎉 Setup completed successfully!`);
    console.log(`✅ Created: ${createdCount} permissions`);
    console.log(`⏭️  Skipped: ${skippedCount} permissions (already exist)`);
    console.log(`📊 Total: ${permissionsToCreate.length} permissions processed`);

    console.log('\n📖 Next steps:');
    console.log('   1. Create a tenant using the TenantService');
    console.log('   2. Create roles and assign permissions');
    console.log('   3. Create users and assign roles');
    console.log('   4. Test permissions in your application');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

/**
 * List all available permissions
 */
async function listPermissions(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const permissionRepository = AppDataSource.getRepository(Permission);
    const permissions = await permissionRepository.find({
      order: { entity_type: 'ASC', action: 'ASC' }
    });

    console.log('\n📋 Available Permissions:');
    console.log('========================');

    const groupedPermissions: { [key: string]: string[] } = {};
    
    for (const permission of permissions) {
      if (!groupedPermissions[permission.entity_type]) {
        groupedPermissions[permission.entity_type] = [];
      }
      groupedPermissions[permission.entity_type].push(permission.action);
    }

    for (const [entityType, actions] of Object.entries(groupedPermissions)) {
      console.log(`\n🏷️  ${entityType}:`);
      actions.forEach(action => {
        console.log(`   • ${action}`);
      });
    }

    console.log(`\n📊 Total: ${permissions.length} permissions across ${Object.keys(groupedPermissions).length} entity types`);

  } catch (error) {
    console.error('❌ Failed to list permissions:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const command = process.argv[2] || 'setup';

  switch (command) {
    case 'setup':
      await setupPermissions();
      break;
    
    case 'list':
    case 'permissions':
      await listPermissions();
      break;
    
    default:
      console.log('RBAC Simple Setup Script');
      console.log('========================');
      console.log('Usage:');
      console.log('  npm run rbac:simple-setup setup       - Create all permissions');
      console.log('  npm run rbac:simple-setup list        - List all permissions');
      console.log('  npm run rbac:simple-setup permissions - List all permissions');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { setupPermissions, listPermissions };