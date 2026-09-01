import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  PurchaseOrderActivity,
  PurchaseOrderActivityChange,
} from '../../../entities/purchase-orders/purchase-order-activity.entity';
import {
  PURCHASE_ORDER_MOVEMENT_TYPE_LABELS,
  PurchaseOrderMovementType,
} from '../constants/purchase-order-movements';

export type RecordPurchaseOrderActivityInput = {
  tenantId: string;
  purchaseOrderId: string;
  type: PurchaseOrderMovementType;
  actorId: string | null;
  description?: string | null;
  occurredAt?: Date;
  changes?: PurchaseOrderActivityChange[] | null;
  metadata?: Record<string, unknown> | null;
  title?: string;
};

@Injectable()
export class PurchaseOrderActivityService {
  constructor(
    @InjectRepository(PurchaseOrderActivity)
    private readonly activityRepository: Repository<PurchaseOrderActivity>,
  ) {}

  async record(input: RecordPurchaseOrderActivityInput): Promise<void> {
    const activity = this.activityRepository.create({
      id: uuidv4(),
      tenant_id: input.tenantId,
      purchase_order_batch_id: input.purchaseOrderId,
      type: input.type,
      title: input.title ?? PURCHASE_ORDER_MOVEMENT_TYPE_LABELS[input.type],
      description: input.description ?? null,
      actor_id: input.actorId,
      occurred_at: input.occurredAt ?? new Date(),
      changes: input.changes?.length ? input.changes : null,
      metadata: input.metadata ?? null,
    });
    await this.activityRepository.save(activity);
  }

  async listForOrder(
    purchaseOrderId: string,
    tenantId: string,
  ): Promise<PurchaseOrderActivity[]> {
    return this.activityRepository.find({
      where: { purchase_order_batch_id: purchaseOrderId, tenant_id: tenantId },
      relations: ['actor'],
      order: { occurred_at: 'DESC' },
    });
  }
}
