import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function createSampleCustomers() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('👥 Creating sample customers...\n');

    // Get tenant
    const tenants = await AppDataSource.query(`SELECT id FROM rbac_tenants LIMIT 1`);
    if (!tenants.length) {
      throw new Error('No tenant found');
    }
    const tenantId = tenants[0].id;

    // Get customer status
    const statusResult = await AppDataSource.query(
      `SELECT id FROM customer_status WHERE code = 'activo' LIMIT 1`
    );
    const statusId = statusResult.length ? statusResult[0].id : 1;

    const customers = [
      {
        name: 'Juan',
        lastname: 'Pérez García',
        email: 'juan.perez@example.com',
        phone: '+52 9841234567',
      },
      {
        name: 'María',
        lastname: 'López Martínez',
        email: 'maria.lopez@example.com',
        phone: '+52 9842345678',
      },
      {
        name: 'Carlos',
        lastname: 'Rodríguez Sánchez',
        email: 'carlos.rodriguez@example.com',
        phone: '+52 9843456789',
      },
    ];

    console.log('📝 Creating customers...\n');

    for (const customer of customers) {
      await AppDataSource.query(
        `INSERT INTO customers (tenant_id, name, lastname, email, phone, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          tenantId,
          customer.name,
          customer.lastname,
          customer.email,
          customer.phone,
        ]
      );

      console.log(`  ✅ Created customer: ${customer.name} ${customer.lastname}`);
    }

    console.log('\n✅ Sample customers created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

createSampleCustomers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
