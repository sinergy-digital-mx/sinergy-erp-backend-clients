import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateExchangeRatesTable1776200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'exchange_rates',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'rate_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'exchange_rate',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'varchar',
            length: '255',
            isNullable: true,
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
      true,
    );

    await queryRunner.createIndex(
      'exchange_rates',
      new TableIndex({
        name: 'IDX_exchange_rates_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'exchange_rates',
      new TableIndex({
        name: 'IDX_exchange_rates_rate_date',
        columnNames: ['rate_date'],
      }),
    );

    await queryRunner.createIndex(
      'exchange_rates',
      new TableIndex({
        name: 'UQ_exchange_rates_tenant_date',
        columnNames: ['tenant_id', 'rate_date'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('exchange_rates', true);
  }
}
