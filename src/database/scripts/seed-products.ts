import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function seedProducts() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🌱 Seeding Products data...\n');

    // Get first tenant
    const tenants = await AppDataSource.query(`SELECT id, name FROM rbac_tenants LIMIT 1`);
    if (!tenants.length) {
      console.log('❌ No tenants found. Please create a tenant first.');
      return;
    }

    const tenantId = tenants[0].id;
    const tenantName = tenants[0].name;
    console.log(`📋 Using tenant: ${tenantName}\n`);

    // Get first vendor
    const vendors = await AppDataSource.query(`SELECT id, name FROM vendors LIMIT 1`);
    if (!vendors.length) {
      console.log('❌ No vendors found. Please create a vendor first.');
      return;
    }

    const vendorId = vendors[0].id;
    const vendorName = vendors[0].name;
    console.log(`🏢 Using vendor: ${vendorName}\n`);

    // Sample products
    const productsData = [
      {
        sku: 'PROD-001',
        name: 'Laptop Dell XPS 13',
        description: 'High-performance laptop for professionals',
      },
      {
        sku: 'PROD-002',
        name: 'USB-C Cable',
        description: 'Universal USB-C charging and data cable',
      },
      {
        sku: 'PROD-003',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with long battery life',
      },
    ];

    console.log('📦 Creating products...\n');
    const products: any[] = [];

    for (const productData of productsData) {
      // Check if product already exists
      const existing = await AppDataSource.query(
        `SELECT id FROM products WHERE tenant_id = ? AND sku = ?`,
        [tenantId, productData.sku]
      );

      if (existing.length) {
        console.log(`  ⏭️  Already exists: ${productData.name} (${productData.sku})`);
        products.push({ id: existing[0].id, ...productData });
        continue;
      }

      const productId = uuidv4();
      await AppDataSource.query(
        `INSERT INTO products (id, tenant_id, sku, name, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [productId, tenantId, productData.sku, productData.name, productData.description]
      );
      products.push({ id: productId, ...productData });
      console.log(`  ✅ Created: ${productData.name} (${productData.sku})`);
    }

    // Create UoMs for first product
    console.log('\n📏 Creating Units of Measure...\n');
    const firstProduct = products[0];

    const uomData = [
      { code: 'unit', name: 'Unit' },
      { code: 'box', name: 'Box (10 units)' },
      { code: 'pallet', name: 'Pallet (100 units)' },
    ];

    const uoms: any[] = [];
    for (const uom of uomData) {
      // Check if UoM already exists
      const existing = await AppDataSource.query(
        `SELECT id FROM uoms WHERE product_id = ? AND code = ?`,
        [firstProduct.id, uom.code]
      );

      if (existing.length) {
        console.log(`  ⏭️  Already exists: ${uom.name} (${uom.code})`);
        uoms.push({ id: existing[0].id, ...uom });
        continue;
      }

      const uomId = uuidv4();
      await AppDataSource.query(
        `INSERT INTO uoms (id, product_id, code, name, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [uomId, firstProduct.id, uom.code, uom.name]
      );
      uoms.push({ id: uomId, ...uom });
      console.log(`  ✅ Created: ${uom.name} (${uom.code})`);
    }

    // Create UoM relationships
    console.log('\n🔗 Creating UoM relationships...\n');
    const relationships = [
      { source: 'box', target: 'unit', factor: 10 },
      { source: 'pallet', target: 'unit', factor: 100 },
      { source: 'pallet', target: 'box', factor: 10 },
    ];

    for (const rel of relationships) {
      const sourceUoM = uoms.find((u) => u.code === rel.source);
      const targetUoM = uoms.find((u) => u.code === rel.target);

      if (sourceUoM && targetUoM) {
        // Check if relationship already exists
        const existing = await AppDataSource.query(
          `SELECT id FROM uom_relationships WHERE product_id = ? AND source_uom_id = ? AND target_uom_id = ?`,
          [firstProduct.id, sourceUoM.id, targetUoM.id]
        );

        if (existing.length) {
          console.log(`  ⏭️  Already exists: 1 ${rel.source} = ${rel.factor} ${rel.target}(s)`);
          continue;
        }

        const relId = uuidv4();
        await AppDataSource.query(
          `INSERT INTO uom_relationships (id, product_id, source_uom_id, target_uom_id, conversion_factor, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [relId, firstProduct.id, sourceUoM.id, targetUoM.id, rel.factor]
        );
        console.log(`  ✅ Created: 1 ${rel.source} = ${rel.factor} ${rel.target}(s)`);
      }
    }

    // Create vendor prices
    console.log('\n💰 Creating vendor prices...\n');
    const prices = [
      { uomCode: 'unit', price: 999.99 },
      { uomCode: 'box', price: 8999.99 },
      { uomCode: 'pallet', price: 89999.99 },
    ];

    for (const priceData of prices) {
      const uom = uoms.find((u) => u.code === priceData.uomCode);
      if (uom) {
        // Check if price already exists
        const existing = await AppDataSource.query(
          `SELECT id FROM vendor_product_prices WHERE vendor_id = ? AND product_id = ? AND uom_id = ?`,
          [vendorId, firstProduct.id, uom.id]
        );

        if (existing.length) {
          console.log(`  ⏭️  Already exists: ${priceData.price} per ${priceData.uomCode}`);
          continue;
        }

        const priceId = uuidv4();
        await AppDataSource.query(
          `INSERT INTO vendor_product_prices (id, vendor_id, product_id, uom_id, price, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [priceId, vendorId, firstProduct.id, uom.id, priceData.price]
        );
        console.log(`  ✅ Created: ${priceData.price} per ${priceData.uomCode}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Products seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - Products created: ${products.length}`);
    console.log(`   - UoMs created: ${uoms.length}`);
    console.log(`   - Relationships created: ${relationships.length}`);
    console.log(`   - Vendor prices created: ${prices.length}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Run migrations: npm run typeorm migration:run`);
    console.log(`   2. Test endpoints with the created data`);
    console.log(`   3. Upload product photos via the API`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedProducts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
