#!/usr/bin/env ts-node

/**
 * Create Users Script
 * Creates sample users and assigns them roles in the RBAC system
 */

import 'reflect-metadata';
import { AppDataSource } from '../../../database/data-source';
import { User } from '../../../entities/users/user.entity';
import { UserStatus } from '../../../entities/users/user-status.entity';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { Role } from '../../../entities/rbac/role.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
import * as bcrypt from 'bcrypt';

interface UserData {
  email: string;
  password: string;
  roles: string[];
  description: string;
}

class UserCreationScript {
  constructor(private dataSource: typeof AppDataSource) {}

  /**
   * Create sample users with role assignments
   */
  async createUsers(tenantSubdomain: string = 'demo'): Promise<void> {
    console.log('👤 Starting User Creation...\n');

    try {
      // Check if we have the RBAC tenant
      const rbacTenantRepo = this.dataSource.getRepository(RBACTenant);
      const rbacTenant = await rbacTenantRepo.findOne({ where: { subdomain: tenantSubdomain } });
      
      if (!rbacTenant) {
        throw new Error(`RBAC Tenant with subdomain "${tenantSubdomain}" not found. Run the RBAC setup first.`);
      }

      console.log(`🏢 Using tenant: ${rbacTenant.name} (${rbacTenant.subdomain})`);

      // Ensure we have a default user status
      const userStatusRepo = this.dataSource.getRepository(UserStatus);
      let activeStatus = await userStatusRepo.findOne({ where: { code: 'active' } });
      
      if (!activeStatus) {
        activeStatus = userStatusRepo.create({
          code: 'active',
          name: 'Active',
        });
        await userStatusRepo.save(activeStatus);
        console.log(`✅ Created user status: Active`);
      }

      // Sample users with their intended roles
      const sampleUsers: UserData[] = [
        {
          email: 'admin@demo.com',
          password: 'admin123',
          roles: ['System Administrator'],
          description: 'System Administrator with full access'
        },
        {
          email: 'sales.manager@demo.com',
          password: 'sales123',
          roles: ['Sales Manager'],
          description: 'Sales Manager overseeing the sales team'
        },
        {
          email: 'sales.rep@demo.com',
          password: 'sales123',
          roles: ['Sales Representative'],
          description: 'Sales Representative handling leads and customers'
        },
        {
          email: 'marketing@demo.com',
          password: 'marketing123',
          roles: ['Marketing Specialist'],
          description: 'Marketing Specialist managing campaigns'
        },
        {
          email: 'support@demo.com',
          password: 'support123',
          roles: ['Customer Support'],
          description: 'Customer Support representative'
        },
        {
          email: 'analyst@demo.com',
          password: 'analyst123',
          roles: ['Data Analyst'],
          description: 'Data Analyst with reporting capabilities'
        },
        {
          email: 'hr@demo.com',
          password: 'hr123',
          roles: ['HR Manager'],
          description: 'HR Manager handling user management'
        },
        {
          email: 'auditor@demo.com',
          password: 'auditor123',
          roles: ['Read Only Auditor'],
          description: 'Auditor with read-only access for compliance'
        }
      ];

      const userRepo = this.dataSource.getRepository(User);
      const roleRepo = this.dataSource.getRepository(Role);
      const userRoleRepo = this.dataSource.getRepository(UserRole);

      let createdCount = 0;
      let skippedCount = 0;

      for (const userData of sampleUsers) {
        // Check if user already exists
        const existingUser = await userRepo.findOne({
          where: { email: userData.email }
        });

        if (existingUser) {
          skippedCount++;
          console.log(`   ⏭️  User ${userData.email} already exists`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create user
        const newUser = userRepo.create({
          email: userData.email,
          password: hashedPassword,
          tenant: rbacTenant,
          tenant_id: rbacTenant.id,
          status: activeStatus,
        });

        const savedUser = await userRepo.save(newUser);
        createdCount++;

        console.log(`   ✅ Created user: ${userData.email}`);
        console.log(`     📝 Description: ${userData.description}`);

        // Assign roles to user
        let assignedRoles = 0;
        for (const roleName of userData.roles) {
          const role = await roleRepo.findOne({
            where: { name: roleName, tenant_id: rbacTenant.id }
          });

          if (role) {
            // Check if user-role relationship already exists
            const existingUserRole = await userRoleRepo.findOne({
              where: {
                user_id: savedUser.id,
                role_id: role.id,
                tenant_id: rbacTenant.id,
              }
            });

            if (!existingUserRole) {
              const userRole = userRoleRepo.create({
                user_id: savedUser.id,
                role_id: role.id,
                tenant_id: rbacTenant.id,
              });
              await userRoleRepo.save(userRole);
              assignedRoles++;
              console.log(`     👥 Assigned role: ${roleName}`);
            }
          } else {
            console.log(`     ⚠️  Role "${roleName}" not found`);
          }
        }

        if (assignedRoles === 0) {
          console.log(`     ⚠️  No roles assigned to ${userData.email}`);
        }
      }

      console.log(`\n📊 User creation summary:`);
      console.log(`✅ Created: ${createdCount} users`);
      console.log(`⏭️  Skipped: ${skippedCount} users (already exist)`);
      console.log(`📋 Total: ${sampleUsers.length} users processed`);

      console.log('\n🎯 Users created successfully!');
      console.log('\n📖 Login credentials:');
      sampleUsers.forEach(user => {
        console.log(`   • ${user.email} / ${user.password} (${user.roles.join(', ')})`);
      });

    } catch (error) {
      console.error('❌ User creation failed:', error);
      throw error;
    }
  }

  /**
   * List all users with their roles
   */
  async listUsers(): Promise<void> {
    console.log('\n👤 Current Users:');
    console.log('================');

    const userRepo = this.dataSource.getRepository(User);
    const userRoleRepo = this.dataSource.getRepository(UserRole);
    const roleRepo = this.dataSource.getRepository(Role);

    const users = await userRepo.find({
      relations: ['tenant', 'status']
    });

    if (users.length === 0) {
      console.log('No users found. Run the user creation script first.');
      return;
    }

    for (const user of users) {
      console.log(`\n📧 ${user.email}`);
      console.log(`   🏢 Tenant: ${user.tenant?.name || 'N/A'}`);
      console.log(`   📊 Status: ${user.status?.name || 'N/A'}`);
      console.log(`   📅 Created: ${user.created_at.toLocaleDateString()}`);

      // Get user roles
      const userRoles = await userRoleRepo.find({
        where: { user_id: user.id },
        relations: ['role']
      });

      if (userRoles.length > 0) {
        console.log(`   👥 Roles:`);
        for (const userRole of userRoles) {
          const role = await roleRepo.findOne({ where: { id: userRole.role_id } });
          if (role) {
            console.log(`     • ${role.name} - ${role.description}`);
          }
        }
      } else {
        console.log(`   👥 Roles: None assigned`);
      }
    }

    console.log(`\n📊 Total users: ${users.length}`);
  }

  /**
   * Assign a role to a user
   */
  async assignRole(userEmail: string, roleName: string, tenantSubdomain: string = 'demo'): Promise<void> {
    console.log(`👥 Assigning role "${roleName}" to user "${userEmail}"...`);

    const userRepo = this.dataSource.getRepository(User);
    const roleRepo = this.dataSource.getRepository(Role);
    const userRoleRepo = this.dataSource.getRepository(UserRole);
    const rbacTenantRepo = this.dataSource.getRepository(RBACTenant);

    // Find user
    const user = await userRepo.findOne({ where: { email: userEmail } });
    if (!user) {
      throw new Error(`User with email "${userEmail}" not found`);
    }

    // Find RBAC tenant
    const rbacTenant = await rbacTenantRepo.findOne({ where: { subdomain: tenantSubdomain } });
    if (!rbacTenant) {
      throw new Error(`RBAC Tenant with subdomain "${tenantSubdomain}" not found`);
    }

    // Find role
    const role = await roleRepo.findOne({
      where: { name: roleName, tenant_id: rbacTenant.id }
    });
    if (!role) {
      throw new Error(`Role "${roleName}" not found in tenant "${tenantSubdomain}"`);
    }

    // Check if assignment already exists
    const existingUserRole = await userRoleRepo.findOne({
      where: {
        user_id: user.id,
        role_id: role.id,
        tenant_id: rbacTenant.id,
      }
    });

    if (existingUserRole) {
      console.log(`⏭️  User "${userEmail}" already has role "${roleName}"`);
      return;
    }

    // Create assignment
    const userRole = userRoleRepo.create({
      user_id: user.id,
      role_id: role.id,
      tenant_id: rbacTenant.id,
    });
    await userRoleRepo.save(userRole);

    console.log(`✅ Successfully assigned role "${roleName}" to user "${userEmail}"`);
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const command = process.argv[2] || 'create';
  const tenantSubdomain = process.argv[3] || 'demo';

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established');
    }

    const userScript = new UserCreationScript(AppDataSource);

    switch (command) {
      case 'create':
        await userScript.createUsers(tenantSubdomain);
        break;
      
      case 'list':
        await userScript.listUsers();
        break;
      
      case 'assign':
        const userEmail = process.argv[4];
        const roleName = process.argv[5];
        if (!userEmail || !roleName) {
          console.log('Usage: npm run rbac:users assign [tenant-subdomain] [user-email] [role-name]');
          process.exit(1);
        }
        await userScript.assignRole(userEmail, roleName, tenantSubdomain);
        break;
      
      default:
        console.log('User Management Script');
        console.log('======================');
        console.log('Usage:');
        console.log('  npm run rbac:users create [tenant-subdomain]           - Create sample users');
        console.log('  npm run rbac:users list                                - List all users');
        console.log('  npm run rbac:users assign [tenant] [email] [role]     - Assign role to user');
        console.log('');
        console.log('Examples:');
        console.log('  npm run rbac:users create demo');
        console.log('  npm run rbac:users assign demo john@demo.com "Sales Manager"');
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

export { UserCreationScript };