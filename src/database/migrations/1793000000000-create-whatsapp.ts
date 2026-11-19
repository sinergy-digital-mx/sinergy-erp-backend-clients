import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULE_CODE = 'whatsapp';
const ENTITY_CODE = 'whatsapp';

/**
 * WhatsApp multi-organización sobre un servidor WAHA compartido.
 * - whatsapp_sessions: una sesión por organización (UNIQUE tenant_id y session_name).
 * - whatsapp_messages: bitácora de envíos.
 * El módulo se registra pero no se habilita: cada organización lo activa desde el panel de módulos.
 */
export class CreateWhatsapp1793000000000 implements MigrationInterface {
  name = 'CreateWhatsapp1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        id varchar(36) NOT NULL,
        tenant_id varchar(36) NOT NULL,
        session_name varchar(80) NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'STOPPED',
        phone_number varchar(32) NULL,
        push_name varchar(255) NULL,
        connected_at timestamp NULL,
        last_status_at timestamp NULL,
        last_error varchar(500) NULL,
        created_by varchar(36) NOT NULL,
        updated_by varchar(36) NOT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_whatsapp_sessions_tenant (tenant_id),
        UNIQUE KEY uq_whatsapp_sessions_name (session_name),
        CONSTRAINT fk_whatsapp_sessions_tenant
          FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id varchar(36) NOT NULL,
        tenant_id varchar(36) NOT NULL,
        session_name varchar(80) NOT NULL,
        to_phone varchar(32) NOT NULL,
        chat_id varchar(64) NULL,
        type varchar(16) NOT NULL DEFAULT 'text',
        body text NULL,
        file_name varchar(255) NULL,
        file_mimetype varchar(120) NULL,
        status varchar(16) NOT NULL DEFAULT 'queued',
        error_message varchar(500) NULL,
        waha_message_id varchar(190) NULL,
        reference_type varchar(60) NULL,
        reference_id varchar(36) NULL,
        sent_at timestamp NULL,
        delivered_at timestamp NULL,
        read_at timestamp NULL,
        created_by varchar(36) NOT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_whatsapp_messages_tenant_created (tenant_id, created_at),
        KEY idx_whatsapp_messages_tenant_status (tenant_id, status),
        KEY idx_whatsapp_messages_waha_id (waha_message_id),
        KEY idx_whatsapp_messages_reference (tenant_id, reference_type, reference_id),
        CONSTRAINT fk_whatsapp_messages_tenant
          FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, category, sort_order, created_at)
      SELECT UUID(), 'WhatsApp', '${MODULE_CODE}',
        'Envío de mensajes por WhatsApp con el número de la organización',
        'communication', 40, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = '${MODULE_CODE}')
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${ENTITY_CODE}', 'WhatsApp'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = '${ENTITY_CODE}')
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Ver WhatsApp en el menú' AS description
        UNION ALL SELECT 'Read', 'Consultar el estado de la conexión y el historial de mensajes'
        UNION ALL SELECT 'Create', 'Enviar mensajes por WhatsApp'
        UNION ALL SELECT 'Update', 'Conectar, escanear QR, reiniciar y desvincular WhatsApp'
        UNION ALL SELECT 'Delete', 'Eliminar la conexión de WhatsApp'
      ) a
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = a.action
        )
    `);

    // Los roles Admin ya quedan con los permisos; solo se usan si la organización activa el módulo.
    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1
      )
      WHERE (r.name = 'Admin' OR r.is_admin = 1)
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}'
    `);
    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE module_id IN (SELECT id FROM modules WHERE code = '${MODULE_CODE}')
    `);
    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}'
    `);
    await queryRunner.query(`DELETE FROM modules WHERE code = '${MODULE_CODE}'`);
    await queryRunner.query(`DELETE FROM entity_registry WHERE code = '${ENTITY_CODE}'`);
    await queryRunner.query(`DROP TABLE IF EXISTS whatsapp_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS whatsapp_sessions`);
  }
}
