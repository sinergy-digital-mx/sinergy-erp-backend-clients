import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function addPhoneCountryToCustomers() {
  const dataSource = new DataSource(typeOrmOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // 1. Agregar columna phone_country
    console.log('📝 Adding phone_country column...');
    await dataSource.query(`
      ALTER TABLE customers 
      ADD COLUMN phone_country VARCHAR(2) NULL AFTER phone
    `);
    console.log('✅ Column added\n');

    // 2. Migrar datos existentes basados en phone_code
    console.log('🔄 Migrating existing data...');
    
    // +52 = MX (Mexico)
    await dataSource.query(`
      UPDATE customers 
      SET phone_country = 'MX' 
      WHERE phone_code = '+52'
    `);
    console.log('  ✓ Mexico numbers updated');

    // +1 = US (USA)
    await dataSource.query(`
      UPDATE customers 
      SET phone_country = 'US' 
      WHERE phone_code = '+1'
    `);
    console.log('  ✓ USA numbers updated');

    // Verificar resultados
    const stats = await dataSource.query(`
      SELECT 
        phone_country,
        phone_code,
        COUNT(*) as count
      FROM customers
      WHERE phone_country IS NOT NULL
      GROUP BY phone_country, phone_code
    `);

    console.log('\n📊 Migration results:');
    stats.forEach((row: any) => {
      console.log(`  ${row.phone_country} (${row.phone_code}): ${row.count} customers`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

addPhoneCountryToCustomers();
