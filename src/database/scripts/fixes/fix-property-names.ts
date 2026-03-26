import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';
const GROUP_ID = '550e8400-e29b-41d4-a716-446655440100';

async function fixPropertyNames() {
  const dataSource = new DataSource(typeOrmOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Obtener todas las propiedades
    console.log('🔄 Fixing property names...');
    const properties = await dataSource.query(
      `SELECT id, code, block, name 
       FROM properties 
       WHERE tenant_id = ? AND group_id = ?`,
      [TENANT_ID, GROUP_ID]
    );

    console.log(`📊 Found ${properties.length} properties to update\n`);

    let updated = 0;
    for (const prop of properties) {
      // Extraer manzana y lote del código: LOT-3-05 -> Manzana 3, Lote 5
      const parts = prop.code.split('-');
      if (parts.length === 3) {
        const manzana = parts[1];
        const lote = parseInt(parts[2], 10);
        
        // Nuevo nombre: Manzana X Lote Y (en lugar de Lote Y Manzana X)
        const newName = `Manzana ${manzana} Lote ${lote}`;
        
        if (prop.name !== newName) {
          await dataSource.query(
            `UPDATE properties SET name = ? WHERE id = ?`,
            [newName, prop.id]
          );
          console.log(`  ✓ ${prop.code}: "${prop.name}" → "${newName}"`);
          updated++;
        }
      }
    }

    console.log(`\n✅ Updated ${updated} property names`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

fixPropertyNames();
