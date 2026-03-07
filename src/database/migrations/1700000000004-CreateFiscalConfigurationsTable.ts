import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateFiscalConfigurationsTable1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'fiscal_configurations',
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
            name: 'warehouse_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'razon_social',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'rfc',
            type: 'varchar',
            length: '13',
            isNullable: false,
          },
          {
            name: 'persona_type',
            type: 'enum',
            enum: ['Persona Física', 'Persona Moral'],
            isNullable: false,
          },
          {
            name: 'fiscal_regime',
            type: 'enum',
            enum: ['601', '603', '605', '606', '607', '608', '609', '610', '611', '614', '616', '620', '621', '622', '623', '624', '625', '626', '627', '628', '629', '630'],
            isNullable: true,
            default: null,
          },
          {
            name: 'digital_seal',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'digital_seal_password',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'private_key',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive'],
            default: "'active'",
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
        foreignKeys: [
          {
            columnNames: ['tenant_id'],
            referencedTableName: 'rbac_tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['warehouse_id'],
            referencedTableName: 'warehouses',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'fiscal_configurations',
      new TableIndex({
        name: 'tenant_index',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'fiscal_configurations',
      new TableIndex({
        name: 'warehouse_index',
        columnNames: ['warehouse_id'],
      }),
    );

    await queryRunner.createIndex(
      'fiscal_configurations',
      new TableIndex({
        name: 'tenant_warehouse_index',
        columnNames: ['tenant_id', 'warehouse_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('fiscal_configurations');
  }
}
