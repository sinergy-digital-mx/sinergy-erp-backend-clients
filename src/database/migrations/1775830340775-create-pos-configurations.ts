import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePosConfigurations1775830340775 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pos_configurations',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'sucursal',
            type: 'varchar',
            length: '36',
            isNullable: false,
            comment: 'Reference to billing_branches.id',
          },
          {
            name: 'modelo',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'tinyint',
            default: 1,
            comment: '1 = active, 0 = inactive',
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

    // Add foreign key to billing_branches
    await queryRunner.createForeignKey(
      'pos_configurations',
      new TableForeignKey({
        columnNames: ['sucursal'],
        referencedColumnNames: ['id'],
        referencedTableName: 'billing_branches',
        onDelete: 'RESTRICT',
        name: 'FK_pos_configurations_billing_branch',
      }),
    );

    // Add tenant isolation index
    await queryRunner.query(
      `CREATE INDEX tenant_index ON pos_configurations (tenant_id)`,
    );

    // Add branch index for efficient lookups
    await queryRunner.query(
      `CREATE INDEX branch_index ON pos_configurations (sucursal)`,
    );

    // Add unique index for code per tenant
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_pos_configurations_code_unique ON pos_configurations (tenant_id, code)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pos_configurations');
  }
}
