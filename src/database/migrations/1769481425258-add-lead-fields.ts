import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLeadFields1769481425258 implements MigrationInterface {
    name = 'AddLeadFields1769481425258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`leads\` ADD \`name\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`leads\` ADD \`lastname\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`leads\` ADD \`email\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`leads\` ADD \`phone\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`leads\` ADD \`phone_country\` varchar(2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`leads\` ADD \`phone_code\` varchar(5) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`leads\` DROP COLUMN \`phone_code\``);
        await queryRunner.query(`ALTER TABLE \`leads\` DROP COLUMN \`phone_country\``);
        await queryRunner.query(`ALTER TABLE \`leads\` DROP COLUMN \`phone\``);
        await queryRunner.query(`ALTER TABLE \`leads\` DROP COLUMN \`email\``);
        await queryRunner.query(`ALTER TABLE \`leads\` DROP COLUMN \`lastname\``);
        await queryRunner.query(`ALTER TABLE \`leads\` DROP COLUMN \`name\``);
    }

}
