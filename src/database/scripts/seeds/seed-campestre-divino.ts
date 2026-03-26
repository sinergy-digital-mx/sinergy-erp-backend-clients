import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function seedCampestreDivino() {
  const dataSource = new DataSource(typeOrmOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Get tenant ID (assuming first tenant or you can specify)
    console.log('\n🔍 Getting tenant...');
    const tenants = await dataSource.query('SELECT id FROM rbac_tenants LIMIT 1');
    
    if (tenants.length === 0) {
      console.error('❌ No tenant found. Please create a tenant first.');
      return;
    }

    const tenantId = tenants[0].id;
    console.log(`✅ Using tenant: ${tenantId}`);

    // Check if group already exists
    console.log('\n🔍 Checking if Campestre Divino already exists...');
    const existing = await dataSource.query(
      'SELECT id FROM property_groups WHERE name = ? AND tenant_id = ?',
      ['Campestre Divino', tenantId]
    );

    if (existing.length > 0) {
      console.log('✅ Campestre Divino already exists:', existing[0].id);
      return;
    }

    // Create Campestre Divino group
    console.log('\n🌱 Creating Campestre Divino property group...');
    const groupId = '550e8400-e29b-41d4-a716-446655440100';
    
    await dataSource.query(
      `INSERT INTO property_groups (id, tenant_id, name, description, location, total_area, total_properties, available_properties, sold_properties, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        groupId,
        tenantId,
        'Campestre Divino',
        'Proyecto residencial campestre con lotes premium',
        'Culiacán, Sinaloa',
        0,
        0,
        0,
        0
      ]
    );

    console.log('✅ Campestre Divino created successfully!');
    console.log(`   ID: ${groupId}`);
    console.log(`   Tenant: ${tenantId}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

seedCampestreDivino();
