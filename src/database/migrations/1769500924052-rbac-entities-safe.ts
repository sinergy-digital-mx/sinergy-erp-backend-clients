import { MigrationInterface, QueryRunner } from "typeorm";

export class RbacEntitiesSafe1769500924052 implements MigrationInterface {
    name = 'RbacEntitiesSafe1769500924052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, create all RBAC tables without touching the users table
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`rbac_tenants\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`subdomain\` varchar(255) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`subdomain_index\` (\`subdomain\`), INDEX \`name_index\` (\`name\`), UNIQUE INDEX \`IDX_17178b3a1eeb26bb657e753d44\` (\`name\`), UNIQUE INDEX \`IDX_cd26a0ba3780becea66b837603\` (\`subdomain\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`rbac_permissions\` (\`id\` varchar(36) NOT NULL, \`entity_type\` varchar(255) NOT NULL, \`action\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`is_system_permission\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`action_index\` (\`action\`), INDEX \`entity_type_index\` (\`entity_type\`), UNIQUE INDEX \`entity_action_index\` (\`entity_type\`, \`action\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`rbac_roles\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`is_system_role\` tinyint NOT NULL DEFAULT 0, \`tenant_id\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`name_index\` (\`name\`), INDEX \`tenant_index\` (\`tenant_id\`), UNIQUE INDEX \`tenant_name_index\` (\`tenant_id\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`rbac_role_permissions\` (\`id\` varchar(36) NOT NULL, \`role_id\` varchar(255) NOT NULL, \`permission_id\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`permission_index\` (\`permission_id\`), INDEX \`role_index\` (\`role_id\`), UNIQUE INDEX \`role_permission_index\` (\`role_id\`, \`permission_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        // Handle users table migration safely - check if it's already UUID
        const userTableInfo = await queryRunner.query(`DESCRIBE users`);
        const idColumn = userTableInfo.find((col: any) => col.Field === 'id');
        
        if (idColumn && idColumn.Type.includes('int')) {
            // Users table still has integer IDs, need to migrate
            
            // First, check if there are any users with empty or null IDs
            const usersWithEmptyIds = await queryRunner.query(`SELECT COUNT(*) as count FROM users WHERE id = 0 OR id IS NULL`);
            
            if (usersWithEmptyIds[0].count > 0) {
                // Delete users with empty IDs as they are invalid
                await queryRunner.query(`DELETE FROM users WHERE id = 0 OR id IS NULL`);
            }
            
            // Create a backup of the users table
            await queryRunner.query(`CREATE TABLE \`users_backup\` AS SELECT * FROM \`users\``);
            
            // Create new users table with UUID
            await queryRunner.query(`CREATE TABLE \`users_new\` (
                \`id\` varchar(36) NOT NULL PRIMARY KEY,
                \`tenant_id\` int NULL,
                \`status_id\` int NULL,
                \`email\` varchar(255) NOT NULL UNIQUE,
                \`password\` varchar(255) NOT NULL,
                \`last_login_at\` datetime NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
            ) ENGINE=InnoDB`);
            
            // Migrate existing users with new UUIDs
            await queryRunner.query(`
                INSERT INTO users_new (id, tenant_id, status_id, email, password, last_login_at, created_at, updated_at)
                SELECT 
                    UUID() as id,
                    tenant_id,
                    status_id,
                    email,
                    password,
                    last_login_at,
                    created_at,
                    updated_at
                FROM users_backup
                WHERE email IS NOT NULL AND email != ''
            `);
            
            // Drop old users table and rename new one
            await queryRunner.query(`DROP TABLE \`users\``);
            await queryRunner.query(`RENAME TABLE \`users_new\` TO \`users\``);
            
            // Clean up backup table
            await queryRunner.query(`DROP TABLE \`users_backup\``);
        }
        
        // Create user_roles table
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`rbac_user_roles\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`role_id\` varchar(255) NOT NULL, \`tenant_id\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`tenant_index\` (\`tenant_id\`), INDEX \`role_index\` (\`role_id\`), INDEX \`user_tenant_index\` (\`user_id\`, \`tenant_id\`), UNIQUE INDEX \`user_role_tenant_index\` (\`user_id\`, \`role_id\`, \`tenant_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        // Add foreign key constraints (with error handling)
        try {
            await queryRunner.query(`ALTER TABLE \`rbac_roles\` ADD CONSTRAINT \`FK_252a038d62e9d956b067421766c\` FOREIGN KEY (\`tenant_id\`) REFERENCES \`rbac_tenants\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        } catch (e) {
            // Constraint might already exist
        }
        
        try {
            await queryRunner.query(`ALTER TABLE \`rbac_user_roles\` ADD CONSTRAINT \`FK_4e65c2f4fa77251a05d21e44a1a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        } catch (e) {
            // Constraint might already exist
        }
        
        try {
            await queryRunner.query(`ALTER TABLE \`rbac_user_roles\` ADD CONSTRAINT \`FK_8e6c750b54d0a976bdb5daf5cda\` FOREIGN KEY (\`role_id\`) REFERENCES \`rbac_roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        } catch (e) {
            // Constraint might already exist
        }
        
        try {
            await queryRunner.query(`ALTER TABLE \`rbac_user_roles\` ADD CONSTRAINT \`FK_39e3a8d5948cc0c3bb9dfe97382\` FOREIGN KEY (\`tenant_id\`) REFERENCES \`rbac_tenants\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        } catch (e) {
            // Constraint might already exist
        }
        
        try {
            await queryRunner.query(`ALTER TABLE \`rbac_role_permissions\` ADD CONSTRAINT \`FK_6eb94e2e9d283993bc7c2f01603\` FOREIGN KEY (\`role_id\`) REFERENCES \`rbac_roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        } catch (e) {
            // Constraint might already exist
        }
        
        try {
            await queryRunner.query(`ALTER TABLE \`rbac_role_permissions\` ADD CONSTRAINT \`FK_6e03d8aa0ac0be56a799875ac4d\` FOREIGN KEY (\`permission_id\`) REFERENCES \`rbac_permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        } catch (e) {
            // Constraint might already exist
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraints
        await queryRunner.query(`ALTER TABLE \`rbac_role_permissions\` DROP FOREIGN KEY \`FK_6e03d8aa0ac0be56a799875ac4d\``);
        await queryRunner.query(`ALTER TABLE \`rbac_role_permissions\` DROP FOREIGN KEY \`FK_6eb94e2e9d283993bc7c2f01603\``);
        await queryRunner.query(`ALTER TABLE \`rbac_user_roles\` DROP FOREIGN KEY \`FK_39e3a8d5948cc0c3bb9dfe97382\``);
        await queryRunner.query(`ALTER TABLE \`rbac_user_roles\` DROP FOREIGN KEY \`FK_8e6c750b54d0a976bdb5daf5cda\``);
        await queryRunner.query(`ALTER TABLE \`rbac_user_roles\` DROP FOREIGN KEY \`FK_4e65c2f4fa77251a05d21e44a1a\``);
        await queryRunner.query(`ALTER TABLE \`rbac_roles\` DROP FOREIGN KEY \`FK_252a038d62e9d956b067421766c\``);
        
        // Drop RBAC tables
        await queryRunner.query(`DROP TABLE \`rbac_user_roles\``);
        await queryRunner.query(`DROP TABLE \`rbac_role_permissions\``);
        await queryRunner.query(`DROP TABLE \`rbac_roles\``);
        await queryRunner.query(`DROP TABLE \`rbac_permissions\``);
        await queryRunner.query(`DROP TABLE \`rbac_tenants\``);
        
        // Restore original users table structure (this is a simplified rollback)
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST`);
    }
}