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
exports.LineItemUpdaterService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const purchase_order_batch_detail_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch-detail.entity");
const purchase_order_line_breakdown_util_1 = require("../utils/purchase-order-line-breakdown.util");
let LineItemUpdaterService = class LineItemUpdaterService {
    lineItemRepository;
    constructor(lineItemRepository) {
        this.lineItemRepository = lineItemRepository;
    }
    async updateLineItemWithReceivedData(lineItemId, receivedItem, convertedQuantity, baseUomId, userId) {
        const lineItem = await this.lineItemRepository.findOne({
            where: { id: lineItemId },
        });
        if (!lineItem) {
            throw new common_1.NotFoundException(`Línea no encontrada: ${lineItemId}`);
        }
        lineItem.received_original_product_id = receivedItem.product_id;
        lineItem.received_original_uom_id = receivedItem.product_uom_id;
        lineItem.received_original_quantity = receivedItem.quantity;
        lineItem.received_original_unit_total = (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(receivedItem.unit_total);
        lineItem.received_original_iva_percentage = receivedItem.iva_percentage;
        lineItem.received_original_iva_unit = receivedItem.iva_unit;
        lineItem.received_original_ieps_percentage = receivedItem.ieps_percentage;
        lineItem.received_original_ieps_unit = receivedItem.ieps_unit;
        Object.assign(lineItem, (0, purchase_order_line_breakdown_util_1.computeReceivedLineBreakdown)(Number(receivedItem.quantity), Number(receivedItem.unit_total), Number(receivedItem.iva_percentage || 0), Number(receivedItem.ieps_percentage || 0)));
        lineItem.received_converted_quantity = convertedQuantity;
        lineItem.received_converted_uom_id = baseUomId;
        lineItem.updated_by = userId;
        lineItem.updated_at = new Date();
        await this.lineItemRepository.save(lineItem);
    }
};
exports.LineItemUpdaterService = LineItemUpdaterService;
exports.LineItemUpdaterService = LineItemUpdaterService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LineItemUpdaterService);
//# sourceMappingURL=line-item-updater.service.js.map