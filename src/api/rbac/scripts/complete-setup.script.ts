#!/usr/bin/env ts-node

/**
 * Complete RBAC setup script that handles all steps:
 * 1. Create permissions (if needed)
 * 2. Create a tenant
 * 3. Create roles from templates
 * 4. Create sample users
 * 5. Assign roles to users
 */

import 'reflect-metadata';
import { AppDataSource } from '../../../database/data-source';
import { DataSource } from 'typeorm';
import { Permission } from '../../../entities/rbac/permission.entity';
import { EntityRegistry } from '../../../entities/entity-registry/entity-registry.entity';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { Role } from '../../../entities/rbac/role.entity';
import { User } from '../../../entities/users/user.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../entities/rbac/role-permission.entity';
import { getAllRoleTemplates } from '../templates/enhanced-role-templates';
import * as bcrypt from 'bcrypt';

interface SetupOptions {
  tenantName?: string;
  tenantSubdomain?: string;
  skipPermissions?: boolean;
  skipTenant?: boolean;
  skipRoles?: boolean;
  skipUsers?: boolean;
  verbose?: boolean;
}

class CompleteRBACSetup {
  constructor(private dataSource: DataSource) {}

  /**
   * Run the complete setup process
   */
  async run(options: SetupOptions = {}): Promise<void> {
    const {
      tenantName = 'Demo Company',
      tenantSubdomain = 'demo',
      skipPermissions = false,
      skipTenant = false,
      skipRoles = false,
      skipUsers = false,
      verbose = true,
    } = options;

    if (verbose) {
      console.log('🚀 Starting Complete RBAC Setup...\n');
    }

    try {
      // Step 1: Create permissions and entity registry
      if (!skipPermissions) {
        if (verbose) console.log('📋 Step 1: Setting up permissions...');
        await this.setupPermissions(verbose);
      }

      // Step 2: Create tenant
      let tenantId: string;
      if (!skipTenant) {
        if (verbose) console.log(`\n🏢 Step 2: Creating tenant "${tenantName}"...`);
        tenantId = await this.createTenant(tenantName, tenantSubdomain, verbose);
      } else {
        // Find existing tenant
        const tenantRepo = this.dataSource.getRepository(RBACTenant);
        const tenant = await tenantRepo.findOne({ where: { subdomain: tenantSubdomain } });
        if (!tenant) {
          throw new Error(`Tenant with subdomain "${tenantSubdomain}" not found`);
        }
        tenantId = tenant.id;
        if (verbose) console.log(`\n🏢 Using existing tenant: ${tenant.name} (${tenantId})`);
      }

      // Step 3: Create roles from templates
      if (!skipRoles) {
        if (verbose) console.log('\n👥 Step 3: Creating roles from templates...');
        await this.createRolesFromTemplates(tenantId, verbose);
      }

      // Step 4: Create sample users
      if (!skipUsers) {
        if (verbose) console.log('\n👤 Step 4: Creating sample users...');
        await this.createSampleUsers(tenantId, verbose);
      }

      if (verbose) {
        console.log('\n✅ Complete RBAC Setup finished successfully!');
        console.log('\n📊 Summary:');
        console.log(`   🏢 Tenant: ${tenantName} (${tenantSubdomain})`);
        console.log(`   🆔 Tenant ID: ${tenantId}`);
        console.log('\n🎯 Your RBAC system is now ready to use!');
      }

    } catch (error) {
      console.error('❌ Setup failed:', error);
      throw error;
    }
  }

  /**
   * Setup permissions and entity registry
   */
  private async setupPermissions(verbose: boolean): Promise<void> {
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
        if (verbose) console.log(`   ✅ Created entity: ${entity.code}`);
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

    if (verbose) {
      console.log(`   ✅ Permissions ready: ${createdCount} created, ${permissionsToCreate.length - createdCount} existed`);
    }
  }

  /**
   * Create a tenant
   */
  private async createTenant(name: string, subdomain: string, verbose: boolean): Promise<string> {
    const tenantRepo = this.dataSource.getRepository(RBACTenant);
    
    // Check if tenant already exists
    const existingTenant = await tenantRepo.findOne({ where: { subdomain } });
    if (existingTenant) {
      if (verbose) {
        console.log(`   ⏭️  Tenant "${name}" already exists`);
        console.log(`   🆔 Tenant ID: ${existingTenant.id}`);
      }
      return existingTenant.id;
    }

    // Create new tenant
    const newTenant = tenantRepo.create({
      name,
      subdomain,
      is_active: true,
    });
    
    const savedTenant = await tenantRepo.save(newTenant);
    
    if (verbose) {
      console.log(`   ✅ Created tenant: ${name}`);
      console.log(`   🆔 Tenant ID: ${savedTenant.id}`);
    }
    
    return savedTenant.id;
  }

  /**
   * Create roles from templates
   */
  private async createRolesFromTemplates(tenantId: string, verbose: boolean): Promise<void> {
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
        if (verbose) {
          console.log(`   ⏭️  Role "${template.name}" already exists`);
        }
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

      if (verbose) {
        console.log(`   ✅ Created role: ${template.name}`);
      }

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

      if (verbose) {
        console.log(`     📋 Assigned ${permissionCount} permissions`);
      }
    }

    if (verbose) {
      console.log(`   📊 Roles summary: ${createdCount} created, ${skippedCount} existed`);
    }
  }

  /**
   * Create sample users and assign roles
   */
  private async createSampleUsers(tenantId: string, verbose: boolean): Promise<void> {
    const userRepo = this.dataSource.getRepository(User);
    const roleRepo = this.dataSource.getRepository(Role);
    const userRoleRepo = this.dataSource.getRepository(UserRole);

    // Sample users with their intended roles
    const sampleUsers = [
      {
        email: 'admin@demo.com',
        password: 'admin123',
        roles: ['System Administrator']
      },
      {
        email: 'sales.manager@demo.com',
        password: 'sales123',
        roles: ['Sales Manager']
      },
      {
        email: 'sales.rep@demo.com',
        password: 'sales123',
        roles: ['Sales Representative']
      },
      {
        email: 'marketing@demo.com',
        password: 'marketing123',
        roles: ['Marketing Specialist']
      },
      {
        email: 'support@demo.com',
        password: 'support123',
        roles: ['Customer Support']
      },
      {
        email: 'analyst@demo.com',
        password: 'analyst123',
        roles: ['Data Analyst']
      },
      {
        email: 'hr@demo.com',
        password: 'hr123',
        roles: ['HR Manager']
      },
      {
        email: 'auditor@demo.com',
        password: 'auditor123',
        roles: ['Read Only Auditor']
      }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await userRepo.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        skippedCount++;
        if (verbose) {
          console.log(`   ⏭️  User ${userData.email} already exists`);
        }
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user with tenant relationship
      const tenant = await this.dataSource.getRepository(RBACTenant).findOne({ where: { id: tenantId } });
      if (!tenant) {
        throw new Error(`Tenant with ID ${tenantId} not found`);
      }

      const newUser = userRepo.create({
        email: userData.email,
        password: hashedPassword,
        tenant: tenant,
      });

      const savedUser = await userRepo.save(newUser);
      createdCount++;

      if (verbose) {
        console.log(`   ✅ Created user: ${userData.email}`);
      }

      // Assign roles to user
      for (const roleName of userData.roles) {
        const role = await roleRepo.findOne({
          where: { name: roleName, tenant_id: tenantId }
        });

        if (role) {
          // Check if user-role relationship already exists
          const existingUserRole = await userRoleRepo.findOne({
            where: {
              user_id: savedUser.id,
              role_id: role.id,
            }
          });

          if (!existingUserRole) {
            const userRole = userRoleRepo.create({
              user_id: savedUser.id,
              role_id: role.id,
            });
            await userRoleRepo.save(userRole);

            if (verbose) {
              console.log(`     👥 Assigned role: ${roleName}`);
            }
          }
        } else {
          if (verbose) {
            console.log(`     ⚠️  Role "${roleName}" not found for user ${userData.email}`);
          }
        }
      }
    }

    if (verbose) {
      console.log(`   📊 Users summary: ${createdCount} created, ${skippedCount} existed`);
    }
  }

  /**
   * Display system status
   */
  async displayStatus(): Promise<void> {
    const tenantRepo = this.dataSource.getRepository(RBACTenant);
    const roleRepo = this.dataSource.getRepository(Role);
    const userRepo = this.dataSource.getRepository(User);
    const permissionRepo = this.dataSource.getRepository(Permission);

    const tenantCount = await tenantRepo.count();
    const roleCount = await roleRepo.count();
    const userCount = await userRepo.count();
    const permissionCount = await permissionRepo.count();

    console.log('\n📊 RBAC System Status:');
    console.log('======================');
    console.log(`🏢 Tenants: ${tenantCount}`);
    console.log(`👥 Roles: ${roleCount}`);
    console.log(`👤 Users: ${userCount}`);
    console.log(`🔐 Permissions: ${permissionCount}`);

    // Show tenants with their users and roles
    const tenants = await tenantRepo.find();
    for (const tenant of tenants) {
      console.log(`\n🏢 Tenant: ${tenant.name} (${tenant.subdomain})`);
      
      const tenantRoles = await roleRepo.find({ where: { tenant_id: tenant.id } });
      const tenantUsers = await userRepo.find({ 
        relations: ['tenant'],
        where: { 
          tenant: { id: tenant.id } 
        } 
      });
      
      console.log(`   👥 Roles (${tenantRoles.length}):`);
      tenantRoles.forEach(role => {
        console.log(`     • ${role.name}`);
      });
      
      console.log(`   👤 Users (${tenantUsers.length}):`);
      tenantUsers.forEach(user => {
        console.log(`     • ${user.email}`);
      });
    }
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const command = process.argv[2] || 'setup';
  const tenantName = process.argv[3] || 'Demo Company';
  const tenantSubdomain = process.argv[4] || 'demo';

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established');
    }

    const setup = new CompleteRBACSetup(AppDataSource);

    switch (command) {
      case 'setup':
        await setup.run({
          tenantName,
          tenantSubdomain,
          verbose: true,
        });
        break;
      
      case 'status':
        await setup.displayStatus();
        break;
      
      case 'permissions-only':
        await setup.run({
          tenantName,
          tenantSubdomain,
          skipTenant: true,
          skipRoles: true,
          skipUsers: true,
          verbose: true,
        });
        break;
      
      case 'tenant-only':
        await setup.run({
          tenantName,
          tenantSubdomain,
          skipPermissions: true,
          skipRoles: true,
          skipUsers: true,
          verbose: true,
        });
        break;
      
      case 'roles-only':
        await setup.run({
          tenantName,
          tenantSubdomain,
          skipPermissions: true,
          skipTenant: true,
          skipUsers: true,
          verbose: true,
        });
        break;
      
      case 'users-only':
        await setup.run({
          tenantName,
          tenantSubdomain,
          skipPermissions: true,
          skipTenant: true,
          skipRoles: true,
          verbose: true,
        });
        break;
      
      default:
        console.log('Complete RBAC Setup Script');
        console.log('===========================');
        console.log('Usage:');
        console.log('  npm run rbac:complete setup [tenant-name] [subdomain]  - Full setup');
        console.log('  npm run rbac:complete status                           - Show system status');
        console.log('  npm run rbac:complete permissions-only                 - Setup permissions only');
        console.log('  npm run rbac:complete tenant-only [name] [subdomain]   - Create tenant only');
        console.log('  npm run rbac:complete roles-only [name] [subdomain]    - Create roles only');
        console.log('  npm run rbac:complete users-only [name] [subdomain]    - Create users only');
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

export { CompleteRBACSetup };