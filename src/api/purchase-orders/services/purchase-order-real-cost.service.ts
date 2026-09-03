import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { PurchaseOrderLandedCostLine } from '../../../entities/purchase-orders/purchase-order-landed-cost-line.entity';
import { UpdatePurchaseOrderRealCostDto } from '../dto/update-purchase-order-real-cost.dto';
import {
  PurchaseOrderActivityService,
  RecordPurchaseOrderActivityInput,
} from './purchase-order-activity.service';
import { PURCHASE_ORDER_MOVEMENT_TYPES } from '../constants/purchase-order-movements';
import {
  activityChange,
  compactActivityChanges,
} from '../utils/purchase-order-activity-change.util';
import {
  ComputeRealCostResult,
  RealCostCurrency,
  assertExchangeRateIfNeeded,
  computePurchaseOrderRealCost,
  isRealCostEnabled,
  parseCustomsExchangeRate,
  parseRealCostNumber,
} from '../utils/purchase-order-real-cost.util';

@Injectable()
export class PurchaseOrderRealCostService {
  constructor(
    @InjectRepository(PurchaseOrderBatch)
    private readonly purchaseOrderRepo: Repository<PurchaseOrderBatch>,
    @InjectRepository(PurchaseOrderBatchDetail)
    private readonly lineRepo: Repository<PurchaseOrderBatchDetail>,
    @InjectRepository(PurchaseOrderLandedCostLine)
    private readonly extraRepo: Repository<PurchaseOrderLandedCostLine>,
    private readonly activityService: PurchaseOrderActivityService,
  ) {}

  async updateRealCost(
    id: string,
    dto: UpdatePurchaseOrderRealCostDto,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const purchaseOrder = await this.purchaseOrderRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['line_items', 'landed_cost_lines'],
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Orden de compra no encontrada: ${id}`);
    }
    if (purchaseOrder.general_status === 'Cancelada') {
      throw new BadRequestException(
        'No se puede editar el costo real de una orden cancelada',
      );
    }

    const extras = (dto.extra_costs ?? []).map((extra) => ({
      concept: extra.concept.trim(),
      amount: extra.amount,
      currency: extra.currency,
    }));
    if (extras.some((extra) => !extra.concept)) {
      throw new BadRequestException('Cada gasto necesita un concepto');
    }

    assertExchangeRateIfNeeded(
      (purchaseOrder.payment_currency === 'USD' ? 'USD' : 'MXN') as RealCostCurrency,
      extras,
      dto.customs_exchange_rate == null
        ? null
        : parseCustomsExchangeRate(dto.customs_exchange_rate),
    );

    const previousRate = parseRealCostNumber(purchaseOrder.customs_exchange_rate, 0) || null;
    const previousExtrasCount = purchaseOrder.landed_cost_lines?.length ?? 0;
    const exchangeRate =
      dto.customs_exchange_rate == null
        ? null
        : parseCustomsExchangeRate(dto.customs_exchange_rate);
    const customsDate = dto.customs_date?.trim() ? dto.customs_date.trim() : null;

    if (dto.line_items?.length) {
      const lineById = new Map(purchaseOrder.line_items.map((line) => [line.id, line]));
      for (const item of dto.line_items) {
        const line = lineById.get(item.line_item_id);
        if (!line) {
          throw new BadRequestException(
            `La línea ${item.line_item_id} no pertenece a esta orden`,
          );
        }
        line.igi_percentage = item.igi_percentage;
      }
    }

    const extrasToPersist = extras;

    await this.extraRepo.delete({ purchase_order_batch_id: id, tenant_id: tenantId });
    const createdExtras = extrasToPersist.map((extra, index) =>
      this.extraRepo.create({
        id: uuidv4(),
        tenant_id: tenantId,
        purchase_order_batch_id: id,
        concept: extra.concept,
        amount: extra.amount,
        currency: extra.currency,
        sort_order: index,
        created_by: userId,
        updated_by: userId,
      }),
    );
    if (createdExtras.length) {
      await this.extraRepo.save(createdExtras);
    }

    purchaseOrder.customs_date = customsDate;
    purchaseOrder.customs_exchange_rate = exchangeRate;
    purchaseOrder.updated_by = userId;
    await this.purchaseOrderRepo.save(purchaseOrder);

    if (dto.line_items?.length) {
      await this.lineRepo.save(purchaseOrder.line_items);
    }

    await this.recalculateIfEnabled(tenantId, id);

    const nextExtrasCount = createdExtras.length;
    const changes = compactActivityChanges([
      activityChange(
        'customs_exchange_rate',
        'T.C. aduana',
        previousRate,
        exchangeRate,
      ),
      activityChange(
        'extra_costs_count',
        'Gastos agregados',
        previousExtrasCount,
        nextExtrasCount,
      ),
    ]);
    if (changes.length) {
      await this.recordActivity({
        tenantId,
        purchaseOrderId: id,
        type: PURCHASE_ORDER_MOVEMENT_TYPES.REAL_COST_UPDATED,
        actorId: userId,
        description: nextExtrasCount
          ? `Se actualizó el costo real (${nextExtrasCount} gastos).`
          : 'Se actualizó el costo real.',
        changes,
        metadata: {
          extras_count: nextExtrasCount,
          customs_exchange_rate: exchangeRate,
        },
      });
    }
  }

  async recalculateIfEnabled(
    tenantId: string,
    purchaseOrderId: string,
    manager?: EntityManager,
  ): Promise<ComputeRealCostResult | null> {
    const poRepo = manager?.getRepository(PurchaseOrderBatch) ?? this.purchaseOrderRepo;
    const lineRepo = manager?.getRepository(PurchaseOrderBatchDetail) ?? this.lineRepo;
    const extraRepo =
      manager?.getRepository(PurchaseOrderLandedCostLine) ?? this.extraRepo;

    const purchaseOrder = await poRepo.findOne({
      where: { id: purchaseOrderId, tenant_id: tenantId },
      relations: ['line_items', 'landed_cost_lines'],
    });
    if (!purchaseOrder) {
      return null;
    }

    const extras = [...(purchaseOrder.landed_cost_lines ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    const enabled = isRealCostEnabled(purchaseOrder.customs_exchange_rate, extras.length);
    const paymentCurrency = (purchaseOrder.payment_currency === 'USD' ? 'USD' : 'MXN') as RealCostCurrency;

    const computed = computePurchaseOrderRealCost({
      payment_currency: paymentCurrency,
      customs_exchange_rate: enabled ? purchaseOrder.customs_exchange_rate : null,
      extras: extras.map((extra) => ({
        amount: extra.amount,
        currency: extra.currency,
      })),
      lines: (purchaseOrder.line_items ?? []).map((line) => ({
        id: line.id,
        quantity: line.quantity,
        received_quantity: line.received_original_quantity,
        vendor_unit_cost:
          line.received_original_unit_total != null
            ? line.received_original_unit_total
            : line.unit_total,
        igi_percentage: line.igi_percentage,
      })),
    });

    await poRepo.update(
      { id: purchaseOrderId, tenant_id: tenantId },
      {
        landed_increment_percentage: enabled ? computed.increment_percentage : 0,
        landed_merchandise_mxn: enabled ? computed.merchandise_mxn ?? 0 : 0,
        landed_extras_mxn: enabled ? computed.extras_mxn ?? 0 : 0,
      },
    );

    for (const line of purchaseOrder.line_items ?? []) {
      const result = computed.lines.find((item) => item.id === line.id);
      await lineRepo.update(
        { id: line.id },
        {
          real_unit_cost_usd: enabled ? result?.real_unit_cost_usd ?? null : null,
          real_unit_cost_mxn: enabled ? result?.real_unit_cost_mxn ?? null : null,
        },
      );
    }

    return enabled ? computed : { ...computed, has_real_cost: false };
  }

  private async recordActivity(input: RecordPurchaseOrderActivityInput): Promise<void> {
    try {
      await this.activityService.record(input);
    } catch (error) {
      console.error('[PO activity] No se pudo guardar el costo real', error);
    }
  }
}
