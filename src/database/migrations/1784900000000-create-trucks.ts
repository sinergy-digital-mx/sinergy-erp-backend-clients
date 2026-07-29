import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateTrucks1784900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'trucks',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36' },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'code', type: 'varchar', length: '30', isNullable: true },
          { name: 'placa', type: 'varchar', length: '50', isNullable: true },
          { name: 'anio', type: 'varchar', length: '10', isNullable: true },
          { name: 'permiso_sct', type: 'varchar', length: '100', isNullable: true },
          { name: 'numero_permiso_sct', type: 'varchar', length: '100', isNullable: true },
          { name: 'tipo_auto_transporte', type: 'varchar', length: '100', isNullable: true },
          { name: 'aseguradora_rc', type: 'varchar', length: '150', isNullable: true },
          { name: 'poliza_rc', type: 'varchar', length: '100', isNullable: true },
          { name: 'subtipo_remolque1', type: 'varchar', length: '100', isNullable: true },
          { name: 'placa_remolque1', type: 'varchar', length: '50', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive'],
            default: "'active'",
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

    await queryRunner.createForeignKey(
      'trucks',
      new TableForeignKey({
        name: 'FK_trucks_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'trucks',
      new TableIndex({
        name: 'idx_trucks_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'trucks',
      new TableIndex({
        name: 'idx_trucks_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'trucks',
      new TableIndex({
        name: 'uq_trucks_tenant_placa',
        columnNames: ['tenant_id', 'placa'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('trucks', true);
  }
}
