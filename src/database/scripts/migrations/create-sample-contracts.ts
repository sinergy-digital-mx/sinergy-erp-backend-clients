import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function createSampleContracts() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('📋 Creating sample contracts...\n');

    // Get tenant
    const tenants = await AppDataSource.query(`SELECT id FROM rbac_tenants LIMIT 1`);
    if (!tenants.length) {
      throw new Error('No tenant found');
    }
    const tenantId = tenants[0].id;
    console.log(`✅ Using tenant: ${tenantId}\n`);

    // Get some customers
    const customers = await AppDataSource.query(
      `SELECT id FROM customers WHERE tenant_id = ? LIMIT 3`,
      [tenantId]
    );

    if (customers.length < 1) {
      console.log('⚠️  No customers found. Create customers first.');
      return;
    }

    // Get some properties
    const properties = await AppDataSource.query(
      `SELECT id FROM properties WHERE tenant_id = ? AND status = 'disponible' LIMIT 3`,
      [tenantId]
    );

    if (properties.length < 1) {
      console.log('⚠️  No available properties found.');
      return;
    }

    console.log(`📍 Found ${customers.length} customer(s) and ${properties.length} property(ies)\n`);

    // Create contracts
    const contracts = [
      {
        customer_id: customers[0].id,
        property_id: properties[0].id,
        contract_number: 'CONT-2025-001',
        contract_date: new Date('2025-01-15'),
        total_price: 50000,
        down_payment: 10000,
        payment_months: 60,
        first_payment_date: new Date('2025-02-15'),
      },
      {
        customer_id: customers[0].id,
        property_id: properties[1].id,
        contract_number: 'CONT-2025-002',
        contract_date: new Date('2025-01-20'),
        total_price: 75000,
        down_payment: 15000,
        payment_months: 48,
        first_payment_date: new Date('2025-02-20'),
      },
    ];

    if (customers.length > 1 && properties.length > 2) {
      contracts.push({
        customer_id: customers[1].id,
        property_id: properties[2].id,
        contract_number: 'CONT-2025-003',
        contract_date: new Date('2025-01-25'),
        total_price: 150000,
        down_payment: 30000,
        payment_months: 84,
        first_payment_date: new Date('2025-02-25'),
      });
    }

    console.log('🔗 Creating contracts...\n');

    for (const contract of contracts) {
      const remaining_balance = contract.total_price - contract.down_payment;
      const monthly_payment = remaining_balance / contract.payment_months;

      await AppDataSource.query(
        `INSERT INTO contracts (id, tenant_id, customer_id, property_id, contract_number, contract_date, total_price, down_payment, remaining_balance, payment_months, monthly_payment, first_payment_date, currency, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          uuidv4(),
          tenantId,
          contract.customer_id,
          contract.property_id,
          contract.contract_number,
          contract.contract_date,
          contract.total_price,
          contract.down_payment,
          remaining_balance,
          contract.payment_months,
          Math.round(monthly_payment * 100) / 100,
          contract.first_payment_date,
          'MXN',
          'activo',
        ]
      );

      console.log(`  ✅ Created contract: ${contract.contract_number}`);
      console.log(`     Total: $${contract.total_price}, Down: $${contract.down_payment}, Monthly: $${Math.round(monthly_payment * 100) / 100}`);
    }

    console.log('\n✅ Sample contracts created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

createSampleContracts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
