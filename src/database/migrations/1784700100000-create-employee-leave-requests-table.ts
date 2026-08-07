import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateEmployeeLeaveRequestsTable1784700100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'employee_leave_requests',
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
          {
            name: 'type',
            type: 'enum',
            enum: ['vacation', 'absence', 'permission', 'sick_leave'],
            isNullable: false,
          },
          { name: 'start_date', type: 'date', isNullable: false },
          { name: 'end_date', type: 'date', isNullable: false },
          { name: 'days', type: 'decimal', precision: 5, scale: 1, isNullable: false },
          { name: 'reason', type: 'varchar', length: '500', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'approved', 'rejected', 'cancelled'],
            default: "'pending'",
          },
          { name: 'is_paid', type: 'tinyint', default: 1 },
          { name: 'created_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'reviewed_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'reviewed_at', type: 'timestamp', isNullable: true },
          { name: 'review_notes', type: 'varchar', length: '500', isNullable: true },
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
      'employee_leave_requests',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_employee_leave_requests_tenant',
      }),
    );

    await queryRunner.createForeignKey(
      'employee_leave_requests',
      new TableForeignKey({
        columnNames: ['employee_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'employees',
        onDelete: 'CASCADE',
        name: 'FK_employee_leave_requests_employee',
      }),
    );

    await queryRunner.createIndex(
      'employee_leave_requests',
      new TableIndex({
        name: 'IDX_employee_leave_requests_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'employee_leave_requests',
      new TableIndex({
        name: 'IDX_employee_leave_requests_employee',
        columnNames: ['employee_id'],
      }),
    );

    await queryRunner.createIndex(
      'employee_leave_requests',
      new TableIndex({
        name: 'IDX_employee_leave_requests_status',
        columnNames: ['status'],
      }),
    );

    console.log('✅ Migration: Created employee_leave_requests table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('employee_leave_requests');

    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('employee_leave_requests', fk);
      }
    }

    await queryRunner.dropTable('employee_leave_requests', true);

    console.log(
      '✅ Migration rollback: Dropped employee_leave_requests table',
    );
  }
}
