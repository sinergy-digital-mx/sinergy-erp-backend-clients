import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function addMeasurementUnitFK() {
  const dataSource = new DataSource(typeOrmOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Check if column exists
    console.log('\n🔍 Checking if measurement_unit_id column exists...');
    const columns = await dataSource.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'properties' AND COLUMN_NAME = 'measurement_unit_id'`,
    );

    if (columns.length === 0) {
      console.log('➕ Adding measurement_unit_id column...');
      await dataSource.query(
        `ALTER TABLE properties ADD COLUMN measurement_unit_id VARCHAR(36) NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440001'`,
      );
      console.log('✅ Column added');
    } else {
      console.log('✅ Column already exists');
    }

    // Check if foreign key exists
    console.log('\n🔍 Checking if foreign key exists...');
    const fks = await dataSource.query(
      `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
       WHERE TABLE_NAME = 'properties' AND COLUMN_NAME = 'measurement_unit_id' AND REFERENCED_TABLE_NAME = 'measurement_units'`,
    );

    if (fks.length === 0) {
      console.log('➕ Adding foreign key constraint...');
      await dataSource.query(
        `ALTER TABLE properties 
         ADD CONSTRAINT FK_properties_measurement_unit_id 
         FOREIGN KEY (measurement_unit_id) REFERENCES measurement_units(id) ON DELETE RESTRICT`,
      );
      console.log('✅ Foreign key added');
    } else {
      console.log('✅ Foreign key already exists');
    }

    console.log('\n✅ All done!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

addMeasurementUnitFK();
