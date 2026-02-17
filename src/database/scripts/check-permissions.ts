import { AppDataSource } from '../data-source';

async function check() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Available entity_type values in rbac_permissions:\n');
    const result = await AppDataSource.query(`
      SELECT DISTINCT entity_type FROM rbac_permissions ORDER BY entity_type
    `);
    
    result.forEach((row: any) => {
      console.log(`  - "${row.entity_type}"`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

check().then(() => process.exit(0)).catch(() => process.exit(1));
