import { AppDataSource } from '../data-source';

async function restorePaymentsTable() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Dropping current payments table...');
    await AppDataSource.query('DROP TABLE IF EXISTS payments');

    console.log('🔄 Creating payments table with original structure...');
    await AppDataSource.query(`
      CREATE TABLE payments (
        id varchar(36) NOT NULL PRIMARY KEY,
        tenant_id varchar(36) NOT NULL,
        contract_id varchar(36) NOT NULL,
        payment_number varchar(50) NOT NULL,
        payment_date date NOT NULL,
        amount_paid decimal(15,2) NOT NULL,
        payment_method varchar(50) DEFAULT 'transferencia',
        status enum('pagado','pendiente','parcial','cancelado') NOT NULL DEFAULT 'pendiente',
        notes text,
        metadata json,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        amount decimal(15,2) DEFAULT 0.00,
        amount_pending decimal(15,2) DEFAULT 0.00,
        due_date date,
        paid_date date,
        first_partial_payment_date date,
        is_overdue tinyint NOT NULL DEFAULT 0,
        INDEX tenant_index (tenant_id),
        INDEX contract_index (contract_id),
        INDEX payment_date_index (payment_date),
        INDEX status_index (status),
        FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    console.log('✅ Payments table restored with original structure');
    console.log('🔄 Now you can run your import script to restore the data');

  } catch (error) {
    console.error('❌ Error restoring payments table:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

restorePaymentsTable();