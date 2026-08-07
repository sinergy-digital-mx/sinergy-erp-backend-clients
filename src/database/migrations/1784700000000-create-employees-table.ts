import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateEmployeesTable1784700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'employees',
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
          { name: 'user_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'employee_code', type: 'varchar', length: '50', isNullable: true },
          { name: 'rfc', type: 'varchar', length: '13', isNullable: true },
          { name: 'curp', type: 'varchar', length: '18', isNullable: true },
          { name: 'nss', type: 'varchar', length: '20', isNullable: true },
          { name: 'position', type: 'varchar', length: '150', isNullable: true },
          { name: 'department', type: 'varchar', length: '150', isNullable: true },
          { name: 'hire_date', type: 'date', isNullable: true },
          { name: 'birth_date', type: 'date', isNullable: true },
          {
            name: 'monthly_salary',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'payment_frequency',
            type: 'enum',
            enum: ['monthly', 'biweekly', 'weekly'],
            default: "'biweekly'",
          },
          { name: 'bank_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'clabe', type: 'varchar', length: '18', isNullable: true },
          { name: 'bank_account', type: 'varchar', length: '30', isNullable: true },
          { name: 'photo_s3_key', type: 'varchar', length: '500', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'terminated'],
            default: "'active'",
          },
          { name: 'termination_date', type: 'date', isNullable: true },
          { name: 'metadata', type: 'json', isNullable: true },
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
      'employees',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_employees_tenant',
      }),
    );

    await queryRunner.createForeignKey(
      'employees',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_employees_user',
      }),
    );

    await queryRunner.createIndex(
      'employees',
      new TableIndex({
        name: 'IDX_employees_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'employees',
      new TableIndex({
        name: 'IDX_employees_user',
        columnNames: ['user_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'employees',
      new TableIndex({
        name: 'IDX_employees_status',
        columnNames: ['status'],
      }),
    );

    console.log('✅ Migration: Created employees table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('employees');

    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('employees', fk);
      }
    }

    await queryRunner.dropTable('employees', true);

    console.log('✅ Migration rollback: Dropped employees table');
  }
}
