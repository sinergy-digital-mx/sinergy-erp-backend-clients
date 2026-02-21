import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function checkTenantModules() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';
    
    // Check if tenant_modules table exists and has data
    console.log('\n🔍 Checking tenant_modules table...');
    const tenantModules = await dataSource.query(`
      SELECT tm.*, m.name as module_name, m.code as module_code
      FROM tenant_modules tm
      LEFT JOIN modules m ON tm.module_id = m.id
      WHERE tm.tenant_id = ?
    `, [tenantId]);

    console.log(`📊 Found ${tenantModules.length} tenant modules:`);
    tenantModules.forEach((tm: any) => {
      console.log(`   • ${tm.module_name} (${tm.module_code}) - Enabled: ${tm.is_enabled}`);
    });

    if (tenantModules.length === 0) {
      console.log('\n❌ No modules found for tenant!');
      console.log('💡 This explains why the available permissions endpoint fails');
      
      // Check what modules exist in the system
      console.log('\n📋 Available modules in system:');
      const allModules = await dataSource.query('SELECT * FROM modules ORDER BY name');
      allModules.forEach((m: any) => {
        console.log(`   • ${m.name} (${m.code}) - ID: ${m.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

checkTenantModules();