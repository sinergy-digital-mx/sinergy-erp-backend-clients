import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';
const CUSTOMER_GROUP_ID = '9917f55f-c03d-4436-83be-95b03360794c';

async function assignCustomerGroup() {
  const dataSource = new DataSource(typeOrmOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Actualizar todos los customers del tenant
    console.log('🔄 Assigning customer group...');
    const result = await dataSource.query(
      `UPDATE customers 
       SET group_id = ? 
       WHERE tenant_id = ?`,
      [CUSTOMER_GROUP_ID, TENANT_ID]
    );

    console.log(`✅ Updated ${result.affectedRows} customers`);
    console.log(`   Group ID: ${CUSTOMER_GROUP_ID}`);

    // Verificar
    const stats = await dataSource.query(
      `SELECT COUNT(*) as count 
       FROM customers 
       WHERE tenant_id = ? AND group_id = ?`,
      [TENANT_ID, CUSTOMER_GROUP_ID]
    );

    console.log(`\n📊 Verification: ${stats[0].count} customers now have the group assigned`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

assignCustomerGroup();
