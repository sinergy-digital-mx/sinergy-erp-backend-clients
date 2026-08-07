import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGpsToWarehousesAndCustomerAddresses1784900000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const warehousesHasLat = await queryRunner.hasColumn('warehouses', 'latitude');
    if (!warehousesHasLat) {
      await queryRunner.addColumns('warehouses', [
        new TableColumn({
          name: 'latitude',
          type: 'decimal',
          precision: 10,
          scale: 6,
          isNullable: true,
        }),
        new TableColumn({
          name: 'longitude',
          type: 'decimal',
          precision: 10,
          scale: 6,
          isNullable: true,
        }),
      ]);
    }

    const addressesHasLat = await queryRunner.hasColumn(
      'customer_addresses',
      'latitude',
    );
    if (!addressesHasLat) {
      await queryRunner.addColumns('customer_addresses', [
        new TableColumn({
          name: 'latitude',
          type: 'decimal',
          precision: 10,
          scale: 6,
          isNullable: true,
        }),
        new TableColumn({
          name: 'longitude',
          type: 'decimal',
          precision: 10,
          scale: 6,
          isNullable: true,
        }),
        new TableColumn({
          name: 'has_gps',
          type: 'tinyint',
          default: 0,
        }),
        new TableColumn({
          name: 'address_source',
          type: 'varchar',
          length: '40',
          isNullable: true,
        }),
        new TableColumn({
          name: 'status',
          type: 'tinyint',
          default: 1,
        }),
        new TableColumn({
          name: 'notes',
          type: 'text',
          isNullable: true,
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const col of [
      'notes',
      'status',
      'address_source',
      'has_gps',
      'longitude',
      'latitude',
    ]) {
      if (await queryRunner.hasColumn('customer_addresses', col)) {
        await queryRunner.dropColumn('customer_addresses', col);
      }
    }

    for (const col of ['longitude', 'latitude']) {
      if (await queryRunner.hasColumn('warehouses', col)) {
        await queryRunner.dropColumn('warehouses', col);
      }
    }
  }
}
