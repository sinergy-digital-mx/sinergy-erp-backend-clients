import { AppDataSource } from '../data-source';

async function restoreOriginalPaymentsStructure() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Drop existing payments table
    console.log('Dropping existing payments table...');
    await AppDataSource.query('DROP TABLE IF EXISTS payments');

    // Create payments table with the ORIGINAL structure from commit d5f2e59
    console.log('Creating payments table with original structure...');
    await AppDataSource.query(`
      CREATE TABLE payments (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        contract_id VARCHAR(36) NOT NULL,
        payment_number VARCHAR(50) NOT NULL,
        payment_date DATE NOT NULL,
        amount_paid DECIMAL(15,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'transferencia',
        status ENUM('pagado', 'pendiente', 'atrasado', 'cancelado') DEFAULT 'pagado',
        notes TEXT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX tenant_index (tenant_id),
        INDEX contract_index (contract_id),
        INDEX payment_date_index (payment_date),
        INDEX status_index (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Payments table created with ORIGINAL structure');
    console.log('   - payment_number: VARCHAR(50)');
    console.log('   - payment_date: DATE');
    console.log('   - amount_paid: DECIMAL(15,2)');
    console.log('   - status: ENUM(pagado, pendiente, atrasado, cancelado)');

    // Try to add foreign keys (optional)
    try {
      await AppDataSource.query(`
        ALTER TABLE payments 
        ADD CONSTRAINT FK_payments_contract_id 
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE RESTRICT
      `);
      console.log('✅ Added FK_payments_contract_id');
    } catch (error: any) {
      console.log('⚠️  Could not add contract_id foreign key (this is okay)');
    }

    console.log('\n✅ Original payments table structure restored!');
    console.log('   Now you can re-import the payments with the correct structure');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

restoreOriginalPaymentsStructure();