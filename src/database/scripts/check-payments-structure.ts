import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../data-source';

async function checkStructure() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const columns = await AppDataSource.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
      AND TABLE_NAME = 'payments'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 Payments Table Structure:\n');
    columns.forEach((col: any) => {
      console.log(`  ${col.COLUMN_NAME}`);
      console.log(`    Type: ${col.DATA_TYPE}`);
      console.log(`    Nullable: ${col.IS_NULLABLE}`);
      console.log(`    Default: ${col.COLUMN_DEFAULT || 'NULL'}`);
      if (col.COLUMN_COMMENT) {
        console.log(`    Comment: ${col.COLUMN_COMMENT}`);
      }
      console.log('');
    });

    // Check if payment_documents table exists
    const tables = await AppDataSource.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
      AND TABLE_NAME = 'payment_documents'
    `);

    if (tables.length > 0) {
      console.log('✅ payment_documents table exists\n');
      
      const docColumns = await AppDataSource.query(`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
        AND TABLE_NAME = 'payment_documents'
        ORDER BY ORDINAL_POSITION
      `);

      console.log('📋 Payment Documents Table Structure:\n');
      docColumns.forEach((col: any) => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      });
    } else {
      console.log('❌ payment_documents table does NOT exist');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

checkStructure();
