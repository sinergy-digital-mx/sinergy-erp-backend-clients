import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function createMeasurementUnitsTable() {
  const dataSource = new DataSource(typeOrmOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Create table directly with SQL
    console.log('\n🔄 Creating measurement_units table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS measurement_units (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        description TEXT,
        \`system\` ENUM('metric', 'imperial') DEFAULT 'metric',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX code_index (code)
      )
    `);
    console.log('✅ measurement_units table created successfully!');

    // Seed data
    console.log('\n🌱 Seeding measurement units...');
    const units = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        code: 'm2',
        name: 'Metro cuadrado',
        symbol: 'm²',
        system: 'metric',
        description: 'Unidad de área métrica',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        code: 'ha',
        name: 'Hectárea',
        symbol: 'ha',
        system: 'metric',
        description: 'Unidad de área métrica (10,000 m²)',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        code: 'km2',
        name: 'Kilómetro cuadrado',
        symbol: 'km²',
        system: 'metric',
        description: 'Unidad de área métrica (1,000,000 m²)',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        code: 'ft2',
        name: 'Pie cuadrado',
        symbol: 'ft²',
        system: 'imperial',
        description: 'Unidad de área imperial',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        code: 'yd2',
        name: 'Yarda cuadrada',
        symbol: 'yd²',
        system: 'imperial',
        description: 'Unidad de área imperial',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        code: 'acres',
        name: 'Acres',
        symbol: 'ac',
        system: 'imperial',
        description: 'Unidad de área imperial',
      },
    ];

    for (const unit of units) {
      await dataSource.query(
        `INSERT IGNORE INTO measurement_units (id, code, name, symbol, \`system\`, description) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [unit.id, unit.code, unit.name, unit.symbol, unit.system, unit.description],
      );
    }

    console.log('✅ Measurement units seeded successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

createMeasurementUnitsTable();
