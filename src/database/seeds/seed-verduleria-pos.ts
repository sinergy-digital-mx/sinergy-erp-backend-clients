import 'dotenv/config';
import 'reflect-metadata';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';

const VERDULERIA_SUBDOMAIN = 'verduleria';
const TEMPLATE_SUBDOMAIN = 'maderia-zona-norte';
const POS_ROLE_NAME = 'Punto de Venta';
const PASSWORD = '123';
const SELLER_CODE = 1001;
const BRANCH_CODE = 'TIJ-1';

const TERMINALS = [
  {
    email: 'ventas.prueba@verduleria.com',
    first_name: 'POS',
    last_name: 'Ventas',
    pos_user_type: 'VENTAS',
  },
  {
    email: 'caja.prueba@verduleria.com',
    first_name: 'POS',
    last_name: 'Caja',
    pos_user_type: 'COBRANZA',
  },
] as const;

const SELLER = {
  email: 'vendedor.prueba@verduleria.com',
  first_name: 'Vendedor',
  last_name: 'Prueba',
};

async function seed() {
  await AppDataSource.initialize();
  const query = AppDataSource.query.bind(AppDataSource);

  const tenants = await query(
    `SELECT id, subdomain FROM rbac_tenants WHERE subdomain IN (?, ?)`,
    [VERDULERIA_SUBDOMAIN, TEMPLATE_SUBDOMAIN],
  );
  const verduleria = tenants.find((row) => row.subdomain === VERDULERIA_SUBDOMAIN);
  const template = tenants.find((row) => row.subdomain === TEMPLATE_SUBDOMAIN);
  if (!verduleria || !template) {
    throw new Error('No se encontró la organización de verdulería o la de madería para copiar el rol.');
  }

  const branches = await query(
    `SELECT b.id, b.code
     FROM billing_branches b
     JOIN fiscal_configurations f ON f.id = b.fiscal_configuration_id
     WHERE f.tenant_id = ? AND b.code = ? AND b.status = 1
     LIMIT 1`,
    [verduleria.id, BRANCH_CODE],
  );
  if (!branches.length) {
    throw new Error(`No hay sucursal activa ${BRANCH_CODE} en verdulería.`);
  }
  const branchId = branches[0].id;

  const existingRole = await query(
    `SELECT id FROM rbac_roles WHERE tenant_id = ? AND name = ? LIMIT 1`,
    [verduleria.id, POS_ROLE_NAME],
  );
  const roleId = existingRole[0]?.id ?? randomUUID();
  if (!existingRole.length) {
    await query(
      `INSERT INTO rbac_roles (id, name, description, is_system_role, is_admin, tenant_id)
       VALUES (?, ?, ?, 0, 0, ?)`,
      [
        roleId,
        POS_ROLE_NAME,
        'Terminales de venta y caja del punto de venta',
        verduleria.id,
      ],
    );
  }

  await query(
    `INSERT INTO rbac_role_permissions (id, role_id, permission_id)
     SELECT UUID(), ?, source.permission_id
     FROM rbac_role_permissions source
     JOIN rbac_roles template_role
       ON template_role.id = source.role_id
      AND template_role.tenant_id = ?
      AND template_role.name = ?
     WHERE NOT EXISTS (
       SELECT 1 FROM rbac_role_permissions existing
       WHERE existing.role_id = ? AND existing.permission_id = source.permission_id
     )`,
    [roleId, template.id, POS_ROLE_NAME, roleId],
  );

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const activeStatus = await query(
    `SELECT id FROM user_status WHERE code = 'active' OR id = 1 ORDER BY id ASC LIMIT 1`,
  );
  const statusId = activeStatus[0]?.id ?? 1;

  for (const terminal of TERMINALS) {
    await upsertUser(query, {
      tenantId: verduleria.id,
      branchId,
      roleId,
      statusId,
      passwordHash,
      email: terminal.email,
      firstName: terminal.first_name,
      lastName: terminal.last_name,
      isPosUser: 1,
      posUserType: terminal.pos_user_type,
      posUserCode: null,
    });
  }

  await upsertUser(query, {
    tenantId: verduleria.id,
    branchId,
    roleId: null,
    statusId,
    passwordHash,
    email: SELLER.email,
    firstName: SELLER.first_name,
    lastName: SELLER.last_name,
    isPosUser: 0,
    posUserType: null,
    posUserCode: SELLER_CODE,
  });

  const created = await query(
    `SELECT email, first_name, last_name, is_pos_user, pos_user_type, pos_user_code, billing_branch_id
     FROM users
     WHERE tenant_id = ? AND email IN (?, ?, ?)
     ORDER BY email`,
    [verduleria.id, ...TERMINALS.map((row) => row.email), SELLER.email],
  );
  console.log(JSON.stringify(created, null, 2));
}

async function upsertUser(
  query: (sql: string, params?: unknown[]) => Promise<any[]>,
  input: {
    tenantId: string;
    branchId: string;
    roleId: string | null;
    statusId: number;
    passwordHash: string;
    email: string;
    firstName: string;
    lastName: string;
    isPosUser: number;
    posUserType: string | null;
    posUserCode: number | null;
  },
) {
  const existing = await query(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [input.email],
  );
  const userId = existing[0]?.id ?? randomUUID();

  if (!existing.length) {
    await query(
      `INSERT INTO users (
         id, tenant_id, status_id, email, password, first_name, last_name,
         language_code, permissions_version, billing_branch_id,
         is_pos_user, pos_user_code, pos_user_type, is_manager
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'es', 1, ?, ?, ?, ?, 0)`,
      [
        userId,
        input.tenantId,
        input.statusId,
        input.email,
        input.passwordHash,
        input.firstName,
        input.lastName,
        input.branchId,
        input.isPosUser,
        input.posUserCode,
        input.posUserType,
      ],
    );
  } else {
    await query(
      `UPDATE users
       SET tenant_id = ?, status_id = ?, first_name = ?, last_name = ?,
           billing_branch_id = ?, is_pos_user = ?, pos_user_code = ?, pos_user_type = ?,
           permissions_version = permissions_version + 1
       WHERE id = ?`,
      [
        input.tenantId,
        input.statusId,
        input.firstName,
        input.lastName,
        input.branchId,
        input.isPosUser,
        input.posUserCode,
        input.posUserType,
        userId,
      ],
    );
  }

  const branchLink = await query(
    `SELECT id FROM user_billing_branches WHERE user_id = ? AND billing_branch_id = ? LIMIT 1`,
    [userId, input.branchId],
  );
  if (!branchLink.length) {
    await query(
      `INSERT INTO user_billing_branches (id, tenant_id, user_id, billing_branch_id, is_primary)
       VALUES (?, ?, ?, ?, 1)`,
      [randomUUID(), input.tenantId, userId, input.branchId],
    );
  }

  if (input.roleId) {
    const roleLink = await query(
      `SELECT id FROM rbac_user_roles WHERE user_id = ? AND role_id = ? AND tenant_id = ? LIMIT 1`,
      [userId, input.roleId, input.tenantId],
    );
    if (!roleLink.length) {
      await query(
        `INSERT INTO rbac_user_roles (id, user_id, role_id, tenant_id)
         VALUES (?, ?, ?, ?)`,
        [randomUUID(), userId, input.roleId, input.tenantId],
      );
    }
  }
}

seed()
  .then(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error?.sqlMessage || error?.message || error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  });
