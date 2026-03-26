require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixCollations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log('🔧 Fixing collations...\n');

    // Fix contracts
    console.log('Fixing contracts...');
    const contractCols = ['id', 'tenant_id', 'customer_id', 'property_id'];
    for (const col of contractCols) {
      try {
        await connection.query(`ALTER TABLE contracts MODIFY ${col} VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`);
        console.log(`✅ contracts.${col}`);
      } catch (e) {
        console.log(`⚠️  contracts.${col}: ${e.message}`);
      }
    }

    // Fix contract_documents
    console.log('\nFixing contract_documents...');
    try {
      await connection.query('ALTER TABLE contract_documents MODIFY contract_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
      console.log('✅ contract_documents.contract_id');
    } catch (e) {
      console.log(`⚠️  contract_documents.contract_id: ${e.message}`);
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixCollations();
