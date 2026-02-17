import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn } from 'typeorm';

export class CreateCustomerGroups1770700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create customer_groups table
        await queryRunner.createTable(
            new Table({
                name: 'customer_groups',
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
            'customer_groups',
            new TableForeignKey({
                columnNames: ['tenant_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'rbac_tenants',
                onDelete: 'CASCADE',
            }),
        );

        // Add group_id column to customers table
        await queryRunner.addColumn(
            'customers',
            new TableColumn({
                name: 'group_id',
                type: 'varchar',
                isNullable: true,
            }),
        );

        // Add foreign key for group
        await queryRunner.createForeignKey(
            'customers',
            new TableForeignKey({
                columnNames: ['group_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'customer_groups',
                onDelete: 'SET NULL',
            }),
        );

        // Add additional customer fields
        await queryRunner.addColumn(
            'customers',
            new TableColumn({
                name: 'lastname',
                type: 'varchar',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'customers',
            new TableColumn({
                name: 'email',
                type: 'varchar',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'customers',
            new TableColumn({
                name: 'phone',
                type: 'varchar',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'customers',
            new TableColumn({
                name: 'company_name',
                type: 'varchar',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'customers',
            new TableColumn({
                name: 'website',
                type: 'varchar',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key from customers
        const table = await queryRunner.getTable('customers');
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('group_id') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('customers', foreignKey);
            }
        }

        // Drop columns
        await queryRunner.dropColumn('customers', 'group_id');
        await queryRunner.dropColumn('customers', 'website');
        await queryRunner.dropColumn('customers', 'company_name');
        await queryRunner.dropColumn('customers', 'phone');
        await queryRunner.dropColumn('customers', 'email');
        await queryRunner.dropColumn('customers', 'lastname');

        // Drop customer_groups table
        await queryRunner.dropTable('customer_groups');
    }
}
