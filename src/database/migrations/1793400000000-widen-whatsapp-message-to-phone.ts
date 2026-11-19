import { MigrationInterface, QueryRunner } from 'typeorm';

/** Los group id (`120363…@g.us`) no caben en varchar(32). */
export class WidenWhatsappMessageToPhone1793400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('whatsapp_messages');
    if (!table?.findColumnByName('to_phone')) return;
    await queryRunner.query(`
      ALTER TABLE whatsapp_messages
      MODIFY COLUMN to_phone varchar(80) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('whatsapp_messages');
    if (!table?.findColumnByName('to_phone')) return;
    await queryRunner.query(`
      ALTER TABLE whatsapp_messages
      MODIFY COLUMN to_phone varchar(32) NOT NULL
    `);
  }
}
