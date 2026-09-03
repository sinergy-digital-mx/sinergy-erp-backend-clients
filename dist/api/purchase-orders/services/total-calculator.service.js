"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TotalCalculatorService = void 0;
const common_1 = require("@nestjs/common");
const receive_purchase_order_dto_1 = require("../dto/receive-purchase-order.dto");
let TotalCalculatorService = class TotalCalculatorService {
    getEffectiveQuantity(item) {
        const hasLots = Array.isArray(item.lots) && item.lots.length > 0;
        const lotMode = item.lot_mode || (hasLots ? receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE : receive_purchase_order_dto_1.ReceiptLotMode.SINGLE);
        if (lotMode === receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE) {
            return (item.lots || []).reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);
        }
        return Number(item.quantity || 0);
    }
    calculateReceivedSubtotal(items) {
        const subtotal = items.reduce((sum, item) => {
            return sum + this.getEffectiveQuantity(item) * item.unit_total;
        }, 0);
        return this.roundToCurrency(subtotal);
    }
    calculateReceivedIvaTotal(items) {
        const ivaTotal = items.reduce((sum, item) => {
            return sum + item.iva_unit * this.getEffectiveQuantity(item);
        }, 0);
        return this.roundToCurrency(ivaTotal);
    }
    calculateReceivedIepsTotal(items) {
        const iepsTotal = items.reduce((sum, item) => {
            return sum + item.ieps_unit * this.getEffectiveQuantity(item);
        }, 0);
        return this.roundToCurrency(iepsTotal);
    }
    calculateReceivedTotal(items) {
        const subtotal = this.calculateReceivedSubtotal(items);
        const ivaTotal = this.calculateReceivedIvaTotal(items);
        const iepsTotal = this.calculateReceivedIepsTotal(items);
        const total = subtotal + ivaTotal + iepsTotal;
        return this.roundToCurrency(total);
    }
    roundToCurrency(value) {
        return Math.round(value * 100) / 100;
    }
};
exports.TotalCalculatorService = TotalCalculatorService;
exports.TotalCalculatorService = TotalCalculatorService = __decorate([
    (0, common_1.Injectable)()
], TotalCalculatorService);
//# sourceMappingURL=total-calculator.service.js.map