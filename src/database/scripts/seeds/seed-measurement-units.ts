import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function seedMeasurementUnits() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const measurementUnits = [
      // Metric
      {
        code: 'm2',
        name: 'Metro cuadrado',
        symbol: 'm²',
        description: 'Unidad métrica estándar para área',
        system: 'metric',
      },
      {
        code: 'ha',
        name: 'Hectárea',
        symbol: 'ha',
        description: '10,000 metros cuadrados',
        system: 'metric',
      },
      {
        code: 'km2',
        name: 'Kilómetro cuadrado',
        symbol: 'km²',
        description: '1,000,000 metros cuadrados',
        system: 'metric',
      },
      // Imperial
      {
        code: 'ft2',
        name: 'Pie cuadrado',
        symbol: 'ft²',
        description: 'Unidad imperial estándar para área',
        system: 'imperial',
      },
      {
        code: 'yd2',
        name: 'Yarda cuadrada',
        symbol: 'yd²',
        description: '9 pies cuadrados',
        system: 'imperial',
      },
      {
        code: 'acres',
        name: 'Acres',
        symbol: 'ac',
        description: '4,047 metros cuadrados aproximadamente',
        system: 'imperial',
      },
    ];

    console.log('\n🌱 Seeding measurement units...');

    for (const unit of measurementUnits) {
      const existing = await dataSource.query(
        'SELECT id FROM measurement_units WHERE code = ?',
        [unit.code]
      );

      if (existing.length === 0) {
        await dataSource.query(
          'INSERT INTO measurement_units (id, code, name, symbol, description, system, created_at) VALUES (UUID(), ?, ?, ?, ?, ?, NOW())',
          [unit.code, unit.name, unit.symbol, unit.description, unit.system]
        );
        console.log(`   ✅ ${unit.name} (${unit.symbol})`);
      } else {
        console.log(`   ⏭️  ${unit.name} already exists`);
      }
    }

    console.log('\n✅ Measurement units seeded successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

seedMeasurementUnits();