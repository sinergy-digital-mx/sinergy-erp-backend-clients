import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyFieldsToLeads1769551800000 implements MigrationInterface {
    name = 'AddCompanyFieldsToLeads1769551800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`leads\` 
            ADD COLUMN \`company_name\` varchar(255) NULL,
            ADD COLUMN \`company_phone\` varchar(255) NULL,
            ADD COLUMN \`website\` varchar(255) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`leads\` 
            DROP COLUMN \`company_name\`,
            DROP COLUMN \`company_phone\`,
            DROP COLUMN \`website\`
        `);
    }
}