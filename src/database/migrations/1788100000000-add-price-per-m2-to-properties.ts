import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPricePerM2ToProperties1788100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'properties',
      new TableColumn({
        name: 'price_per_m2',
        type: 'decimal',
        precision: 15,
        scale: 2,
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE properties
      SET price_per_m2 = ROUND(total_price / total_area, 2)
      WHERE price_per_m2 IS NULL
        AND total_area IS NOT NULL
        AND total_area > 0
        AND total_price IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('properties');
    if (table?.findColumnByName('price_per_m2')) {
      await queryRunner.dropColumn('properties', 'price_per_m2');
    }
  }

  private async ensureColumn(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(column.name)) {
      await queryRunner.addColumn(tableName, column);
    }
  }
}
