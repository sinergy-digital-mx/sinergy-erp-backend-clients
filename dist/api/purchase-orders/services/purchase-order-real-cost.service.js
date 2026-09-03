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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderRealCostService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const purchase_order_batch_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch.entity");
const purchase_order_batch_detail_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch-detail.entity");
const purchase_order_landed_cost_line_entity_1 = require("../../../entities/purchase-orders/purchase-order-landed-cost-line.entity");
const purchase_order_activity_service_1 = require("./purchase-order-activity.service");
const purchase_order_movements_1 = require("../constants/purchase-order-movements");
const purchase_order_activity_change_util_1 = require("../utils/purchase-order-activity-change.util");
const purchase_order_real_cost_util_1 = require("../utils/purchase-order-real-cost.util");
let PurchaseOrderRealCostService = class PurchaseOrderRealCostService {
    purchaseOrderRepo;
    lineRepo;
    extraRepo;
    activityService;
    constructor(purchaseOrderRepo, lineRepo, extraRepo, activityService) {
        this.purchaseOrderRepo = purchaseOrderRepo;
        this.lineRepo = lineRepo;
        this.extraRepo = extraRepo;
        this.activityService = activityService;
    }
    async updateRealCost(id, dto, tenantId, userId) {
        const purchaseOrder = await this.purchaseOrderRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['line_items', 'landed_cost_lines'],
        });
        if (!purchaseOrder) {
            throw new common_1.NotFoundException(`Orden de compra no encontrada: ${id}`);
        }
        if (purchaseOrder.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede editar el costo real de una orden cancelada');
        }
        const extras = (dto.extra_costs ?? []).map((extra) => ({
            concept: extra.concept.trim(),
            amount: extra.amount,
            currency: extra.currency,
        }));
        if (extras.some((extra) => !extra.concept)) {
            throw new common_1.BadRequestException('Cada gasto necesita un concepto');
        }
        (0, purchase_order_real_cost_util_1.assertExchangeRateIfNeeded)((purchaseOrder.payment_currency === 'USD' ? 'USD' : 'MXN'), extras, dto.customs_exchange_rate == null
            ? null
            : (0, purchase_order_real_cost_util_1.parseCustomsExchangeRate)(dto.customs_exchange_rate));
        const previousRate = (0, purchase_order_real_cost_util_1.parseRealCostNumber)(purchaseOrder.customs_exchange_rate, 0) || null;
        const previousExtrasCount = purchaseOrder.landed_cost_lines?.length ?? 0;
        const exchangeRate = dto.customs_exchange_rate == null
            ? null
            : (0, purchase_order_real_cost_util_1.parseCustomsExchangeRate)(dto.customs_exchange_rate);
        const customsDate = dto.customs_date?.trim() ? dto.customs_date.trim() : null;
        if (dto.line_items?.length) {
            const lineById = new Map(purchaseOrder.line_items.map((line) => [line.id, line]));
            for (const item of dto.line_items) {
                const line = lineById.get(item.line_item_id);
                if (!line) {
                    throw new common_1.BadRequestException(`La línea ${item.line_item_id} no pertenece a esta orden`);
                }
                line.igi_percentage = item.igi_percentage;
            }
        }
        const extrasToPersist = extras;
        await this.extraRepo.delete({ purchase_order_batch_id: id, tenant_id: tenantId });
        const createdExtras = extrasToPersist.map((extra, index) => this.extraRepo.create({
            id: (0, uuid_1.v4)(),
            tenant_id: tenantId,
            purchase_order_batch_id: id,
            concept: extra.concept,
            amount: extra.amount,
            currency: extra.currency,
            sort_order: index,
            created_by: userId,
            updated_by: userId,
        }));
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
        const changes = (0, purchase_order_activity_change_util_1.compactActivityChanges)([
            (0, purchase_order_activity_change_util_1.activityChange)('customs_exchange_rate', 'T.C. aduana', previousRate, exchangeRate),
            (0, purchase_order_activity_change_util_1.activityChange)('extra_costs_count', 'Gastos agregados', previousExtrasCount, nextExtrasCount),
        ]);
        if (changes.length) {
            await this.recordActivity({
                tenantId,
                purchaseOrderId: id,
                type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.REAL_COST_UPDATED,
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
    async recalculateIfEnabled(tenantId, purchaseOrderId, manager) {
        const poRepo = manager?.getRepository(purchase_order_batch_entity_1.PurchaseOrderBatch) ?? this.purchaseOrderRepo;
        const lineRepo = manager?.getRepository(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail) ?? this.lineRepo;
        const extraRepo = manager?.getRepository(purchase_order_landed_cost_line_entity_1.PurchaseOrderLandedCostLine) ?? this.extraRepo;
        const purchaseOrder = await poRepo.findOne({
            where: { id: purchaseOrderId, tenant_id: tenantId },
            relations: ['line_items', 'landed_cost_lines'],
        });
        if (!purchaseOrder) {
            return null;
        }
        const extras = [...(purchaseOrder.landed_cost_lines ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const enabled = (0, purchase_order_real_cost_util_1.isRealCostEnabled)(purchaseOrder.customs_exchange_rate, extras.length);
        const paymentCurrency = (purchaseOrder.payment_currency === 'USD' ? 'USD' : 'MXN');
        const computed = (0, purchase_order_real_cost_util_1.computePurchaseOrderRealCost)({
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
                vendor_unit_cost: line.received_original_unit_total != null
                    ? line.received_original_unit_total
                    : line.unit_total,
                igi_percentage: line.igi_percentage,
            })),
        });
        await poRepo.update({ id: purchaseOrderId, tenant_id: tenantId }, {
            landed_increment_percentage: enabled ? computed.increment_percentage : 0,
            landed_merchandise_mxn: enabled ? computed.merchandise_mxn ?? 0 : 0,
            landed_extras_mxn: enabled ? computed.extras_mxn ?? 0 : 0,
        });
        for (const line of purchaseOrder.line_items ?? []) {
            const result = computed.lines.find((item) => item.id === line.id);
            await lineRepo.update({ id: line.id }, {
                real_unit_cost_usd: enabled ? result?.real_unit_cost_usd ?? null : null,
                real_unit_cost_mxn: enabled ? result?.real_unit_cost_mxn ?? null : null,
            });
        }
        return enabled ? computed : { ...computed, has_real_cost: false };
    }
    async recordActivity(input) {
        try {
            await this.activityService.record(input);
        }
        catch (error) {
            console.error('[PO activity] No se pudo guardar el costo real', error);
        }
    }
};
exports.PurchaseOrderRealCostService = PurchaseOrderRealCostService;
exports.PurchaseOrderRealCostService = PurchaseOrderRealCostService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_order_batch_entity_1.PurchaseOrderBatch)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail)),
    __param(2, (0, typeorm_1.InjectRepository)(purchase_order_landed_cost_line_entity_1.PurchaseOrderLandedCostLine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        purchase_order_activity_service_1.PurchaseOrderActivityService])
], PurchaseOrderRealCostService);
//# sourceMappingURL=purchase-order-real-cost.service.js.map