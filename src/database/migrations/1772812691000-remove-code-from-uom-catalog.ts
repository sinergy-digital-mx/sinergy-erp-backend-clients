import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCodeFromUomCatalog1772812691000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if code column exists before dropping
    const table = await queryRunner.getTable('uom_catalog');
    const codeColumn = table?.columns.find(col => col.name === 'code');
    
    if (codeColumn) {
      // Drop index on code if exists
      try {
        await queryRunner.dropIndex('uom_catalog', 'idx_uom_catalog_code');
      } catch (err) {
        // Index might not exist
      }

      // Drop code column
      await queryRunner.dropColumn('uom_catalog', 'code');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add code column back
    await queryRunner.query(
      `ALTER TABLE uom_catalog ADD COLUMN code VARCHAR(100) NOT NULL UNIQUE`
    );

    // Recreate index
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_uom_catalog_code ON uom_catalog (code)`
    );
  }
}
