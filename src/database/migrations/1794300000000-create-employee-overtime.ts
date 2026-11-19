import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateEmployeeOvertime1794300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'employee_overtime_policies',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          {
            name: 'workday_hours',
            type: 'decimal',
            precision: 4,
            scale: 2,
            default: 8,
          },
          {
            name: 'daily_double_hours',
            type: 'decimal',
            precision: 4,
            scale: 2,
            default: 3,
          },
          {
            name: 'weekly_double_hours',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 9,
          },
          {
            name: 'double_multiplier',
            type: 'decimal',
            precision: 6,
            scale: 2,
            default: 2,
          },
          {
            name: 'excess_multiplier',
            type: 'decimal',
            precision: 6,
            scale: 2,
            default: 3,
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
      'employee_overtime_policies',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_employee_overtime_policies_tenant',
      }),
    );

    await queryRunner.createIndex(
      'employee_overtime_policies',
      new TableIndex({
        name: 'IDX_employee_overtime_policies_tenant',
        columnNames: ['tenant_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'employee_overtime_requests',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'employee_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'work_date', type: 'date', isNullable: false },
          { name: 'start_time', type: 'varchar', length: '5', isNullable: false },
          { name: 'end_time', type: 'varchar', length: '5', isNullable: false },
          {
            name: 'requested_hours',
            type: 'decimal',
            precision: 6,
            scale: 2,
            isNullable: false,
          },
          { name: 'reason', type: 'varchar', length: '500', isNullable: false },
          { name: 'notes', type: 'varchar', length: '500', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'approved', 'rejected', 'paid'],
            default: "'pending'",
          },
          {
            name: 'approved_hours',
            type: 'decimal',
            precision: 6,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'hourly_rate',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'double_hours',
            type: 'decimal',
            precision: 6,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'excess_hours',
            type: 'decimal',
            precision: 6,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'paid_amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          { name: 'payment_detail', type: 'json', isNullable: true },
          { name: 'created_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'reviewed_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'reviewed_at', type: 'timestamp', isNullable: true },
          { name: 'review_notes', type: 'varchar', length: '500', isNullable: true },
          { name: 'paid_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'paid_at', type: 'timestamp', isNullable: true },
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
      'employee_overtime_requests',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_employee_overtime_requests_tenant',
      }),
    );

    await queryRunner.createForeignKey(
      'employee_overtime_requests',
      new TableForeignKey({
        columnNames: ['employee_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'employees',
        onDelete: 'CASCADE',
        name: 'FK_employee_overtime_requests_employee',
      }),
    );

    await queryRunner.createIndex(
      'employee_overtime_requests',
      new TableIndex({
        name: 'IDX_employee_overtime_requests_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'employee_overtime_requests',
      new TableIndex({
        name: 'IDX_employee_overtime_requests_employee',
        columnNames: ['employee_id'],
      }),
    );

    await queryRunner.createIndex(
      'employee_overtime_requests',
      new TableIndex({
        name: 'IDX_employee_overtime_requests_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'employee_overtime_requests',
      new TableIndex({
        name: 'IDX_employee_overtime_requests_employee_date',
        columnNames: ['employee_id', 'work_date'],
      }),
    );

    await queryRunner.query(`
      UPDATE rbac_permissions p
      INNER JOIN entity_registry er ON er.id = p.entity_registry_id
      SET p.description = 'Aprobar o rechazar vacaciones, ausencias y horas extras',
          p.updated_at = NOW()
      WHERE er.code = 'Employee' AND p.action = 'ManageLeave'
    `);

    await queryRunner.query(`
      UPDATE rbac_permissions p
      INNER JOIN entity_registry er ON er.id = p.entity_registry_id
      SET p.description = 'Ver solo mi expediente, mi salario y solicitar vacaciones u horas extras',
          p.updated_at = NOW()
      WHERE er.code = 'Employee' AND p.action = 'ViewOwn'
    `);

    console.log('✅ Migration: Created employee overtime tables');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE rbac_permissions p
      INNER JOIN entity_registry er ON er.id = p.entity_registry_id
      SET p.description = 'Aprobar o rechazar vacaciones y ausencias de todos',
          p.updated_at = NOW()
      WHERE er.code = 'Employee' AND p.action = 'ManageLeave'
    `);

    await queryRunner.query(`
      UPDATE rbac_permissions p
      INNER JOIN entity_registry er ON er.id = p.entity_registry_id
      SET p.description = 'Ver solo mi expediente, mi salario y solicitar mis vacaciones',
          p.updated_at = NOW()
      WHERE er.code = 'Employee' AND p.action = 'ViewOwn'
    `);

    for (const tableName of [
      'employee_overtime_requests',
      'employee_overtime_policies',
    ]) {
      const table = await queryRunner.getTable(tableName);
      if (table) {
        for (const fk of table.foreignKeys) {
          await queryRunner.dropForeignKey(tableName, fk);
        }
      }
      await queryRunner.dropTable(tableName, true);
    }

    console.log('✅ Migration rollback: Dropped employee overtime tables');
  }
}
