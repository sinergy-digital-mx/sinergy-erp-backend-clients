import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Envío de cotización por correo (PDF adjunto) e historial.
 * Agrega permiso Quotation:Send a Admin.
 */
export class QuotationEmailSend1788400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_quotation_emails',
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
          { name: 'quotation_id', type: 'varchar', length: '36' },
          { name: 'to_email', type: 'varchar', length: '255' },
          { name: 'cc', type: 'json', isNullable: true },
          { name: 'bcc', type: 'json', isNullable: true },
          { name: 'subject', type: 'varchar', length: '255' },
          { name: 'message', type: 'text', isNullable: true },
          { name: 'sent_by', type: 'varchar', length: '36', isNullable: true },
          {
            name: 'sent_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'inv_s_quotation_emails',
      new TableIndex({
        name: 'idx_qt_email_quotation',
        columnNames: ['quotation_id'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_quotation_emails',
      new TableIndex({
        name: 'idx_qt_email_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createForeignKey(
      'inv_s_quotation_emails',
      new TableForeignKey({
        name: 'FK_qt_email_quotation',
        columnNames: ['quotation_id'],
        referencedTableName: 'inv_s_quotations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT UUID(), er.id, m.id, 'Send', 'Enviar cotización por correo', 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'quotations'
      WHERE er.code = 'Quotation'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = 'Send'
        )
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = 'quotations' LIMIT 1
      ) AND p.action = 'Send'
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inv_s_quotation_emails', true);

    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'quotations' AND p.action = 'Send'
    `);
    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'quotations' AND p.action = 'Send'
    `);
  }
}
