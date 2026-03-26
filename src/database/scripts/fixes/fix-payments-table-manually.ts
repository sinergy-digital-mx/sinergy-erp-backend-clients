import { AppDataSource } from '../data-source';

async function fixPaymentsTable() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Check if payments table exists
    const paymentsExists = await AppDataSource.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'payments'
    `);

    if (paymentsExists[0].count > 0) {
      console.log('⚠️  Payments table already exists, dropping it...');
      await AppDataSource.query('DROP TABLE IF EXISTS payments');
    }

    // Check rbac_tenants.id type
    const tenantsIdType = await AppDataSource.query(`
      SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'rbac_tenants'
      AND COLUMN_NAME = 'id'
    `);

    console.log('rbac_tenants.id type:', tenantsIdType[0]);

    // Check contracts.id type
    const contractsIdType = await AppDataSource.query(`
      SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contracts'
      AND COLUMN_NAME = 'id'
    `);

    console.log('contracts.id type:', contractsIdType[0]);

    // Get the exact column type from rbac_tenants
    const tenantColumnType = tenantsIdType[0].COLUMN_TYPE;
    const contractColumnType = contractsIdType[0].COLUMN_TYPE;

    // Create payments table with matching types
    await AppDataSource.query(`
      CREATE TABLE payments (
        id ${tenantColumnType} PRIMARY KEY,
        tenant_id ${tenantColumnType} NOT NULL,
        contract_id ${contractColumnType} NOT NULL,
        payment_number VARCHAR(50) NOT NULL,
        payment_date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL COMMENT 'Monto total esperado del pago',
        amount_paid DECIMAL(15,2) DEFAULT 0 COMMENT 'Monto realmente pagado (puede ser parcial)',
        amount_pending DECIMAL(15,2) DEFAULT 0 COMMENT 'Diferencia pendiente (amount - amount_paid)',
        paid_date DATE NULL COMMENT 'Fecha del último pago',
        first_partial_payment_date DATE NULL COMMENT 'Fecha del primer pago parcial',
        payment_method VARCHAR(50) DEFAULT 'transferencia',
        status ENUM('pendiente', 'pagado', 'parcial', 'vencido', 'cancelado') DEFAULT 'pendiente',
        notes TEXT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX IDX_payments_tenant_id (tenant_id),
        INDEX IDX_payments_contract_id (contract_id),
        INDEX IDX_payments_payment_date (payment_date),
        INDEX IDX_payments_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Payments table created');

    // Add foreign keys separately
    console.log('Adding foreign key for tenant_id...');
    await AppDataSource.query(`
      ALTER TABLE payments 
      ADD CONSTRAINT FK_payments_tenant_id 
      FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE
    `);

    console.log('Adding foreign key for contract_id...');
    await AppDataSource.query(`
      ALTER TABLE payments 
      ADD CONSTRAINT FK_payments_contract_id 
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE RESTRICT
    `);

    console.log('✅ Payments table created successfully with foreign keys');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPaymentsTable();
