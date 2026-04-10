import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateBillingBranches1775830340774 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'billing_branches',
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
            name: 'fiscal_configuration_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'address',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'city',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'state',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'country',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'postal_code',
            type: 'varchar',
            length: '20',
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

    // Add foreign key to fiscal_configurations
    await queryRunner.createForeignKey(
      'billing_branches',
      new TableForeignKey({
        columnNames: ['fiscal_configuration_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_configurations',
        onDelete: 'CASCADE',
        name: 'FK_billing_branches_fiscal_configuration',
      }),
    );

    // Add index for fiscal_configuration_id
    await queryRunner.query(
      `CREATE INDEX idx_billing_branches_fiscal_config ON billing_branches (fiscal_configuration_id)`,
    );

    // Add unique index for code per fiscal configuration
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_billing_branches_code_unique ON billing_branches (fiscal_configuration_id, code)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('billing_branches');
  }
}
