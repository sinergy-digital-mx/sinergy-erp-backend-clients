import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddPosUserType1779500000001 implements MigrationInterface {
  private async hasColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    return !!table?.columns.some((column) => column.name === columnName);
  }

  private async hasIndex(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    return !!table?.indices.some((index) => index.name === indexName);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await this.hasColumn(queryRunner, 'users', 'pos_user_type'))) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'pos_user_type',
          type: 'enum',
          enum: ['VENTAS', 'COBRANZA'],
          isNullable: true,
        }),
      );
    }

    if (!(await this.hasColumn(queryRunner, 'inv_s_sales_orders', 'collected_by_user_id'))) {
      await queryRunner.addColumn(
        'inv_s_sales_orders',
        new TableColumn({
          name: 'collected_by_user_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }

    const salesTable = await queryRunner.getTable('inv_s_sales_orders');
    const collectedFk = salesTable?.foreignKeys.find((fk) =>
      fk.columnNames.includes('collected_by_user_id'),
    );
    if (!collectedFk) {
      await queryRunner.createForeignKey(
        'inv_s_sales_orders',
        new TableForeignKey({
          columnNames: ['collected_by_user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    if (await this.hasIndex(queryRunner, 'pos_daily_shifts', 'uq_pos_daily_shift_terminal_day')) {
      if (!(await this.hasIndex(queryRunner, 'pos_daily_shifts', 'idx_pos_daily_shifts_terminal_user'))) {
        await queryRunner.createIndex(
          'pos_daily_shifts',
          new TableIndex({
            name: 'idx_pos_daily_shifts_terminal_user',
            columnNames: ['terminal_user_id'],
          }),
        );
      }
      await queryRunner.dropIndex('pos_daily_shifts', 'uq_pos_daily_shift_terminal_day');
    }

    if (!(await this.hasIndex(queryRunner, 'pos_daily_shifts', 'uq_pos_daily_shift_branch_day'))) {
      await queryRunner.createIndex(
        'pos_daily_shifts',
        new TableIndex({
          name: 'uq_pos_daily_shift_branch_day',
          columnNames: ['billing_branch_id', 'shift_date'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await this.hasIndex(queryRunner, 'pos_daily_shifts', 'uq_pos_daily_shift_branch_day')) {
      await queryRunner.dropIndex('pos_daily_shifts', 'uq_pos_daily_shift_branch_day');
    }

    if (!(await this.hasIndex(queryRunner, 'pos_daily_shifts', 'uq_pos_daily_shift_terminal_day'))) {
      await queryRunner.createIndex(
        'pos_daily_shifts',
        new TableIndex({
          name: 'uq_pos_daily_shift_terminal_day',
          columnNames: ['terminal_user_id', 'shift_date'],
          isUnique: true,
        }),
      );
    }

    const salesTable = await queryRunner.getTable('inv_s_sales_orders');
    const fk = salesTable?.foreignKeys.find((f) =>
      f.columnNames.includes('collected_by_user_id'),
    );
    if (fk) {
      await queryRunner.dropForeignKey('inv_s_sales_orders', fk);
    }

    if (await this.hasColumn(queryRunner, 'inv_s_sales_orders', 'collected_by_user_id')) {
      await queryRunner.dropColumn('inv_s_sales_orders', 'collected_by_user_id');
    }

    if (await this.hasColumn(queryRunner, 'users', 'pos_user_type')) {
      await queryRunner.dropColumn('users', 'pos_user_type');
    }
  }
}
