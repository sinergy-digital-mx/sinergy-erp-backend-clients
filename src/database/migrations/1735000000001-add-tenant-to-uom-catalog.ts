import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddTenantToUomCatalog1735000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if tenant_id column already exists
    const table = await queryRunner.getTable('uom_catalog');
    const hasColumn = table?.columns.find((col) => col.name === 'tenant_id');

    // 1. Agregar columna tenant_id solo si no existe
    if (!hasColumn) {
      await queryRunner.addColumn(
        'uom_catalog',
        new TableColumn({
          name: 'tenant_id',
          type: 'varchar',
          length: '36',
          isNullable: true, // Temporalmente nullable para migración
        }),
      );
    }

    // 2. Obtener el primer tenant disponible para asignar a registros existentes
    const tenants = await queryRunner.query('SELECT id FROM rbac_tenants LIMIT 1');
    if (tenants.length > 0) {
      const defaultTenantId = tenants[0].id;
      await queryRunner.query(
        `UPDATE uom_catalog SET tenant_id = '${defaultTenantId}' WHERE tenant_id IS NULL`,
      );
    }

    // 3. Hacer la columna NOT NULL solo si es nullable
    const currentColumn = table?.columns.find((col) => col.name === 'tenant_id');
    if (currentColumn?.isNullable) {
      await queryRunner.changeColumn(
        'uom_catalog',
        'tenant_id',
        new TableColumn({
          name: 'tenant_id',
          type: 'varchar',
          length: '36',
          isNullable: false,
        }),
      );
    }

    // 4. Crear foreign key solo si no existe
    const hasForeignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('tenant_id') !== -1,
    );
    if (!hasForeignKey) {
      await queryRunner.createForeignKey(
        'uom_catalog',
        new TableForeignKey({
          columnNames: ['tenant_id'],
          referencedTableName: 'rbac_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    // 5. Crear índice tenant_id solo si no existe
    const hasTenantIndex = table?.indices.find((idx) => idx.name === 'tenant_index');
    if (!hasTenantIndex) {
      await queryRunner.createIndex(
        'uom_catalog',
        new TableIndex({
          name: 'tenant_index',
          columnNames: ['tenant_id'],
        }),
      );
    }

    // Note: tenant_name_index already exists from entity definition, no need to create tenant_code_index
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.dropIndex('uom_catalog', 'tenant_index');

    // Eliminar foreign key
    const table = await queryRunner.getTable('uom_catalog');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('tenant_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('uom_catalog', foreignKey);
    }

    // Eliminar columna
    await queryRunner.dropColumn('uom_catalog', 'tenant_id');
  }
}
