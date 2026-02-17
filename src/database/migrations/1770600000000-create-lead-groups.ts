import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn } from 'typeorm';

export class CreateLeadGroups1770600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create lead_groups table
        await queryRunner.createTable(
            new Table({
                name: 'lead_groups',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'tenant_id',
                        type: 'varchar',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                    },
                    {
                        name: 'description',
                        type: 'text',
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

        // Add foreign key for tenant
        await queryRunner.createForeignKey(
            'lead_groups',
            new TableForeignKey({
                columnNames: ['tenant_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'rbac_tenants',
                onDelete: 'CASCADE',
            }),
        );

        // Add group_id column to leads table
        await queryRunner.addColumn(
            'leads',
            new TableColumn({
                name: 'group_id',
                type: 'varchar',
                isNullable: true,
            }),
        );

        // Add foreign key for group
        await queryRunner.createForeignKey(
            'leads',
            new TableForeignKey({
                columnNames: ['group_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'lead_groups',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key from leads
        const table = await queryRunner.getTable('leads');
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('group_id') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('leads', foreignKey);
            }
        }

        // Drop group_id column
        await queryRunner.dropColumn('leads', 'group_id');

        // Drop lead_groups table
        await queryRunner.dropTable('lead_groups');
    }
}
