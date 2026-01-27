import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUsersTenantIdToUuid1769544821279 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get all foreign key constraints that reference tenant tables
        const foreignKeys = await queryRunner.query(`
            SELECT 
                CONSTRAINT_NAME,
                TABLE_NAME,
                REFERENCED_TABLE_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE REFERENCED_TABLE_NAME = 'tenant' 
            AND TABLE_SCHEMA = DATABASE()
        `);

        // Drop all foreign key constraints that reference the old tenant table
        for (const fk of foreignKeys) {
            try {
                await queryRunner.query(`ALTER TABLE ${fk.TABLE_NAME} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                console.log(`Dropped foreign key: ${fk.CONSTRAINT_NAME} from ${fk.TABLE_NAME}`);
            } catch (error) {
                console.log(`Failed to drop foreign key ${fk.CONSTRAINT_NAME}: ${error.message}`);
            }
        }

        // Update all tenant_id columns to VARCHAR(36) to store UUIDs
        await queryRunner.query(`
            ALTER TABLE users 
            MODIFY COLUMN tenant_id VARCHAR(36) NULL
        `);

        await queryRunner.query(`
            ALTER TABLE leads 
            MODIFY COLUMN tenant_id VARCHAR(36) NULL
        `);

        await queryRunner.query(`
            ALTER TABLE lead_addresses 
            MODIFY COLUMN tenant_id VARCHAR(36) NULL
        `);

        await queryRunner.query(`
            ALTER TABLE customers 
            MODIFY COLUMN tenant_id VARCHAR(36) NULL
        `);

        await queryRunner.query(`
            ALTER TABLE customer_addresses 
            MODIFY COLUMN tenant_id VARCHAR(36) NULL
        `);

        // Clear all tenant_id values since they're invalid now (old numeric IDs)
        // Users will need to be migrated separately using the migration script
        await queryRunner.query(`UPDATE users SET tenant_id = NULL`);
        await queryRunner.query(`UPDATE leads SET tenant_id = NULL`);
        await queryRunner.query(`UPDATE lead_addresses SET tenant_id = NULL`);
        await queryRunner.query(`UPDATE customers SET tenant_id = NULL`);
        await queryRunner.query(`UPDATE customer_addresses SET tenant_id = NULL`);

        // Add foreign key constraints to rbac_tenants table
        await queryRunner.query(`
            ALTER TABLE users 
            ADD CONSTRAINT FK_users_rbac_tenant_id 
            FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE leads 
            ADD CONSTRAINT FK_leads_rbac_tenant_id 
            FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE lead_addresses 
            ADD CONSTRAINT FK_lead_addresses_rbac_tenant_id 
            FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE customers 
            ADD CONSTRAINT FK_customers_rbac_tenant_id 
            FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE customer_addresses 
            ADD CONSTRAINT FK_customer_addresses_rbac_tenant_id 
            FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE SET NULL
        `);

        // Drop the old tenant table since we're now using rbac_tenants
        await queryRunner.query(`DROP TABLE IF EXISTS tenant`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the old tenant table
        await queryRunner.query(`
            CREATE TABLE tenant (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Drop foreign key constraints to rbac_tenants
        await queryRunner.query(`
            ALTER TABLE users 
            DROP FOREIGN KEY IF EXISTS FK_users_rbac_tenant_id
        `);

        await queryRunner.query(`
            ALTER TABLE leads 
            DROP FOREIGN KEY IF EXISTS FK_leads_rbac_tenant_id
        `);

        await queryRunner.query(`
            ALTER TABLE lead_addresses 
            DROP FOREIGN KEY IF EXISTS FK_lead_addresses_rbac_tenant_id
        `);

        await queryRunner.query(`
            ALTER TABLE customers 
            DROP FOREIGN KEY IF EXISTS FK_customers_rbac_tenant_id
        `);

        await queryRunner.query(`
            ALTER TABLE customer_addresses 
            DROP FOREIGN KEY IF EXISTS FK_customer_addresses_rbac_tenant_id
        `);

        // Revert tenant_id columns back to INT
        await queryRunner.query(`
            ALTER TABLE users 
            MODIFY COLUMN tenant_id INT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE leads 
            MODIFY COLUMN tenant_id INT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE lead_addresses 
            MODIFY COLUMN tenant_id INT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE customers 
            MODIFY COLUMN tenant_id INT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE customer_addresses 
            MODIFY COLUMN tenant_id INT NULL
        `);

        // Recreate foreign key constraints to old tenant table
        await queryRunner.query(`
            ALTER TABLE users 
            ADD CONSTRAINT FK_users_tenant_id 
            FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE leads 
            ADD CONSTRAINT FK_leads_tenant_id 
            FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE lead_addresses 
            ADD CONSTRAINT FK_lead_addresses_tenant_id 
            FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE customers 
            ADD CONSTRAINT FK_customers_tenant_id 
            FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE customer_addresses 
            ADD CONSTRAINT FK_customer_addresses_tenant_id 
            FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE SET NULL
        `);
    }

}
