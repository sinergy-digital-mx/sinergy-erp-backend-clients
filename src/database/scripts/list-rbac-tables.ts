import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function listRbacTables() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // List all tables that start with 'rbac_' or contain 'module'
    const tables = await dataSource.query(`
      SELECT TABLE_NAME as table_name
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND (TABLE_NAME LIKE 'rbac_%' OR TABLE_NAME LIKE '%module%' OR TABLE_NAME LIKE '%tenant%')
      ORDER BY TABLE_NAME
    `);

    console.log('\n📋 RBAC and Module related tables:');
    tables.forEach((table: any) => {
      console.log(`   • ${table.table_name}`);
    });

    // Check specifically for tenant modules
    console.log('\n🔍 Looking for tenant-module relationship tables...');
    const tenantModuleTables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND (table_name LIKE '%tenant%module%' OR table_name LIKE '%module%tenant%')
      ORDER BY table_name
    `);

    if (tenantModuleTables.length === 0) {
      console.log('❌ No tenant-module relationship tables found');
      console.log('💡 This explains why the endpoint is failing');
    } else {
      console.log('✅ Found tenant-module tables:');
      tenantModuleTables.forEach((table: any) => {
        console.log(`   • ${table.table_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

listRbacTables();