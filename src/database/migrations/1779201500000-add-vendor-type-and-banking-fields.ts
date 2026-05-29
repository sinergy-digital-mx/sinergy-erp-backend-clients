import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddVendorTypeAndBankingFields1779201500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      new TableColumn({
        name: 'vendor_type',
        type: 'enum',
        enum: ['NATIONAL', 'INTERNATIONAL'],
        default: "'NATIONAL'",
        isNullable: false,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      new TableColumn({ name: 'tax_id', type: 'varchar', length: '64', isNullable: true }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({ name: 'legal_name', type: 'varchar', length: '255', isNullable: true }),
    );

    await this.ensureColumn(
      queryRunner,
      new TableColumn({ name: 'bank_name', type: 'varchar', length: '120', isNullable: true }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({ name: 'bank_account_holder', type: 'varchar', length: '255', isNullable: true }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({ name: 'bank_account_number', type: 'varchar', length: '34', isNullable: true }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({ name: 'bank_clabe', type: 'varchar', length: '18', isNullable: true }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({ name: 'bank_swift_bic', type: 'varchar', length: '11', isNullable: true }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({ name: 'bank_iban', type: 'varchar', length: '34', isNullable: true }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({ name: 'bank_currency', type: 'varchar', length: '3', isNullable: true }),
    );

    const table = await queryRunner.getTable('vendors');
    const hasIndex = table?.indices.some((i) => i.name === 'vendor_type_index');
    if (!hasIndex) {
      await queryRunner.createIndex(
        'vendors',
        new TableIndex({ name: 'vendor_type_index', columnNames: ['vendor_type'] }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('vendors');
    if (table?.indices.some((i) => i.name === 'vendor_type_index')) {
      await queryRunner.dropIndex('vendors', 'vendor_type_index');
    }

    for (const col of [
      'bank_currency',
      'bank_iban',
      'bank_swift_bic',
      'bank_clabe',
      'bank_account_number',
      'bank_account_holder',
      'bank_name',
      'legal_name',
      'tax_id',
      'vendor_type',
    ]) {
      const exists = table?.findColumnByName(col);
      if (exists) {
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
