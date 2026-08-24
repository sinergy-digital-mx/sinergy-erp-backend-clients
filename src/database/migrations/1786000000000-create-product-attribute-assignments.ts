import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProductAttributeAssignments1786000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product_attribute_assignments',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'product_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'attribute_value_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
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

    await this.ensureIndex(
      queryRunner,
      'product_attribute_assignments',
      new TableIndex({
        name: 'UQ_product_attribute_assignments_product_value',
        columnNames: ['product_id', 'attribute_value_id'],
        isUnique: true,
      }),
    );
    await this.ensureIndex(
      queryRunner,
      'product_attribute_assignments',
      new TableIndex({
        name: 'IDX_product_attribute_assignments_product_id',
        columnNames: ['product_id'],
      }),
    );
    await this.ensureIndex(
      queryRunner,
      'product_attribute_assignments',
      new TableIndex({
        name: 'IDX_product_attribute_assignments_attribute_value_id',
        columnNames: ['attribute_value_id'],
      }),
    );

    await this.ensureForeignKey(
      queryRunner,
      'product_attribute_assignments',
      new TableForeignKey({
        name: 'FK_product_attribute_assignments_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await this.ensureForeignKey(
      queryRunner,
      'product_attribute_assignments',
      new TableForeignKey({
        name: 'FK_product_attribute_assignments_attribute_value_id',
        columnNames: ['attribute_value_id'],
        referencedTableName: 'product_attribute_values',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('product_attribute_assignments');
  }

  private async ensureIndex(
    queryRunner: QueryRunner,
    tableName: string,
    index: TableIndex,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const exists = table?.indices.some((existingIndex) => existingIndex.name === index.name);
    if (!exists) {
      await queryRunner.createIndex(tableName, index);
    }
  }

  private async ensureForeignKey(
    queryRunner: QueryRunner,
    tableName: string,
    foreignKey: TableForeignKey,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const exists = table?.foreignKeys.some((fk) => fk.name === foreignKey.name);
    if (!exists) {
      await queryRunner.createForeignKey(tableName, foreignKey);
    }
  }
}
