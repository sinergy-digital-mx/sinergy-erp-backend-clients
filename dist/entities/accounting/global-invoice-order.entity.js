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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalInvoiceOrder = void 0;
const typeorm_1 = require("typeorm");
let GlobalInvoiceOrder = class GlobalInvoiceOrder {
    id;
    global_invoice_id;
    sales_order_id;
};
exports.GlobalInvoiceOrder = GlobalInvoiceOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GlobalInvoiceOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GlobalInvoiceOrder.prototype, "global_invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GlobalInvoiceOrder.prototype, "sales_order_id", void 0);
exports.GlobalInvoiceOrder = GlobalInvoiceOrder = __decorate([
    (0, typeorm_1.Entity)('global_invoice_orders'),
    (0, typeorm_1.Index)('uq_global_invoice_order', ['global_invoice_id', 'sales_order_id'], { unique: true }),
    (0, typeorm_1.Index)('idx_global_invoice_order_sales', ['sales_order_id'])
], GlobalInvoiceOrder);
//# sourceMappingURL=global-invoice-order.entity.js.map