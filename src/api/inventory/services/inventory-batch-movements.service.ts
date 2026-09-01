import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InventoryAuditLine } from '../../../entities/inventory/inventory-audit-line.entity';
import { InventoryAuditStatus } from '../../../entities/inventory/inventory-audit-status.enum';
import { InventoryTransferLine } from '../../../entities/inventory/inventory-transfer-line.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
import { User } from '../../../entities/users/user.entity';
import {
  INVENTORY_BATCH_MOVEMENT_TYPE_LABELS,
  INVENTORY_BATCH_MOVEMENT_TYPES,
  InventoryBatchMovementType,
} from '../constants/inventory-batch-movements';
import { InventoryBatchMovementDto } from '../dto/inventory-batch-movement.dto';
import { formatUserDisplayName } from '../utils/user-display-name.util';

function formatQty(value: unknown): string {
  const parsed = parseFloat(String(value ?? 0));
  return (Number.isFinite(parsed) ? parsed : 0).toFixed(3);
}

function customerName(customer?: {
  company_name?: string | null;
  name?: string | null;
  lastname?: string | null;
} | null): string | null {
  if (!customer) {
    return null;
  }
  if (customer.company_name?.trim()) {
    return customer.company_name.trim();
  }
  const person = [customer.name, customer.lastname].filter(Boolean).join(' ').trim();
  return person || null;
}

@Injectable()
export class InventoryBatchMovementsService {
  constructor(
    @InjectRepository(InventoryBatch)
    private readonly batchRepo: Repository<InventoryBatch>,
    @InjectRepository(InventoryTransferLine)
    private readonly transferLineRepo: Repository<InventoryTransferLine>,
    @InjectRepository(InventoryAuditLine)
    private readonly auditLineRepo: Repository<InventoryAuditLine>,
    @InjectRepository(SalesOrderBatchAllocation)
    private readonly allocationRepo: Repository<SalesOrderBatchAllocation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async list(
    batchId: string,
    tenantId: string,
  ): Promise<{ data: InventoryBatchMovementDto[]; total: number }> {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId, tenant_id: tenantId },
      relations: ['product', 'uom', 'warehouse', 'purchase_order_batch', 'transferred_from_batch'],
    });
    if (!batch) {
      throw new NotFoundException(`Lote no encontrado: ${batchId}`);
    }
    const data = await this.listForLoadedBatch(batch);
    return { data, total: data.length };
  }

  async listForLoadedBatch(batch: InventoryBatch): Promise<InventoryBatchMovementDto[]> {
    const [transfers, audits, sales] = await Promise.all([
      this.transferLineRepo
        .createQueryBuilder('line')
        .leftJoinAndSelect('line.inventory_transfer', 'transfer')
        .leftJoinAndSelect('transfer.created_by_user', 'transfer_user')
        .leftJoinAndSelect('transfer.source_warehouse', 'source_wh')
        .leftJoinAndSelect('source_wh.billing_branch', 'source_branch')
        .leftJoinAndSelect('transfer.destination_warehouse', 'dest_wh')
        .leftJoinAndSelect('dest_wh.billing_branch', 'dest_branch')
        .leftJoinAndSelect('line.source_inventory_batch', 'source_batch')
        .leftJoinAndSelect('line.destination_inventory_batch', 'dest_batch')
        .where('line.source_inventory_batch_id = :batchId', { batchId: batch.id })
        .orWhere('line.destination_inventory_batch_id = :destId', { destId: batch.id })
        .orderBy('line.created_at', 'ASC')
        .getMany(),
      this.auditLineRepo
        .createQueryBuilder('line')
        .leftJoinAndSelect('line.inventory_audit', 'audit')
        .leftJoinAndSelect('audit.authorized_by_user', 'authorized')
        .leftJoinAndSelect('line.counted_by_user', 'counted')
        .where('line.inventory_batch_id = :batchId', { batchId: batch.id })
        .andWhere('audit.status = :status', { status: InventoryAuditStatus.POSTED })
        .orderBy('audit.authorized_at', 'ASC')
        .getMany(),
      this.allocationRepo
        .createQueryBuilder('alloc')
        .leftJoinAndSelect('alloc.sales_order_detail', 'detail')
        .leftJoinAndSelect('detail.sales_order', 'so')
        .leftJoinAndSelect('so.customer', 'customer')
        .leftJoinAndSelect('so.creator', 'so_creator')
        .where('alloc.inventory_batch_id = :batchId', { batchId: batch.id })
        .orderBy('alloc.created_at', 'ASC')
        .getMany(),
    ]);

    const actorIds = new Set<string>();
    if (batch.created_by) {
      actorIds.add(batch.created_by);
    }
    for (const alloc of sales) {
      if (alloc.created_by) {
        actorIds.add(alloc.created_by);
      }
    }
    const extraUsers = actorIds.size
      ? await this.userRepo.find({ where: { id: In([...actorIds]) } })
      : [];
    const userById = new Map(extraUsers.map((user) => [user.id, user]));
    const uom = batch.uom?.name ?? '';
    const movements: InventoryBatchMovementDto[] = [];

    const inboundTransfer = transfers.find(
      (line) => line.destination_inventory_batch_id === batch.id,
    );
    movements.push(
      this.buildOriginMovement(batch, inboundTransfer ?? null, userById, uom),
    );

    for (const line of transfers) {
      if (line.destination_inventory_batch_id === batch.id) {
        continue;
      }
      const qty = formatQty(line.quantity);
      const destNo = line.destination_inventory_batch?.batch_number ?? '';
      const destWh = line.inventory_transfer?.destination_warehouse?.name ?? '';
      const destBranch =
        line.inventory_transfer?.destination_warehouse?.billing_branch?.code ?? '';
      movements.push(
        this.movement({
          id: `transfer_out:${line.id}`,
          occurred_at: line.created_at,
          type: INVENTORY_BATCH_MOVEMENT_TYPES.TRANSFER_OUT,
          direction: 'out',
          quantity: qty,
          description: `Salieron ${qty} ${uom} hacia el lote ${destNo} (${destBranch ? `${destBranch} · ` : ''}${destWh}). Folio ${line.inventory_transfer?.folio ?? ''}.`,
          actor_id: line.inventory_transfer?.created_by ?? null,
          actor_name: formatUserDisplayName(line.inventory_transfer?.created_by_user ?? null),
          metadata: {
            transfer_id: line.inventory_transfer_id,
            transfer_folio: line.inventory_transfer?.folio ?? null,
            related_batch_id: line.destination_inventory_batch_id,
            related_batch_number: destNo,
            warehouse_name: destWh,
            sucursal: destBranch || null,
            uom_name: uom,
          },
        }),
      );
    }

    for (const alloc of sales) {
      const so = alloc.sales_order_detail?.sales_order;
      const folio = so?.folio ?? '';
      const qty = formatQty(alloc.quantity_allocated);
      const client = customerName(so?.customer ?? null);
      movements.push(
        this.movement({
          id: `sold:${alloc.id}`,
          occurred_at: alloc.created_at,
          type: INVENTORY_BATCH_MOVEMENT_TYPES.STOCK_SOLD,
          direction: 'out',
          quantity: qty,
          description: `Salieron ${qty} ${uom} por la venta ${folio}${client ? ` (${client})` : ''}.`,
          actor_id: alloc.created_by ?? so?.created_by ?? null,
          actor_name:
            formatUserDisplayName(userById.get(alloc.created_by) ?? null) ??
            formatUserDisplayName(so?.creator ?? null),
          metadata: {
            allocation_id: alloc.id,
            sales_order_id: so?.id ?? alloc.sales_order_detail?.sales_order_id ?? null,
            sales_order_folio: folio,
            sales_order_type: so?.sales_order_type ?? null,
            customer_name: client,
            uom_name: uom,
          },
        }),
      );
    }

    for (const line of audits) {
      const before = line.quantity_before_post;
      const after = line.quantity_after_post;
      const variance = formatQty(line.variance);
      const signed = parseFloat(variance);
      movements.push(
        this.movement({
          id: `audit:${line.id}`,
          occurred_at: line.inventory_audit?.authorized_at ?? line.updated_at,
          type: INVENTORY_BATCH_MOVEMENT_TYPES.INVENTORY_ADJUSTED,
          direction: 'adjust',
          quantity: variance,
          description: `Ajuste ${line.inventory_audit?.folio ?? ''}: ${before ?? '—'} → ${after ?? '—'} ${uom}${line.reason ? `. ${line.reason}` : ''}.`,
          actor_id: line.counted_by ?? null,
          actor_name: formatUserDisplayName(line.counted_by_user ?? null),
          authorized_by_id: line.inventory_audit?.authorized_by ?? null,
          authorized_by_name: formatUserDisplayName(
            line.inventory_audit?.authorized_by_user ?? null,
          ),
          authorized_at: line.inventory_audit?.authorized_at ?? null,
          changes: [
            {
              field: 'available_quantity',
              field_label: 'Existencia',
              from: before === null || before === undefined ? null : formatQty(before),
              to: after === null || after === undefined ? null : formatQty(after),
            },
          ],
          metadata: {
            audit_id: line.inventory_audit_id,
            audit_folio: line.inventory_audit?.folio ?? null,
            reason: line.reason,
            variance,
            increased: signed > 0,
            uom_name: uom,
          },
        }),
      );
    }

    movements.sort((a, b) => {
      const delta = new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
      if (delta !== 0) {
        return delta;
      }
      return a.id.localeCompare(b.id);
    });

    return movements;
  }

  private buildOriginMovement(
    batch: InventoryBatch,
    inbound: InventoryTransferLine | null,
    userById: Map<string, User>,
    uom: string,
  ): InventoryBatchMovementDto {
    const qty = formatQty(batch.initial_quantity);
    const actorId = batch.created_by;
    const actorName = formatUserDisplayName(userById.get(actorId) ?? null);
    const warehouseName = batch.warehouse?.name ?? '';

    if (inbound || batch.transferred_from_batch_id) {
      const sourceNo =
        inbound?.source_inventory_batch?.batch_number ??
        batch.transferred_from_batch?.batch_number ??
        '';
      const sourceWh = inbound?.inventory_transfer?.source_warehouse?.name ?? '';
      const folio = inbound?.inventory_transfer?.folio ?? '';
      return this.movement({
        id: inbound ? `transfer_in:${inbound.id}` : `created:${batch.id}`,
        occurred_at: inbound?.created_at ?? batch.created_at,
        type: INVENTORY_BATCH_MOVEMENT_TYPES.TRANSFER_IN,
        direction: 'in',
        quantity: formatQty(inbound?.quantity ?? batch.initial_quantity),
        description: `Entraron ${formatQty(inbound?.quantity ?? batch.initial_quantity)} ${uom} desde el lote ${sourceNo}${sourceWh ? ` (${sourceWh})` : ''}${folio ? `. Folio ${folio}` : ''}.`,
        actor_id: inbound?.inventory_transfer?.created_by ?? actorId,
        actor_name:
          formatUserDisplayName(inbound?.inventory_transfer?.created_by_user ?? null) ?? actorName,
        metadata: {
          transfer_id: inbound?.inventory_transfer_id ?? null,
          transfer_folio: folio || null,
          related_batch_id:
            inbound?.source_inventory_batch_id ?? batch.transferred_from_batch_id,
          related_batch_number: sourceNo || null,
          warehouse_name: sourceWh || warehouseName,
          uom_name: uom,
        },
      });
    }

    if (batch.purchase_order_batch_id) {
      const folio = batch.purchase_order_batch?.folio ?? '';
      return this.movement({
        id: `purchase:${batch.id}`,
        occurred_at: batch.created_at,
        type: INVENTORY_BATCH_MOVEMENT_TYPES.PURCHASE_RECEIVED,
        direction: 'in',
        quantity: qty,
        description: `Entraron ${qty} ${uom} por la orden de compra ${folio || 'sin folio'} en ${warehouseName || 'almacén'}.`,
        actor_id: actorId,
        actor_name: actorName,
        metadata: {
          purchase_order_id: batch.purchase_order_batch_id,
          purchase_order_folio: folio || null,
          warehouse_name: warehouseName || null,
          uom_name: uom,
        },
      });
    }

    const tag = batch.source_tag_identifier?.trim() ?? '';
    if (tag.toUpperCase() === 'IMPORTACION') {
      return this.movement({
        id: `imported:${batch.id}`,
        occurred_at: batch.created_at,
        type: INVENTORY_BATCH_MOVEMENT_TYPES.IMPORTED,
        direction: 'in',
        quantity: qty,
        description: `Entraron ${qty} ${uom} por importación en ${warehouseName || 'almacén'}.`,
        actor_id: actorId,
        actor_name: actorName,
        metadata: {
          source_tag_identifier: tag,
          warehouse_name: warehouseName || null,
          uom_name: uom,
        },
      });
    }

    return this.movement({
      id: `created:${batch.id}`,
      occurred_at: batch.created_at,
      type: INVENTORY_BATCH_MOVEMENT_TYPES.CREATED,
      direction: 'in',
      quantity: qty,
      description: `Se creó el lote ${batch.batch_number} con ${qty} ${uom} en ${warehouseName || 'almacén'}${tag ? ` (tag ${tag})` : ''}.`,
      actor_id: actorId,
      actor_name: actorName,
      metadata: {
        source_tag_identifier: tag || null,
        warehouse_name: warehouseName || null,
        uom_name: uom,
      },
    });
  }

  private movement(input: {
    id: string;
    occurred_at: Date;
    type: InventoryBatchMovementType;
    direction: 'in' | 'out' | 'adjust';
    quantity: string | null;
    description: string | null;
    actor_id: string | null;
    actor_name: string | null;
    authorized_by_id?: string | null;
    authorized_by_name?: string | null;
    authorized_at?: Date | null;
    changes?: InventoryBatchMovementDto['changes'];
    metadata?: Record<string, unknown>;
  }): InventoryBatchMovementDto {
    return {
      id: input.id,
      occurred_at: input.occurred_at,
      type: input.type,
      type_label: INVENTORY_BATCH_MOVEMENT_TYPE_LABELS[input.type],
      title: INVENTORY_BATCH_MOVEMENT_TYPE_LABELS[input.type],
      description: input.description,
      direction: input.direction,
      quantity: input.quantity,
      actor_id: input.actor_id,
      actor_name: input.actor_name,
      authorized_by_id: input.authorized_by_id ?? null,
      authorized_by_name: input.authorized_by_name ?? null,
      authorized_at: input.authorized_at ?? null,
      changes: input.changes ?? [],
      metadata: input.metadata ?? {},
    };
  }
}
