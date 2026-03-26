import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';
import { v4 as uuidv4 } from 'uuid';

async function createCustomerDocumentsTables() {
  const dataSource = new DataSource(typeOrmOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // 1. Create document_types table
    console.log('📝 Creating document_types table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS document_types (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NULL,
        code VARCHAR(100) NOT NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_required BOOLEAN DEFAULT FALSE,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX tenant_index (tenant_id),
        FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ document_types table created\n');

    // 2. Create customer_documents table
    console.log('📝 Creating customer_documents table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS customer_documents (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        customer_id INT NOT NULL,
        document_type_id VARCHAR(36) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size BIGINT NOT NULL,
        expiration_date DATE NULL,
        notes TEXT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        metadata JSON NULL,
        uploaded_by VARCHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX tenant_index (tenant_id),
        INDEX customer_index (customer_id),
        FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (document_type_id) REFERENCES document_types(id) ON DELETE RESTRICT
      )
    `);
    console.log('✅ customer_documents table created\n');

    // 3. Seed global document types
    console.log('🌱 Seeding global document types...');
    
    const globalTypes = [
      {
        id: uuidv4(),
        code: 'id_card',
        name: 'INE/IFE',
        description: 'Identificación oficial mexicana',
      },
      {
        id: uuidv4(),
        code: 'drivers_license',
        name: 'Licencia de Conducir',
        description: 'Licencia de conducir vigente',
      },
      {
        id: uuidv4(),
        code: 'passport',
        name: 'Pasaporte',
        description: 'Pasaporte vigente',
      },
      {
        id: uuidv4(),
        code: 'proof_of_address',
        name: 'Comprobante de Domicilio',
        description: 'Recibo de luz, agua, teléfono, etc. (no mayor a 3 meses)',
      },
      {
        id: uuidv4(),
        code: 'proof_of_income',
        name: 'Comprobante de Ingresos',
        description: 'Recibo de nómina, estados de cuenta, declaración de impuestos',
      },
      {
        id: uuidv4(),
        code: 'tax_id',
        name: 'RFC',
        description: 'Registro Federal de Contribuyentes',
      },
      {
        id: uuidv4(),
        code: 'bank_statement',
        name: 'Estado de Cuenta Bancario',
        description: 'Estado de cuenta bancario reciente',
      },
      {
        id: uuidv4(),
        code: 'contract',
        name: 'Contrato',
        description: 'Contrato firmado',
      },
      {
        id: uuidv4(),
        code: 'other',
        name: 'Otro',
        description: 'Otro tipo de documento',
      },
    ];

    for (const type of globalTypes) {
      await dataSource.query(
        `INSERT INTO document_types (id, tenant_id, code, name, description, is_active, is_required)
         VALUES (?, NULL, ?, ?, ?, TRUE, FALSE)`,
        [type.id, type.code, type.name, type.description]
      );
      console.log(`  ✓ ${type.name}`);
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

createCustomerDocumentsTables();
