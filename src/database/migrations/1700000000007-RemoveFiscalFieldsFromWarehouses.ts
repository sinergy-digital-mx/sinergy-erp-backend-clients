import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFiscalFieldsFromWarehouses1700000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop columns that are no longer needed
    const table = await queryRunner.getTable('warehouses');
    
    if (table) {
      // Drop razon_social
      if (table.findColumnByName('razon_social')) {
        await queryRunner.dropColumn('warehouses', 'razon_social');
      }

      // Drop rfc
      if (table.findColumnByName('rfc')) {
        await queryRunner.dropColumn('warehouses', 'rfc');
      }

      // Drop persona_type
      if (table.findColumnByName('persona_type')) {
        await queryRunner.dropColumn('warehouses', 'persona_type');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a destructive migration, no rollback needed
  }
}
