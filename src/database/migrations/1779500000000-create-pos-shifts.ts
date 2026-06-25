import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePosShifts1779500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pos_daily_shifts',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36' },
          { name: 'terminal_user_id', type: 'varchar', length: '36' },
          { name: 'billing_branch_id', type: 'varchar', length: '36' },
          { name: 'shift_date', type: 'date' },
          {
            name: 'opening_cash_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'opening_cash_usd',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['open', 'closed'],
            default: "'open'",
          },
          { name: 'closed_at', type: 'timestamp', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
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

    await queryRunner.createTable(
      new Table({
        name: 'pos_partial_shifts',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36' },
          { name: 'daily_shift_id', type: 'varchar', length: '36' },
          { name: 'partial_number', type: 'int' },
          {
            name: 'removed_total_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'removed_total_usd',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'sales_total_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          { name: 'sales_count', type: 'int', default: 0 },
          {
            name: 'performed_by_user_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'notes', type: 'text', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'pos_partial_shift_denominations',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'partial_shift_id', type: 'varchar', length: '36' },
          {
            name: 'currency',
            type: 'enum',
            enum: ['MXN', 'USD'],
          },
          {
            name: 'denomination',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          { name: 'bill_count', type: 'int' },
          {
            name: 'amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
        ],
      }),
      true,
    );

    const dailyFk = [
      ['tenant_id', 'rbac_tenants', 'id', 'CASCADE'],
      ['terminal_user_id', 'users', 'id', 'RESTRICT'],
      ['billing_branch_id', 'billing_branches', 'id', 'RESTRICT'],
    ] as const;

    for (const [col, refTable, refCol, onDelete] of dailyFk) {
      await queryRunner.createForeignKey(
        'pos_daily_shifts',
        new TableForeignKey({
          columnNames: [col],
          referencedTableName: refTable,
          referencedColumnNames: [refCol],
          onDelete,
        }),
      );
    }

    await queryRunner.createForeignKey(
      'pos_partial_shifts',
      new TableForeignKey({
        columnNames: ['daily_shift_id'],
        referencedTableName: 'pos_daily_shifts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'pos_partial_shifts',
      new TableForeignKey({
        columnNames: ['performed_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'pos_partial_shift_denominations',
      new TableForeignKey({
        columnNames: ['partial_shift_id'],
        referencedTableName: 'pos_partial_shifts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'pos_daily_shifts',
      new TableIndex({
        name: 'uq_pos_daily_shift_branch_day',
        columnNames: ['billing_branch_id', 'shift_date'],
        isUnique: true,
      }),
    );

    await queryRunner.addColumns('inv_s_sales_orders', [
      new TableColumn({
        name: 'terminal_user_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
      new TableColumn({
        name: 'seller_user_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
      new TableColumn({
        name: 'pos_daily_shift_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    ]);

    for (const col of ['terminal_user_id', 'seller_user_id', 'pos_daily_shift_id']) {
      await queryRunner.createForeignKey(
        'inv_s_sales_orders',
        new TableForeignKey({
          columnNames: [col],
          referencedTableName: col === 'pos_daily_shift_id' ? 'pos_daily_shifts' : 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    await queryRunner.createIndex(
      'inv_s_sales_orders',
      new TableIndex({
        name: 'idx_so_pos_daily_shift',
        columnNames: ['pos_daily_shift_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const salesTable = await queryRunner.getTable('inv_s_sales_orders');
    for (const col of ['pos_daily_shift_id', 'seller_user_id', 'terminal_user_id']) {
      const fk = salesTable?.foreignKeys.find((f) => f.columnNames.includes(col));
      if (fk) await queryRunner.dropForeignKey('inv_s_sales_orders', fk);
      await queryRunner.dropColumn('inv_s_sales_orders', col);
    }

    await queryRunner.dropIndex('pos_daily_shifts', 'uq_pos_daily_shift_terminal_day');
    await queryRunner.dropTable('pos_partial_shift_denominations');
    await queryRunner.dropTable('pos_partial_shifts');
    await queryRunner.dropTable('pos_daily_shifts');
  }
}
