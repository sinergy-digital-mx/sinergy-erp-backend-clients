import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function testCustomerGroup() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Get a customer with group
    console.log('\n🔍 Getting customer with group...');
    const customer = await dataSource.query(`
      SELECT c.*, cg.id as group_id, cg.name as group_name, cg.description as group_description
      FROM customers c
      LEFT JOIN customer_groups cg ON c.group_id = cg.id
      LIMIT 1
    `);

    if (customer.length > 0) {
      console.log('📊 Customer found:');
      console.log(JSON.stringify(customer[0], null, 2));
    } else {
      console.log('❌ No customers found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

testCustomerGroup();