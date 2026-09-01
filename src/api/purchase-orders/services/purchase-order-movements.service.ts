import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderDocument } from '../../../entities/purchase-orders/purchase-order-document.entity';
import { PurchaseOrderPayment } from '../../../entities/purchase-orders/purchase-order-payment.entity';
import { PurchaseOrderActivity } from '../../../entities/purchase-orders/purchase-order-activity.entity';
import { InventoryTransferLine } from '../../../entities/inventory/inventory-transfer-line.entity';
import { InventoryAuditLine } from '../../../entities/inventory/inventory-audit-line.entity';
import { InventoryAuditStatus } from '../../../entities/inventory/inventory-audit-status.enum';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
import { User } from '../../../entities/users/user.entity';
import { formatUserDisplayName } from '../utils/user-display-name.util';
import { PurchaseOrderActivityService } from './purchase-order-activity.service';
import {
  GENERATED_PURCHASE_ORDER_DOCUMENT_TYPE_IDS,
  PURCHASE_ORDER_MOVEMENT_TYPE_LABELS,
  PURCHASE_ORDER_MOVEMENT_TYPES,
  PurchaseOrderMovementType,
} from '../constants/purchase-order-movements';

export type PurchaseOrderMovementChange = {
  field: string;
  field_label: string;
  from: string | null;
  to: string | null;
};

export type PurchaseOrderMovement = {
  id: string;
  occurred_at: Date;
  type: PurchaseOrderMovementType;
  type_label: string;
  title: string;
  description: string | null;
  actor_id: string | null;
  actor_name: string | null;
  changes: PurchaseOrderMovementChange[];
  metadata: Record<string, unknown>;
};

@Injectable()
export class PurchaseOrderMovementsService {
  constructor(
    @InjectRepository(PurchaseOrderBatch)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderBatch>,
    @InjectRepository(InventoryBatch)
    private readonly inventoryBatchRepository: Repository<InventoryBatch>,
    @InjectRepository(PurchaseOrderDocument)
    private readonly documentRepository: Repository<PurchaseOrderDocument>,
    @InjectRepository(PurchaseOrderPayment)
    private readonly paymentRepository: Repository<PurchaseOrderPayment>,
    @InjectRepository(InventoryTransferLine)
    private readonly transferLineRepository: Repository<InventoryTransferLine>,
    @InjectRepository(InventoryAuditLine)
    private readonly auditLineRepository: Repository<InventoryAuditLine>,
    @InjectRepository(SalesOrderBatchAllocation)
    private readonly allocationRepository: Repository<SalesOrderBatchAllocation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly activityService: PurchaseOrderActivityService,
  ) {}

  async list(orderId: string, tenantId: string): Promise<{
    data: PurchaseOrderMovement[];
    total: number;
  }> {
    const order = await this.purchaseOrderRepository.findOne({
      where: { id: orderId, tenant_id: tenantId },
      relations: ['creator', 'vendor'],
    });
    if (!order) {
      throw new NotFoundException(`Orden de compra no encontrada: ${orderId}`);
    }

    const [activities, batches, documents, payments] = await Promise.all([
      this.activityService.listForOrder(orderId, tenantId),
      this.inventoryBatchRepository.find({
        where: { purchase_order_batch_id: orderId, tenant_id: tenantId },
        relations: ['product', 'warehouse', 'uom'],
        order: { created_at: 'ASC' },
      }),
      this.documentRepository.find({
        where: { purchase_order_batch_id: orderId },
        relations: ['document_type', 'uploader'],
        order: { created_at: 'ASC' },
      }),
      this.paymentRepository.find({
        where: { purchase_order_batch_id: orderId, tenant_id: tenantId },
        relations: ['creator'],
        order: { created_at: 'ASC' },
      }),
    ]);

    const batchIds = batches.map((batch) => batch.id);
    const [transfers, audits, sales] = batchIds.length
      ? await Promise.all([
          this.transferLineRepository
            .createQueryBuilder('line')
            .leftJoinAndSelect('line.inventory_transfer', 'transfer')
            .leftJoinAndSelect('transfer.created_by_user', 'transfer_user')
            .leftJoinAndSelect('transfer.source_warehouse', 'source_wh')
            .leftJoinAndSelect('source_wh.billing_branch', 'source_branch')
            .leftJoinAndSelect('transfer.destination_warehouse', 'dest_wh')
            .leftJoinAndSelect('dest_wh.billing_branch', 'dest_branch')
            .leftJoinAndSelect('line.source_inventory_batch', 'source_batch')
            .leftJoinAndSelect('line.destination_inventory_batch', 'dest_batch')
            .where('line.source_inventory_batch_id IN (:...sourceIds)', { sourceIds: batchIds })
            .orWhere('line.destination_inventory_batch_id IN (:...destIds)', { destIds: batchIds })
            .orderBy('line.created_at', 'ASC')
            .getMany(),
          this.auditLineRepository
            .createQueryBuilder('line')
            .leftJoinAndSelect('line.inventory_audit', 'audit')
            .leftJoinAndSelect('audit.authorized_by_user', 'authorized')
            .leftJoinAndSelect('line.inventory_batch', 'batch')
            .where('line.inventory_batch_id IN (:...batchIds)', { batchIds })
            .andWhere('audit.status = :status', { status: InventoryAuditStatus.POSTED })
            .orderBy('audit.authorized_at', 'ASC')
            .getMany(),
          this.allocationRepository
            .createQueryBuilder('alloc')
            .leftJoinAndSelect('alloc.sales_order_detail', 'detail')
            .leftJoinAndSelect('detail.sales_order', 'so')
            .leftJoinAndSelect('alloc.inventory_batch', 'batch')
            .where('alloc.inventory_batch_id IN (:...batchIds)', { batchIds })
            .orderBy('alloc.created_at', 'ASC')
            .getMany(),
        ])
      : [[], [], []];

    const actorIds = new Set<string>();
    for (const batch of batches) {
      if (batch.created_by) actorIds.add(batch.created_by);
    }
    for (const alloc of sales) {
      if (alloc.created_by) actorIds.add(alloc.created_by);
    }
    const extraUsers = actorIds.size
      ? await this.userRepository.find({ where: { id: In([...actorIds]) } })
      : [];
    const userById = new Map(extraUsers.map((user) => [user.id, user]));

    const movements: PurchaseOrderMovement[] = [];

    movements.push(
      this.movement({
        id: `created:${order.id}`,
        occurred_at: order.created_at,
        type: PURCHASE_ORDER_MOVEMENT_TYPES.CREATED,
        description: `Se creó la orden ${order.folio}${order.vendor?.name ? ` para ${order.vendor.name}` : ''}.`,
        actor_id: order.created_by,
        actor_name: formatUserDisplayName(order.creator),
        metadata: { folio: order.folio, status: 'Creada' },
      }),
    );

    const receiptLots = batches.filter((batch) => !batch.transferred_from_batch_id);
    if (receiptLots.length > 0) {
      const firstReceipt = receiptLots[0];
      const qty = receiptLots.reduce(
        (sum, batch) => sum + Number(batch.initial_quantity || 0),
        0,
      );
      movements.push(
        this.movement({
          id: `received:${order.id}`,
          occurred_at: firstReceipt.created_at,
          type: PURCHASE_ORDER_MOVEMENT_TYPES.RECEIVED,
          description: `Se recibió mercancía en ${receiptLots.length} lote(s). Cantidad: ${qty.toFixed(3)}.`,
          actor_id: firstReceipt.created_by,
          actor_name: formatUserDisplayName(userById.get(firstReceipt.created_by) ?? null),
          metadata: {
            lots_count: receiptLots.length,
            quantity: qty.toFixed(3),
          },
        }),
      );

      for (const lot of receiptLots) {
        const uom = lot.uom?.name ?? '';
        movements.push(
          this.movement({
            id: `lot_received:${lot.id}`,
            occurred_at: lot.created_at,
            type: PURCHASE_ORDER_MOVEMENT_TYPES.LOT_RECEIVED,
            description: `Llegó el lote ${lot.batch_number}: ${Number(lot.initial_quantity).toFixed(3)} ${uom} de ${lot.product?.name ?? 'producto'} en ${lot.warehouse?.name ?? 'almacén'}.`,
            actor_id: lot.created_by,
            actor_name: formatUserDisplayName(userById.get(lot.created_by) ?? null),
            metadata: {
              batch_id: lot.id,
              batch_number: lot.batch_number,
              quantity: Number(lot.initial_quantity).toFixed(3),
              uom_name: uom,
              warehouse_name: lot.warehouse?.name ?? null,
              product_name: lot.product?.name ?? null,
            },
          }),
        );
      }
    }

    const seenTransfers = new Set<string>();
    for (const line of transfers) {
      if (seenTransfers.has(line.id)) continue;
      seenTransfers.add(line.id);
      const qty = Number(line.quantity).toFixed(3);
      const sourceNo = line.source_inventory_batch?.batch_number ?? '';
      const destNo = line.destination_inventory_batch?.batch_number ?? '';
      const destWh = line.inventory_transfer?.destination_warehouse?.name ?? '';
      const destBranch =
        line.inventory_transfer?.destination_warehouse?.billing_branch?.code ?? '';
      movements.push(
        this.movement({
          id: `lot_migrated:${line.id}`,
          occurred_at: line.created_at,
          type: PURCHASE_ORDER_MOVEMENT_TYPES.LOT_MIGRATED,
          description: `Se migraron ${qty} del lote ${sourceNo} al lote ${destNo} (${destBranch ? `${destBranch} · ` : ''}${destWh}). Folio ${line.inventory_transfer?.folio ?? ''}.`,
          actor_id: line.inventory_transfer?.created_by ?? null,
          actor_name: formatUserDisplayName(line.inventory_transfer?.created_by_user ?? null),
          metadata: {
            transfer_id: line.inventory_transfer_id,
            transfer_folio: line.inventory_transfer?.folio ?? null,
            source_batch_number: sourceNo,
            destination_batch_number: destNo,
            quantity: qty,
            destination_warehouse_name: destWh,
            destination_sucursal: destBranch || null,
          },
        }),
      );
    }

    for (const doc of documents) {
      const generated = GENERATED_PURCHASE_ORDER_DOCUMENT_TYPE_IDS.has(
        Number(doc.document_type_id),
      );
      const type = generated
        ? PURCHASE_ORDER_MOVEMENT_TYPES.DOCUMENT_GENERATED
        : PURCHASE_ORDER_MOVEMENT_TYPES.DOCUMENT_UPLOADED;
      const typeName = doc.document_type?.name ?? 'Documento';
      movements.push(
        this.movement({
          id: `document:${doc.id}`,
          occurred_at: doc.created_at,
          type,
          description: generated
            ? `Se generó ${typeName} (${doc.file_name}).`
            : `Se subió ${typeName}: ${doc.file_name}.`,
          actor_id: doc.uploaded_by,
          actor_name: formatUserDisplayName(doc.uploader),
          metadata: {
            document_id: doc.id,
            document_type_id: doc.document_type_id,
            document_type_name: typeName,
            file_name: doc.file_name,
          },
        }),
      );
    }

    for (const payment of payments) {
      movements.push(
        this.movement({
          id: `payment:${payment.id}`,
          occurred_at: payment.created_at,
          type: PURCHASE_ORDER_MOVEMENT_TYPES.PAYMENT_RECORDED,
          description: `Se registró un pago de ${Number(payment.amount).toFixed(2)} ${payment.currency} (${payment.payment_method}).`,
          actor_id: payment.created_by,
          actor_name: formatUserDisplayName(payment.creator),
          metadata: {
            payment_id: payment.id,
            amount: Number(payment.amount).toFixed(2),
            currency: payment.currency,
            payment_method: payment.payment_method,
            payment_date: payment.payment_date,
            reference_number: payment.reference_number ?? null,
          },
        }),
      );
    }

    for (const line of audits) {
      const before = line.quantity_before_post;
      const after = line.quantity_after_post;
      movements.push(
        this.movement({
          id: `audit:${line.id}`,
          occurred_at: line.inventory_audit?.authorized_at ?? line.updated_at,
          type: PURCHASE_ORDER_MOVEMENT_TYPES.INVENTORY_ADJUSTED,
          description: `Ajuste ${line.inventory_audit?.folio ?? ''} sobre ${line.inventory_batch?.batch_number ?? 'lote'}: ${before ?? '—'} → ${after ?? '—'}${line.reason ? `. ${line.reason}` : ''}.`,
          actor_id: line.inventory_audit?.authorized_by ?? null,
          actor_name: formatUserDisplayName(line.inventory_audit?.authorized_by_user ?? null),
          metadata: {
            audit_id: line.inventory_audit_id,
            audit_folio: line.inventory_audit?.folio ?? null,
            batch_number: line.inventory_batch?.batch_number ?? null,
            quantity_before: before,
            quantity_after: after,
            reason: line.reason,
          },
        }),
      );
    }

    for (const alloc of sales) {
      const folio = alloc.sales_order_detail?.sales_order?.folio ?? '';
      movements.push(
        this.movement({
          id: `sold:${alloc.id}`,
          occurred_at: alloc.created_at,
          type: PURCHASE_ORDER_MOVEMENT_TYPES.STOCK_SOLD,
          description: `Salieron ${Number(alloc.quantity_allocated).toFixed(3)} del lote ${alloc.inventory_batch?.batch_number ?? ''} por la venta ${folio}.`,
          actor_id: alloc.created_by,
          actor_name: formatUserDisplayName(userById.get(alloc.created_by) ?? null),
          metadata: {
            allocation_id: alloc.id,
            sales_order_folio: folio,
            batch_number: alloc.inventory_batch?.batch_number ?? null,
            quantity: Number(alloc.quantity_allocated).toFixed(3),
          },
        }),
      );
    }

    for (const activity of activities) {
      movements.push(this.fromActivity(activity));
    }

    movements.sort((a, b) => {
      const delta = new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
      if (delta !== 0) return delta;
      return a.id.localeCompare(b.id);
    });

    return { data: movements, total: movements.length };
  }

  private fromActivity(activity: PurchaseOrderActivity): PurchaseOrderMovement {
    const type = activity.type as PurchaseOrderMovementType;
    return {
      id: `activity:${activity.id}`,
      occurred_at: activity.occurred_at,
      type,
      type_label: PURCHASE_ORDER_MOVEMENT_TYPE_LABELS[type] ?? activity.title,
      title: activity.title,
      description: activity.description,
      actor_id: activity.actor_id,
      actor_name: formatUserDisplayName(activity.actor),
      changes: activity.changes ?? [],
      metadata: activity.metadata ?? {},
    };
  }

  private movement(input: {
    id: string;
    occurred_at: Date;
    type: PurchaseOrderMovementType;
    description: string | null;
    actor_id: string | null;
    actor_name: string | null;
    metadata?: Record<string, unknown>;
    changes?: PurchaseOrderMovementChange[];
  }): PurchaseOrderMovement {
    return {
      id: input.id,
      occurred_at: input.occurred_at,
      type: input.type,
      type_label: PURCHASE_ORDER_MOVEMENT_TYPE_LABELS[input.type],
      title: PURCHASE_ORDER_MOVEMENT_TYPE_LABELS[input.type],
      description: input.description,
      actor_id: input.actor_id,
      actor_name: input.actor_name,
      changes: input.changes ?? [],
      metadata: input.metadata ?? {},
    };
  }
}
