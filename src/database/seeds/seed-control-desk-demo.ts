import 'dotenv/config';
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { ControlDeskLifecycleService } from '../../api/warehouse-control/control-desk-lifecycle.service';
import { SalesOrderFulfillmentService } from '../../api/sales-orders/services/sales-order-fulfillment.service';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../entities/sales-orders/sales-order-detail.entity';
import { ControlDeskJob } from '../../entities/control-desk/control-desk-job.entity';
import { ControlDeskPickTask } from '../../entities/control-desk/control-desk-pick-task.entity';
import { ControlDeskPickLine } from '../../entities/control-desk/control-desk-pick-line.entity';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';

const TENANT_ID = 'a9c67ebf-715f-4cec-9af5-ba233e9f8e05';
const BRANCH_ID = 'f58eba7b-2559-4543-aac7-844f425be938';
const FISCAL_ID = '008ca9b9-cd03-44f8-97fc-2830b8f5ec04';
const COLD_WH_ID = 'b0df0fc4-7414-4858-a725-0beadecfd071';
const ADMIN_ID = '2c933091-b1d7-4584-a2e7-b51a86a97b6a';
const DEMO_TAG = '[DEMO-MDC]';
const PASSWORD = '123';

const COLD = [
  { id: 'ea23a82d-bdfc-475a-bbb3-8a1f268583e5', name: 'LECHUGA BOLA', uom: 'cecef3f7-e805-427a-9d10-6369841a7234', catalog: 'b94a341f-23b5-4b31-8a22-454d143a6ae4', price: 18 },
  { id: '67a06d77-bfbb-4843-a14d-57e7d0a42808', name: 'LECHUGA ROMANA', uom: '5c8f9968-4f90-4f7f-a3ef-9f34231e653b', catalog: 'b94a341f-23b5-4b31-8a22-454d143a6ae4', price: 22 },
  { id: 'e6cd887c-b1cd-46aa-950e-1bb06b5517d3', name: 'FRESA BURBUJA 450 GRS', uom: '002aff84-9056-4943-b90a-12293f10536c', catalog: '07e4c16b-7ae8-43f4-a4be-f21ad751c053', price: 45 },
  { id: 'a9b1318d-0b2e-435c-806d-0e55759b3f2f', name: 'KIWI', uom: '1756bbf0-8602-4489-8c4d-b3fefa31266e', catalog: 'd2e34052-63b3-4d20-adee-952ba594f5db', price: 38 },
  { id: '3bf0add0-a479-4e00-8bb3-ec3d0b91deb7', name: 'DURAZNO', uom: 'c72a01dc-c459-47b6-a861-1d7ca5a288d5', catalog: 'd2e34052-63b3-4d20-adee-952ba594f5db', price: 32 },
];

const DRY = [
  { id: 'b8382585-868d-412f-b233-5bea12ce4d0e', name: 'CAMOTE USA', uom: '1ee512e6-d274-4617-831e-7dfb2b00b1a8', catalog: 'd2e34052-63b3-4d20-adee-952ba594f5db', price: 16 },
  { id: '1e73870f-2da2-4956-95fc-83f15dfbfd8b', name: 'JICAMA', uom: 'a41f8982-6077-484e-944b-0012bd7a8a23', catalog: 'd2e34052-63b3-4d20-adee-952ba594f5db', price: 14 },
  { id: 'e326107a-9bd3-4cb3-a961-899bd9aa7fc4', name: 'CEBOLLA BLANCA #1', uom: '4373c8c4-c7a7-4ea6-8aad-094466fd2770', catalog: 'd2e34052-63b3-4d20-adee-952ba594f5db', price: 12 },
  { id: '0ffae9e4-257d-438f-b77c-a0efcb6cd63e', name: 'LIMON MEXICANO # 300', uom: 'cb201c35-e054-4254-877a-514026b170c6', catalog: 'd2e34052-63b3-4d20-adee-952ba594f5db', price: 20 },
  { id: '7c90f61a-074e-436c-9fb8-125c8335fb72', name: 'MANZANA GALA', uom: '82c704e4-587c-4e60-ae56-4871a73856d7', catalog: 'd2e34052-63b3-4d20-adee-952ba594f5db', price: 28 },
];

const CUSTOMERS = [
  15047, 15049, 15057, 15058, 15059, 15061, 15063,
  15046, 15048, 15050, 15051, 15052, 15053, 15055, 15056,
];

type Scenario =
  | 'queue'
  | 'released_position'
  | 'picking'
  | 'waiting'
  | 'assembling'
  | 'assembled'
  | 'shortage';

const SCENARIOS: Scenario[] = [
  'queue', 'queue', 'queue', 'queue',
  'released_position', 'released_position',
  'picking', 'picking', 'picking',
  'waiting', 'waiting',
  'assembling', 'assembling',
  'assembled',
  'shortage',
];

async function main() {
  await AppDataSource.initialize();
  const tables = await AppDataSource.query("SHOW TABLES LIKE 'control_desk_jobs'");
  if (!tables.length) {
    throw new Error('Corre la migración 1787800000000-create-control-desk-tables primero');
  }

  const lifecycle = new ControlDeskLifecycleService();
  const fulfillment = new SalesOrderFulfillmentService(
    AppDataSource.getRepository(InventoryBatch),
  );

  console.log('Limpieza demo previa...');
  const old = await AppDataSource.query(
    `SELECT id FROM inv_s_sales_orders WHERE tenant_id = ? AND notes LIKE ?`,
    [TENANT_ID, `${DEMO_TAG}%`],
  );
  for (const row of old) {
    await AppDataSource.query(`DELETE FROM inv_s_sales_orders WHERE id = ?`, [row.id]);
  }
  await AppDataSource.query(
    `DELETE FROM control_desk_positions WHERE tenant_id = ? AND name LIKE ?`,
    [TENANT_ID, `${DEMO_TAG}%`],
  );
  await AppDataSource.query(
    `DELETE FROM inv_s_batches WHERE tenant_id = ? AND source_tag_identifier = ?`,
    [TENANT_ID, 'DEMO-MDC'],
  );

  let dryWh = await AppDataSource.query(
    `SELECT id FROM warehouses WHERE tenant_id = ? AND code = 'SECA' LIMIT 1`,
    [TENANT_ID],
  );
  let dryWhId: string;
  if (dryWh[0]) {
    dryWhId = dryWh[0].id;
  } else {
    dryWhId = uuidv4();
    await AppDataSource.query(
      `INSERT INTO warehouses
        (id, tenant_id, name, code, description, street, city, state, zip_code, country,
         phone, email, contact_person, status, billing_branch_id, fiscal_configuration_id, prefix, created_at, updated_at)
       VALUES (?, ?, 'Bodega Seca', 'SECA', 'Bodega seca / sin frío', '', 'Tijuana', 'BC', '', 'MX',
         '', '', '', 'active', ?, ?, 'SEC', NOW(), NOW())`,
      [dryWhId, TENANT_ID, BRANCH_ID, FISCAL_ID],
    );
    console.log('Bodega Seca creada');
  }

  const stockItems = [
    ...COLD.map((p) => ({ ...p, warehouseId: COLD_WH_ID })),
    ...DRY.map((p) => ({ ...p, warehouseId: dryWhId })),
  ];
  for (const item of stockItems) {
    await AppDataSource.query(
      `INSERT INTO inv_s_batches
        (id, tenant_id, batch_number, warehouse_id, product_id, uom_id,
         initial_quantity, available_quantity, created_by, source_tag_identifier, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 800, 800, ?, 'DEMO-MDC', NOW())`,
      [
        uuidv4(),
        TENANT_ID,
        `DEMO-${item.warehouseId.slice(0, 4)}-${item.id.slice(0, 8)}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        item.warehouseId,
        item.id,
        item.catalog,
        ADMIN_ID,
      ],
    );
  }
  console.log(`Stock demo: ${stockItems.length} lotes`);

  const positions: Array<{ id: string; code: string }> = [];
  for (const row of [0, 1]) {
    const letter = row === 0 ? 'A' : 'B';
    for (let col = 0; col < 6; col++) {
      const code = `${letter}${col + 1}`;
      const id = uuidv4();
      await AppDataSource.query(
        `INSERT INTO control_desk_positions
          (id, tenant_id, billing_branch_id, code, name, \`row\`, col, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [id, TENANT_ID, BRANCH_ID, code, `${DEMO_TAG} ${code}`, row, col, row * 10 + col],
      );
      positions.push({ id, code });
    }
  }
  console.log('12 posiciones de piso (A1-A6, B1-B6)');

  const jefeRoleId = await ensureJefeRole();
  const jefeFrio = await ensureJefeUser(
    'jefe.frio@verduleria.com',
    'María',
    'Frío',
    COLD_WH_ID,
    jefeRoleId,
  );
  const jefeSeca = await ensureJefeUser(
    'jefe.seca@verduleria.com',
    'Luis',
    'Seca',
    dryWhId,
    jefeRoleId,
  );

  const lastFolio = await AppDataSource.query(
    `SELECT folio FROM inv_s_sales_orders WHERE tenant_id = ? AND folio LIKE 'OSV-%' ORDER BY folio DESC LIMIT 1`,
    [TENANT_ID],
  );
  let nextFolio = lastFolio[0]
    ? parseInt(String(lastFolio[0].folio).replace('OSV-', ''), 10) + 1
    : 1;

  const created: Array<{ folio: string; scenario: Scenario; jobId: string }> = [];
  let positionIdx = 0;

  for (let i = 0; i < 15; i++) {
    const scenario = SCENARIOS[i];
    const folio = `OSV-${String(nextFolio++).padStart(6, '0')}`;
    const customerId = CUSTOMERS[i];
    const coldItem = COLD[i % COLD.length];
    const dryItem = DRY[i % DRY.length];
    const extraCold = COLD[(i + 1) % COLD.length];

    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const soId = uuidv4();
      const so = qr.manager.create(SalesOrder, {
        id: soId,
        tenant_id: TENANT_ID,
        folio,
        fiscal_configuration_id: FISCAL_ID,
        billing_branch_id: BRANCH_ID,
        warehouse_id: null,
        customer_id: customerId,
        expected_delivery_date: new Date('2026-09-05'),
        sales_order_type: 'MANUAL',
        payment_status: 'Pendiente',
        general_status: 'En Selección',
        notes: `${DEMO_TAG} ${scenario}`,
        requires_selection_assembly: true,
        created_by: ADMIN_ID,
        subtotal: 0,
        iva_total: 0,
        ieps_total: 0,
        discount_total: 0,
        total: 0,
      });
      await qr.manager.save(SalesOrder, so);

      const linesSpec = [
        { product: dryItem, qty: 8 + (i % 5) },
        { product: coldItem, qty: 6 + (i % 4) },
      ];
      if (i % 3 === 0) {
        linesSpec.push({ product: extraCold, qty: 4 });
      }

      const details: SalesOrderDetail[] = [];
      let subtotal = 0;
      for (const line of linesSpec) {
        const detail = qr.manager.create(SalesOrderDetail, {
          id: uuidv4(),
          sales_order_id: soId,
          product_id: line.product.id,
          product_uom_id: line.product.uom,
          quantity: line.qty,
          quantity_base_uom: line.qty,
          base_uom_id: line.product.catalog,
          unit_price: line.product.price,
          discount_percentage: 0,
          discount_unit: 0,
          iva_percentage: 0,
          iva_unit: 0,
          ieps_percentage: 0,
          ieps_unit: 0,
          created_by: ADMIN_ID,
        });
        await qr.manager.save(SalesOrderDetail, detail);
        details.push(detail);
        subtotal += line.qty * line.product.price;
      }
      so.subtotal = subtotal;
      so.total = subtotal;
      await qr.manager.save(SalesOrder, so);

      const job = await lifecycle.syncJobForSalesOrder(qr.manager, {
        tenantId: TENANT_ID,
        userId: ADMIN_ID,
        salesOrder: so,
        details,
        requiresSelection: true,
      });
      if (!job) {
        throw new Error(`No se creó job para ${folio}`);
      }

      const loaded = await qr.manager.findOne(ControlDeskJob, {
        where: { id: job.id },
        relations: ['tasks', 'tasks.lines', 'tasks.lines.sales_order_detail'],
      });
      if (!loaded) {
        throw new Error(`Job no encontrado ${job.id}`);
      }

      await applyScenario(qr.manager, loaded, scenario, positions, positionIdx, fulfillment);
      if (scenario !== 'queue') {
        positionIdx += 1;
      }

      await qr.commitTransaction();
      created.push({ folio, scenario, jobId: job.id });
      console.log(`${folio} → ${scenario}`);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  console.log('\nListo. 15 OV en Mesa de Control (Verduleria / TIJ-1)\n');
  console.log('Admin tablero: rrv@gmail.com / 123  (sin almacén → vista admin)');
  console.log(`Jefe Almacén Frío: jefe.frio@verduleria.com / ${PASSWORD}`);
  console.log(`Jefe Bodega Seca:  jefe.seca@verduleria.com / ${PASSWORD}`);
  console.log(`Usuarios: ${jefeFrio.email}, ${jefeSeca.email}`);
  console.log(created.map((c) => `${c.folio} ${c.scenario}`).join('\n'));

  await AppDataSource.destroy();
}

async function applyScenario(
  manager: any,
  job: ControlDeskJob,
  scenario: Scenario,
  positions: Array<{ id: string; code: string }>,
  positionIdx: number,
  fulfillment: SalesOrderFulfillmentService,
) {
  const assignPos = async () => {
    const pos = positions[positionIdx % positions.length];
    await manager.update(ControlDeskJob, { id: job.id }, { position_id: pos.id });
  };

  if (scenario === 'queue') {
    return;
  }

  if (scenario === 'released_position') {
    await assignPos();
    return;
  }

  const tasks: ControlDeskPickTask[] = job.tasks ?? [];
  const dryTask = tasks.find((t) => t.warehouse_id !== COLD_WH_ID) ?? tasks[0];
  const coldTask = tasks.find((t) => t.warehouse_id === COLD_WH_ID) ?? tasks[1] ?? tasks[0];

  if (scenario === 'picking') {
    await assignPos();
    await manager.update(
      ControlDeskPickTask,
      { id: dryTask.id },
      {
        status: 'in_progress',
        started_at: new Date(),
        started_by: ADMIN_ID,
      },
    );
    await manager.update(ControlDeskJob, { id: job.id }, { status: 'picking' });
    return;
  }

  const completeTask = async (task: ControlDeskPickTask, short = false) => {
    for (const line of task.lines ?? []) {
      const requested = parseFloat(line.quantity_base_requested.toString());
      const picked = short ? Math.max(requested - 2, 1) : requested;
      const detail = await manager.findOne(SalesOrderDetail, {
        where: { id: line.sales_order_detail_id },
      });
      if (detail && picked > 0) {
        await fulfillment.allocateFifo(
          detail,
          ADMIN_ID,
          manager,
          { warehouseId: task.warehouse_id },
          picked,
        );
      }
      await manager.update(
        ControlDeskPickLine,
        { id: line.id },
        {
          quantity_base_picked: picked,
          status: short && picked < requested ? 'short' : 'picked',
        },
      );
    }
    await manager.update(
      ControlDeskPickTask,
      { id: task.id },
      {
        status: short ? 'short' : 'picked',
        started_at: new Date(),
        started_by: ADMIN_ID,
        completed_at: new Date(),
        completed_by: ADMIN_ID,
      },
    );
  };

  if (scenario === 'shortage') {
    await assignPos();
    await completeTask(dryTask, false);
    await completeTask(coldTask, true);
    await manager.update(
      ControlDeskJob,
      { id: job.id },
      { status: 'waiting_assembly', has_shortage: true },
    );
    return;
  }

  await completeTask(dryTask, false);
  await completeTask(coldTask, false);
  await assignPos();

  if (scenario === 'waiting') {
    await manager.update(ControlDeskJob, { id: job.id }, { status: 'waiting_assembly' });
    return;
  }
  if (scenario === 'assembling') {
    await manager.update(ControlDeskJob, { id: job.id }, { status: 'assembling' });
    return;
  }
  if (scenario === 'assembled') {
    await manager.update(ControlDeskJob, { id: job.id }, { status: 'assembled' });
  }
}

async function ensureJefeRole(): Promise<string> {
  const existing = await AppDataSource.query(
    `SELECT id FROM rbac_roles WHERE tenant_id = ? AND name = 'Jefe de almacén' LIMIT 1`,
    [TENANT_ID],
  );
  let roleId = existing[0]?.id;
  if (!roleId) {
    roleId = uuidv4();
    await AppDataSource.query(
      `INSERT INTO rbac_roles (id, name, description, is_system_role, is_admin, tenant_id, created_at, updated_at)
       VALUES (?, 'Jefe de almacén', 'Picking de su almacén en Mesa de Control', 0, 0, ?, NOW(), NOW())`,
      [roleId, TENANT_ID],
    );
  }

  await AppDataSource.query(
    `INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
     SELECT UUID(), ?, p.id, NOW()
     FROM rbac_permissions p
     JOIN modules m ON m.id = p.module_id
     WHERE m.code = 'warehouse_control' AND p.action IN ('ViewMenu', 'Read', 'Update')
       AND NOT EXISTS (
         SELECT 1 FROM rbac_role_permissions rp
         WHERE rp.role_id = ? AND rp.permission_id = p.id
       )`,
    [roleId, roleId],
  );
  return roleId;
}

async function ensureJefeUser(
  email: string,
  firstName: string,
  lastName: string,
  warehouseId: string,
  roleId: string,
) {
  const status = await AppDataSource.query(
    `SELECT id FROM user_status WHERE code = 'active' LIMIT 1`,
  );
  let user = await AppDataSource.query(`SELECT id, email FROM users WHERE email = ? LIMIT 1`, [
    email,
  ]);
  let userId: string;
  if (user[0]) {
    userId = user[0].id;
    await AppDataSource.query(
      `UPDATE users SET billing_branch_id = ?, tenant_id = ? WHERE id = ?`,
      [BRANCH_ID, TENANT_ID, userId],
    );
  } else {
    userId = uuidv4();
    const hash = await bcrypt.hash(PASSWORD, 10);
    await AppDataSource.query(
      `INSERT INTO users
        (id, tenant_id, email, password, first_name, last_name, status_id, language_code,
         billing_branch_id, permissions_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'es', ?, 1, NOW(), NOW())`,
      [userId, TENANT_ID, email, hash, firstName, lastName, status[0].id, BRANCH_ID],
    );
  }

  await AppDataSource.query(
    `INSERT IGNORE INTO rbac_user_roles (id, user_id, role_id, tenant_id, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [uuidv4(), userId, roleId, TENANT_ID],
  );
  await AppDataSource.query(
    `DELETE FROM user_warehouse_assignments WHERE tenant_id = ? AND user_id = ?`,
    [TENANT_ID, userId],
  );
  await AppDataSource.query(
    `INSERT INTO user_warehouse_assignments (id, tenant_id, user_id, warehouse_id, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [uuidv4(), TENANT_ID, userId, warehouseId],
  );
  await AppDataSource.query(
    `UPDATE users SET permissions_version = permissions_version + 1 WHERE id = ?`,
    [userId],
  );
  return { id: userId, email };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
