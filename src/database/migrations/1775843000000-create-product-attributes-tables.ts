import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProductAttributesTables1775843000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product_attributes',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'tinyint',
            default: 1,
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

    await this.ensureIndex(queryRunner, 'product_attributes', new TableIndex({
      name: 'UQ_product_attributes_tenant_name',
      columnNames: ['tenant_id', 'name'],
      isUnique: true,
    }));
    await this.ensureIndex(queryRunner, 'product_attributes', new TableIndex({
      name: 'IDX_product_attributes_tenant_id',
      columnNames: ['tenant_id'],
    }));
    await this.ensureIndex(queryRunner, 'product_attributes', new TableIndex({
      name: 'IDX_product_attributes_is_active',
      columnNames: ['is_active'],
    }));

    await queryRunner.createTable(
      new Table({
        name: 'product_attribute_values',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'attribute_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'tinyint',
            default: 1,
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

    await this.ensureIndex(queryRunner, 'product_attribute_values', new TableIndex({
      name: 'UQ_product_attribute_values_attribute_value',
      columnNames: ['attribute_id', 'value'],
      isUnique: true,
    }));
    await this.ensureIndex(queryRunner, 'product_attribute_values', new TableIndex({
      name: 'IDX_product_attribute_values_attribute_id',
      columnNames: ['attribute_id'],
    }));
    await this.ensureIndex(queryRunner, 'product_attribute_values', new TableIndex({
      name: 'IDX_product_attribute_values_is_active',
      columnNames: ['is_active'],
    }));

    await this.ensureForeignKey(queryRunner, 'product_attributes', new TableForeignKey({
      name: 'FK_product_attributes_tenant_id',
      columnNames: ['tenant_id'],
      referencedTableName: 'rbac_tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await this.ensureForeignKey(queryRunner, 'product_attribute_values', new TableForeignKey({
      name: 'FK_product_attribute_values_attribute_id',
      columnNames: ['attribute_id'],
      referencedTableName: 'product_attributes',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('product_attribute_values');
    await queryRunner.dropTable('product_attributes');
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
