import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function assignModulesToTenant() {
  const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log(`🔄 Assigning modules to tenant: ${tenantId}\n`);

    // Get all modules
    const modules = await AppDataSource.query(`
      SELECT id, code, name FROM modules
    `);

    if (modules.length === 0) {
      console.log('⚠️  No modules found in database');
      return;
    }

    console.log(`📦 Found ${modules.length} modules\n`);

    let assignedCount = 0;
    let skippedCount = 0;

    for (const module of modules) {
      // Check if already assigned
      const existing = await AppDataSource.query(`
        SELECT id FROM tenant_modules 
        WHERE tenant_id = ? AND module_id = ?
      `, [tenantId, module.id]);

      if (existing.length > 0) {
        skippedCount++;
        console.log(`⏭️  Already assigned: ${module.name}`);
        continue;
      }

      // Assign module to tenant
      const tenantModuleId = uuidv4();
      await AppDataSource.query(`
        INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
        VALUES (?, ?, ?, true, NOW())
      `, [tenantModuleId, tenantId, module.id]);

      assignedCount++;
      console.log(`✅ Assigned: ${module.name}`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Assigned: ${assignedCount}`);
    console.log(`   ⏭️  Already existed: ${skippedCount}`);
    console.log(`   📦 Total modules: ${modules.length}`);

    // Verify assignment
    const verification = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM tenant_modules 
      WHERE tenant_id = ? AND is_enabled = true
    `, [tenantId]);

    console.log(`\n✨ Tenant now has ${verification[0].count} enabled modules`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

assignModulesToTenant().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
