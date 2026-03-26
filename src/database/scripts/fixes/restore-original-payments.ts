import { AppDataSource } from '../data-source';

async function restoreOriginalPayments() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Drop existing payments table if it exists
    console.log('Dropping existing payments table...');
    await AppDataSource.query('DROP TABLE IF EXISTS payments');

    // Create the original simple payments table structure
    console.log('Creating original payments table structure...');
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
        INDEX status_index (status),
        
        CONSTRAINT FK_payments_tenant_id 
          FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE,
        CONSTRAINT FK_payments_contract_id 
          FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Original payments table restored successfully');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

restoreOriginalPayments();