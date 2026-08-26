import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCadastralKeyToProperties1786400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'cadastral_key',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('properties', 'cadastral_key');
  }
}
