import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Módulo Cotizaciones: espejo de OV sin facturación ni lotes.
 * Folio COT-000001. Se puede crear desde POS y convertir a OV conservando precios.
 */
export class CreateQuotationsModule1788300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_quotations',
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
          { name: 'folio', type: 'varchar', length: '20' },
          { name: 'fiscal_configuration_id', type: 'varchar', length: '36' },
          {
            name: 'billing_branch_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'warehouse_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'customer_id', type: 'int' },
          { name: 'expected_delivery_date', type: 'date' },
          {
            name: 'quotation_type',
            type: 'enum',
            enum: ['POS', 'MANUAL'],
            default: "'MANUAL'",
          },
          {
            name: 'fiscal_razon_social',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'general_status',
            type: 'enum',
            enum: ['Creada', 'Convertida', 'Cancelada'],
            default: "'Creada'",
          },
          { name: 'notes', type: 'text', isNullable: true },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: '0',
          },
          {
            name: 'iva_total',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: '0',
          },
          {
            name: 'ieps_total',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: '0',
          },
          {
            name: 'discount_total',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: '0',
          },
          {
            name: 'global_discount_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'global_discount_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: '0',
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: '0',
          },
          { name: 'created_by', type: 'varchar', length: '36' },
          {
            name: 'terminal_user_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'seller_user_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'assigned_seller_user_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'converted_to_sales_order_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          { name: 'updated_by', type: 'varchar', length: '36', isNullable: true },
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

    await queryRunner.createIndex(
      'inv_s_quotations',
      new TableIndex({ name: 'idx_qt_tenant', columnNames: ['tenant_id'] }),
    );
    await queryRunner.createIndex(
      'inv_s_quotations',
      new TableIndex({
        name: 'uq_qt_tenant_folio',
        columnNames: ['tenant_id', 'folio'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'inv_s_quotations',
      new TableIndex({ name: 'idx_qt_customer', columnNames: ['customer_id'] }),
    );
    await queryRunner.createIndex(
      'inv_s_quotations',
      new TableIndex({ name: 'idx_qt_warehouse', columnNames: ['warehouse_id'] }),
    );
    await queryRunner.createIndex(
      'inv_s_quotations',
      new TableIndex({
        name: 'idx_qt_billing_branch',
        columnNames: ['billing_branch_id'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_quotations',
      new TableIndex({
        name: 'idx_qt_general_status',
        columnNames: ['general_status'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_quotations',
      new TableIndex({
        name: 'idx_qt_converted_so',
        columnNames: ['converted_to_sales_order_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_quotations',
      new TableForeignKey({
        name: 'FK_qt_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_quotations',
      new TableForeignKey({
        name: 'FK_qt_fiscal',
        columnNames: ['fiscal_configuration_id'],
        referencedTableName: 'fiscal_configurations',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_quotations',
      new TableForeignKey({
        name: 'FK_qt_billing_branch',
        columnNames: ['billing_branch_id'],
        referencedTableName: 'billing_branches',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_quotations',
      new TableForeignKey({
        name: 'FK_qt_warehouse',
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_quotations',
      new TableForeignKey({
        name: 'FK_qt_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'inv_s_quotation_details',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'quotation_id', type: 'varchar', length: '36' },
          { name: 'product_id', type: 'varchar', length: '36' },
          { name: 'product_uom_id', type: 'varchar', length: '36' },
          { name: 'quantity', type: 'decimal', precision: 12, scale: 3 },
          {
            name: 'quantity_base_uom',
            type: 'decimal',
            precision: 12,
            scale: 3,
            default: '0',
          },
          {
            name: 'base_uom_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'unit_price', type: 'decimal', precision: 12, scale: 2 },
          {
            name: 'discount_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'discount_unit',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: '0',
          },
          {
            name: 'product_discount_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'iva_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'iva_unit',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: '0',
          },
          {
            name: 'ieps_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'ieps_unit',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: '0',
          },
          { name: 'created_by', type: 'varchar', length: '36' },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          { name: 'updated_by', type: 'varchar', length: '36', isNullable: true },
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

    await queryRunner.createIndex(
      'inv_s_quotation_details',
      new TableIndex({
        name: 'idx_qt_detail_quotation',
        columnNames: ['quotation_id'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_quotation_details',
      new TableIndex({
        name: 'idx_qt_detail_product',
        columnNames: ['product_id'],
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_quotation_details',
      new TableForeignKey({
        name: 'FK_qt_detail_quotation',
        columnNames: ['quotation_id'],
        referencedTableName: 'inv_s_quotations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'inv_s_quotation_document_types',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '100', isUnique: true },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.query(`
      INSERT INTO inv_s_quotation_document_types (name, description)
      VALUES ('DOCUMENTO_ORIGINAL', 'Documento original de la cotización')
    `);

    await queryRunner.createTable(
      new Table({
        name: 'inv_s_quotation_documents',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'quotation_id', type: 'varchar', length: '36' },
          { name: 'document_type_id', type: 'int' },
          { name: 'file_name', type: 'varchar', length: '255' },
          { name: 'file_path', type: 'varchar', length: '500' },
          { name: 'file_size', type: 'bigint', isNullable: true },
          { name: 'mime_type', type: 'varchar', length: '100', isNullable: true },
          {
            name: 'document_language',
            type: 'enum',
            enum: ['es', 'en'],
            default: "'es'",
          },
          { name: 'uploaded_by', type: 'varchar', length: '36' },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'inv_s_quotation_documents',
      new TableIndex({
        name: 'idx_qt_doc_quotation_id',
        columnNames: ['quotation_id'],
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_quotation_documents',
      new TableForeignKey({
        name: 'FK_qt_doc_quotation',
        columnNames: ['quotation_id'],
        referencedTableName: 'inv_s_quotations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_quotation_documents',
      new TableForeignKey({
        name: 'FK_qt_doc_type',
        columnNames: ['document_type_id'],
        referencedTableName: 'inv_s_quotation_document_types',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    const soTable = await queryRunner.getTable('inv_s_sales_orders');
    if (soTable && !soTable.findColumnByName('converted_from_quotation_id')) {
      await queryRunner.addColumn(
        'inv_s_sales_orders',
        new TableColumn({
          name: 'converted_from_quotation_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
      await queryRunner.createIndex(
        'inv_s_sales_orders',
        new TableIndex({
          name: 'idx_so_converted_from_quotation',
          columnNames: ['converted_from_quotation_id'],
        }),
      );
    }

    await this.seedModule(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const soTable = await queryRunner.getTable('inv_s_sales_orders');
    if (soTable?.findColumnByName('converted_from_quotation_id')) {
      const idx = soTable.indices.find(
        (i) => i.name === 'idx_so_converted_from_quotation',
      );
      if (idx) {
        await queryRunner.dropIndex(
          'inv_s_sales_orders',
          'idx_so_converted_from_quotation',
        );
      }
      await queryRunner.dropColumn(
        'inv_s_sales_orders',
        'converted_from_quotation_id',
      );
    }

    await queryRunner.dropTable('inv_s_quotation_documents', true);
    await queryRunner.dropTable('inv_s_quotation_document_types', true);
    await queryRunner.dropTable('inv_s_quotation_details', true);
    await queryRunner.dropTable('inv_s_quotations', true);

    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'quotations'
    `);
    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE module_id IN (SELECT id FROM modules WHERE code = 'quotations')
    `);
    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'quotations'
    `);
    await queryRunner.query(`DELETE FROM modules WHERE code = 'quotations'`);
    await queryRunner.query(
      `DELETE FROM entity_registry WHERE code = 'Quotation'`,
    );
  }

  private async seedModule(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, category, sort_order, created_at)
      SELECT UUID(), 'Cotizaciones', 'quotations',
        'Cotizaciones de venta. Sin facturación ni reserva de inventario hasta convertir a OV.',
        'sales', 8, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = 'quotations')
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT 'Quotation', 'Cotizaciones'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = 'Quotation')
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'quotations'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Ver Cotizaciones en el menú' AS description
        UNION ALL SELECT 'Create', 'Crear cotizaciones (manual o POS)'
        UNION ALL SELECT 'Read', 'Consultar cotizaciones y PDF'
        UNION ALL SELECT 'Update', 'Editar cotizaciones en estado Creada'
        UNION ALL SELECT 'Delete', 'Cancelar cotizaciones'
        UNION ALL SELECT 'Convert', 'Convertir cotización a orden de venta'
      ) a
      WHERE er.code = 'Quotation'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = a.action
        )
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), t.id, m.id, 1, NOW()
      FROM rbac_tenants t
      JOIN modules m ON m.code = 'quotations'
      WHERE NOT EXISTS (
        SELECT 1 FROM tenant_modules tm
        WHERE tm.tenant_id = t.id AND tm.module_id = m.id
      )
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = 'quotations' LIMIT 1
      )
      WHERE r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    `);

    await queryRunner.query(`
      UPDATE users
      SET permissions_version = COALESCE(permissions_version, 0) + 1
    `);
  }
}
