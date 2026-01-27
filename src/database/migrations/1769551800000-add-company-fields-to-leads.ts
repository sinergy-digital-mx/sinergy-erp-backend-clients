import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyFieldsToLeads1769551800000 implements MigrationInterface {
    name = 'AddCompanyFieldsToLeads1769551800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if columns already exist before adding them
        const table = await queryRunner.getTable('leads');
        
        if (table && !table.findColumnByName('company_name')) {
            await queryRunner.query(`ALTER TABLE \`leads\` ADD COLUMN \`company_name\` varchar(255) NULL`);
        }
        
        if (table && !table.findColumnByName('company_phone')) {
            await queryRunner.query(`ALTER TABLE \`leads\` ADD COLUMN \`company_phone\` varchar(255) NULL`);
        }
        
        if (table && !table.findColumnByName('website')) {
            await queryRunner.query(`ALTER TABLE \`leads\` ADD COLUMN \`website\` varchar(255) NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('leads');
        
        if (table && table.findColumnByName('website')) {
            await queryRunner.query(`ALTER TABLE \`leads\` DROP COLUMN \`website\``);
        }
        
        if (table && table.findColumnByName('company_phone')) {
            await queryRunner.query(`ALTER TABLE \`leads\` DROP COLUMN \`company_phone\``);
        }
        
        if (table && table.findColumnByName('company_name')) {
            await queryRunner.query(`ALTER TABLE \`leads\` DROP COLUMN \`company_name\``);
        }
    }
}