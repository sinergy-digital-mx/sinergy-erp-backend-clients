import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateElectronicInvoicingTables1780000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE fiscal_configurations
        ADD COLUMN created_by VARCHAR(36) NULL,
        ADD COLUMN certificate_serial_number VARCHAR(30) NULL,
        ADD COLUMN finkok_registration_status ENUM('pending','registered','failed','not_required') NOT NULL DEFAULT 'pending',
        ADD COLUMN finkok_registered_at TIMESTAMP NULL,
        ADD COLUMN finkok_registration_error TEXT NULL
    `);

    await queryRunner.createTable(
      new Table({
        name: 'finkok_provider_configurations',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'finkok_username', type: 'varchar', length: '255', isNullable: false },
          { name: 'finkok_username_encrypted', type: 'text', isNullable: false },
          { name: 'finkok_username_iv', type: 'varchar', length: '32', isNullable: false },
          { name: 'finkok_password_encrypted', type: 'text', isNullable: false },
          { name: 'finkok_password_iv', type: 'varchar', length: '32', isNullable: false },
          {
            name: 'environment',
            type: 'enum',
            enum: ['demo', 'production'],
            default: "'demo'",
          },
          { name: 'is_active', type: 'tinyint', default: 1 },
          { name: 'last_connection_test_at', type: 'timestamp', isNullable: true },
          { name: 'last_connection_test_status', type: 'varchar', length: '50', isNullable: true },
          { name: 'created_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'updated_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
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
      'finkok_provider_configurations',
      new TableIndex({
        name: 'uq_finkok_provider_tenant',
        columnNames: ['tenant_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'finkok_provider_configurations',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'electronic_invoices',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'fiscal_configuration_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'source_module', type: 'varchar', length: '50', isNullable: false },
          { name: 'source_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'uuid', type: 'varchar', length: '36', isNullable: true },
          { name: 'series', type: 'varchar', length: '25', isNullable: true },
          { name: 'folio', type: 'varchar', length: '40', isNullable: true },
          { name: 'tipo_comprobante', type: 'varchar', length: '5', default: "'I'" },
          { name: 'rfc_emisor', type: 'varchar', length: '13', isNullable: false },
          { name: 'rfc_receptor', type: 'varchar', length: '13', isNullable: false },
          { name: 'receptor_nombre', type: 'varchar', length: '255', isNullable: true },
          { name: 'subtotal', type: 'decimal', precision: 14, scale: 2, isNullable: false },
          { name: 'total', type: 'decimal', precision: 14, scale: 2, isNullable: false },
          { name: 'currency', type: 'varchar', length: '3', default: "'MXN'" },
          { name: 'xml_unsigned', type: 'longtext', isNullable: true },
          { name: 'xml_stamped', type: 'longtext', isNullable: true },
          { name: 'xml_stamped_s3_key', type: 'varchar', length: '500', isNullable: true },
          { name: 'stamped_at', type: 'timestamp', isNullable: true },
          { name: 'certificate_serial', type: 'varchar', length: '50', isNullable: true },
          { name: 'sat_seal', type: 'varchar', length: '500', isNullable: true },
          { name: 'sat_certificate_number', type: 'varchar', length: '30', isNullable: true },
          {
            name: 'stamp_status',
            type: 'enum',
            enum: [
              'pending_stamp',
              'stamped',
              'stamp_error',
              'cancel_pending',
              'cancelled',
              'cancel_error',
            ],
            default: "'pending_stamp'",
          },
          { name: 'stamp_error_message', type: 'text', isNullable: true },
          { name: 'cancel_motivo', type: 'varchar', length: '2', isNullable: true },
          { name: 'cancel_replacement_uuid', type: 'varchar', length: '36', isNullable: true },
          { name: 'cancel_acuse_xml', type: 'longtext', isNullable: true },
          { name: 'cancel_sat_status_code', type: 'varchar', length: '10', isNullable: true },
          {
            name: 'sat_status',
            type: 'enum',
            enum: ['Vigente', 'Cancelado', 'No Encontrado', 'Desconocido'],
            isNullable: true,
          },
          { name: 'sat_es_cancelable', type: 'varchar', length: '100', isNullable: true },
          { name: 'sat_estatus_cancelacion', type: 'varchar', length: '100', isNullable: true },
          { name: 'sat_codigo_estatus', type: 'varchar', length: '255', isNullable: true },
          { name: 'sat_last_sync_at', type: 'timestamp', isNullable: true },
          { name: 'sat_sync_enabled', type: 'tinyint', default: 1 },
          { name: 'metadata', type: 'json', isNullable: true },
          { name: 'created_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
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
      'electronic_invoices',
      new TableIndex({ name: 'tenant_index', columnNames: ['tenant_id'] }),
    );
    await queryRunner.createIndex(
      'electronic_invoices',
      new TableIndex({
        name: 'idx_ei_source',
        columnNames: ['tenant_id', 'source_module', 'source_id'],
      }),
    );
    await queryRunner.createIndex(
      'electronic_invoices',
      new TableIndex({ name: 'idx_ei_uuid', columnNames: ['uuid'] }),
    );
    await queryRunner.createIndex(
      'electronic_invoices',
      new TableIndex({
        name: 'idx_ei_sat_sync',
        columnNames: ['stamp_status', 'sat_last_sync_at'],
      }),
    );

    await queryRunner.createForeignKey(
      'electronic_invoices',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'electronic_invoices',
      new TableForeignKey({
        columnNames: ['fiscal_configuration_id'],
        referencedTableName: 'fiscal_configurations',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'electronic_invoice_sync_logs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'electronic_invoice_id', type: 'varchar', length: '36', isNullable: true },
          {
            name: 'trigger_type',
            type: 'enum',
            enum: ['scheduled', 'manual', 'batch'],
            default: "'scheduled'",
          },
          { name: 'previous_sat_status', type: 'varchar', length: '50', isNullable: true },
          { name: 'new_sat_status', type: 'varchar', length: '50', isNullable: true },
          { name: 'raw_response', type: 'json', isNullable: true },
          { name: 'success', type: 'tinyint', default: 1 },
          { name: 'error_message', type: 'text', isNullable: true },
          { name: 'triggered_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'electronic_invoice_sync_logs',
      new TableIndex({ name: 'tenant_index', columnNames: ['tenant_id'] }),
    );
    await queryRunner.createIndex(
      'electronic_invoice_sync_logs',
      new TableIndex({
        name: 'idx_eisl_invoice',
        columnNames: ['electronic_invoice_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'electronic_invoice_sync_logs',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'electronic_invoice_sync_logs',
      new TableForeignKey({
        columnNames: ['electronic_invoice_id'],
        referencedTableName: 'electronic_invoices',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('electronic_invoice_sync_logs', true);
    await queryRunner.dropTable('electronic_invoices', true);
    await queryRunner.dropTable('finkok_provider_configurations', true);

    await queryRunner.query(`
      ALTER TABLE fiscal_configurations
        DROP COLUMN created_by,
        DROP COLUMN certificate_serial_number,
        DROP COLUMN finkok_registration_status,
        DROP COLUMN finkok_registered_at,
        DROP COLUMN finkok_registration_error
    `);
  }
}
