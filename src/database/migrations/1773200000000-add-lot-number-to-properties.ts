import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLotNumberToProperties1773200000000 implements MigrationInterface {
    name = 'AddLotNumberToProperties1773200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`properties\` ADD \`lot_number\` varchar(50) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`lot_number\``);
    }
}