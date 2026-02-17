import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCustomerAnsweredToLeads1770500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'leads',
            new TableColumn({
                name: 'customer_answered',
                type: 'boolean',
                default: false,
            }),
        );

        await queryRunner.addColumn(
            'leads',
            new TableColumn({
                name: 'customer_answered_at',
                type: 'timestamp',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('leads', 'customer_answered_at');
        await queryRunner.dropColumn('leads', 'customer_answered');
    }
}
