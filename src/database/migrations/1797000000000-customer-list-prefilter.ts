import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Listado de clientes: prefiltro de razón/sucursal y permiso para no aplicarlo.
 * customers:ViewAll = entrar al listado sin la razón y sucursal del usuario.
 * La configuración por organización vive en customer_list_settings (default sellers).
 */
export class CustomerListPrefilter1797000000000 implements MigrationInterface {
  name = 'CustomerListPrefilter1797000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('customer_list_settings');
    if (!existing) {
      await queryRunner.createTable(
        new Table({
          name: 'customer_list_settings',
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
            { name: 'prefilter', type: 'varchar', length: '20', default: "'sellers'", isNullable: false },
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
        'customer_list_settings',
        new TableIndex({
          name: 'uq_customer_list_settings_tenant',
          columnNames: ['tenant_id'],
          isUnique: true,
        }),
      );

      await queryRunner.createForeignKey(
        'customer_list_settings',
        new TableForeignKey({
          columnNames: ['tenant_id'],
          referencedTableName: 'rbac_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'customer_list_settings',
        new TableForeignKey({
          columnNames: ['updated_by'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT
        UUID(),
        COALESCE(
          (
            SELECT p.entity_registry_id
            FROM rbac_permissions p
            WHERE p.module_id = m.id
            ORDER BY
              CASE WHEN LOWER(p.action) IN ('create', 'read', 'viewmenu') THEN 0 ELSE 1 END,
              p.created_at
            LIMIT 1
          ),
          (
            SELECT er.id
            FROM entity_registry er
            WHERE LOWER(er.code) IN ('customers', 'customer')
            LIMIT 1
          )
        ),
        m.id,
        'ViewAll',
        'Entrar a Clientes sin la razón y sucursal asignadas. Puede ver todas desde el select.',
        1,
        NOW(),
        NOW()
      FROM modules m
      WHERE m.code = 'customers'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND LOWER(p.action) = 'viewall'
        )
        AND COALESCE(
          (
            SELECT p.entity_registry_id
            FROM rbac_permissions p
            WHERE p.module_id = m.id
            ORDER BY
              CASE WHEN LOWER(p.action) IN ('create', 'read', 'viewmenu') THEN 0 ELSE 1 END,
              p.created_at
            LIMIT 1
          ),
          (
            SELECT er.id
            FROM entity_registry er
            WHERE LOWER(er.code) IN ('customers', 'customer')
            LIMIT 1
          )
        ) IS NOT NULL
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, perm.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions perm
        ON perm.module_id = (SELECT id FROM modules WHERE code = 'customers' LIMIT 1)
       AND LOWER(perm.action) = 'viewall'
      WHERE (r.is_admin = 1 OR r.name = 'Admin')
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id
            AND rp.permission_id = perm.id
        )
    `);

    await queryRunner.query(`
      UPDATE users
      SET permissions_version = COALESCE(permissions_version, 0) + 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'customers'
        AND LOWER(p.action) = 'viewall'
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'customers'
        AND LOWER(p.action) = 'viewall'
    `);

    const table = await queryRunner.getTable('customer_list_settings');
    if (table) {
      await queryRunner.dropTable('customer_list_settings', true);
    }
  }
}
