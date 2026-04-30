import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddFiscalFieldsAndWarehouseToCustomers1776203000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'fiscal_rfc',
      new TableColumn({
        name: 'fiscal_rfc',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'fiscal_razon_social',
      new TableColumn({
        name: 'fiscal_razon_social',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'fiscal_person_type',
      new TableColumn({
        name: 'fiscal_person_type',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'fiscal_address',
      new TableColumn({
        name: 'fiscal_address',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'fiscal_city',
      new TableColumn({
        name: 'fiscal_city',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'fiscal_state',
      new TableColumn({
        name: 'fiscal_state',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'fiscal_postal_code',
      new TableColumn({
        name: 'fiscal_postal_code',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'warehouse_id',
      new TableColumn({
        name: 'warehouse_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    const table = await queryRunner.getTable('customers');
    const hasWarehouseIndex = table?.indices.find(idx => idx.name === 'idx_customers_warehouse_id');
    if (!hasWarehouseIndex) {
      await queryRunner.createIndex(
        'customers',
        new TableIndex({
          name: 'idx_customers_warehouse_id',
          columnNames: ['warehouse_id'],
        }),
      );
    }

    const hasWarehouseFk = table?.foreignKeys.find(fk => fk.name === 'fk_customers_warehouse_id');
    if (!hasWarehouseFk) {
      await queryRunner.createForeignKey(
        'customers',
        new TableForeignKey({
          name: 'fk_customers_warehouse_id',
          columnNames: ['warehouse_id'],
          referencedTableName: 'warehouses',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customers');
    const warehouseFk = table?.foreignKeys.find(fk => fk.name === 'fk_customers_warehouse_id');
    if (warehouseFk) {
      await queryRunner.dropForeignKey('customers', warehouseFk);
    }

    const warehouseIdx = table?.indices.find(idx => idx.name === 'idx_customers_warehouse_id');
    if (warehouseIdx) {
      await queryRunner.dropIndex('customers', warehouseIdx);
    }

    const columnsToDrop = [
      'warehouse_id',
      'fiscal_postal_code',
      'fiscal_state',
      'fiscal_city',
      'fiscal_address',
      'fiscal_person_type',
      'fiscal_razon_social',
      'fiscal_rfc',
    ];

    for (const columnName of columnsToDrop) {
      const currentTable = await queryRunner.getTable('customers');
      if (currentTable?.findColumnByName(columnName)) {
        await queryRunner.dropColumn('customers', columnName);
      }
    }
  }

  private async ensureColumn(
    queryRunner: QueryRunner,
    columnName: string,
    column: TableColumn,
  ): Promise<void> {
    const table = await queryRunner.getTable('customers');
    const exists = table?.findColumnByName(columnName);
    if (!exists) {
      await queryRunner.addColumn('customers', column);
    }
  }
}
