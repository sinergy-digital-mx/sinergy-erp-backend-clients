import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function seedUoMCatalog() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🌱 Seeding UoM Catalog...\n');

    // Define global UoMs
    const uomsData = [
      { name: 'Pieza', description: 'Unidad individual' },
      { name: 'Display', description: 'Paquete de display' },
      { name: 'Caja', description: 'Caja completa' },
      { name: 'Pallet', description: 'Pallet completo' },
      { name: 'Bulto', description: 'Bulto de productos' },
      { name: 'Docena', description: 'Doce unidades' },
      { name: 'Metro', description: 'Metro lineal' },
      { name: 'Kilogramo', description: 'Kilogramo de peso' },
    ];

    console.log('📝 Creating UoMs in catalog...\n');

    for (const uomData of uomsData) {
      const uomId = uuidv4();

      try {
        await AppDataSource.query(
          `INSERT INTO uom_catalog (id, name, description, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [uomId, uomData.name, uomData.description]
        );

        console.log(`✅ Created: ${uomData.name}`);
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⏭️  ${uomData.name} already exists`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ UoM Catalog seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - UoMs created: ${uomsData.length}`);
    console.log('\n💡 Next steps:');
    console.log(`   1. Assign UoMs to products`);
    console.log(`   2. Create UoM relationships (conversions)`);
    console.log(`   3. Create vendor prices`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedUoMCatalog()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
