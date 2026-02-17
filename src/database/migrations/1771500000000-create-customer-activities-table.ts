import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCustomerActivitiesTable1771500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'customer_activities',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'customer_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['call', 'email', 'meeting', 'note', 'task', 'follow_up', 'purchase', 'support'],
            default: "'note'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['completed', 'scheduled', 'cancelled', 'in_progress'],
            default: "'completed'",
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'activity_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'duration_minutes',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'outcome',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'follow_up_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
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
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'customer_activities',
      new TableIndex({
        name: 'IDX_customer_activities_tenant_customer',
        columnNames: ['tenant_id', 'customer_id'],
      }),
    );

    await queryRunner.createIndex(
      'customer_activities',
      new TableIndex({
        name: 'IDX_customer_activities_user',
        columnNames: ['user_id', 'tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'customer_activities',
      new TableIndex({
        name: 'IDX_customer_activities_type',
        columnNames: ['type', 'tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'customer_activities',
      new TableIndex({
        name: 'IDX_customer_activities_date',
        columnNames: ['activity_date', 'tenant_id'],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'customer_activities',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'customer_activities',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'customer_activities',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('customer_activities', true);
  }
}
