import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../entities/sales-orders/sales-order-detail.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { ControlDeskJob } from '../../entities/control-desk/control-desk-job.entity';
import { ControlDeskPickTask } from '../../entities/control-desk/control-desk-pick-task.entity';
import { ControlDeskPickLine } from '../../entities/control-desk/control-desk-pick-line.entity';
import { ControlDeskPosition } from '../../entities/control-desk/control-desk-position.entity';
import { UserWarehouseAssignment } from '../../entities/control-desk/user-warehouse-assignment.entity';
import { CONTROL_DESK_TERMINAL_TASK_STATUSES } from '../../entities/control-desk/control-desk.constants';
import { SalesOrderFulfillmentService } from '../sales-orders/services/sales-order-fulfillment.service';
import { ControlDeskLifecycleService } from './control-desk-lifecycle.service';
import { QueryControlDeskBoardDto } from './dto/query-control-desk-board.dto';
import { AssignPositionDto } from './dto/assign-position.dto';
import { CompletePickTaskDto } from './dto/complete-pick-task.dto';
import { CorroborateSalesOrderDto } from './dto/corroborate-sales-order.dto';
import { CreateControlDeskPositionDto } from './dto/create-control-desk-position.dto';
import { UpdateControlDeskPositionDto } from './dto/update-control-desk-position.dto';
import { QueryControlDeskPositionsDto } from './dto/query-control-desk-positions.dto';
import {
  formatCustomerDisplayName,
  mapPosUser,
} from '../pos-shifts/mappers/pos-sale-collection.mapper';

type Actor = {
  userId: string;
  hasAdminRole: boolean;
};

@Injectable()
export class WarehouseControlService {
  private readonly logger = new Logger(WarehouseControlService.name);

  constructor(
    @InjectRepository(SalesOrder)
    private readonly soRepo: Repository<SalesOrder>,
    @InjectRepository(ControlDeskJob)
    private readonly jobRepo: Repository<ControlDeskJob>,
    @InjectRepository(ControlDeskPickTask)
    private readonly taskRepo: Repository<ControlDeskPickTask>,
    @InjectRepository(ControlDeskPosition)
    private readonly positionRepo: Repository<ControlDeskPosition>,
    @InjectRepository(UserWarehouseAssignment)
    private readonly assignmentRepo: Repository<UserWarehouseAssignment>,
    @InjectRepository(BillingBranch)
    private readonly branchRepo: Repository<BillingBranch>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
    private readonly fulfillmentService: SalesOrderFulfillmentService,
    private readonly lifecycle: ControlDeskLifecycleService,
    private readonly dataSource: DataSource,
  ) {}

  async getBoard(
    tenantId: string,
    actor: Actor,
    filters: QueryControlDeskBoardDto,
  ) {
    await this.ensureJobsForOpenOrders(tenantId, actor.userId);

    const scope = await this.resolveScope(tenantId, actor, filters);
    const { search, status, page = 1, limit = 50 } = filters;

    const qb = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.sales_order', 'so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('job.billing_branch', 'billing_branch')
      .leftJoinAndSelect('job.position', 'position')
      .leftJoinAndSelect('job.tasks', 'task')
      .leftJoinAndSelect('task.warehouse', 'warehouse')
      .leftJoinAndSelect('task.lines', 'line')
      .leftJoinAndSelect('line.sales_order_detail', 'detail')
      .leftJoinAndSelect('detail.product', 'product')
      .leftJoinAndSelect('detail.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .where('job.tenant_id = :tenantId', { tenantId })
      .andWhere('job.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('so.general_status = :enSeleccion', { enSeleccion: 'En Selección' });

    if (scope.billingBranchId) {
      qb.andWhere('job.billing_branch_id = :billingBranchId', {
        billingBranchId: scope.billingBranchId,
      });
    }

    if (scope.warehouseIds?.length) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM control_desk_pick_tasks scoped
          WHERE scoped.job_id = job.id
            AND scoped.warehouse_id IN (:...warehouseIds)
            AND scoped.status != 'cancelled'
        )`,
        { warehouseIds: scope.warehouseIds },
      );
    }

    if (status) {
      qb.andWhere('job.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        `(so.folio LIKE :s
          OR customer.name LIKE :s
          OR customer.lastname LIKE :s
          OR CONCAT(customer.name, ' ', COALESCE(customer.lastname, '')) LIKE :s)`,
        { s: `%${search}%` },
      );
    }

    qb.orderBy('so.created_at', 'ASC');

    const jobs = await qb.getMany();
    const mappedJobs = jobs.map((job) => this.mapJob(job, scope.warehouseIds));
    const queue = mappedJobs.filter((job) => !job.position);
    const paged = mappedJobs.slice((page - 1) * limit, page * limit);

    const [stats, positions] = await Promise.all([
      this.buildStats(tenantId, scope),
      scope.billingBranchId
        ? this.listPositionsInternal(tenantId, scope.billingBranchId, mappedJobs)
        : [],
    ]);

    return {
      view: scope.view,
      scope_label: scope.scopeLabel,
      assigned_warehouses: scope.assignedWarehouses,
      billing_branches: scope.billingBranches,
      billing_branch_id: scope.billingBranchId,
      stats,
      positions,
      queue,
      jobs: paged,
      total: mappedJobs.length,
      page,
      limit,
      totalPages: Math.ceil(mappedJobs.length / limit) || 0,
    };
  }

  async getStats(tenantId: string, actor: Actor, filters: QueryControlDeskBoardDto) {
    await this.ensureJobsForOpenOrders(tenantId, actor.userId);
    const scope = await this.resolveScope(tenantId, actor, filters);
    return {
      view: scope.view,
      scope_label: scope.scopeLabel,
      assigned_warehouses: scope.assignedWarehouses,
      billing_branches: scope.billingBranches,
      billing_branch_id: scope.billingBranchId,
      stats: await this.buildStats(tenantId, scope),
    };
  }

  async findOneJob(id: string, tenantId: string, actor: Actor) {
    const job = await this.loadJobOrFail(id, tenantId);
    const assignments = await this.getAssignedWarehouses(tenantId, actor.userId);
    if (assignments.length && !actor.hasAdminRole) {
      const allowed = new Set(assignments.map((w) => w.id));
      const visible = (job.tasks ?? []).some((task) => allowed.has(task.warehouse_id));
      if (!visible) {
        throw new ForbiddenException(
          'No tienes acceso a este pedido en Mesa de Control',
        );
      }
      return this.mapJob(job, [...allowed]);
    }
    return this.mapJob(job);
  }

  async assignPosition(
    jobId: string,
    dto: AssignPositionDto,
    tenantId: string,
    actor: Actor,
  ) {
    this.assertAdminOrUnscoped(actor, await this.getAssignedWarehouses(tenantId, actor.userId));

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const job = await this.loadJobOrFail(jobId, tenantId, qr.manager);
      if (job.status === 'cancelled') {
        throw new BadRequestException('El pedido de Mesa de Control está cancelado');
      }

      const position = dto.position_id
        ? await this.requirePosition(qr.manager, tenantId, dto.position_id, job.billing_branch_id)
        : await this.nextFreePosition(qr.manager, tenantId, job.billing_branch_id, job.id);

      if (!position) {
        throw new BadRequestException(
          'No hay posiciones libres en esta sucursal',
        );
      }

      const occupant = await qr.manager.findOne(ControlDeskJob, {
        where: { position_id: position.id },
      });
      if (occupant && occupant.id !== job.id) {
        if (occupant.status === 'cancelled') {
          await qr.manager.update(
            ControlDeskJob,
            { id: occupant.id },
            { position_id: null },
          );
        } else {
          throw new BadRequestException(
            `La posición ${position.code} ya está ocupada`,
          );
        }
      }

      await qr.manager.update(
        ControlDeskJob,
        { id: job.id },
        { position_id: position.id, updated_by: actor.userId },
      );
      await qr.commitTransaction();
      return this.findOneJob(job.id, tenantId, actor);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async startTask(
    jobId: string,
    taskId: string,
    tenantId: string,
    actor: Actor,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const job = await this.loadJobOrFail(jobId, tenantId, qr.manager);
      const task = this.requireTask(job, taskId);
      await this.assertCanActOnWarehouse(tenantId, actor, task.warehouse_id);

      if (task.status !== 'pending' && task.status !== 'in_progress') {
        throw new BadRequestException(
          `La tarea del almacén ya está en estado ${task.status}`,
        );
      }

      if (task.status === 'pending') {
        await qr.manager.update(
          ControlDeskPickTask,
          { id: task.id },
          {
            status: 'in_progress',
            started_at: new Date(),
            started_by: actor.userId,
          },
        );
      }

      await this.lifecycle.refreshJobProgress(qr.manager, job.id, actor.userId);
      await qr.commitTransaction();
      return this.findOneJob(job.id, tenantId, actor);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async completeTask(
    jobId: string,
    taskId: string,
    dto: CompletePickTaskDto,
    tenantId: string,
    actor: Actor,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const job = await this.loadJobOrFail(jobId, tenantId, qr.manager);
      const task = this.requireTask(job, taskId);
      await this.assertCanActOnWarehouse(tenantId, actor, task.warehouse_id);

      if (CONTROL_DESK_TERMINAL_TASK_STATUSES.includes(task.status)) {
        throw new BadRequestException('Esta tarea de almacén ya fue cerrada');
      }
      if (task.status === 'cancelled') {
        throw new BadRequestException('La tarea está cancelada');
      }

      const pickedById = new Map(
        (dto.lines ?? []).map((line) => [line.id, line.quantity_base_picked]),
      );
      if (dto.lines?.length) {
        const taskLineIds = new Set((task.lines ?? []).map((line) => line.id));
        for (const line of dto.lines) {
          if (!taskLineIds.has(line.id)) {
            throw new BadRequestException('Hay líneas que no pertenecen a esta tarea');
          }
        }
      }

      let hasShort = false;
      for (const line of task.lines ?? []) {
        const requested = parseFloat(line.quantity_base_requested.toString());
        const picked = dto.lines?.length
          ? pickedById.has(line.id)
            ? Number(pickedById.get(line.id))
            : requested
          : requested;
        if (picked > requested + 0.0005) {
          throw new BadRequestException(
            'La cantidad surtida no puede ser mayor a la solicitada',
          );
        }

        const detail = await qr.manager.findOne(SalesOrderDetail, {
          where: { id: line.sales_order_detail_id },
        });
        if (!detail) {
          throw new NotFoundException('Línea de orden no encontrada');
        }

        if (picked > 0) {
          await this.fulfillmentService.allocateFifo(
            detail,
            actor.userId,
            qr.manager,
            { warehouseId: task.warehouse_id },
            picked,
          );
        }

        const short = picked + 0.0005 < requested;
        if (short) {
          hasShort = true;
        }
        await qr.manager.update(
          ControlDeskPickLine,
          { id: line.id },
          {
            quantity_base_picked: parseFloat(picked.toFixed(3)),
            status: short ? 'short' : 'picked',
          },
        );
      }

      await qr.manager.update(
        ControlDeskPickTask,
        { id: task.id },
        {
          status: hasShort ? 'short' : 'picked',
          completed_at: new Date(),
          completed_by: actor.userId,
          started_at: task.started_at ?? new Date(),
          started_by: task.started_by ?? actor.userId,
        },
      );

      await this.lifecycle.refreshJobProgress(qr.manager, job.id, actor.userId);
      await qr.commitTransaction();
      this.logger.log(
        `Tarea ${task.id} cerrada (${hasShort ? 'short' : 'picked'}) por ${actor.userId}`,
      );
      return this.findOneJob(job.id, tenantId, actor);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async assemble(jobId: string, tenantId: string, actor: Actor) {
    this.assertAdminOrUnscoped(
      actor,
      await this.getAssignedWarehouses(tenantId, actor.userId),
    );

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const job = await this.loadJobOrFail(jobId, tenantId, qr.manager);
      this.assertTasksTerminal(job);

      const positionCount = await qr.manager.count(ControlDeskPosition, {
        where: {
          tenant_id: tenantId,
          billing_branch_id: job.billing_branch_id,
          is_active: true,
        },
      });
      if (positionCount > 0 && !job.position_id) {
        throw new BadRequestException(
          'Asigna una posición de piso antes de marcar armando',
        );
      }

      const nextStatus =
        job.status === 'assembling' || job.status === 'assembled'
          ? 'assembled'
          : 'assembling';

      await qr.manager.update(
        ControlDeskJob,
        { id: job.id },
        { status: nextStatus, updated_by: actor.userId },
      );
      await qr.commitTransaction();
      return this.findOneJob(job.id, tenantId, actor);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async corroborate(
    jobId: string,
    dto: CorroborateSalesOrderDto,
    tenantId: string,
    actor: Actor,
  ) {
    this.assertAdminOrUnscoped(
      actor,
      await this.getAssignedWarehouses(tenantId, actor.userId),
    );

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const job = await this.loadJobOrFail(jobId, tenantId, qr.manager);
      this.assertTasksTerminal(job);

      const so = job.sales_order;
      if (!so || so.general_status !== 'En Selección') {
        throw new BadRequestException(
          `La orden no está pendiente de corroboración (estado: ${so?.general_status ?? '—'})`,
        );
      }

      const positionCount = await qr.manager.count(ControlDeskPosition, {
        where: {
          tenant_id: tenantId,
          billing_branch_id: job.billing_branch_id,
          is_active: true,
        },
      });
      const assemblyReady =
        job.status === 'assembling' ||
        job.status === 'assembled' ||
        job.status === 'waiting_assembly';
      if (positionCount > 0 && job.status === 'waiting_assembly') {
        throw new BadRequestException(
          'Marca la orden como armando en su posición antes de corroborar',
        );
      }
      if (!assemblyReady) {
        throw new BadRequestException(
          'La orden todavía tiene almacenes pendientes de surtir',
        );
      }

      await qr.manager.update(
        ControlDeskJob,
        { id: job.id },
        {
          status: 'assembled',
          position_id: null,
          updated_by: actor.userId,
        },
      );
      await qr.manager.update(
        SalesOrder,
        { id: so.id, tenant_id: tenantId },
        {
          general_status: 'Lista para entrega',
          corroborated_by: actor.userId,
          corroborated_at: new Date(),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          updated_by: actor.userId,
        },
      );

      await qr.commitTransaction();
      this.logger.log(
        `OV ${so.folio} corroborada en Mesa de Control por ${actor.userId}`,
      );
      return this.findOneJob(job.id, tenantId, actor);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async listPositions(tenantId: string, query: QueryControlDeskPositionsDto) {
    const positions = await this.positionRepo.find({
      where: {
        tenant_id: tenantId,
        billing_branch_id: query.billing_branch_id,
        ...(query.include_inactive ? {} : { is_active: true }),
      },
      order: { sort_order: 'ASC', row: 'ASC', col: 'ASC', code: 'ASC' },
    });
    const jobs = await this.jobRepo.find({
      where: {
        tenant_id: tenantId,
        billing_branch_id: query.billing_branch_id,
      },
      relations: ['sales_order', 'sales_order.customer', 'tasks', 'tasks.warehouse'],
    });
    const mappedJobs = jobs
      .filter((job) => job.status !== 'cancelled')
      .map((job) => this.mapJob(job));
    return this.listPositionsInternal(
      tenantId,
      query.billing_branch_id,
      mappedJobs,
      positions,
    );
  }

  async createPosition(tenantId: string, dto: CreateControlDeskPositionDto) {
    await this.assertBranch(tenantId, dto.billing_branch_id);
    const exists = await this.positionRepo.findOne({
      where: {
        tenant_id: tenantId,
        billing_branch_id: dto.billing_branch_id,
        code: dto.code.trim(),
      },
    });
    if (exists) {
      throw new BadRequestException(
        `Ya existe la posición ${dto.code} en esta sucursal`,
      );
    }

    const position = this.positionRepo.create({
      id: uuidv4(),
      tenant_id: tenantId,
      billing_branch_id: dto.billing_branch_id,
      code: dto.code.trim(),
      name: dto.name?.trim() || null,
      row: dto.row ?? 0,
      col: dto.col ?? 0,
      sort_order: dto.sort_order ?? 0,
      is_active: dto.is_active ?? true,
    });
    return this.positionRepo.save(position);
  }

  async updatePosition(
    id: string,
    tenantId: string,
    dto: UpdateControlDeskPositionDto,
  ) {
    const position = await this.positionRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!position) {
      throw new NotFoundException('Posición no encontrada');
    }
    if (dto.code && dto.code.trim() !== position.code) {
      const exists = await this.positionRepo.findOne({
        where: {
          tenant_id: tenantId,
          billing_branch_id: position.billing_branch_id,
          code: dto.code.trim(),
        },
      });
      if (exists) {
        throw new BadRequestException(
          `Ya existe la posición ${dto.code} en esta sucursal`,
        );
      }
      position.code = dto.code.trim();
    }
    if (dto.name !== undefined) {
      position.name = dto.name?.trim() || null;
    }
    if (dto.row !== undefined) {
      position.row = dto.row;
    }
    if (dto.col !== undefined) {
      position.col = dto.col;
    }
    if (dto.sort_order !== undefined) {
      position.sort_order = dto.sort_order;
    }
    if (dto.is_active !== undefined) {
      position.is_active = dto.is_active;
    }
    return this.positionRepo.save(position);
  }

  async deletePosition(id: string, tenantId: string) {
    const position = await this.positionRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!position) {
      throw new NotFoundException('Posición no encontrada');
    }
    const occupant = await this.jobRepo.findOne({
      where: { position_id: id },
    });
    if (occupant && occupant.status !== 'cancelled') {
      throw new BadRequestException(
        'No se puede eliminar una posición ocupada',
      );
    }
    if (occupant) {
      await this.jobRepo.update({ id: occupant.id }, { position_id: null });
    }
    await this.positionRepo.remove(position);
    return { id, deleted: true };
  }

  async getSalesOrderSummary(salesOrderId: string, tenantId: string) {
    const job = await this.jobRepo.findOne({
      where: { tenant_id: tenantId, sales_order_id: salesOrderId },
      relations: [
        'position',
        'tasks',
        'tasks.warehouse',
        'tasks.lines',
        'tasks.lines.sales_order_detail',
        'tasks.lines.sales_order_detail.product',
        'tasks.lines.sales_order_detail.product_uom',
        'tasks.lines.sales_order_detail.product_uom.uom',
      ],
    });
    if (!job || job.status === 'cancelled') {
      return null;
    }
    return this.mapJob(job);
  }

  private async ensureJobsForOpenOrders(tenantId: string, userId: string) {
    const orphans = await this.soRepo
      .createQueryBuilder('so')
      .leftJoin(
        ControlDeskJob,
        'job',
        'job.sales_order_id = so.id AND job.status != :cancelled',
        { cancelled: 'cancelled' },
      )
      .leftJoinAndSelect('so.line_items', 'line_items')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.general_status = :status', { status: 'En Selección' })
      .andWhere('so.requires_selection_assembly = 1')
      .andWhere('job.id IS NULL')
      .getMany();

    for (const so of orphans) {
      const qr = this.dataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        await this.lifecycle.syncJobForSalesOrder(qr.manager, {
          tenantId,
          userId,
          salesOrder: so,
          details: so.line_items ?? [],
          requiresSelection: true,
        });
        await qr.commitTransaction();
      } catch (err) {
        await qr.rollbackTransaction();
        this.logger.warn(
          `No se pudo crear job para OV ${so.folio}: ${(err as Error).message}`,
        );
      } finally {
        await qr.release();
      }
    }
  }

  private async resolveScope(
    tenantId: string,
    actor: Actor,
    filters: QueryControlDeskBoardDto,
  ) {
    const assignedWarehouses = await this.getAssignedWarehouses(
      tenantId,
      actor.userId,
    );
    const isWarehouseUser = assignedWarehouses.length > 0 && !actor.hasAdminRole;
    const view =
      filters.view === 'warehouse' && assignedWarehouses.length
        ? 'warehouse'
        : isWarehouseUser
          ? 'warehouse'
          : 'admin';

    let warehouseIds: string[] | null = null;
    if (view === 'warehouse') {
      warehouseIds = assignedWarehouses.map((w) => w.id);
      if (filters.warehouse_id) {
        if (!warehouseIds.includes(filters.warehouse_id)) {
          throw new ForbiddenException(
            'No puedes consultar un almacén que no tienes asignado',
          );
        }
        warehouseIds = [filters.warehouse_id];
      }
    } else if (filters.warehouse_id) {
      warehouseIds = [filters.warehouse_id];
    }

    const billingBranches = this.uniqueBranches(assignedWarehouses);
    const allowedBranchIds = new Set(billingBranches.map((b) => b.id));
    let billingBranchId = filters.billing_branch_id ?? null;
    if (view === 'warehouse') {
      if (billingBranchId && !allowedBranchIds.has(billingBranchId)) {
        throw new ForbiddenException(
          'No puedes consultar una sucursal fuera de tus almacenes',
        );
      }
      if (!billingBranchId && billingBranches.length === 1) {
        billingBranchId = billingBranches[0].id;
      }
    }

    const warehouseNames = assignedWarehouses.map((w) => w.name).filter(Boolean);
    const scopeLabel =
      view === 'warehouse'
        ? warehouseNames.join(' · ') || null
        : null;

    return {
      view,
      billingBranchId,
      billingBranches: view === 'warehouse' ? billingBranches : [],
      warehouseIds,
      assignedWarehouses,
      scopeLabel,
    };
  }

  private uniqueBranches(
    assignedWarehouses: Array<{
      billing_branch: { id: string; code: string; display_name: string } | null;
    }>,
  ) {
    const map = new Map<
      string,
      { id: string; code: string; display_name: string }
    >();
    for (const warehouse of assignedWarehouses) {
      const branch = warehouse.billing_branch;
      if (branch?.id && !map.has(branch.id)) {
        map.set(branch.id, branch);
      }
    }
    return [...map.values()];
  }

  private formatBranch(branch?: BillingBranch | null) {
    if (!branch) {
      return null;
    }
    return {
      id: branch.id,
      code: branch.code,
      display_name: [branch.code, branch.city].filter(Boolean).join(' — '),
    };
  }

  private async getAssignedWarehouses(tenantId: string, userId: string) {
    const rows = await this.assignmentRepo.find({
      where: { tenant_id: tenantId, user_id: userId },
      relations: ['warehouse', 'warehouse.billing_branch'],
    });
    return rows
      .filter((row) => row.warehouse)
      .map((row) => ({
        id: row.warehouse.id,
        name: row.warehouse.name,
        code: row.warehouse.code,
        billing_branch_id: row.warehouse.billing_branch_id,
        billing_branch: this.formatBranch(row.warehouse.billing_branch),
      }));
  }

  private async buildStats(
    tenantId: string,
    scope: {
      billingBranchId: string | null;
      warehouseIds: string[] | null;
    },
  ) {
    const empty = {
      in_desk: 0,
      released: 0,
      picking: 0,
      waiting_assembly: 0,
      assembling: 0,
      assembled: 0,
      with_shortage: 0,
      positions_free: 0,
      positions_occupied: 0,
      warehouse: {
        pending: 0,
        in_progress: 0,
        picked_today: 0,
      },
    };

    const jobQb = this.jobRepo
      .createQueryBuilder('job')
      .innerJoin('job.sales_order', 'so')
      .where('job.tenant_id = :tenantId', { tenantId })
      .andWhere('job.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('so.general_status = :enSeleccion', { enSeleccion: 'En Selección' });
    if (scope.billingBranchId) {
      jobQb.andWhere('job.billing_branch_id = :billingBranchId', {
        billingBranchId: scope.billingBranchId,
      });
    }
    if (scope.warehouseIds?.length) {
      jobQb.andWhere(
        `EXISTS (
          SELECT 1 FROM control_desk_pick_tasks scoped
          WHERE scoped.job_id = job.id
            AND scoped.warehouse_id IN (:...warehouseIds)
        )`,
        { warehouseIds: scope.warehouseIds },
      );
    }

    const jobs = await jobQb.getMany();
    const stats = { ...empty, warehouse: { ...empty.warehouse } };
    stats.in_desk = jobs.length;
    for (const job of jobs) {
      if (job.status in stats) {
        (stats as any)[job.status] += 1;
      }
      if (job.has_shortage) {
        stats.with_shortage += 1;
      }
    }

    if (scope.billingBranchId) {
      const positions = await this.positionRepo.find({
        where: {
          tenant_id: tenantId,
          billing_branch_id: scope.billingBranchId,
          is_active: true,
        },
      });
      const occupiedIds = new Set(
        jobs.filter((job) => job.position_id).map((job) => job.position_id),
      );
      stats.positions_occupied = positions.filter((p) => occupiedIds.has(p.id)).length;
      stats.positions_free = Math.max(positions.length - stats.positions_occupied, 0);
    }

    const taskQb = this.taskRepo
      .createQueryBuilder('task')
      .innerJoin('task.job', 'job')
      .innerJoin('job.sales_order', 'so')
      .where('task.tenant_id = :tenantId', { tenantId })
      .andWhere('job.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('so.general_status = :enSeleccion', { enSeleccion: 'En Selección' });
    if (scope.billingBranchId) {
      taskQb.andWhere('job.billing_branch_id = :billingBranchId', {
        billingBranchId: scope.billingBranchId,
      });
    }
    if (scope.warehouseIds?.length) {
      taskQb.andWhere('task.warehouse_id IN (:...warehouseIds)', {
        warehouseIds: scope.warehouseIds,
      });
    }
    const tasks = await taskQb.getMany();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    stats.warehouse.pending = tasks.filter((t) => t.status === 'pending').length;
    stats.warehouse.in_progress = tasks.filter((t) => t.status === 'in_progress').length;
    stats.warehouse.picked_today = tasks.filter(
      (t) =>
        CONTROL_DESK_TERMINAL_TASK_STATUSES.includes(t.status) &&
        t.completed_at &&
        t.completed_at >= startOfDay,
    ).length;

    return stats;
  }

  private async listPositionsInternal(
    _tenantId: string,
    billingBranchId: string,
    jobs: ReturnType<WarehouseControlService['mapJob']>[],
    positions?: ControlDeskPosition[],
  ) {
    const catalog =
      positions ??
      (await this.positionRepo.find({
        where: {
          tenant_id: _tenantId,
          billing_branch_id: billingBranchId,
          is_active: true,
        },
        order: { sort_order: 'ASC', row: 'ASC', col: 'ASC', code: 'ASC' },
      }));
    const byPosition = new Map(jobs.filter((j) => j.position).map((j) => [j.position!.id, j]));
    return catalog.map((position) => ({
      id: position.id,
      code: position.code,
      name: position.name,
      row: position.row,
      col: position.col,
      sort_order: position.sort_order,
      is_active: Boolean(position.is_active),
      occupied: byPosition.has(position.id),
      job: byPosition.get(position.id) ?? null,
    }));
  }

  private mapJob(job: ControlDeskJob, warehouseScope?: string[] | null) {
    const so = job.sales_order;
    const tasks = (job.tasks ?? []).map((task) => this.mapTask(task));
    const terminal = tasks.filter((task) =>
      CONTROL_DESK_TERMINAL_TASK_STATUSES.includes(task.status as any),
    ).length;
    const missing = tasks.flatMap((task) =>
      task.lines
        .filter((line) => line.status === 'short' || line.quantity_base_missing > 0)
        .map((line) => ({
          warehouse_id: task.warehouse?.id ?? null,
          warehouse_name: task.warehouse?.name ?? null,
          product_name: line.product_name,
          product_sku: line.product_sku,
          quantity_base_missing: line.quantity_base_missing,
        })),
    );

    const customer = so?.customer ?? null;
    const customerName =
      customer?.name?.trim() ||
      formatCustomerDisplayName(customer) ||
      null;

    return {
      id: job.id,
      folio: so?.folio ?? null,
      customer_name: customerName,
      customer_display_name: customerName,
      expected_delivery_date: so?.expected_delivery_date ?? null,
      status: job.status,
      has_shortage: Boolean(job.has_shortage),
      created_at: job.created_at,
      sales_order: so
        ? {
            id: so.id,
            folio: so.folio,
            general_status: so.general_status,
            expected_delivery_date: so.expected_delivery_date,
            notes: so.notes,
            total: so.total,
            created_at: so.created_at,
            customer_display_name: customerName,
            customer: customer
              ? {
                  id: customer.id,
                  name: customer.name ?? null,
                  lastname: customer.lastname ?? null,
                  display_name: customerName,
                  phone: customer.phone ?? null,
                  company_name: customer.company_name ?? null,
                }
              : null,
          }
        : null,
      billing_branch: job.billing_branch
        ? {
            id: job.billing_branch.id,
            code: job.billing_branch.code,
            display_name: [job.billing_branch.code, job.billing_branch.city]
              .filter(Boolean)
              .join(' — '),
          }
        : null,
      position: job.position
        ? {
            id: job.position.id,
            code: job.position.code,
            name: job.position.name,
            row: job.position.row,
            col: job.position.col,
          }
        : null,
      progress: {
        warehouses_done: terminal,
        warehouses_total: tasks.length,
      },
      tasks,
      pick_tasks: warehouseScope?.length
        ? tasks.filter((task) => warehouseScope.includes(task.warehouse?.id ?? ''))
        : tasks,
      missing,
    };
  }

  private mapTask(task: ControlDeskPickTask) {
    const lines = (task.lines ?? []).map((line) => {
      const requested = this.toQty(line.quantity_base_requested);
      const picked = this.toQty(line.quantity_base_picked);
      const detail = line.sales_order_detail;
      const product = detail?.product;
      const uom = detail?.product_uom?.uom;
      const quantity = this.toSalesUomQty(requested, detail);
      const quantityPicked = this.toSalesUomQty(picked, detail);
      return {
        id: line.id,
        sales_order_detail_id: line.sales_order_detail_id,
        product_id: detail?.product_id ?? null,
        product_name: product?.name ?? null,
        product_sku: product?.sku ?? null,
        /** Cantidad pedida en UOM de la OV. Pintar "Pedido {quantity}". */
        quantity,
        quantity_picked: quantityPicked,
        uom_name: uom?.name ?? null,
        quantity_base_requested: requested,
        quantity_base_picked: picked,
        quantity_base_missing: Math.max(parseFloat((requested - picked).toFixed(3)), 0),
        status: line.status,
      };
    });

    return {
      id: task.id,
      status: task.status,
      warehouse: task.warehouse
        ? {
            id: task.warehouse.id,
            name: task.warehouse.name,
            code: task.warehouse.code,
          }
        : null,
      started_at: task.started_at,
      completed_at: task.completed_at,
      started_by_user: mapPosUser(task.starter),
      completed_by_user: mapPosUser(task.completer),
      lines_count: lines.length,
      quantity_requested_total: parseFloat(
        lines.reduce((sum, row) => sum + row.quantity, 0).toFixed(3),
      ),
      lines,
    };
  }

  private toQty(value: unknown): number {
    return parseFloat((value ?? 0).toString()) || 0;
  }

  /** Convierte qty en UOM base a la UOM de la línea de la OV. */
  private toSalesUomQty(
    quantityBase: number,
    detail?: { quantity?: unknown; quantity_base_uom?: unknown } | null,
  ): number {
    const detailQty = this.toQty(detail?.quantity);
    const detailBase = this.toQty(detail?.quantity_base_uom);
    if (detailBase > 0 && detailQty > 0) {
      return parseFloat(((quantityBase * detailQty) / detailBase).toFixed(3));
    }
    return quantityBase;
  }

  private async loadJobOrFail(id: string, tenantId: string, manager?: any) {
    const repo = manager ? manager.getRepository(ControlDeskJob) : this.jobRepo;
    const relations = [
      'sales_order',
      'sales_order.customer',
      'billing_branch',
      'position',
      'tasks',
      'tasks.warehouse',
      'tasks.starter',
      'tasks.completer',
      'tasks.lines',
      'tasks.lines.sales_order_detail',
      'tasks.lines.sales_order_detail.product',
      'tasks.lines.sales_order_detail.product_uom',
      'tasks.lines.sales_order_detail.product_uom.uom',
    ];
    let job = await repo.findOne({
      where: { id, tenant_id: tenantId },
      relations,
    });
    if (!job) {
      job = await repo.findOne({
        where: { sales_order_id: id, tenant_id: tenantId },
        relations,
      });
    }
    if (!job) {
      throw new NotFoundException('Pedido de Mesa de Control no encontrado');
    }
    return job;
  }

  private requireTask(job: ControlDeskJob, taskId: string) {
    const task = (job.tasks ?? []).find((row) => row.id === taskId);
    if (!task) {
      throw new NotFoundException('Tarea de almacén no encontrada');
    }
    return task;
  }

  private assertTasksTerminal(job: ControlDeskJob) {
    const active = (job.tasks ?? []).filter((task) => task.status !== 'cancelled');
    const pending = active.filter(
      (task) => !CONTROL_DESK_TERMINAL_TASK_STATUSES.includes(task.status),
    );
    if (pending.length) {
      const names = pending
        .map((task) => task.warehouse?.name ?? task.warehouse_id)
        .join(', ');
      throw new BadRequestException(
        `Faltan almacenes por surtir: ${names}`,
      );
    }
  }

  private async assertCanActOnWarehouse(
    tenantId: string,
    actor: Actor,
    warehouseId: string,
  ) {
    if (actor.hasAdminRole) {
      return;
    }
    const assigned = await this.getAssignedWarehouses(tenantId, actor.userId);
    if (!assigned.length) {
      return;
    }
    if (!assigned.some((w) => w.id === warehouseId)) {
      throw new ForbiddenException(
        'Solo puedes surtir el almacén que tienes asignado',
      );
    }
  }

  private assertAdminOrUnscoped(
    actor: Actor,
    assigned: Array<{ id: string }>,
  ) {
    if (actor.hasAdminRole || !assigned.length) {
      return;
    }
    throw new ForbiddenException(
      'Solo un supervisor de Mesa de Control puede armar o corroborar',
    );
  }

  private async requirePosition(
    manager: any,
    tenantId: string,
    positionId: string,
    billingBranchId: string,
  ) {
    const position = await manager.findOne(ControlDeskPosition, {
      where: { id: positionId, tenant_id: tenantId },
    });
    if (!position || !position.is_active) {
      throw new NotFoundException('Posición no encontrada');
    }
    if (position.billing_branch_id !== billingBranchId) {
      throw new BadRequestException(
        'La posición no pertenece a la sucursal de la orden',
      );
    }
    return position;
  }

  private async nextFreePosition(
    manager: any,
    tenantId: string,
    billingBranchId: string,
    jobId: string,
  ) {
    const positions = await manager.find(ControlDeskPosition, {
      where: { tenant_id: tenantId, billing_branch_id: billingBranchId, is_active: true },
      order: { sort_order: 'ASC', row: 'ASC', col: 'ASC', code: 'ASC' },
    });
    for (const position of positions) {
      const occupant = await manager.findOne(ControlDeskJob, {
        where: { position_id: position.id },
      });
      if (!occupant || occupant.id === jobId || occupant.status === 'cancelled') {
        return position;
      }
    }
    return null;
  }

  private async assertBranch(tenantId: string, billingBranchId: string) {
    const branch = await this.branchRepo
      .createQueryBuilder('branch')
      .innerJoin('branch.fiscal_configuration', 'fc')
      .where('branch.id = :billingBranchId', { billingBranchId })
      .andWhere('fc.tenant_id = :tenantId', { tenantId })
      .getOne();
    if (!branch) {
      throw new NotFoundException('La sucursal no existe o no pertenece a la organización');
    }
    return branch;
  }
}
