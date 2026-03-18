import { AppDataSource } from '../data-source';

/**
 * Script to ensure all modules have corresponding entity_registry entries
 * Run this BEFORE add-view-menu-permission.ts if you encounter entity_registry_id errors
 */
async function fixEntityRegistryForModules() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔧 Fixing entity registry entries for modules...\n');

    // Step 1: Find modules without entity registry entries
    const modulesWithoutRegistry = await AppDataSource.query(
      `SELECT m.id, m.code, m.name
       FROM modules m
       WHERE NOT EXISTS (
         SELECT 1 FROM entity_registry er WHERE er.code = m.code
       )`
    );

    if (modulesWithoutRegistry.length === 0) {
      console.log('✅ All modules already have entity registry entries!');
      console.log('   No fixes needed.\n');
      return;
    }

    console.log(`⚠️  Found ${modulesWithoutRegistry.length} module(s) without entity registry entries:\n`);
    
    modulesWithoutRegistry.forEach(module => {
      console.log(`   - ${module.name} (${module.code})`);
    });

    console.log('\n📝 Creating missing entity registry entries...\n');

    // Step 2: Create missing entity registry entries
    for (const module of modulesWithoutRegistry) {
      const result = await AppDataSource.query(
        `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
        [module.code, `${module.name} Management`]
      );
      
      console.log(`  ✅ Created entity registry for: ${module.name}`);
      console.log(`     - Code: ${module.code}`);
      console.log(`     - Registry ID: ${result.insertId}\n`);
    }

    // Step 3: Verification
    console.log('📊 Verification:\n');
    
    const allModulesWithRegistry = await AppDataSource.query(
      `SELECT m.code, m.name, er.id as registry_id, er.name as registry_name
       FROM modules m
       INNER JOIN entity_registry er ON er.code = m.code
       ORDER BY m.name`
    );

    console.log(`✅ All ${allModulesWithRegistry.length} modules now have entity registry entries:\n`);
    
    allModulesWithRegistry.forEach(module => {
      console.log(`   • ${module.name} (${module.code}) → Registry ID: ${module.registry_id}`);
    });

    console.log('\n✅ Entity registry fix completed successfully!');
    console.log('\n💡 You can now run: npx ts-node src/database/scripts/add-view-menu-permission.ts');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

fixEntityRegistryForModules()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
