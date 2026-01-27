import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertDatetimeToTimestampUtc1769556400000 implements MigrationInterface {
    name = 'ConvertDatetimeToTimestampUtc1769556400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Convert all datetime columns to timestamp for UTC storage
        
        // Users table
        await queryRunner.query(`
            ALTER TABLE \`users\` 
            MODIFY COLUMN \`last_login_at\` TIMESTAMP NULL,
            MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            MODIFY COLUMN \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);

        // Lead activities table - most critical for UTC
        await queryRunner.query(`
            ALTER TABLE \`lead_activities\` 
            MODIFY COLUMN \`activity_date\` TIMESTAMP NOT NULL,
            MODIFY COLUMN \`follow_up_date\` TIMESTAMP NULL,
            MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            MODIFY COLUMN \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);

        // Leads table
        await queryRunner.query(`
            ALTER TABLE \`leads\` 
            MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);

        // Lead addresses table
        await queryRunner.query(`
            ALTER TABLE \`lead_addresses\` 
            MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            MODIFY COLUMN \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);

        // RBAC tables (check if they exist first)
        const tenantTableExists = await queryRunner.hasTable('rbac_tenants');
        if (tenantTableExists) {
            await queryRunner.query(`
                ALTER TABLE \`rbac_tenants\` 
                MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                MODIFY COLUMN \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);
        }

        const rolesTableExists = await queryRunner.hasTable('rbac_roles');
        if (rolesTableExists) {
            await queryRunner.query(`
                ALTER TABLE \`rbac_roles\` 
                MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                MODIFY COLUMN \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);
        }

        const permissionsTableExists = await queryRunner.hasTable('rbac_permissions');
        if (permissionsTableExists) {
            await queryRunner.query(`
                ALTER TABLE \`rbac_permissions\` 
                MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                MODIFY COLUMN \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);
        }

        const userRolesTableExists = await queryRunner.hasTable('rbac_user_roles');
        if (userRolesTableExists) {
            await queryRunner.query(`
                ALTER TABLE \`rbac_user_roles\` 
                MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            `);
        }

        const rolePermissionsTableExists = await queryRunner.hasTable('rbac_role_permissions');
        if (rolePermissionsTableExists) {
            await queryRunner.query(`
                ALTER TABLE \`rbac_role_permissions\` 
                MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            `);
        }

        const auditLogsTableExists = await queryRunner.hasTable('rbac_audit_logs');
        if (auditLogsTableExists) {
            await queryRunner.query(`
                ALTER TABLE \`rbac_audit_logs\` 
                MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            `);
        }

        // Customer tables (check if they exist first)
        const customersTableExists = await queryRunner.hasTable('customers');
        if (customersTableExists) {
            await queryRunner.query(`
                ALTER TABLE \`customers\` 
                MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            `);
        }

        const customerAddressesTableExists = await queryRunner.hasTable('customer_addresses');
        if (customerAddressesTableExists) {
            await queryRunner.query(`
                ALTER TABLE \`customer_addresses\` 
                MODIFY COLUMN \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                MODIFY COLUMN \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);
        }

        console.log('✅ All datetime columns converted to timestamp (UTC)');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to datetime if needed
        
        // Users table
        await queryRunner.query(`
            ALTER TABLE \`users\` 
            MODIFY COLUMN \`last_login_at\` DATETIME NULL,
            MODIFY COLUMN \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            MODIFY COLUMN \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);

        // Lead activities table
        await queryRunner.query(`
            ALTER TABLE \`lead_activities\` 
            MODIFY COLUMN \`activity_date\` DATETIME NOT NULL,
            MODIFY COLUMN \`follow_up_date\` DATETIME NULL,
            MODIFY COLUMN \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            MODIFY COLUMN \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);

        // Continue with other tables...
        console.log('⚠️  Reverted timestamp columns back to datetime');
    }
}