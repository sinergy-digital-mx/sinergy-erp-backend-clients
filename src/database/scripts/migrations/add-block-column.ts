import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function addBlockColumn() {
  const dataSource = new DataSource(typeOrmOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Check if column exists
    console.log('\n🔍 Checking if block column exists...');
    const columns = await dataSource.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'properties' AND COLUMN_NAME = 'block'`,
    );

    if (columns.length === 0) {
      console.log('➕ Adding block column...');
      await dataSource.query(
        `ALTER TABLE properties ADD COLUMN block VARCHAR(50) NULL AFTER code`,
      );
      console.log('✅ Block column added');
    } else {
      console.log('✅ Block column already exists');
    }

    console.log('\n✅ All done!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

addBlockColumn();
