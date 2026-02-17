import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePhoneCountriesTable1771700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'phone_countries',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'country_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'country_code',
            type: 'varchar',
            length: '3',
          },
          {
            name: 'phone_code',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'flag_emoji',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'phone_countries',
      new TableIndex({
        name: 'phone_country_code_index',
        columnNames: ['phone_code'],
      })
    );

    await queryRunner.createIndex(
      'phone_countries',
      new TableIndex({
        name: 'phone_country_name_index',
        columnNames: ['country_name'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('phone_countries');
  }
}
