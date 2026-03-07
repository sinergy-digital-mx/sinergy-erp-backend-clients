import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function seedUomsSpanish() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🌱 Seeding UoMs in Spanish...\n');

    // Define UoMs in Spanish
    const uomsData = [
      { code: 'pieza', name: 'Pieza', description: 'Unidad individual' },
      { code: 'display', name: 'Display', description: 'Paquete de display' },
      { code: 'caja', name: 'Caja', description: 'Caja completa' },
      { code: 'pallet', name: 'Pallet', description: 'Pallet completo' },
    ];

    // Get all products
    const products = await AppDataSource.query(`SELECT id FROM products`);
    console.log(`📦 Found ${products.length} product(s)\n`);

    let totalUomsCreated = 0;

    for (const product of products) {
      console.log(`Creating UoMs for product ${product.id}...`);

      for (let i = 0; i < uomsData.length; i++) {
        const uomData = uomsData[i];
        const uomId = uuidv4();

        try {
          await AppDataSource.query(
            `INSERT INTO uoms (id, product_id, code, name, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [uomId, product.id, uomData.code, uomData.name]
          );

          console.log(`   ✅ Created UoM: ${uomData.name} (${uomData.code})`);
          totalUomsCreated++;
        } catch (err: any) {
          if (err.code === 'ER_DUP_ENTRY') {
            console.log(`   ⏭️  UoM ${uomData.code} already exists for this product`);
          } else {
            throw err;
          }
        }
      }

      console.log('');
    }

    console.log('='.repeat(60));
    console.log('✅ UoMs seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - Products processed: ${products.length}`);
    console.log(`   - UoMs created: ${totalUomsCreated}`);
    console.log('\n💡 Next steps:');
    console.log(`   1. Create UoM relationships (e.g., 1 caja = 10 piezas)`);
    console.log(`   2. Create vendor prices for each UoM`);
    console.log(`   3. Use UoMs when creating requisitions`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedUomsSpanish()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
