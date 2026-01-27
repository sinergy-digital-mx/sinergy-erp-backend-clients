#!/usr/bin/env ts-node

/**
 * Simple complete RBAC setup script
 * This script creates everything needed for a working RBAC system
 */

import 'reflect-metadata';
import { AppDataSource } from '../../../database/data-source';
import { Permission } from '../../../entities/rbac/permission.entity';
import { EntityRegistry } from '../../../entities/entity-registry/entity-registry.entity';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { Role } from '../../../entities/rbac/role.entity';
import { RolePermission } from '../../../entities/rbac/role-permission.entity';
import { getAllRoleTemplates } from '../templates/enhanced-role-templates';

class SimpleCompleteSetup {
  constructor(private dataSource: typeof AppDataSource) {}

  /**
   * Run the complete setup process
   */
  async run(): Promise<void> {
    console.log('🚀 Starting Complete RBAC Setup...\n');

    try {
      // Step 1: Setup permissions
      console.log('📋 Step 1: Setting up permissions...');
      await this.setupPermissions();

      // Step 2: Create tenant
      console.log('\n🏢 Step 2: Creating tenant...');
      const tenantId = await this.createTenant('Demo Company', 'demo');

      // Step 3: Create roles from templates
      console.log('\n👥 Step 3: Creating roles from templates...');
      await this.createRolesFromTemplates(tenantId);

      console.log('\n✅ Complete RBAC Setup finished successfully!');
      console.log('\n📊 Summary:');
      console.log(`   🏢 Tenant: Demo Company (demo)`);
      console.log(`   🆔 Tenant ID: ${tenantId}`);
      console.log('\n🎯 Your RBAC system is now ready!');
      console.log('\n📖 Next steps:');
      console.log('   1. Create users through your application');
      console.log('   2. Assign roles to users using the UserRole entity');
      console.log('   3. Test permissions in your controllers');

    } catch (error) {
      console.error('❌ Setup failed:', error);
      throw error;
    }
  }

  /**
   * Setup permissions and entity registry
   */
  private async setupPermissions(): Promise<void> {
    const permissionRepository = this.dataSource.getRepository(Permission);
    const entityRegistryRepository = this.dataSource.getRepository(EntityRegistry);

    // Entity registry entries
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
        console.log(`   ✅ Created entity: ${entity.code}`);
      }
    }

    // Permissions
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
      }
    }

    console.log(`   ✅ Permissions ready: ${createdCount} created, ${permissionsToCreate.length - createdCount} existed`);
  }

  /**
   * Create a tenant
   */
  private async createTenant(name: string, subdomain: string): Promise<string> {
    const tenantRepo = this.dataSource.getRepository(RBACTenant);
    
    // Check if tenant already exists
    const existingTenant = await tenantRepo.findOne({ where: { subdomain } });
    if (existingTenant) {
      console.log(`   ⏭️  Tenant "${name}" already exists`);
      console.log(`   🆔 Tenant ID: ${existingTenant.id}`);
      return existingTenant.id;
    }

    // Create new tenant
    const newTenant = tenantRepo.create({
      name,
      subdomain,
      is_active: true,
    });
    
    const savedTenant = await tenantRepo.save(newTenant);
    
    console.log(`   ✅ Created tenant: ${name}`);
    console.log(`   🆔 Tenant ID: ${savedTenant.id}`);
    
    return savedTenant.id;
  }

  /**
   * Create roles from templates
   */
  private async createRolesFromTemplates(tenantId: string): Promise<void> {
    const roleRepo = this.dataSource.getRepository(Role);
    const permissionRepo = this.dataSource.getRepository(Permission);
    const rolePermissionRepo = this.dataSource.getRepository(RolePermission);
    
    const templates = getAllRoleTemplates();
    let createdCount = 0;
    let skippedCount = 0;

    for (const template of templates) {
      // Check if role already exists for this tenant
      const existingRole = await roleRepo.findOne({
        where: { name: template.name, tenant_id: tenantId }
      });

      if (existingRole) {
        skippedCount++;
        console.log(`   ⏭️  Role "${template.name}" already exists`);
        continue;
      }

      // Create the role
      const newRole = roleRepo.create({
        name: template.name,
        description: template.description,
        tenant_id: tenantId,
        is_system_role: false,
      });

      const savedRole = await roleRepo.save(newRole);
      createdCount++;

      console.log(`   ✅ Created role: ${template.name}`);

      // Assign permissions to the role
      let permissionCount = 0;
      for (const permissionGroup of template.permissions) {
        for (const action of permissionGroup.actions) {
          const permission = await permissionRepo.findOne({
            where: {
              entity_type: permissionGroup.entityType,
              action: action,
            }
          });

          if (permission) {
            // Check if role-permission relationship already exists
            const existingRolePermission = await rolePermissionRepo.findOne({
              where: {
                role_id: savedRole.id,
                permission_id: permission.id,
              }
            });

            if (!existingRolePermission) {
              const rolePermission = rolePermissionRepo.create({
                role_id: savedRole.id,
                permission_id: permission.id,
              });
              await rolePermissionRepo.save(rolePermission);
              permissionCount++;
            }
          }
        }
      }

      console.log(`     📋 Assigned ${permissionCount} permissions`);
    }

    console.log(`   📊 Roles summary: ${createdCount} created, ${skippedCount} existed`);
  }

  /**
   * Display system status
   */
  async displayStatus(): Promise<void> {
    const tenantRepo = this.dataSource.getRepository(RBACTenant);
    const roleRepo = this.dataSource.getRepository(Role);
    const permissionRepo = this.dataSource.getRepository(Permission);

    const tenantCount = await tenantRepo.count();
    const roleCount = await roleRepo.count();
    const permissionCount = await permissionRepo.count();

    console.log('\n📊 RBAC System Status:');
    console.log('======================');
    console.log(`🏢 Tenants: ${tenantCount}`);
    console.log(`👥 Roles: ${roleCount}`);
    console.log(`🔐 Permissions: ${permissionCount}`);

    // Show tenants with their roles
    const tenants = await tenantRepo.find();
    for (const tenant of tenants) {
      console.log(`\n🏢 Tenant: ${tenant.name} (${tenant.subdomain})`);
      
      const tenantRoles = await roleRepo.find({ where: { tenant_id: tenant.id } });
      
      console.log(`   👥 Roles (${tenantRoles.length}):`);
      tenantRoles.forEach(role => {
        console.log(`     • ${role.name} - ${role.description}`);
      });
    }

    console.log('\n🎯 To create users and assign roles:');
    console.log('   1. Use your application\'s user registration');
    console.log('   2. Create UserRole entries to assign roles to users');
    console.log('   3. Use the PermissionService to check user permissions');
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const command = process.argv[2] || 'setup';

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established');
    }

    const setup = new SimpleCompleteSetup(AppDataSource);

    switch (command) {
      case 'setup':
        await setup.run();
        break;
      
      case 'status':
        await setup.displayStatus();
        break;
      
      default:
        console.log('Simple Complete RBAC Setup Script');
        console.log('==================================');
        console.log('Usage:');
        console.log('  npm run rbac:simple-complete setup   - Full setup');
        console.log('  npm run rbac:simple-complete status  - Show system status');
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
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

export { SimpleCompleteSetup };