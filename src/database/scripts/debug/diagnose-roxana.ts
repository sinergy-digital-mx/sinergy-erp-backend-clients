import { AppDataSource } from '../data-source';

async function diagnoseRoxana() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Diagnosing CONT-3-08...\n');

    // Find contract by number
    const contractByNumber = await AppDataSource.query(`
      SELECT id, contract_number, tenant_id, total_price, down_payment, 
             remaining_balance, first_payment_date, payment_months, monthly_payment
      FROM contracts 
      WHERE contract_number = 'CONT-3-08'
    `);

    console.log('1. Search by contract_number = "CONT-3-08":');
    if (contractByNumber.length > 0) {
      console.log(`   ✓ Found: ${JSON.stringify(contractByNumber[0], null, 2)}`);
    } else {
      console.log('   ✗ Not found');
    }

    // Find contracts with Roxana
    const contractsByRoxana = await AppDataSource.query(`
      SELECT c.id, c.contract_number, c.tenant_id, cust.name, cust.lastname
      FROM contracts c
      LEFT JOIN customers cust ON c.customer_id = cust.id
      WHERE cust.name LIKE '%Roxana%' OR cust.lastname LIKE '%Roxana%'
    `);

    console.log('\n2. Search by customer name containing "Roxana":');
    if (contractsByRoxana.length > 0) {
      contractsByRoxana.forEach(c => {
        console.log(`   - ${c.contract_number} (ID: ${c.id}) - ${c.name} ${c.lastname}`);
      });
    } else {
      console.log('   ✗ Not found');
    }

    // Find all contracts with lote 8
    const contractsWithLote8 = await AppDataSource.query(`
      SELECT c.id, c.contract_number, c.tenant_id, p.code, p.lot_number
      FROM contracts c
      LEFT JOIN properties p ON c.property_id = p.id
      WHERE p.code LIKE '%8%' OR p.lot_number LIKE '%8%'
    `);

    console.log('\n3. Search by property code/lot containing "8":');
    if (contractsWithLote8.length > 0) {
      contractsWithLote8.forEach(c => {
        console.log(`   - ${c.contract_number} (ID: ${c.id}) - Lote: ${c.code}/${c.lot_number}`);
      });
    } else {
      console.log('   ✗ Not found');
    }

    // If we found a contract, check its payments
    if (contractByNumber.length > 0) {
      const contractId = contractByNumber[0].id;
      const payments = await AppDataSource.query(`
        SELECT id, payment_number, due_date, amount, amount_paid, status
        FROM contract_payments 
        WHERE contract_id = ?
      `, [contractId]);

      console.log(`\n4. Payments for CONT-3-08 (contract_id: ${contractId}):`);
      if (payments.length > 0) {
        console.log(`   ✓ Found ${payments.length} payments`);
        payments.slice(0, 5).forEach(p => {
          console.log(`   - Pago #${p.payment_number}: ${p.due_date} - $${p.amount} (${p.status})`);
        });
      } else {
        console.log('   ✗ No payments found');
      }
    }

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

diagnoseRoxana();
