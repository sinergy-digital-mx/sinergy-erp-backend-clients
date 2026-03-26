import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function assignModulesToTenants() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Assigning modules to tenants...\n');

    // Get all modules
    const modules = await AppDataSource.query(`
      SELECT id, code, name FROM modules
    `);

    if (modules.length === 0) {
      console.log('⚠️  No modules found. Creating default modules...\n');
      
      // Create default modules
      const defaultModules = [
        { code: 'leads', name: 'Leads Management' },
        { code: 'customers', name: 'Customers Management' },
        { code: 'properties', name: 'Properties Management' },
        { code: 'contracts', name: 'Contracts Management' },
        { code: 'payments', name: 'Payments Management' },
        { code: 'transactions', name: 'Transactions Management' },
        { code: 'email', name: 'Email Management' },
        { code: 'reports', name: 'Reports Management' },
        { code: 'users', name: 'Users Management' },
        { code: 'roles', name: 'Roles Management' },
        { code: 'permissions', name: 'Permissions Management' },
        { code: 'audit', name: 'Audit Logs' },
      ];

      for (const module of defaultModules) {
        const moduleId = uuidv4();
        await AppDataSource.query(`
          INSERT INTO modules (id, code, name, description, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [moduleId, module.code, module.name, `${module.name} module`]);
        console.log(`✅ Created module: ${module.name}`);
      }
    }

    // Get all tenants
    const tenants = await AppDataSource.query(`
      SELECT id, name, subdomain FROM rbac_tenants WHERE is_active = true
    `);

    if (tenants.length === 0) {
      console.log('⚠️  No active tenants found. Please create a tenant first.');
      return;
    }

    console.log(`📦 Found ${tenants.length} active tenant(s)\n`);

    // Get all modules again (in case we just created them)
    const allModules = await AppDataSource.query(`
      SELECT id, code, name FROM modules
    `);

    // Assign all modules to each tenant
    for (const tenant of tenants) {
      console.log(`🏢 Processing tenant: ${tenant.name} (${tenant.subdomain})`);
      
      let assignedCount = 0;
      let skippedCount = 0;

      for (const module of allModules) {
        // Check if already assigned
        const existing = await AppDataSource.query(`
          SELECT id FROM tenant_modules 
          WHERE tenant_id = ? AND module_id = ?
        `, [tenant.id, module.id]);

        if (existing.length > 0) {
          skippedCount++;
          continue;
        }

        // Assign module to tenant
        const tenantModuleId = uuidv4();
        await AppDataSource.query(`
          INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
          VALUES (?, ?, ?, true, NOW())
        `, [tenantModuleId, tenant.id, module.id]);

        assignedCount++;
        console.log(`   ✅ Assigned: ${module.name}`);
      }

      console.log(`   📊 Summary: ${assignedCount} assigned, ${skippedCount} already existed\n`);
    }

    // Verify assignment
    console.log('📊 Verification:\n');
    const verification = await AppDataSource.query(`
      SELECT 
        t.name as tenant,
        COUNT(tm.id) as module_count,
        GROUP_CONCAT(m.name SEPARATOR ', ') as modules
      FROM rbac_tenants t
      LEFT JOIN tenant_modules tm ON t.id = tm.tenant_id
      LEFT JOIN modules m ON tm.module_id = m.id
      WHERE t.is_active = true
      GROUP BY t.id, t.name
    `);

    verification.forEach((row: any) => {
      console.log(`🏢 ${row.tenant}: ${row.module_count} modules`);
      if (row.modules) {
        console.log(`   📦 ${row.modules}\n`);
      }
    });

    console.log('✨ Module assignment complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

assignModulesToTenants().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
