import { AppDataSource } from '../data-source';

async function fixRoxanaDate() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Fixing first_payment_date for CONT-3-08...\n');

    // Get current contract
    const contract = await AppDataSource.query(`
      SELECT id, contract_number, contract_date, first_payment_date
      FROM contracts 
      WHERE contract_number = 'CONT-3-08'
    `);

    if (contract.length === 0) {
      console.error('Contract not found');
      process.exit(1);
    }

    const c = contract[0];
    console.log('Current values:');
    console.log(`- Contract Date: ${c.contract_date}`);
    console.log(`- First Payment Date: ${c.first_payment_date}\n`);

    // The contract date is 3/1/2025 (March 1, 2025)
    // First payment should be same month: March 1, 2025
    const correctFirstPaymentDate = new Date('2025-03-01');

    console.log('Updating to:');
    console.log(`- First Payment Date: ${correctFirstPaymentDate.toISOString().split('T')[0]}\n`);

    // Update contract
    await AppDataSource.query(`
      UPDATE contracts 
      SET first_payment_date = ?
      WHERE contract_number = 'CONT-3-08'
    `, [correctFirstPaymentDate]);

    console.log('✓ Contract updated\n');

    // Verify
    const updated = await AppDataSource.query(`
      SELECT contract_date, first_payment_date
      FROM contracts 
      WHERE contract_number = 'CONT-3-08'
    `);

    console.log('Verified:');
    console.log(`- Contract Date: ${updated[0].contract_date}`);
    console.log(`- First Payment Date: ${updated[0].first_payment_date}`);

    await AppDataSource.destroy();
    console.log('\n✓ Done! Now run: npx ts-node -r tsconfig-paths/register src/database/scripts/generate-roxana-correct.ts');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixRoxanaDate();
