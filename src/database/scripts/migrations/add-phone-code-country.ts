import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function addColumns() {
  const dataSource = new DataSource(typeOrmOptions as any);
  await dataSource.initialize();

  try {
    const queryRunner = dataSource.createQueryRunner();
    
    // Add columns
    await queryRunner.query('ALTER TABLE customers ADD COLUMN phone_code VARCHAR(10) NULL');
    await queryRunner.query('ALTER TABLE customers ADD COLUMN country VARCHAR(100) NULL');
    console.log('✓ Columns added successfully');

    // Update existing customer 2 with test data
    await queryRunner.query(
      'UPDATE customers SET phone_code = ?, country = ? WHERE id = 2',
      ['+52', 'Mexico']
    );
    console.log('✓ Customer 2 updated with phone_code and country');

  } catch (error) {
    if (error.message.includes('Duplicate column')) {
      console.log('✓ Columns already exist');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await dataSource.destroy();
  }
}

addColumns();
