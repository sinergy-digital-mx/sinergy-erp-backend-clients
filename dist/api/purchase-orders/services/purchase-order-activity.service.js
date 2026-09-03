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
exports.PurchaseOrderActivityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const purchase_order_activity_entity_1 = require("../../../entities/purchase-orders/purchase-order-activity.entity");
const purchase_order_movements_1 = require("../constants/purchase-order-movements");
let PurchaseOrderActivityService = class PurchaseOrderActivityService {
    activityRepository;
    constructor(activityRepository) {
        this.activityRepository = activityRepository;
    }
    async record(input) {
        const activity = this.activityRepository.create({
            id: (0, uuid_1.v4)(),
            tenant_id: input.tenantId,
            purchase_order_batch_id: input.purchaseOrderId,
            type: input.type,
            title: input.title ?? purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPE_LABELS[input.type],
            description: input.description ?? null,
            actor_id: input.actorId,
            occurred_at: input.occurredAt ?? new Date(),
            changes: input.changes?.length ? input.changes : null,
            metadata: input.metadata ?? null,
        });
        await this.activityRepository.save(activity);
    }
    async listForOrder(purchaseOrderId, tenantId) {
        return this.activityRepository.find({
            where: { purchase_order_batch_id: purchaseOrderId, tenant_id: tenantId },
            relations: ['actor'],
            order: { occurred_at: 'DESC' },
        });
    }
};
exports.PurchaseOrderActivityService = PurchaseOrderActivityService;
exports.PurchaseOrderActivityService = PurchaseOrderActivityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_order_activity_entity_1.PurchaseOrderActivity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PurchaseOrderActivityService);
//# sourceMappingURL=purchase-order-activity.service.js.map