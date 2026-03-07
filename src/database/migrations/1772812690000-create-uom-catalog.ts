import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableColumn } from 'typeorm';

export class CreateUomCatalog1772812690000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create global UoM catalog table
    await queryRunner.createTable(
      new Table({
        name: 'uom_catalog',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
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
      true
    );

    // Add index on name
    await queryRunner.createIndex(
      'uom_catalog',
      new TableIndex({
        name: 'idx_uom_catalog_name',
        columnNames: ['name'],
      })
    );

    // Modify uoms table to reference catalog
    await queryRunner.addColumn(
      'uoms',
      new TableColumn({
        name: 'uom_catalog_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      })
    );

    // Add foreign key to catalog
    await queryRunner.createForeignKey(
      'uoms',
      new TableForeignKey({
        columnNames: ['uom_catalog_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'uom_catalog',
        onDelete: 'RESTRICT',
      })
    );

    // Add index
    await queryRunner.createIndex(
      'uoms',
      new TableIndex({
        name: 'idx_uoms_catalog',
        columnNames: ['uom_catalog_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('uoms');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('uom_catalog_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('uoms', foreignKey);
    }

    // Drop index
    await queryRunner.dropIndex('uoms', 'idx_uoms_catalog');

    // Drop column
    await queryRunner.dropColumn('uoms', 'uom_catalog_id');

    // Drop catalog table
    await queryRunner.dropTable('uom_catalog');
  }
}
