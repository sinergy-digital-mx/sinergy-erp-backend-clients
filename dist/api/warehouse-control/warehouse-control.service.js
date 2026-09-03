"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WarehouseControlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseControlService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const sales_order_detail_entity_1 = require("../../entities/sales-orders/sales-order-detail.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const control_desk_job_entity_1 = require("../../entities/control-desk/control-desk-job.entity");
const control_desk_pick_task_entity_1 = require("../../entities/control-desk/control-desk-pick-task.entity");
const control_desk_pick_line_entity_1 = require("../../entities/control-desk/control-desk-pick-line.entity");
const control_desk_position_entity_1 = require("../../entities/control-desk/control-desk-position.entity");
const user_warehouse_assignment_entity_1 = require("../../entities/control-desk/user-warehouse-assignment.entity");
const control_desk_constants_1 = require("../../entities/control-desk/control-desk.constants");
const sales_order_fulfillment_service_1 = require("../sales-orders/services/sales-order-fulfillment.service");
const control_desk_lifecycle_service_1 = require("./control-desk-lifecycle.service");
const pos_sale_collection_mapper_1 = require("../pos-shifts/mappers/pos-sale-collection.mapper");
let WarehouseControlService = WarehouseControlService_1 = class WarehouseControlService {
    soRepo;
    jobRepo;
    taskRepo;
    positionRepo;
    assignmentRepo;
    branchRepo;
    warehouseRepo;
    fulfillmentService;
    lifecycle;
    dataSource;
    logger = new common_1.Logger(WarehouseControlService_1.name);
    constructor(soRepo, jobRepo, taskRepo, positionRepo, assignmentRepo, branchRepo, warehouseRepo, fulfillmentService, lifecycle, dataSource) {
        this.soRepo = soRepo;
        this.jobRepo = jobRepo;
        this.taskRepo = taskRepo;
        this.positionRepo = positionRepo;
        this.assignmentRepo = assignmentRepo;
        this.branchRepo = branchRepo;
        this.warehouseRepo = warehouseRepo;
        this.fulfillmentService = fulfillmentService;
        this.lifecycle = lifecycle;
        this.dataSource = dataSource;
    }
    async getBoard(tenantId, actor, filters) {
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
            qb.andWhere(`EXISTS (
          SELECT 1 FROM control_desk_pick_tasks scoped
          WHERE scoped.job_id = job.id
            AND scoped.warehouse_id IN (:...warehouseIds)
            AND scoped.status != 'cancelled'
        )`, { warehouseIds: scope.warehouseIds });
        }
        if (status) {
            qb.andWhere('job.status = :status', { status });
        }
        if (search) {
            qb.andWhere(`(so.folio LIKE :s
          OR customer.name LIKE :s
          OR customer.lastname LIKE :s
          OR CONCAT(customer.name, ' ', COALESCE(customer.lastname, '')) LIKE :s)`, { s: `%${search}%` });
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
    async getStats(tenantId, actor, filters) {
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
    async findOneJob(id, tenantId, actor) {
        const job = await this.loadJobOrFail(id, tenantId);
        const assignments = await this.getAssignedWarehouses(tenantId, actor.userId);
        if (assignments.length && !actor.hasAdminRole) {
            const allowed = new Set(assignments.map((w) => w.id));
            const visible = (job.tasks ?? []).some((task) => allowed.has(task.warehouse_id));
            if (!visible) {
                throw new common_1.ForbiddenException('No tienes acceso a este pedido en Mesa de Control');
            }
            return this.mapJob(job, [...allowed]);
        }
        return this.mapJob(job);
    }
    async assignPosition(jobId, dto, tenantId, actor) {
        this.assertAdminOrUnscoped(actor, await this.getAssignedWarehouses(tenantId, actor.userId));
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const job = await this.loadJobOrFail(jobId, tenantId, qr.manager);
            if (job.status === 'cancelled') {
                throw new common_1.BadRequestException('El pedido de Mesa de Control está cancelado');
            }
            const position = dto.position_id
                ? await this.requirePosition(qr.manager, tenantId, dto.position_id, job.billing_branch_id)
                : await this.nextFreePosition(qr.manager, tenantId, job.billing_branch_id, job.id);
            if (!position) {
                throw new common_1.BadRequestException('No hay posiciones libres en esta sucursal');
            }
            const occupant = await qr.manager.findOne(control_desk_job_entity_1.ControlDeskJob, {
                where: { position_id: position.id },
            });
            if (occupant && occupant.id !== job.id) {
                if (occupant.status === 'cancelled') {
                    await qr.manager.update(control_desk_job_entity_1.ControlDeskJob, { id: occupant.id }, { position_id: null });
                }
                else {
                    throw new common_1.BadRequestException(`La posición ${position.code} ya está ocupada`);
                }
            }
            await qr.manager.update(control_desk_job_entity_1.ControlDeskJob, { id: job.id }, { position_id: position.id, updated_by: actor.userId });
            await qr.commitTransaction();
            return this.findOneJob(job.id, tenantId, actor);
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async startTask(jobId, taskId, tenantId, actor) {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const job = await this.loadJobOrFail(jobId, tenantId, qr.manager);
            const task = this.requireTask(job, taskId);
            await this.assertCanActOnWarehouse(tenantId, actor, task.warehouse_id);
            if (task.status !== 'pending' && task.status !== 'in_progress') {
                throw new common_1.BadRequestException(`La tarea del almacén ya está en estado ${task.status}`);
            }
            if (task.status === 'pending') {
                await qr.manager.update(control_desk_pick_task_entity_1.ControlDeskPickTask, { id: task.id }, {
                    status: 'in_progress',
                    started_at: new Date(),
                    started_by: actor.userId,
                });
            }
            await this.lifecycle.refreshJobProgress(qr.manager, job.id, actor.userId);
            await qr.commitTransaction();
            return this.findOneJob(job.id, tenantId, actor);
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async completeTask(jobId, taskId, dto, tenantId, actor) {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const job = await this.loadJobOrFail(jobId, tenantId, qr.manager);
            const task = this.requireTask(job, taskId);
            await this.assertCanActOnWarehouse(tenantId, actor, task.warehouse_id);
            if (control_desk_constants_1.CONTROL_DESK_TERMINAL_TASK_STATUSES.includes(task.status)) {
                throw new common_1.BadRequestException('Esta tarea de almacén ya fue cerrada');
            }
            if (task.status === 'cancelled') {
                throw new common_1.BadRequestException('La tarea está cancelada');
            }
            const pickedById = new Map((dto.lines ?? []).map((line) => [line.id, line.quantity_base_picked]));
            if (dto.lines?.length) {
                const taskLineIds = new Set((task.lines ?? []).map((line) => line.id));
                for (const line of dto.lines) {
                    if (!taskLineIds.has(line.id)) {
                        throw new common_1.BadRequestException('Hay líneas que no pertenecen a esta tarea');
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
                    throw new common_1.BadRequestException('La cantidad surtida no puede ser mayor a la solicitada');
                }
                const detail = await qr.manager.findOne(sales_order_detail_entity_1.SalesOrderDetail, {
                    where: { id: line.sales_order_detail_id },
                });
                if (!detail) {
                    throw new common_1.NotFoundException('Línea de orden no encontrada');
                }
                if (picked > 0) {
                    await this.fulfillmentService.allocateFifo(detail, actor.userId, qr.manager, { warehouseId: task.warehouse_id }, picked);
                }
                const short = picked + 0.0005 < requested;
                if (short) {
                    hasShort = true;
                }
                await qr.manager.update(control_desk_pick_line_entity_1.ControlDeskPickLine, { id: line.id }, {
                    quantity_base_picked: parseFloat(picked.toFixed(3)),
                    status: short ? 'short' : 'picked',
                });
            }
            await qr.manager.update(control_desk_pick_task_entity_1.ControlDeskPickTask, { id: task.id }, {
                status: hasShort ? 'short' : 'picked',
                completed_at: new Date(),
                completed_by: actor.userId,
                started_at: task.started_at ?? new Date(),
                started_by: task.started_by ?? actor.userId,
            });
            await this.lifecycle.refreshJobProgress(qr.manager, job.id, actor.userId);
            await qr.commitTransaction();
            this.logger.log(`Tarea ${task.id} cerrada (${hasShort ? 'short' : 'picked'}) por ${actor.userId}`);
            return this.findOneJob(job.id, tenantId, actor);
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async assemble(jobId, tenantId, actor) {
        this.assertAdminOrUnscoped(actor, await this.getAssignedWarehouses(tenantId, actor.userId));
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const job = await this.loadJobOrFail(jobId, tenantId, qr.manager);
            this.assertTasksTerminal(job);
            const positionCount = await qr.manager.count(control_desk_position_entity_1.ControlDeskPosition, {
                where: {
                    tenant_id: tenantId,
                    billing_branch_id: job.billing_branch_id,
                    is_active: true,
                },
            });
            if (positionCount > 0 && !job.position_id) {
                throw new common_1.BadRequestException('Asigna una posición de piso antes de marcar armando');
            }
            const nextStatus = job.status === 'assembling' || job.status === 'assembled'
                ? 'assembled'
                : 'assembling';
            await qr.manager.update(control_desk_job_entity_1.ControlDeskJob, { id: job.id }, { status: nextStatus, updated_by: actor.userId });
            await qr.commitTransaction();
            return this.findOneJob(job.id, tenantId, actor);
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async corroborate(jobId, dto, tenantId, actor) {
        this.assertAdminOrUnscoped(actor, await this.getAssignedWarehouses(tenantId, actor.userId));
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const job = await this.loadJobOrFail(jobId, tenantId, qr.manager);
            this.assertTasksTerminal(job);
            const so = job.sales_order;
            if (!so || so.general_status !== 'En Selección') {
                throw new common_1.BadRequestException(`La orden no está pendiente de corroboración (estado: ${so?.general_status ?? '—'})`);
            }
            const positionCount = await qr.manager.count(control_desk_position_entity_1.ControlDeskPosition, {
                where: {
                    tenant_id: tenantId,
                    billing_branch_id: job.billing_branch_id,
                    is_active: true,
                },
            });
            const assemblyReady = job.status === 'assembling' ||
                job.status === 'assembled' ||
                job.status === 'waiting_assembly';
            if (positionCount > 0 && job.status === 'waiting_assembly') {
                throw new common_1.BadRequestException('Marca la orden como armando en su posición antes de corroborar');
            }
            if (!assemblyReady) {
                throw new common_1.BadRequestException('La orden todavía tiene almacenes pendientes de surtir');
            }
            await qr.manager.update(control_desk_job_entity_1.ControlDeskJob, { id: job.id }, {
                status: 'assembled',
                position_id: null,
                updated_by: actor.userId,
            });
            await qr.manager.update(sales_order_entity_1.SalesOrder, { id: so.id, tenant_id: tenantId }, {
                general_status: 'Lista para entrega',
                corroborated_by: actor.userId,
                corroborated_at: new Date(),
                ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
                updated_by: actor.userId,
            });
            await qr.commitTransaction();
            this.logger.log(`OV ${so.folio} corroborada en Mesa de Control por ${actor.userId}`);
            return this.findOneJob(job.id, tenantId, actor);
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async listPositions(tenantId, query) {
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
        return this.listPositionsInternal(tenantId, query.billing_branch_id, mappedJobs, positions);
    }
    async createPosition(tenantId, dto) {
        await this.assertBranch(tenantId, dto.billing_branch_id);
        const exists = await this.positionRepo.findOne({
            where: {
                tenant_id: tenantId,
                billing_branch_id: dto.billing_branch_id,
                code: dto.code.trim(),
            },
        });
        if (exists) {
            throw new common_1.BadRequestException(`Ya existe la posición ${dto.code} en esta sucursal`);
        }
        const position = this.positionRepo.create({
            id: (0, uuid_1.v4)(),
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
    async updatePosition(id, tenantId, dto) {
        const position = await this.positionRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!position) {
            throw new common_1.NotFoundException('Posición no encontrada');
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
                throw new common_1.BadRequestException(`Ya existe la posición ${dto.code} en esta sucursal`);
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
    async deletePosition(id, tenantId) {
        const position = await this.positionRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!position) {
            throw new common_1.NotFoundException('Posición no encontrada');
        }
        const occupant = await this.jobRepo.findOne({
            where: { position_id: id },
        });
        if (occupant && occupant.status !== 'cancelled') {
            throw new common_1.BadRequestException('No se puede eliminar una posición ocupada');
        }
        if (occupant) {
            await this.jobRepo.update({ id: occupant.id }, { position_id: null });
        }
        await this.positionRepo.remove(position);
        return { id, deleted: true };
    }
    async getSalesOrderSummary(salesOrderId, tenantId) {
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
    async ensureJobsForOpenOrders(tenantId, userId) {
        const orphans = await this.soRepo
            .createQueryBuilder('so')
            .leftJoin(control_desk_job_entity_1.ControlDeskJob, 'job', 'job.sales_order_id = so.id AND job.status != :cancelled', { cancelled: 'cancelled' })
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
            }
            catch (err) {
                await qr.rollbackTransaction();
                this.logger.warn(`No se pudo crear job para OV ${so.folio}: ${err.message}`);
            }
            finally {
                await qr.release();
            }
        }
    }
    async resolveScope(tenantId, actor, filters) {
        const assignedWarehouses = await this.getAssignedWarehouses(tenantId, actor.userId);
        const isWarehouseUser = assignedWarehouses.length > 0 && !actor.hasAdminRole;
        const view = filters.view === 'warehouse' && assignedWarehouses.length
            ? 'warehouse'
            : isWarehouseUser
                ? 'warehouse'
                : 'admin';
        let warehouseIds = null;
        if (view === 'warehouse') {
            warehouseIds = assignedWarehouses.map((w) => w.id);
            if (filters.warehouse_id) {
                if (!warehouseIds.includes(filters.warehouse_id)) {
                    throw new common_1.ForbiddenException('No puedes consultar un almacén que no tienes asignado');
                }
                warehouseIds = [filters.warehouse_id];
            }
        }
        else if (filters.warehouse_id) {
            warehouseIds = [filters.warehouse_id];
        }
        const billingBranches = this.uniqueBranches(assignedWarehouses);
        const allowedBranchIds = new Set(billingBranches.map((b) => b.id));
        let billingBranchId = filters.billing_branch_id ?? null;
        if (view === 'warehouse') {
            if (billingBranchId && !allowedBranchIds.has(billingBranchId)) {
                throw new common_1.ForbiddenException('No puedes consultar una sucursal fuera de tus almacenes');
            }
            if (!billingBranchId && billingBranches.length === 1) {
                billingBranchId = billingBranches[0].id;
            }
        }
        const warehouseNames = assignedWarehouses.map((w) => w.name).filter(Boolean);
        const scopeLabel = view === 'warehouse'
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
    uniqueBranches(assignedWarehouses) {
        const map = new Map();
        for (const warehouse of assignedWarehouses) {
            const branch = warehouse.billing_branch;
            if (branch?.id && !map.has(branch.id)) {
                map.set(branch.id, branch);
            }
        }
        return [...map.values()];
    }
    formatBranch(branch) {
        if (!branch) {
            return null;
        }
        return {
            id: branch.id,
            code: branch.code,
            display_name: [branch.code, branch.city].filter(Boolean).join(' — '),
        };
    }
    async getAssignedWarehouses(tenantId, userId) {
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
    async buildStats(tenantId, scope) {
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
            jobQb.andWhere(`EXISTS (
          SELECT 1 FROM control_desk_pick_tasks scoped
          WHERE scoped.job_id = job.id
            AND scoped.warehouse_id IN (:...warehouseIds)
        )`, { warehouseIds: scope.warehouseIds });
        }
        const jobs = await jobQb.getMany();
        const stats = { ...empty, warehouse: { ...empty.warehouse } };
        stats.in_desk = jobs.length;
        for (const job of jobs) {
            if (job.status in stats) {
                stats[job.status] += 1;
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
            const occupiedIds = new Set(jobs.filter((job) => job.position_id).map((job) => job.position_id));
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
        stats.warehouse.picked_today = tasks.filter((t) => control_desk_constants_1.CONTROL_DESK_TERMINAL_TASK_STATUSES.includes(t.status) &&
            t.completed_at &&
            t.completed_at >= startOfDay).length;
        return stats;
    }
    async listPositionsInternal(_tenantId, billingBranchId, jobs, positions) {
        const catalog = positions ??
            (await this.positionRepo.find({
                where: {
                    tenant_id: _tenantId,
                    billing_branch_id: billingBranchId,
                    is_active: true,
                },
                order: { sort_order: 'ASC', row: 'ASC', col: 'ASC', code: 'ASC' },
            }));
        const byPosition = new Map(jobs.filter((j) => j.position).map((j) => [j.position.id, j]));
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
    mapJob(job, warehouseScope) {
        const so = job.sales_order;
        const tasks = (job.tasks ?? []).map((task) => this.mapTask(task));
        const terminal = tasks.filter((task) => control_desk_constants_1.CONTROL_DESK_TERMINAL_TASK_STATUSES.includes(task.status)).length;
        const missing = tasks.flatMap((task) => task.lines
            .filter((line) => line.status === 'short' || line.quantity_base_missing > 0)
            .map((line) => ({
            warehouse_id: task.warehouse?.id ?? null,
            warehouse_name: task.warehouse?.name ?? null,
            product_name: line.product_name,
            product_sku: line.product_sku,
            quantity_base_missing: line.quantity_base_missing,
        })));
        const customer = so?.customer ?? null;
        const customerName = customer?.name?.trim() ||
            (0, pos_sale_collection_mapper_1.formatCustomerDisplayName)(customer) ||
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
    mapTask(task) {
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
            started_by_user: (0, pos_sale_collection_mapper_1.mapPosUser)(task.starter),
            completed_by_user: (0, pos_sale_collection_mapper_1.mapPosUser)(task.completer),
            lines_count: lines.length,
            quantity_requested_total: parseFloat(lines.reduce((sum, row) => sum + row.quantity, 0).toFixed(3)),
            lines,
        };
    }
    toQty(value) {
        return parseFloat((value ?? 0).toString()) || 0;
    }
    toSalesUomQty(quantityBase, detail) {
        const detailQty = this.toQty(detail?.quantity);
        const detailBase = this.toQty(detail?.quantity_base_uom);
        if (detailBase > 0 && detailQty > 0) {
            return parseFloat(((quantityBase * detailQty) / detailBase).toFixed(3));
        }
        return quantityBase;
    }
    async loadJobOrFail(id, tenantId, manager) {
        const repo = manager ? manager.getRepository(control_desk_job_entity_1.ControlDeskJob) : this.jobRepo;
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
            throw new common_1.NotFoundException('Pedido de Mesa de Control no encontrado');
        }
        return job;
    }
    requireTask(job, taskId) {
        const task = (job.tasks ?? []).find((row) => row.id === taskId);
        if (!task) {
            throw new common_1.NotFoundException('Tarea de almacén no encontrada');
        }
        return task;
    }
    assertTasksTerminal(job) {
        const active = (job.tasks ?? []).filter((task) => task.status !== 'cancelled');
        const pending = active.filter((task) => !control_desk_constants_1.CONTROL_DESK_TERMINAL_TASK_STATUSES.includes(task.status));
        if (pending.length) {
            const names = pending
                .map((task) => task.warehouse?.name ?? task.warehouse_id)
                .join(', ');
            throw new common_1.BadRequestException(`Faltan almacenes por surtir: ${names}`);
        }
    }
    async assertCanActOnWarehouse(tenantId, actor, warehouseId) {
        if (actor.hasAdminRole) {
            return;
        }
        const assigned = await this.getAssignedWarehouses(tenantId, actor.userId);
        if (!assigned.length) {
            return;
        }
        if (!assigned.some((w) => w.id === warehouseId)) {
            throw new common_1.ForbiddenException('Solo puedes surtir el almacén que tienes asignado');
        }
    }
    assertAdminOrUnscoped(actor, assigned) {
        if (actor.hasAdminRole || !assigned.length) {
            return;
        }
        throw new common_1.ForbiddenException('Solo un supervisor de Mesa de Control puede armar o corroborar');
    }
    async requirePosition(manager, tenantId, positionId, billingBranchId) {
        const position = await manager.findOne(control_desk_position_entity_1.ControlDeskPosition, {
            where: { id: positionId, tenant_id: tenantId },
        });
        if (!position || !position.is_active) {
            throw new common_1.NotFoundException('Posición no encontrada');
        }
        if (position.billing_branch_id !== billingBranchId) {
            throw new common_1.BadRequestException('La posición no pertenece a la sucursal de la orden');
        }
        return position;
    }
    async nextFreePosition(manager, tenantId, billingBranchId, jobId) {
        const positions = await manager.find(control_desk_position_entity_1.ControlDeskPosition, {
            where: { tenant_id: tenantId, billing_branch_id: billingBranchId, is_active: true },
            order: { sort_order: 'ASC', row: 'ASC', col: 'ASC', code: 'ASC' },
        });
        for (const position of positions) {
            const occupant = await manager.findOne(control_desk_job_entity_1.ControlDeskJob, {
                where: { position_id: position.id },
            });
            if (!occupant || occupant.id === jobId || occupant.status === 'cancelled') {
                return position;
            }
        }
        return null;
    }
    async assertBranch(tenantId, billingBranchId) {
        const branch = await this.branchRepo
            .createQueryBuilder('branch')
            .innerJoin('branch.fiscal_configuration', 'fc')
            .where('branch.id = :billingBranchId', { billingBranchId })
            .andWhere('fc.tenant_id = :tenantId', { tenantId })
            .getOne();
        if (!branch) {
            throw new common_1.NotFoundException('La sucursal no existe o no pertenece a la organización');
        }
        return branch;
    }
};
exports.WarehouseControlService = WarehouseControlService;
exports.WarehouseControlService = WarehouseControlService = WarehouseControlService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(control_desk_job_entity_1.ControlDeskJob)),
    __param(2, (0, typeorm_1.InjectRepository)(control_desk_pick_task_entity_1.ControlDeskPickTask)),
    __param(3, (0, typeorm_1.InjectRepository)(control_desk_position_entity_1.ControlDeskPosition)),
    __param(4, (0, typeorm_1.InjectRepository)(user_warehouse_assignment_entity_1.UserWarehouseAssignment)),
    __param(5, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(6, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        sales_order_fulfillment_service_1.SalesOrderFulfillmentService,
        control_desk_lifecycle_service_1.ControlDeskLifecycleService,
        typeorm_2.DataSource])
], WarehouseControlService);
//# sourceMappingURL=warehouse-control.service.js.map