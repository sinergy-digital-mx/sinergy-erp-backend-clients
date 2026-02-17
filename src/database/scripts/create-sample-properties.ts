import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function createSampleProperties() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🏗️  Creating sample property groups and properties...\n');

    // Get tenant
    const tenants = await AppDataSource.query(`SELECT id FROM rbac_tenants LIMIT 1`);
    if (!tenants.length) {
      throw new Error('No tenant found');
    }
    const tenantId = tenants[0].id;
    console.log(`✅ Using tenant: ${tenantId}\n`);

    // Create property groups
    const groups = [
      {
        id: uuidv4(),
        name: 'Divino Living',
        description: 'Desarrollo residencial de lujo',
        location: 'Cancún, Quintana Roo',
        total_area: 50000,
      },
      {
        id: uuidv4(),
        name: 'Campestre',
        description: 'Lotes campestres con vista',
        location: 'Playa del Carmen',
        total_area: 75000,
      },
      {
        id: uuidv4(),
        name: 'Costa Azul',
        description: 'Propiedades frente al mar',
        location: 'Tulum',
        total_area: 30000,
      },
    ];

    console.log('📋 Creating property groups...\n');
    for (const group of groups) {
      await AppDataSource.query(
        `INSERT INTO property_groups (id, tenant_id, name, description, location, total_area, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [group.id, tenantId, group.name, group.description, group.location, group.total_area]
      );
      console.log(`  ✅ Created group: ${group.name}`);
    }

    // Create properties for each group
    console.log('\n📍 Creating properties...\n');

    const properties = [
      // Divino Living
      {
        code: 'DIV-001',
        name: 'Lote A1 - Divino Living',
        group_id: groups[0].id,
        total_area: 500,
        total_price: 50000,
        location: 'Manzana A, Lote 1',
      },
      {
        code: 'DIV-002',
        name: 'Lote A2 - Divino Living',
        group_id: groups[0].id,
        total_area: 550,
        total_price: 55000,
        location: 'Manzana A, Lote 2',
      },
      {
        code: 'DIV-003',
        name: 'Lote B1 - Divino Living',
        group_id: groups[0].id,
        total_area: 600,
        total_price: 60000,
        location: 'Manzana B, Lote 1',
      },
      // Campestre
      {
        code: 'CAMP-001',
        name: 'Lote Campestre 1',
        group_id: groups[1].id,
        total_area: 1000,
        total_price: 75000,
        location: 'Sector Norte',
      },
      {
        code: 'CAMP-002',
        name: 'Lote Campestre 2',
        group_id: groups[1].id,
        total_area: 1200,
        total_price: 85000,
        location: 'Sector Norte',
      },
      // Costa Azul
      {
        code: 'COSTA-001',
        name: 'Lote Frente al Mar 1',
        group_id: groups[2].id,
        total_area: 400,
        total_price: 150000,
        location: 'Primera línea de playa',
      },
      {
        code: 'COSTA-002',
        name: 'Lote Frente al Mar 2',
        group_id: groups[2].id,
        total_area: 450,
        total_price: 160000,
        location: 'Primera línea de playa',
      },
    ];

    for (const prop of properties) {
      await AppDataSource.query(
        `INSERT INTO properties (id, tenant_id, group_id, code, name, description, location, total_area, total_price, currency, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          uuidv4(),
          tenantId,
          prop.group_id,
          prop.code,
          prop.name,
          `Propiedad ${prop.code}`,
          prop.location,
          prop.total_area,
          prop.total_price,
          'MXN',
          'disponible',
        ]
      );
      console.log(`  ✅ Created property: ${prop.code} - ${prop.name}`);
    }

    console.log('\n✅ Sample properties created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

createSampleProperties()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
