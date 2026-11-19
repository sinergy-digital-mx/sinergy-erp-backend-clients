import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateEmployeeLeaveDocuments1794000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'employee_leave_documents',
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
            name: 'leave_request_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'employee_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'file_name', type: 'varchar', length: '255', isNullable: false },
          { name: 's3_key', type: 'varchar', length: '500', isNullable: false },
          { name: 'mime_type', type: 'varchar', length: '120', isNullable: true },
          { name: 'file_size', type: 'int', isNullable: true },
          { name: 'uploaded_by', type: 'varchar', length: '36', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'employee_leave_documents',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_employee_leave_documents_tenant',
      }),
    );

    await queryRunner.createForeignKey(
      'employee_leave_documents',
      new TableForeignKey({
        columnNames: ['leave_request_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'employee_leave_requests',
        onDelete: 'CASCADE',
        name: 'FK_employee_leave_documents_request',
      }),
    );

    await queryRunner.createIndex(
      'employee_leave_documents',
      new TableIndex({
        name: 'IDX_employee_leave_documents_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'employee_leave_documents',
      new TableIndex({
        name: 'IDX_employee_leave_documents_request',
        columnNames: ['leave_request_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('employee_leave_documents');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('employee_leave_documents', fk);
      }
    }
    await queryRunner.dropTable('employee_leave_documents', true);
  }
}
