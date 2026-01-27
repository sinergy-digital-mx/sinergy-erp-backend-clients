import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUsersTable1769500924053 implements MigrationInterface {
    name = 'FixUsersTable1769500924053'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if users table has id column
        const userTableInfo = await queryRunner.query(`DESCRIBE users`);
        const idColumn = userTableInfo.find((col: any) => col.Field === 'id');
        
        if (!idColumn) {
            // Users table is missing id column, need to add it
            
            // Create a backup of the users table
            await queryRunner.query(`CREATE TABLE \`users_backup\` AS SELECT * FROM \`users\``);
            
            // Drop the users table
            await queryRunner.query(`DROP TABLE \`users\``);
            
            // Create new users table with UUID id
            await queryRunner.query(`CREATE TABLE \`users\` (
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
                INSERT INTO users (id, tenant_id, status_id, email, password, last_login_at, created_at, updated_at)
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
            
            // Add foreign key indexes
            await queryRunner.query(`CREATE INDEX \`IDX_users_tenant_id\` ON \`users\` (\`tenant_id\`)`);
            await queryRunner.query(`CREATE INDEX \`IDX_users_status_id\` ON \`users\` (\`status_id\`)`);
            
            // Clean up backup table
            await queryRunner.query(`DROP TABLE \`users_backup\``);
            
            // Now add the missing foreign key constraint for user_roles
            try {
                await queryRunner.query(`ALTER TABLE \`rbac_user_roles\` ADD CONSTRAINT \`FK_4e65c2f4fa77251a05d21e44a1a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
            } catch (e) {
                // Constraint might already exist
                console.log('Foreign key constraint already exists or failed to add:', e.message);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint
        try {
            await queryRunner.query(`ALTER TABLE \`rbac_user_roles\` DROP FOREIGN KEY \`FK_4e65c2f4fa77251a05d21e44a1a\``);
        } catch (e) {
            // Constraint might not exist
        }
        
        // Restore original users table structure (simplified rollback)
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST`);
    }
}