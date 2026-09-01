import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddAssignedSellerAndAssignmentHistory1787400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'customers',
      new TableColumn({
        name: 'registered_fiscal_configuration_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );
    await this.ensureColumn(
      queryRunner,
      'customers',
      new TableColumn({
        name: 'assigned_seller_user_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );
    await this.ensureColumn(
      queryRunner,
      'inv_s_sales_orders',
      new TableColumn({
        name: 'assigned_seller_user_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await this.ensureIndex(
      queryRunner,
      'customers',
      'idx_customers_registered_fiscal_configuration_id',
      ['registered_fiscal_configuration_id'],
    );
    await this.ensureIndex(
      queryRunner,
      'customers',
      'idx_customers_assigned_seller_user_id',
      ['assigned_seller_user_id'],
    );
    await this.ensureIndex(
      queryRunner,
      'inv_s_sales_orders',
      'idx_so_assigned_seller_user_id',
      ['assigned_seller_user_id'],
    );

    await this.ensureForeignKey(
      queryRunner,
      'customers',
      'fk_customers_registered_fiscal_configuration_id',
      ['registered_fiscal_configuration_id'],
      'fiscal_configurations',
    );
    await this.ensureForeignKey(
      queryRunner,
      'customers',
      'fk_customers_assigned_seller_user_id',
      ['assigned_seller_user_id'],
      'users',
    );
    await this.ensureForeignKey(
      queryRunner,
      'inv_s_sales_orders',
      'fk_so_assigned_seller_user_id',
      ['assigned_seller_user_id'],
      'users',
    );

    await queryRunner.query(`
      UPDATE customers c
      INNER JOIN billing_branches b ON b.id = c.registered_billing_branch_id
      SET c.registered_fiscal_configuration_id = b.fiscal_configuration_id
      WHERE c.registered_fiscal_configuration_id IS NULL
        AND c.registered_billing_branch_id IS NOT NULL
    `);

    await queryRunner.query(`
      UPDATE inv_s_sales_orders
      SET assigned_seller_user_id = seller_user_id
      WHERE assigned_seller_user_id IS NULL
        AND seller_user_id IS NOT NULL
    `);

    await queryRunner.query(`
      UPDATE inv_s_sales_orders
      SET assigned_seller_user_id = created_by
      WHERE assigned_seller_user_id IS NULL
        AND created_by IS NOT NULL
    `);

    await queryRunner.createTable(
      new Table({
        name: 'customer_assignment_changes',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'customer_id', type: 'int', isNullable: false },
          { name: 'type', type: 'varchar', length: '50', isNullable: false },
          { name: 'title', type: 'varchar', length: '255', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'actor_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'occurred_at', type: 'timestamp', isNullable: false },
          { name: 'changes', type: 'json', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'customer_assignment_changes',
      new TableIndex({
        name: 'idx_customer_assignment_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'customer_assignment_changes',
      new TableIndex({
        name: 'idx_customer_assignment_customer',
        columnNames: ['customer_id'],
      }),
    );
    await queryRunner.createIndex(
      'customer_assignment_changes',
      new TableIndex({
        name: 'idx_customer_assignment_occurred',
        columnNames: ['customer_id', 'occurred_at'],
      }),
    );
    await queryRunner.createForeignKey(
      'customer_assignment_changes',
      new TableForeignKey({
        name: 'fk_customer_assignment_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'customer_assignment_changes',
      new TableForeignKey({
        name: 'fk_customer_assignment_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'customer_assignment_changes',
      new TableForeignKey({
        name: 'fk_customer_assignment_actor',
        columnNames: ['actor_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'inv_s_sales_order_assignment_changes',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'sales_order_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'type', type: 'varchar', length: '50', isNullable: false },
          { name: 'title', type: 'varchar', length: '255', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'actor_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'occurred_at', type: 'timestamp', isNullable: false },
          { name: 'changes', type: 'json', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'inv_s_sales_order_assignment_changes',
      new TableIndex({
        name: 'idx_so_assignment_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_sales_order_assignment_changes',
      new TableIndex({
        name: 'idx_so_assignment_order',
        columnNames: ['sales_order_id'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_sales_order_assignment_changes',
      new TableIndex({
        name: 'idx_so_assignment_occurred',
        columnNames: ['sales_order_id', 'occurred_at'],
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_sales_order_assignment_changes',
      new TableForeignKey({
        name: 'fk_so_assignment_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_sales_order_assignment_changes',
      new TableForeignKey({
        name: 'fk_so_assignment_order',
        columnNames: ['sales_order_id'],
        referencedTableName: 'inv_s_sales_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_sales_order_assignment_changes',
      new TableForeignKey({
        name: 'fk_so_assignment_actor',
        columnNames: ['actor_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inv_s_sales_order_assignment_changes');
    await queryRunner.dropTable('customer_assignment_changes');

    await this.dropForeignKeyIfExists(queryRunner, 'inv_s_sales_orders', 'fk_so_assigned_seller_user_id');
    await this.dropIndexIfExists(queryRunner, 'inv_s_sales_orders', 'idx_so_assigned_seller_user_id');
    await this.dropColumnIfExists(queryRunner, 'inv_s_sales_orders', 'assigned_seller_user_id');

    await this.dropForeignKeyIfExists(queryRunner, 'customers', 'fk_customers_assigned_seller_user_id');
    await this.dropForeignKeyIfExists(
      queryRunner,
      'customers',
      'fk_customers_registered_fiscal_configuration_id',
    );
    await this.dropIndexIfExists(queryRunner, 'customers', 'idx_customers_assigned_seller_user_id');
    await this.dropIndexIfExists(
      queryRunner,
      'customers',
      'idx_customers_registered_fiscal_configuration_id',
    );
    await this.dropColumnIfExists(queryRunner, 'customers', 'assigned_seller_user_id');
    await this.dropColumnIfExists(queryRunner, 'customers', 'registered_fiscal_configuration_id');
  }

  private async ensureColumn(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(column.name)) {
      await queryRunner.addColumn(tableName, column);
    }
  }

  private async ensureIndex(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
    columnNames: string[],
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.indices.find((idx) => idx.name === indexName)) {
      await queryRunner.createIndex(
        tableName,
        new TableIndex({ name: indexName, columnNames }),
      );
    }
  }

  private async ensureForeignKey(
    queryRunner: QueryRunner,
    tableName: string,
    fkName: string,
    columnNames: string[],
    referencedTableName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.foreignKeys.find((fk) => fk.name === fkName)) {
      await queryRunner.createForeignKey(
        tableName,
        new TableForeignKey({
          name: fkName,
          columnNames,
          referencedTableName,
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  private async dropForeignKeyIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    fkName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const fk = table?.foreignKeys.find((item) => item.name === fkName);
    if (fk) {
      await queryRunner.dropForeignKey(tableName, fk);
    }
  }

  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const idx = table?.indices.find((item) => item.name === indexName);
    if (idx) {
      await queryRunner.dropIndex(tableName, idx);
    }
  }

  private async dropColumnIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (table?.findColumnByName(columnName)) {
      await queryRunner.dropColumn(tableName, columnName);
    }
  }
}
