import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVendorFiscalAddressParts1795600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      new TableColumn({
        name: 'exterior_number',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({
        name: 'interior_number',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({
        name: 'colonia',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({
        name: 'localidad',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('vendors');
    for (const col of ['localidad', 'colonia', 'interior_number', 'exterior_number']) {
      if (table?.findColumnByName(col)) {
        await queryRunner.dropColumn('vendors', col);
      }
    }
  }

  private async ensureColumn(queryRunner: QueryRunner, column: TableColumn): Promise<void> {
    const table = await queryRunner.getTable('vendors');
    if (!table?.findColumnByName(column.name)) {
      await queryRunner.addColumn('vendors', column);
    }
  }
}
