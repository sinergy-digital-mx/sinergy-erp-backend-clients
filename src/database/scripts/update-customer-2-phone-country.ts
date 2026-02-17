import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function updateCustomer() {
  const dataSource = new DataSource(typeOrmOptions as any);
  await dataSource.initialize();

  try {
    const queryRunner = dataSource.createQueryRunner();
    
    // Update customer 2 with phone_code and country
    await queryRunner.query(
      'UPDATE customers SET phone_code = ?, country = ? WHERE id = 2',
      ['+52', 'Mexico']
    );
    console.log('✓ Customer 2 updated with phone_code (+52) and country (Mexico)');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await dataSource.destroy();
  }
}

updateCustomer();
