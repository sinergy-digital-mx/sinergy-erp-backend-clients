import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function createTable() {
  const dataSource = new DataSource(typeOrmOptions as any);
  await dataSource.initialize();

  try {
    const queryRunner = dataSource.createQueryRunner();
    
    // Drop existing table
    await queryRunner.query('DROP TABLE IF EXISTS phone_countries');
    
    // Create table with utf8mb4
    await queryRunner.query(`
      CREATE TABLE phone_countries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        country_name VARCHAR(100) NOT NULL,
        country_code VARCHAR(3) NOT NULL,
        phone_code VARCHAR(20) NOT NULL,
        flag_emoji VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX phone_country_code_index (phone_code),
        INDEX phone_country_name_index (country_name)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('✓ Table created');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await dataSource.destroy();
  }
}

createTable();
