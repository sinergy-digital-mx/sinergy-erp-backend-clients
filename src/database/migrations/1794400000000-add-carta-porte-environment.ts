import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCartaPorteEnvironment1794400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('shippings');
    if (table?.columns.some((column) => column.name === 'carta_porte_environment')) return;
    await queryRunner.addColumn(
      'shippings',
      new TableColumn({
        name: 'carta_porte_environment',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('shippings');
    if (!table?.columns.some((column) => column.name === 'carta_porte_environment')) return;
    await queryRunner.dropColumn('shippings', 'carta_porte_environment');
  }
}
