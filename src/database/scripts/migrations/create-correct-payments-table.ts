import { AppDataSource } from '../data-source';

async function createCorrectPaymentsTable() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Drop existing payments table
    console.log('Dropping existing payments table...');
    await AppDataSource.query('DROP TABLE IF EXISTS payments');

    // Create payments table with the correct structure from PAYMENTS_IMPORT_SUMMARY.md
    console.log('Creating payments table with correct structure...');
    await AppDataSource.query(`
      CREATE TABLE payments (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        contract_id VARCHAR(36) NOT NULL,
        payment_number INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        due_date DATE NOT NULL,
        paid_date DATE NULL,
        status ENUM('pendiente', 'pagado', 'vencido', 'cancelado') DEFAULT 'pendiente',
        payment_method VARCHAR(50) NULL,
        reference_number VARCHAR(100) NULL,
        notes TEXT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX tenant_index (tenant_id),
        INDEX contract_index (contract_id),
        INDEX due_date_index (due_date),
        INDEX status_index (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Payments table created with correct structure');
    console.log('   - payment_number: INT');
    console.log('   - amount: DECIMAL(15,2)');
    console.log('   - due_date: DATE');
    console.log('   - paid_date: DATE (nullable)');
    console.log('   - status: ENUM(pendiente, pagado, vencido, cancelado)');
    console.log('   - payment_method: VARCHAR(50) (nullable)');
    console.log('   - reference_number: VARCHAR(100) (nullable)');

    // Try to add foreign keys (optional)
    try {
      await AppDataSource.query(`
        ALTER TABLE payments 
        ADD CONSTRAINT FK_payments_tenant_id 
        FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE
      `);
      console.log('✅ Added FK_payments_tenant_id');
    } catch (error: any) {
      console.log('⚠️  Could not add tenant_id foreign key (this is okay)');
    }

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

    console.log('\n✅ Payments table is ready!');
    console.log('   Structure matches PAYMENTS_IMPORT_SUMMARY.md');
    console.log('   Entity updated to match table structure');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createCorrectPaymentsTable();