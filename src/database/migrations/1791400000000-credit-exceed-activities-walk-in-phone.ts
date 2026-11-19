import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Crédito que puede exceder el monto, tipos de actividad de logística
 * y teléfono de mostrador en el ticket.
 */
export class CreditExceedActivitiesWalkInPhone1791400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const credits = await queryRunner.getTable('customer_credits');
    if (credits && !credits.findColumnByName('allow_credit_exceed')) {
      await queryRunner.addColumn(
        'customer_credits',
        new TableColumn({
          name: 'allow_credit_exceed',
          type: 'tinyint',
          width: 1,
          default: 0,
          isNullable: false,
        }),
      );
    }

    const orders = await queryRunner.getTable('inv_s_sales_orders');
    if (orders && !orders.findColumnByName('walk_in_phone')) {
      await queryRunner.addColumn(
        'inv_s_sales_orders',
        new TableColumn({
          name: 'walk_in_phone',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }),
      );
    }

    const activities = await queryRunner.getTable('customer_activities');
    const typeColumn = activities?.findColumnByName('type');
    if (typeColumn && typeColumn.type.toLowerCase().startsWith('enum')) {
      await queryRunner.query(`
        ALTER TABLE customer_activities
        MODIFY COLUMN type ENUM(
          'call',
          'whatsapp',
          'email',
          'home_visit',
          'store_visit',
          'meeting',
          'note',
          'task',
          'follow_up',
          'purchase',
          'support'
        ) NOT NULL DEFAULT 'note'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const credits = await queryRunner.getTable('customer_credits');
    if (credits?.findColumnByName('allow_credit_exceed')) {
      await queryRunner.dropColumn('customer_credits', 'allow_credit_exceed');
    }

    const orders = await queryRunner.getTable('inv_s_sales_orders');
    if (orders?.findColumnByName('walk_in_phone')) {
      await queryRunner.dropColumn('inv_s_sales_orders', 'walk_in_phone');
    }
  }
}
