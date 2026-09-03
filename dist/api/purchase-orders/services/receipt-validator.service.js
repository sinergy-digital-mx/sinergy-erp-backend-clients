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
exports.ReceiptValidatorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const purchase_order_batch_detail_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch-detail.entity");
const receive_purchase_order_dto_1 = require("../dto/receive-purchase-order.dto");
let ReceiptValidatorService = class ReceiptValidatorService {
    purchaseOrderDetailRepository;
    constructor(purchaseOrderDetailRepository) {
        this.purchaseOrderDetailRepository = purchaseOrderDetailRepository;
    }
    async validateReceivedItems(items) {
        for (const item of items) {
            const quantity = Number(item.quantity || 0);
            const hasLots = Array.isArray(item.lots) && item.lots.length > 0;
            const lots = item.lots || [];
            const lotMode = item.lot_mode || (hasLots ? receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE : receive_purchase_order_dto_1.ReceiptLotMode.SINGLE);
            const lotsTotalQuantity = hasLots
                ? lots.reduce((acc, lot) => acc + Number(lot.quantity || 0), 0)
                : 0;
            const effectiveQuantity = lotMode === receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE ? lotsTotalQuantity : quantity;
            if (effectiveQuantity < 0) {
                throw new common_1.BadRequestException(`La cantidad recibida no puede ser negativa para la línea ${item.line_item_id}`);
            }
            if (effectiveQuantity > 999999.999) {
                throw new common_1.BadRequestException(`La cantidad recibida excede el límite máximo (999,999.999) para la línea ${item.line_item_id}`);
            }
            if (lotMode === receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE && !hasLots) {
                throw new common_1.BadRequestException(`Se requiere al menos un lote en modo múltiple para la línea ${item.line_item_id}`);
            }
            if (lotMode === receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE && hasLots) {
                for (const lot of lots) {
                    if (!lot.tag_identifier?.trim()) {
                        throw new common_1.BadRequestException(`Se requiere etiqueta/identificador para cada lote de la línea ${item.line_item_id}`);
                    }
                    if (Number(lot.quantity || 0) <= 0) {
                        throw new common_1.BadRequestException(`La cantidad del lote debe ser mayor a cero para la línea ${item.line_item_id}`);
                    }
                    if (lot.product_uom_id !== item.product_uom_id) {
                        throw new common_1.BadRequestException(`La UoM del lote debe coincidir con la UoM de la línea ${item.line_item_id}`);
                    }
                    this.assertValidMeasure(lot.measure, lot.measure_uom_id ?? item.measure_uom_id, item.line_item_id);
                }
            }
            else {
                this.assertValidMeasure(item.measure, item.measure_uom_id, item.line_item_id);
            }
            const lineItem = await this.purchaseOrderDetailRepository.findOne({
                where: { id: item.line_item_id },
            });
            if (!lineItem) {
                throw new common_1.NotFoundException(`Línea no encontrada: ${item.line_item_id}`);
            }
        }
        const hasAtLeastOneItem = items.some((item) => {
            const hasLots = Array.isArray(item.lots) && item.lots.length > 0;
            const lotMode = item.lot_mode || (hasLots ? receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE : receive_purchase_order_dto_1.ReceiptLotMode.SINGLE);
            if (lotMode === receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE) {
                return (item.lots || []).some((lot) => Number(lot.quantity || 0) > 0);
            }
            return Number(item.quantity || 0) > 0;
        });
        if (!hasAtLeastOneItem) {
            throw new common_1.BadRequestException('Se debe recibir al menos un producto con cantidad mayor a cero');
        }
    }
    assertValidMeasure(measure, measureUomId, lineItemId) {
        const hasMeasure = measure !== undefined && measure !== null;
        const hasUom = Boolean(measureUomId?.trim());
        if (!hasMeasure && !hasUom) {
            return;
        }
        if (hasMeasure && !hasUom) {
            throw new common_1.BadRequestException(`Indica la unidad del tamaño (Foot, PIES, …) para la línea ${lineItemId}. No uses la unidad de la orden de compra`);
        }
        if (!hasMeasure && hasUom) {
            throw new common_1.BadRequestException(`Indica el tamaño (8, 12, …) para la línea ${lineItemId}`);
        }
        const value = Number(measure);
        if (!Number.isFinite(value) || value <= 0) {
            throw new common_1.BadRequestException(`El tamaño debe ser mayor a cero para la línea ${lineItemId}`);
        }
        if (value > 999999.999) {
            throw new common_1.BadRequestException(`El tamaño excede el límite máximo (999,999.999) para la línea ${lineItemId}`);
        }
    }
};
exports.ReceiptValidatorService = ReceiptValidatorService;
exports.ReceiptValidatorService = ReceiptValidatorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ReceiptValidatorService);
//# sourceMappingURL=receipt-validator.service.js.map