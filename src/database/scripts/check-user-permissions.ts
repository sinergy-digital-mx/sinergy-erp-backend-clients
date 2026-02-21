import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function checkUserPermissions(userId?: string) {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // If no userId provided, show all users
    if (!userId) {
      console.log('📋 Available users:');
      const users = await dataSource.query(`
        SELECT id, email, first_name, last_name 
        FROM users 
        WHERE tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
        LIMIT 10
      `);
      
      users.forEach((user: any) => {
        console.log(`   • ${user.email} (${user.first_name} ${user.last_name}) - ID: ${user.id}`);
      });
      
      console.log('\n💡 Run again with: npx ts-node check-user-permissions.ts USER_ID');
      return;
    }

    // Get user info
    const userQuery = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.tenant_id
      FROM users u
      WHERE u.id = ?
    `;
    const users = await dataSource.query(userQuery, [userId]);
    
    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = users[0];
    console.log(`👤 User: ${user.email} (${user.first_name} ${user.last_name})`);
    console.log(`🏢 Tenant: ${user.tenant_id}`);

    // Get user roles and permissions
    const permissionsQuery = `
      SELECT 
        r.name as role_name,
        p.action,
        er.entity_name,
        p.description,
        m.name as module_name
      FROM rbac_user_roles ur
      JOIN rbac_roles r ON ur.role_id = r.id
      JOIN rbac_role_permissions rp ON r.id = rp.role_id
      JOIN rbac_permissions p ON rp.permission_id = p.id
      LEFT JOIN rbac_entity_registry er ON p.entity_registry_id = er.id
      LEFT JOIN rbac_modules m ON p.module_id = m.id
      WHERE ur.user_id = ?
      ORDER BY r.name, m.name, er.entity_name, p.action
    `;

    const permissions = await dataSource.query(permissionsQuery, [userId]);

    if (permissions.length === 0) {
      console.log('❌ User has no permissions assigned');
      return;
    }

    console.log(`\n📋 User has ${permissions.length} permissions:`);

    // Group by role
    const permissionsByRole = permissions.reduce((acc: any, perm: any) => {
      if (!acc[perm.role_name]) {
        acc[perm.role_name] = [];
      }
      acc[perm.role_name].push(perm);
      return acc;
    }, {});

    Object.entries(permissionsByRole).forEach(([roleName, rolePermissions]: [string, any]) => {
      console.log(`\n🎭 Role: ${roleName} (${rolePermissions.length} permissions)`);
      
      // Group by module
      const permissionsByModule = rolePermissions.reduce((acc: any, perm: any) => {
        const module = perm.module_name || 'No Module';
        if (!acc[module]) {
          acc[module] = [];
        }
        acc[module].push(perm);
        return acc;
      }, {});

      Object.entries(permissionsByModule).forEach(([moduleName, modulePermissions]: [string, any]) => {
        console.log(`   📦 ${moduleName}:`);
        modulePermissions.forEach((perm: any) => {
          const entity = perm.entity_name || 'Unknown';
          const description = perm.description ? ` - ${perm.description}` : '';
          console.log(`      ✓ ${entity}.${perm.action}${description}`);
        });
      });
    });

    // Check specifically for Lead permissions
    const leadPermissions = permissions.filter((p: any) => 
      p.entity_name === 'Lead' || p.entity_name === 'lead'
    );

    console.log(`\n🎯 Lead Permissions: ${leadPermissions.length}`);
    leadPermissions.forEach((perm: any) => {
      console.log(`   ✓ Lead.${perm.action} - ${perm.description || 'No description'}`);
    });

    // Check for Role/RBAC permissions
    const rbacPermissions = permissions.filter((p: any) => 
      p.entity_name?.toLowerCase().includes('role') || 
      p.entity_name?.toLowerCase().includes('rbac') ||
      p.entity_name?.toLowerCase().includes('user')
    );

    console.log(`\n🔐 RBAC/Role Permissions: ${rbacPermissions.length}`);
    rbacPermissions.forEach((perm: any) => {
      console.log(`   ✓ ${perm.entity_name}.${perm.action} - ${perm.description || 'No description'}`);
    });

  } catch (error) {
    console.error('❌ Error checking user permissions:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Get userId from command line argument
const userId = process.argv[2];
checkUserPermissions(userId);