import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Nombre y RFC opcionales en venta POS de mostrador (ticket, no alta de cliente).
 */
export class AddSalesOrderWalkInTicket1790500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('inv_s_sales_orders');
        if (!table?.findColumnByName('walk_in_name')) {
            await queryRunner.addColumn(
                'inv_s_sales_orders',
                new TableColumn({
                    name: 'walk_in_name',
                    type: 'varchar',
                    length: '120',
                    isNullable: true,
                }),
            );
        }
        if (!table?.findColumnByName('walk_in_rfc')) {
            await queryRunner.addColumn(
                'inv_s_sales_orders',
                new TableColumn({
                    name: 'walk_in_rfc',
                    type: 'varchar',
                    length: '13',
                    isNullable: true,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('inv_s_sales_orders');
        if (table?.findColumnByName('walk_in_rfc')) {
            await queryRunner.dropColumn('inv_s_sales_orders', 'walk_in_rfc');
        }
        if (table?.findColumnByName('walk_in_name')) {
            await queryRunner.dropColumn('inv_s_sales_orders', 'walk_in_name');
        }
    }
}
