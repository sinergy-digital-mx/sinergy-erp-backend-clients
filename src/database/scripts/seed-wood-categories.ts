import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function seedWoodCategories() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🌱 Seeding Wood Categories and Subcategories...\n');

    // Tenant ID
    const tenantId = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';

    // Verify tenant exists
    const tenant = await AppDataSource.query(
      `SELECT id, name FROM rbac_tenants WHERE id = ?`,
      [tenantId]
    );

    if (!tenant.length) {
      console.log(`❌ Tenant with ID ${tenantId} not found`);
      return;
    }

    const tenantName = tenant[0].name;
    console.log(`📋 Using tenant: ${tenantName}\n`);

    // Categories data
    const categoriesData = [
      {
        name: 'Madera sólida',
        description: 'Maderas sólidas de alta calidad',
        subcategories: [
          { name: 'Pino', description: 'Madera de pino' },
          { name: 'Encino', description: 'Madera de encino' },
          { name: 'Cedro', description: 'Madera de cedro' },
          { name: 'Caoba', description: 'Madera de caoba' },
        ],
      },
      {
        name: 'Tableros de madera',
        description: 'Tableros y láminas de madera',
        subcategories: [
          { name: 'MDF', description: 'Tablero de fibra de densidad media' },
          { name: 'Triplay', description: 'Tablero contrachapado' },
          { name: 'OSB', description: 'Tablero de virutas orientadas' },
          { name: 'Aglomerado', description: 'Tablero aglomerado' },
        ],
      },
    ];

    // Create categories and subcategories
    console.log('📦 Creating categories and subcategories...\n');

    for (const categoryData of categoriesData) {
      // Create category
      const categoryId = uuidv4();
      await AppDataSource.query(
        `INSERT INTO categories (id, tenant_id, name, description, status, display_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          categoryId,
          tenantId,
          categoryData.name,
          categoryData.description,
          'active',
          0,
        ]
      );

      console.log(`✅ Created category: ${categoryData.name}`);

      // Create subcategories
      for (let i = 0; i < categoryData.subcategories.length; i++) {
        const subcategoryData = categoryData.subcategories[i];
        const subcategoryId = uuidv4();

        await AppDataSource.query(
          `INSERT INTO subcategories (id, tenant_id, category_id, name, description, status, display_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            subcategoryId,
            tenantId,
            categoryId,
            subcategoryData.name,
            subcategoryData.description,
            'active',
            i,
          ]
        );

        console.log(`   └─ ✅ Created subcategory: ${subcategoryData.name}`);
      }

      console.log('');
    }

    console.log('='.repeat(60));
    console.log('✅ Wood categories seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - Categories created: ${categoriesData.length}`);
    console.log(
      `   - Subcategories created: ${categoriesData.reduce((sum, cat) => sum + cat.subcategories.length, 0)}`
    );
    console.log(`   - Tenant: ${tenantName}`);
    console.log('\n💡 Next steps:');
    console.log(`   1. Create products with these categories`);
    console.log(`   2. Use category_id and subcategory_id when creating products`);
    console.log(`   3. Test endpoints to list products by category`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedWoodCategories()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
