import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Salida de inventario al cancelar una compra recibida
 * y permiso único para corregir cantidad o precio del recibo.
 */
export class PurchaseOrderReversal1791500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const ledger = await queryRunner.getTable('inv_s_stock_ledger');
    const movement = ledger?.findColumnByName('movement_type');
    if (movement && !String(movement.enum ?? []).includes('purchase_reversal')) {
      await queryRunner.query(`
        ALTER TABLE inv_s_stock_ledger
        MODIFY COLUMN movement_type ENUM(
          'purchase_receipt',
          'import',
          'sale',
          'sale_reversal',
          'transfer_in',
          'transfer_out',
          'audit_adjustment',
          'opening_balance',
          'purchase_reversal'
        ) NOT NULL
      `);
    }

    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT
        UUID(),
        er.id,
        m.id,
        'CorrectReceipt',
        'Corregir cantidad o precio de una orden de compra ya recibida',
        1,
        NOW(),
        NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'purchase_orders'
      WHERE er.code = 'purchase_orders'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND p.action = 'CorrectReceipt'
        );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.action = 'CorrectReceipt'
      JOIN modules m ON m.id = p.module_id AND m.code = 'purchase_orders'
      WHERE r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        );
    `);

    await queryRunner.query(`
      UPDATE users u
      INNER JOIN rbac_user_roles ur ON ur.user_id = u.id
      INNER JOIN rbac_roles r ON r.id = ur.role_id AND r.name = 'Admin'
      SET u.permissions_version = COALESCE(u.permissions_version, 0) + 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'purchase_orders' AND p.action = 'CorrectReceipt'
    `);
    await queryRunner.query(`
      DELETE p FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'purchase_orders' AND p.action = 'CorrectReceipt'
    `);
  }
}
