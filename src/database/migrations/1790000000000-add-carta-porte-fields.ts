import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCartaPorteFields1790000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumns('users', queryRunner, [
      new TableColumn({ name: 'is_driver', type: 'tinyint', default: 0 }),
      new TableColumn({
        name: 'driver_license_number',
        type: 'varchar',
        length: '30',
        isNullable: true,
      }),
      new TableColumn({
        name: 'driver_rfc',
        type: 'varchar',
        length: '13',
        isNullable: true,
      }),
    ]);

    await this.addColumns('trucks', queryRunner, [
      new TableColumn({
        name: 'peso_bruto_vehicular',
        type: 'decimal',
        precision: 10,
        scale: 3,
        isNullable: true,
      }),
    ]);

    await this.addColumns('shippings', queryRunner, [
      new TableColumn({
        name: 'carta_porte_uuid',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
      new TableColumn({
        name: 'carta_porte_idccp',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
      new TableColumn({
        name: 'carta_porte_xml',
        type: 'longtext',
        isNullable: true,
      }),
      new TableColumn({
        name: 'carta_porte_stamped_at',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'carta_porte_error',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'carta_porte_peso_kg',
        type: 'decimal',
        precision: 12,
        scale: 3,
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropColumns('shippings', queryRunner, [
      'carta_porte_uuid',
      'carta_porte_idccp',
      'carta_porte_xml',
      'carta_porte_stamped_at',
      'carta_porte_error',
      'carta_porte_peso_kg',
    ]);
    await this.dropColumns('trucks', queryRunner, ['peso_bruto_vehicular']);
    await this.dropColumns('users', queryRunner, [
      'is_driver',
      'driver_license_number',
      'driver_rfc',
    ]);
  }

  private async addColumns(
    table: string,
    queryRunner: QueryRunner,
    columns: TableColumn[],
  ): Promise<void> {
    const current = await queryRunner.getTable(table);
    for (const column of columns) {
      if (!current?.columns.some((item) => item.name === column.name)) {
        await queryRunner.addColumn(table, column);
      }
    }
  }

  private async dropColumns(
    table: string,
    queryRunner: QueryRunner,
    names: string[],
  ): Promise<void> {
    const current = await queryRunner.getTable(table);
    for (const name of names) {
      if (current?.columns.some((item) => item.name === name)) {
        await queryRunner.dropColumn(table, name);
      }
    }
  }
}
