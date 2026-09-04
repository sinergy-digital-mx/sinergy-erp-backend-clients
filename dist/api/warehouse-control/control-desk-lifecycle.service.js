"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ControlDeskLifecycleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlDeskLifecycleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const product_entity_1 = require("../../entities/products/product.entity");
const product_item_kind_enum_1 = require("../../entities/products/product-item-kind.enum");
const inventory_batch_entity_1 = require("../../entities/purchase-orders/inventory-batch.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const control_desk_job_entity_1 = require("../../entities/control-desk/control-desk-job.entity");
const control_desk_pick_task_entity_1 = require("../../entities/control-desk/control-desk-pick-task.entity");
const control_desk_pick_line_entity_1 = require("../../entities/control-desk/control-desk-pick-line.entity");
const control_desk_constants_1 = require("../../entities/control-desk/control-desk.constants");
let ControlDeskLifecycleService = ControlDeskLifecycleService_1 = class ControlDeskLifecycleService {
    logger = new common_1.Logger(ControlDeskLifecycleService_1.name);
    async findActiveJob(manager, tenantId, salesOrderId) {
        return manager.findOne(control_desk_job_entity_1.ControlDeskJob, {
            where: { tenant_id: tenantId, sales_order_id: salesOrderId },
            relations: ['tasks', 'tasks.lines'],
        });
    }
    assertJobEditable(job) {
        if (!job || job.status === 'cancelled') {
            return;
        }
        const tasks = job.tasks ?? [];
        const busy = tasks.some((task) => task.status !== 'pending');
        if (busy) {
            throw new common_1.BadRequestException('No se puede editar la orden: el picking de Mesa de Control ya empezó');
        }
    }
    async syncJobForSalesOrder(manager, params) {
        const { tenantId, userId, salesOrder } = params;
        const goodsDetails = await this.filterGoodsDetails(manager, params.details);
        const requiresSelection = params.requiresSelection && goodsDetails.length > 0;
        const existing = await this.findActiveJob(manager, tenantId, salesOrder.id);
        if (!requiresSelection) {
            if (existing && existing.status !== 'cancelled') {
                this.assertJobEditable(existing);
                await this.cancelJob(manager, existing, userId);
            }
            return null;
        }
        const branchId = salesOrder.billing_branch_id;
        if (!branchId) {
            throw new common_1.BadRequestException('La orden necesita sucursal para entrar a Mesa de Control');
        }
        if (existing) {
            this.assertJobEditable(existing);
            await manager.delete(control_desk_job_entity_1.ControlDeskJob, { id: existing.id });
        }
        return this.createJob(manager, {
            tenantId,
            userId,
            salesOrder,
            details: goodsDetails,
            billingBranchId: branchId,
        });
    }
    async filterGoodsDetails(manager, details) {
        const productIds = [...new Set(details.map((detail) => detail.product_id).filter(Boolean))];
        if (!productIds.length) {
            return [];
        }
        const products = await manager.find(product_entity_1.Product, {
            where: { id: (0, typeorm_1.In)(productIds) },
            select: ['id', 'item_kind'],
        });
        const goodsIds = new Set(products
            .filter((product) => (product.item_kind ?? product_item_kind_enum_1.ProductItemKind.Goods) === product_item_kind_enum_1.ProductItemKind.Goods)
            .map((product) => product.id));
        return details.filter((detail) => goodsIds.has(detail.product_id));
    }
    async cancelJobForSalesOrder(manager, tenantId, salesOrderId, userId) {
        const job = await this.findActiveJob(manager, tenantId, salesOrderId);
        if (!job || job.status === 'cancelled') {
            return;
        }
        await this.cancelJob(manager, job, userId);
    }
    async cancelJob(manager, job, userId) {
        if (job.tasks?.length) {
            for (const task of job.tasks) {
                await manager.update(control_desk_pick_line_entity_1.ControlDeskPickLine, { task_id: task.id }, { status: 'cancelled' });
                await manager.update(control_desk_pick_task_entity_1.ControlDeskPickTask, { id: task.id }, { status: 'cancelled' });
            }
        }
        else {
            const tasks = await manager.find(control_desk_pick_task_entity_1.ControlDeskPickTask, {
                where: { job_id: job.id },
            });
            for (const task of tasks) {
                await manager.update(control_desk_pick_line_entity_1.ControlDeskPickLine, { task_id: task.id }, { status: 'cancelled' });
                await manager.update(control_desk_pick_task_entity_1.ControlDeskPickTask, { id: task.id }, { status: 'cancelled' });
            }
        }
        await manager.update(control_desk_job_entity_1.ControlDeskJob, { id: job.id }, {
            status: 'cancelled',
            position_id: null,
            updated_by: userId,
        });
    }
    deriveJobStatus(tasks) {
        const active = tasks.filter((task) => task.status !== 'cancelled');
        const hasShortage = active.some((task) => task.status === 'short');
        if (!active.length) {
            return { status: 'released', hasShortage: false };
        }
        const allPending = active.every((task) => task.status === 'pending');
        if (allPending) {
            return { status: 'released', hasShortage };
        }
        const allTerminal = active.every((task) => control_desk_constants_1.CONTROL_DESK_TERMINAL_TASK_STATUSES.includes(task.status));
        if (allTerminal) {
            return { status: 'waiting_assembly', hasShortage };
        }
        return { status: 'picking', hasShortage };
    }
    async refreshJobProgress(manager, jobId, userId, preserveAssembly = false) {
        const job = await manager.findOne(control_desk_job_entity_1.ControlDeskJob, {
            where: { id: jobId },
            relations: ['tasks'],
        });
        if (!job) {
            throw new common_1.BadRequestException('Job de Mesa de Control no encontrado');
        }
        if (job.status === 'cancelled') {
            return job;
        }
        const derived = this.deriveJobStatus(job.tasks ?? []);
        let nextStatus = derived.status;
        if (preserveAssembly &&
            derived.status === 'waiting_assembly' &&
            (job.status === 'assembling' || job.status === 'assembled')) {
            nextStatus = job.status;
        }
        await manager.update(control_desk_job_entity_1.ControlDeskJob, { id: job.id }, {
            status: nextStatus,
            has_shortage: derived.hasShortage,
            ...(userId ? { updated_by: userId } : {}),
        });
        job.status = nextStatus;
        job.has_shortage = derived.hasShortage;
        return job;
    }
    async createJob(manager, params) {
        const { tenantId, userId, salesOrder, details, billingBranchId } = params;
        const job = manager.create(control_desk_job_entity_1.ControlDeskJob, {
            id: (0, uuid_1.v4)(),
            tenant_id: tenantId,
            sales_order_id: salesOrder.id,
            billing_branch_id: billingBranchId,
            position_id: null,
            status: 'released',
            has_shortage: false,
            created_by: userId,
            updated_by: userId,
        });
        await manager.save(control_desk_job_entity_1.ControlDeskJob, job);
        const tasksByWarehouse = new Map();
        for (const detail of details) {
            const splits = await this.splitDetailByStock(manager, detail, billingBranchId, tenantId);
            for (const split of splits) {
                let bucket = tasksByWarehouse.get(split.warehouseId);
                if (!bucket) {
                    const task = manager.create(control_desk_pick_task_entity_1.ControlDeskPickTask, {
                        id: (0, uuid_1.v4)(),
                        tenant_id: tenantId,
                        job_id: job.id,
                        warehouse_id: split.warehouseId,
                        status: 'pending',
                    });
                    await manager.save(control_desk_pick_task_entity_1.ControlDeskPickTask, task);
                    bucket = { task, lines: [] };
                    tasksByWarehouse.set(split.warehouseId, bucket);
                }
                const line = manager.create(control_desk_pick_line_entity_1.ControlDeskPickLine, {
                    id: (0, uuid_1.v4)(),
                    tenant_id: tenantId,
                    task_id: bucket.task.id,
                    sales_order_detail_id: detail.id,
                    warehouse_id: split.warehouseId,
                    quantity_base_requested: split.quantityBase,
                    quantity_base_picked: 0,
                    status: 'pending',
                });
                await manager.save(control_desk_pick_line_entity_1.ControlDeskPickLine, line);
                bucket.lines.push(line);
            }
        }
        job.tasks = [...tasksByWarehouse.values()].map((bucket) => bucket.task);
        this.logger.log(`Job Mesa de Control ${job.id} para OV ${salesOrder.folio}: ${job.tasks.length} almacén(es)`);
        return job;
    }
    async splitDetailByStock(manager, detail, billingBranchId, tenantId) {
        const needed = parseFloat(detail.quantity_base_uom.toString());
        const stocks = await manager
            .createQueryBuilder(inventory_batch_entity_1.InventoryBatch, 'batch')
            .innerJoin('batch.warehouse', 'warehouse')
            .select('warehouse.id', 'warehouse_id')
            .addSelect('SUM(batch.available_quantity)', 'available')
            .addSelect('MIN(batch.created_at)', 'oldest')
            .where('warehouse.billing_branch_id = :billingBranchId', {
            billingBranchId,
        })
            .andWhere('warehouse.tenant_id = :tenantId', { tenantId })
            .andWhere('batch.product_id = :productId', {
            productId: detail.product_id,
        })
            .andWhere('batch.available_quantity > 0')
            .groupBy('warehouse.id')
            .orderBy('oldest', 'ASC')
            .addOrderBy('available', 'DESC')
            .getRawMany();
        const splits = [];
        let remaining = needed;
        for (const row of stocks) {
            if (remaining <= 0) {
                break;
            }
            const available = parseFloat(row.available?.toString() || '0');
            const take = Math.min(available, remaining);
            if (take <= 0) {
                continue;
            }
            splits.push({
                warehouseId: row.warehouse_id,
                quantityBase: parseFloat(take.toFixed(3)),
            });
            remaining = parseFloat((remaining - take).toFixed(3));
        }
        if (remaining > 0) {
            const fallbackId = stocks.sort((a, b) => parseFloat(b.available?.toString() || '0') -
                parseFloat(a.available?.toString() || '0'))[0]?.warehouse_id ??
                (await this.firstWarehouseOfBranch(manager, tenantId, billingBranchId));
            if (!fallbackId) {
                throw new common_1.BadRequestException('La sucursal no tiene almacenes para Mesa de Control');
            }
            const existing = splits.find((s) => s.warehouseId === fallbackId);
            if (existing) {
                existing.quantityBase = parseFloat((existing.quantityBase + remaining).toFixed(3));
            }
            else {
                splits.push({
                    warehouseId: fallbackId,
                    quantityBase: remaining,
                });
            }
        }
        return splits;
    }
    async firstWarehouseOfBranch(manager, tenantId, billingBranchId) {
        const warehouse = await manager.findOne(warehouse_entity_1.Warehouse, {
            where: {
                tenant_id: tenantId,
                billing_branch_id: billingBranchId,
                status: 'active',
            },
            order: { created_at: 'ASC' },
        });
        return warehouse?.id ?? null;
    }
};
exports.ControlDeskLifecycleService = ControlDeskLifecycleService;
exports.ControlDeskLifecycleService = ControlDeskLifecycleService = ControlDeskLifecycleService_1 = __decorate([
    (0, common_1.Injectable)()
], ControlDeskLifecycleService);
//# sourceMappingURL=control-desk-lifecycle.service.js.map