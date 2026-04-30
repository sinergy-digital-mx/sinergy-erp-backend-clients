import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropDescriptionFromProductAttributes1775843100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('product_attributes');
    if (table?.findColumnByName('description')) {
      await queryRunner.dropColumn('product_attributes', 'description');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('product_attributes');
    if (!table?.findColumnByName('description')) {
      await queryRunner.addColumn(
        'product_attributes',
        new TableColumn({
          name: 'description',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }
  }
}
