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
exports.SalesOrderPayment = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const sales_order_entity_1 = require("./sales-order.entity");
const user_entity_1 = require("../users/user.entity");
const pos_sale_payment_method_enum_1 = require("../pos/pos-sale-payment-method.enum");
const sales_order_payment_document_entity_1 = require("./sales-order-payment-document.entity");
let SalesOrderPayment = class SalesOrderPayment {
    id;
    tenant;
    tenant_id;
    sales_order;
    sales_order_id;
    payment_date;
    amount;
    currency;
    payment_method;
    reference_number;
    notes;
    source;
    creator;
    created_by;
    documents;
    created_at;
};
exports.SalesOrderPayment = SalesOrderPayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesOrderPayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], SalesOrderPayment.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderPayment.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrder, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_id' }),
    __metadata("design:type", sales_order_entity_1.SalesOrder)
], SalesOrderPayment.prototype, "sales_order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderPayment.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], SalesOrderPayment.prototype, "payment_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], SalesOrderPayment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['MXN', 'USD'],
        default: 'MXN',
    }),
    __metadata("design:type", String)
], SalesOrderPayment.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: pos_sale_payment_method_enum_1.PosSalePaymentMethod,
    }),
    __metadata("design:type", String)
], SalesOrderPayment.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], SalesOrderPayment.prototype, "reference_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SalesOrderPayment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'manual' }),
    __metadata("design:type", String)
], SalesOrderPayment.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], SalesOrderPayment.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderPayment.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sales_order_payment_document_entity_1.SalesOrderPaymentDocument, (doc) => doc.payment),
    __metadata("design:type", Array)
], SalesOrderPayment.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrderPayment.prototype, "created_at", void 0);
exports.SalesOrderPayment = SalesOrderPayment = __decorate([
    (0, typeorm_1.Entity)('inv_s_sales_order_payments'),
    (0, typeorm_1.Index)('idx_so_payments_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_so_payments_order_id', ['sales_order_id']),
    (0, typeorm_1.Index)('idx_so_payments_date', ['payment_date'])
], SalesOrderPayment);
//# sourceMappingURL=sales-order-payment.entity.js.map