import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../entities/sales-orders/sales-order-detail.entity';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { ControlDeskJob } from '../../entities/control-desk/control-desk-job.entity';
import { ControlDeskPickTask } from '../../entities/control-desk/control-desk-pick-task.entity';
import { ControlDeskPickLine } from '../../entities/control-desk/control-desk-pick-line.entity';
import {
  CONTROL_DESK_TERMINAL_TASK_STATUSES,
  ControlDeskJobStatus,
  ControlDeskTaskStatus,
} from '../../entities/control-desk/control-desk.constants';

type StockRow = {
  warehouse_id: string;
  available: string;
  oldest: Date;
};

@Injectable()
export class ControlDeskLifecycleService {
  private readonly logger = new Logger(ControlDeskLifecycleService.name);

  async findActiveJob(
    manager: EntityManager,
    tenantId: string,
    salesOrderId: string,
  ): Promise<ControlDeskJob | null> {
    return manager.findOne(ControlDeskJob, {
      where: { tenant_id: tenantId, sales_order_id: salesOrderId },
      relations: ['tasks', 'tasks.lines'],
    });
  }

  assertJobEditable(job: ControlDeskJob | null): void {
    if (!job || job.status === 'cancelled') {
      return;
    }
    const tasks = job.tasks ?? [];
    const busy = tasks.some((task) => task.status !== 'pending');
    if (busy) {
      throw new BadRequestException(
        'No se puede editar la orden: el picking de Mesa de Control ya empezó',
      );
    }
  }

  /**
   * Crea, reconstruye o cancela el job según el checkbox de la OV.
   */
  async syncJobForSalesOrder(
    manager: EntityManager,
    params: {
      tenantId: string;
      userId: string;
      salesOrder: SalesOrder;
      details: SalesOrderDetail[];
      requiresSelection: boolean;
    },
  ): Promise<ControlDeskJob | null> {
    const { tenantId, userId, salesOrder, details, requiresSelection } = params;
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
      throw new BadRequestException(
        'La orden necesita sucursal para entrar a Mesa de Control',
      );
    }

    if (existing) {
      this.assertJobEditable(existing);
      await manager.delete(ControlDeskJob, { id: existing.id });
    }

    return this.createJob(manager, {
      tenantId,
      userId,
      salesOrder,
      details,
      billingBranchId: branchId,
    });
  }

  async cancelJobForSalesOrder(
    manager: EntityManager,
    tenantId: string,
    salesOrderId: string,
    userId: string,
  ): Promise<void> {
    const job = await this.findActiveJob(manager, tenantId, salesOrderId);
    if (!job || job.status === 'cancelled') {
      return;
    }
    await this.cancelJob(manager, job, userId);
  }

  async cancelJob(
    manager: EntityManager,
    job: ControlDeskJob,
    userId: string,
  ): Promise<void> {
    if (job.tasks?.length) {
      for (const task of job.tasks) {
        await manager.update(
          ControlDeskPickLine,
          { task_id: task.id },
          { status: 'cancelled' },
        );
        await manager.update(
          ControlDeskPickTask,
          { id: task.id },
          { status: 'cancelled' },
        );
      }
    } else {
      const tasks = await manager.find(ControlDeskPickTask, {
        where: { job_id: job.id },
      });
      for (const task of tasks) {
        await manager.update(
          ControlDeskPickLine,
          { task_id: task.id },
          { status: 'cancelled' },
        );
        await manager.update(
          ControlDeskPickTask,
          { id: task.id },
          { status: 'cancelled' },
        );
      }
    }

    await manager.update(
      ControlDeskJob,
      { id: job.id },
      {
        status: 'cancelled',
        position_id: null,
        updated_by: userId,
      },
    );
  }

  deriveJobStatus(tasks: Array<{ status: ControlDeskTaskStatus }>): {
    status: ControlDeskJobStatus;
    hasShortage: boolean;
  } {
    const active = tasks.filter((task) => task.status !== 'cancelled');
    const hasShortage = active.some((task) => task.status === 'short');
    if (!active.length) {
      return { status: 'released', hasShortage: false };
    }
    const allPending = active.every((task) => task.status === 'pending');
    if (allPending) {
      return { status: 'released', hasShortage };
    }
    const allTerminal = active.every((task) =>
      CONTROL_DESK_TERMINAL_TASK_STATUSES.includes(task.status),
    );
    if (allTerminal) {
      return { status: 'waiting_assembly', hasShortage };
    }
    return { status: 'picking', hasShortage };
  }

  async refreshJobProgress(
    manager: EntityManager,
    jobId: string,
    userId?: string,
    preserveAssembly = false,
  ): Promise<ControlDeskJob> {
    const job = await manager.findOne(ControlDeskJob, {
      where: { id: jobId },
      relations: ['tasks'],
    });
    if (!job) {
      throw new BadRequestException('Job de Mesa de Control no encontrado');
    }
    if (job.status === 'cancelled') {
      return job;
    }

    const derived = this.deriveJobStatus(job.tasks ?? []);
    let nextStatus = derived.status;
    if (
      preserveAssembly &&
      derived.status === 'waiting_assembly' &&
      (job.status === 'assembling' || job.status === 'assembled')
    ) {
      nextStatus = job.status;
    }

    await manager.update(
      ControlDeskJob,
      { id: job.id },
      {
        status: nextStatus,
        has_shortage: derived.hasShortage,
        ...(userId ? { updated_by: userId } : {}),
      },
    );
    job.status = nextStatus;
    job.has_shortage = derived.hasShortage;
    return job;
  }

  private async createJob(
    manager: EntityManager,
    params: {
      tenantId: string;
      userId: string;
      salesOrder: SalesOrder;
      details: SalesOrderDetail[];
      billingBranchId: string;
    },
  ): Promise<ControlDeskJob> {
    const { tenantId, userId, salesOrder, details, billingBranchId } = params;

    const job = manager.create(ControlDeskJob, {
      id: uuidv4(),
      tenant_id: tenantId,
      sales_order_id: salesOrder.id,
      billing_branch_id: billingBranchId,
      position_id: null,
      status: 'released',
      has_shortage: false,
      created_by: userId,
      updated_by: userId,
    });
    await manager.save(ControlDeskJob, job);

    const tasksByWarehouse = new Map<
      string,
      { task: ControlDeskPickTask; lines: ControlDeskPickLine[] }
    >();

    for (const detail of details) {
      const splits = await this.splitDetailByStock(
        manager,
        detail,
        billingBranchId,
        tenantId,
      );
      for (const split of splits) {
        let bucket = tasksByWarehouse.get(split.warehouseId);
        if (!bucket) {
          const task = manager.create(ControlDeskPickTask, {
            id: uuidv4(),
            tenant_id: tenantId,
            job_id: job.id,
            warehouse_id: split.warehouseId,
            status: 'pending',
          });
          await manager.save(ControlDeskPickTask, task);
          bucket = { task, lines: [] };
          tasksByWarehouse.set(split.warehouseId, bucket);
        }
        const line = manager.create(ControlDeskPickLine, {
          id: uuidv4(),
          tenant_id: tenantId,
          task_id: bucket.task.id,
          sales_order_detail_id: detail.id,
          warehouse_id: split.warehouseId,
          quantity_base_requested: split.quantityBase,
          quantity_base_picked: 0,
          status: 'pending',
        });
        await manager.save(ControlDeskPickLine, line);
        bucket.lines.push(line);
      }
    }

    job.tasks = [...tasksByWarehouse.values()].map((bucket) => bucket.task);
    this.logger.log(
      `Job Mesa de Control ${job.id} para OV ${salesOrder.folio}: ${job.tasks.length} almacén(es)`,
    );
    return job;
  }

  private async splitDetailByStock(
    manager: EntityManager,
    detail: SalesOrderDetail,
    billingBranchId: string,
    tenantId: string,
  ): Promise<Array<{ warehouseId: string; quantityBase: number }>> {
    const needed = parseFloat(detail.quantity_base_uom.toString());
    const stocks = await manager
      .createQueryBuilder(InventoryBatch, 'batch')
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
      .getRawMany<StockRow>();

    const splits: Array<{ warehouseId: string; quantityBase: number }> = [];
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
      const fallbackId =
        stocks.sort(
          (a, b) =>
            parseFloat(b.available?.toString() || '0') -
            parseFloat(a.available?.toString() || '0'),
        )[0]?.warehouse_id ??
        (await this.firstWarehouseOfBranch(manager, tenantId, billingBranchId));

      if (!fallbackId) {
        throw new BadRequestException(
          'La sucursal no tiene almacenes para Mesa de Control',
        );
      }

      const existing = splits.find((s) => s.warehouseId === fallbackId);
      if (existing) {
        existing.quantityBase = parseFloat(
          (existing.quantityBase + remaining).toFixed(3),
        );
      } else {
        splits.push({
          warehouseId: fallbackId,
          quantityBase: remaining,
        });
      }
    }

    return splits;
  }

  private async firstWarehouseOfBranch(
    manager: EntityManager,
    tenantId: string,
    billingBranchId: string,
  ): Promise<string | null> {
    const warehouse = await manager.findOne(Warehouse, {
      where: {
        tenant_id: tenantId,
        billing_branch_id: billingBranchId,
        status: 'active',
      },
      order: { created_at: 'ASC' },
    });
    return warehouse?.id ?? null;
  }
}
