import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function runMigration() {
    console.log('🚀 Running migration...');
    
    const dataSource = new DataSource(typeOrmOptions);
    await dataSource.initialize();
    console.log('✅ Database connection established');

    try {
        // Run the migration manually
        await dataSource.query(`
            ALTER TABLE \`leads\` 
            ADD COLUMN \`company_name\` varchar(255) NULL,
            ADD COLUMN \`company_phone\` varchar(255) NULL,
            ADD COLUMN \`website\` varchar(255) NULL
        `);
        
        console.log('✅ Migration completed successfully');
    } catch (error) {
        if (error.message.includes('Duplicate column name')) {
            console.log('⏭️  Columns already exist, skipping migration');
        } else {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    } finally {
        await dataSource.destroy();
    }
}

runMigration()
    .then(() => {
        console.log('🎉 Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Migration script failed:', error);
        process.exit(1);
    });