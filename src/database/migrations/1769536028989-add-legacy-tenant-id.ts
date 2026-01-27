import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLegacyTenantId1769536028989 implements MigrationInterface {
    name = 'AddLegacyTenantId1769536028989'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add legacy_tenant_id column to rbac_tenants table
        await queryRunner.query(`ALTER TABLE \`rbac_tenants\` ADD \`legacy_tenant_id\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove legacy_tenant_id column from rbac_tenants table
        await queryRunner.query(`ALTER TABLE \`rbac_tenants\` DROP COLUMN \`legacy_tenant_id\``);
    }

}
